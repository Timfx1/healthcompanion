// ============================================================
// FILE: storage.ts — the prototype's persistence layer.
//
// Everything in this prototype has been in-memory until now: state lived in
// React and died on reload. That is fine for photographing a screen and useless
// for the one thing a reflection has to do, which is still be there tomorrow.
//
// This is `localStorage`, and it is the WEB PROTOTYPE'S STAND-IN for what the
// React Native app will do with AsyncStorage (§7, phase 1 item 4). The shape is
// deliberately the same — a namespaced key, a JSON value, read and write — so
// the port is a swap of two functions rather than a rewrite of the callers.
//
// ─────────────────────────────────────────────────────────────────────────────
// IT CANNOT THROW. This is not defensive habit, it is P1: "the capture path must
// never fail (offline-safe, optimistic UI)". `localStorage` throws in more
// situations than people expect — Safari private browsing, quota exhaustion, an
// iframe with third-party storage blocked — and a reflection somebody just wrote
// is exactly the wrong moment to surface a storage exception.
//
// So every access is wrapped, and a failure degrades to an in-memory map for the
// session rather than propagating. The user keeps what they wrote for as long as
// the tab is open, and nothing on screen apologises. That is the same reasoning
// that gives the confirmation Toast no failure branch.
// ============================================================

const NS = "recovery-companion:";

/** Session fallback when localStorage is unavailable. Never surfaced as an error. */
const memory = new Map<string, string>();

function backing(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    // Touching the property is itself what throws in blocked-storage contexts,
    // so the probe has to be inside the try.
    const ls = window.localStorage;
    const probe = NS + "__probe";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

export function read<T>(key: string, fallback: T): T {
  const store = backing();
  try {
    const raw = store ? store.getItem(NS + key) : memory.get(NS + key) ?? null;
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    // A corrupt value is treated as absent. Losing one malformed entry beats
    // refusing to open the screen it belongs to.
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  const serialised = JSON.stringify(value);
  const store = backing();
  try {
    if (store) store.setItem(NS + key, serialised);
    else memory.set(NS + key, serialised);
  } catch {
    memory.set(NS + key, serialised);
  }
}

export function clear(key: string): void {
  const store = backing();
  try {
    if (store) store.removeItem(NS + key);
  } catch {
    /* ignore */
  }
  memory.delete(NS + key);
}

export const KEYS = {
  weeklyReflection: "weekly-reflection",
  /** Epoch ms of the previous open. Read once per document, then overwritten - see absence.ts. */
  lastOpened: "last-opened",
} as const;
