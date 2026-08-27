// ============================================================
// FILE: harness/shims/async-storage.ts
//
// A DECLARED FIDELITY SUBSTITUTION, exactly like `expo-linear-gradient`, and it
// is written here rather than assumed so that nobody has to guess what the
// slice suite is actually evidence about.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS REAL, AND WHAT IS NOT
//
// REAL:
//   • The API contract. `getItem` returns `string | null`, `setItem` returns a
//     promise, both are genuinely asynchronous, and a rejection is a rejected
//     promise rather than a thrown value. `RecoveryDataProvider`'s whole
//     never-throws design is a statement about those shapes.
//   • Persistence across a remount. The map is mirrored into `localStorage`, so
//     `page.reload()` is a real second launch reading what the first left
//     behind — which is the only way to ask "did it come back?" honestly.
//   • Ordering. Operations resolve in the order they were issued.
//
// NOT REAL:
//   • The backend. A device uses SQLite (Android) or a file-per-key store
//     (iOS). This uses `localStorage`, which has a ~5MB quota, no cross-launch
//     corruption modes, and no OS eviction. A quota or corruption failure on a
//     device will not look like anything here.
//   • The thread. A device crosses the native bridge; this crosses a
//     `setTimeout`. Real jank between a write being issued and it landing is
//     larger and less regular than anything this reproduces.
//
// WHY NOT THE VENDOR'S OWN WEB BUILD. `@react-native-async-storage/async-storage`
// ships one (`lib/module/AsyncStorage.js`, also localStorage-backed), and it
// would resolve here on its own. It is rejected on purpose: it is synchronous
// underneath and resolves in a microtask, which means hydration ALWAYS wins the
// race against first paint. A harness where the bug cannot occur is a harness
// that certifies its absence — and "a screen must not flash empty and then
// fill" is precisely one of the claims this slice exists to make. Latency has
// to be injectable, so the storage has to be ours.
//
// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION happens BEFORE the app mounts, via `page.addInitScript`, because
// hydration starts on the first effect and a control installed after that is a
// control that arrives too late to affect the thing being measured.
// ============================================================

/** The single localStorage key holding the whole map. One key, so a test can
 *  plant an entire previous launch in one `addInitScript`. */
const BACKING = "harness:async-storage";

type Config = {
  /** Delay applied to every read, in ms. Default 0. */
  readLatency?: number;
  /** Delay applied to every write, in ms. Default 0. */
  writeLatency?: number;
  /** When true, every write REJECTS. Reads still work. */
  writesFail?: boolean;
};

type Op = { op: "get" | "set" | "remove" | "clear"; key: string; at: number };

const w = globalThis as unknown as {
  __STORAGE_CONFIG__?: Config;
  __storage?: unknown;
  localStorage?: Storage;
};

const cfg: Config = w.__STORAGE_CONFIG__ ?? {};
let readLatency = cfg.readLatency ?? 0;
let writeLatency = cfg.writeLatency ?? 0;
let writesFail = cfg.writesFail ?? false;

/** Every operation, in issue order. This is how "seeded exactly once" is
 *  asserted: not by looking at the result, which a re-seed would also produce,
 *  but by counting the writes that produced it. */
const ops: Op[] = [];
/** In-flight writes. The optimistic-write claim is "the entry is on screen
 *  WHILE this is above zero", which cannot be asked any other way. */
let pending = 0;

function load(): Map<string, string> {
  try {
    const raw = w.localStorage?.getItem(BACKING);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw) as Record<string, string>));
  } catch {
    return new Map();
  }
}

const map = load();

function flush(): void {
  try {
    w.localStorage?.setItem(BACKING, JSON.stringify(Object.fromEntries(map)));
  } catch {
    // The mirror is best-effort. Losing it costs the reload test, not the run.
  }
}

const after = <T,>(ms: number, value: T): Promise<T> =>
  ms <= 0 ? Promise.resolve(value) : new Promise((resolve) => setTimeout(() => resolve(value), ms));

async function getItem(key: string): Promise<string | null> {
  ops.push({ op: "get", key, at: Date.now() });
  return after(readLatency, map.get(key) ?? null);
}

async function setItem(key: string, value: string): Promise<void> {
  ops.push({ op: "set", key, at: Date.now() });
  pending++;
  try {
    await after(writeLatency, null);
    if (writesFail) {
      // A REJECTED PROMISE, not a throw. `writeJson` attaches `.catch(() => {})`
      // and never awaits; if this threw synchronously that catch would not run
      // and the provider's never-fails promise would be a lie the harness told.
      throw new Error("harness: writes are failing");
    }
    map.set(key, value);
    flush();
  } finally {
    pending--;
  }
}

async function removeItem(key: string): Promise<void> {
  ops.push({ op: "remove", key, at: Date.now() });
  await after(writeLatency, null);
  map.delete(key);
  flush();
}

async function clear(): Promise<void> {
  ops.push({ op: "clear", key: "*", at: Date.now() });
  await after(writeLatency, null);
  map.clear();
  flush();
}

async function getAllKeys(): Promise<string[]> {
  await after(readLatency, null);
  return [...map.keys()];
}

async function multiGet(keys: string[]): Promise<[string, string | null][]> {
  return Promise.all(keys.map(async (k) => [k, await getItem(k)] as [string, string | null]));
}

async function multiSet(pairs: [string, string][]): Promise<void> {
  await Promise.all(pairs.map(([k, v]) => setItem(k, v)));
}

const AsyncStorage = { getItem, setItem, removeItem, clear, getAllKeys, multiGet, multiSet };

// ── The control surface the slice spec drives ───────────────────────────────
w.__storage = {
  /** Everything currently stored, as a plain object. */
  dump: () => Object.fromEntries(map),
  /** Every operation issued this launch, in order. */
  ops: () => ops.map((o) => ({ ...o })),
  /** How many writes have been issued but not yet settled. */
  pending: () => pending,
  setLatency: (next: { read?: number; write?: number }) => {
    if (typeof next.read === "number") readLatency = next.read;
    if (typeof next.write === "number") writeLatency = next.write;
  },
  failWrites: (on: boolean) => {
    writesFail = on;
  },
  /** The localStorage key the whole map lives under, so a test can plant one. */
  backingKey: BACKING,
};

export default AsyncStorage;
