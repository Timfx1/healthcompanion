// ============================================================
// FILE: harness/mutants.mjs — plant a break, watch the test fail, revert.
//
// A test that has not been SEEN to fail is not evidence. This repository has
// written three checks that could not fail — an N6 substring match that flagged
// "pro" inside "post-operative", its replacement whose escape collapsed to a
// literal backspace so it matched nothing at all, and a smoke check that passed
// on a blank white page. Every one of them was green.
//
// So each mutant below is a specific, plausible defect — several are literally
// the code that was there before — paired with the test that must catch it. The
// run FAILS if a mutant survives, and prints which test should have died.
//
// This is a tool, not a gate: it edits source on purpose. `verify.mjs` does not
// call it. Run it after touching the provider or the slice suite:
//
//   node harness/mutants.mjs
//
// Every mutant is reverted in a `finally`, and the originals are restored on
// exit however the run ends.
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, "..");

const PROVIDER = resolve(APP, "src/state/RecoveryDataContext.tsx");
const RULES_ABSENCE = resolve(APP, "src/rules/absence.ts");

/** [file, find, replace, grep-for-the-test-that-must-die] */
const MUTANTS = [
  {
    name: "the fixture is re-seeded on every launch",
    file: PROVIDER,
    from: "      const seeded = await readJson<boolean>(KEYS.seeded, false);\n      if (!seeded) {",
    to: "      const seeded = await readJson<boolean>(KEYS.seeded, false);\n      if (true || !seeded) {",
    catches: "A DELETED ENTRY STAYS DELETED",
  },
  {
    name: "the write goes back inside the setState updater",
    file: PROVIDER,
    from:
      "      if (Object.is(resolved, committed.current)) return;\n" +
      "      committed.current = resolved;\n" +
      "      setValue(resolved);\n" +
      "      writeJson(key, resolved);",
    to:
      "      if (Object.is(resolved, committed.current)) return;\n" +
      "      committed.current = resolved;\n" +
      "      setValue(() => { writeJson(key, resolved); return resolved; });",
    catches: "BEFORE THE WRITE RESOLVES",
  },
  {
    name: "the write is awaited before the state update — no longer optimistic",
    file: PROVIDER,
    from: "      committed.current = resolved;\n      setValue(resolved);\n      writeJson(key, resolved);",
    to:
      "      committed.current = resolved;\n" +
      "      AsyncStorage.setItem(key, JSON.stringify(resolved)).then(() => setValue(resolved)).catch(() => {});",
    catches: "BEFORE THE WRITE RESOLVES",
  },
  {
    name: "children mount before hydration — the defect this suite was built for",
    file: PROVIDER,
    from: "      {hydrated ? children : fallback}",
    to: "      {children}",
    catches: "0 check-ins",
  },
  {
    name: "children mount before hydration (the timeline half)",
    file: PROVIDER,
    from: "      {hydrated ? children : fallback}",
    to: "      {children}",
    catches: "Nothing here yet.",
  },
  {
    name: "the welcome-back timestamp is never spent",
    file: PROVIDER,
    from: "      setIsWelcomeBack(isReturn(last, now));\n      writeJson(KEYS.lastOpened, now);",
    to: "      setIsWelcomeBack(isReturn(last, now));",
    catches: "greeted ONCE",
  },
  {
    name: "the StrictMode hydrate guard is removed",
    file: PROVIDER,
    from: "    if (hydrating.current) return;\n    hydrating.current = true;",
    to: "    hydrating.current = true;",
    catches: "writes the fixture and marks itself seeded",
  },
  {
    name: "a key escapes the namespace",
    file: PROVIDER,
    from: '  timeline: NS + "timeline",',
    to: '  timeline: "timeline",',
    catches: "every key this store writes",
  },
  {
    name: "a failed write is left unhandled",
    file: PROVIDER,
    from: "  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});",
    to: "  void AsyncStorage.setItem(key, JSON.stringify(value));",
    catches: "unhandled rejection",
  },
  {
    // Aimed at the SEED's photo write, not at `addPhoto`.
    //
    // `addPhoto` was the first target and the mutant SURVIVED, correctly: the
    // only screen that calls it is `PhotoCapture`, which goes through
    // `expo-image-picker` and cannot mount in a browser at all. So the slice
    // covers the persistence of the two photo records and NOT the write that
    // creates them. `store.test.ts` covers `photoEntry` returning both; what
    // nothing covers is the provider persisting a photo the user just took.
    // That gap is real, is recorded in DESIGN_CRITERIA §11, and belongs to the
    // device work in step 2 — re-pointing the mutant to something the test can
    // see would have hidden it.
    name: "the seeded photo record is not persisted",
    file: PROVIDER,
    from: "        writeJson(KEYS.photos, PHOTOS);",
    to: "        void PHOTOS;",
    catches: "ROUND-TRIP TOGETHER",
  },
  {
    name: "a first-ever open is greeted as a return",
    file: RULES_ABSENCE,
    from: "  if (lastOpenedAt === null) return false;",
    to: "  if (lastOpenedAt === null) return true;",
    catches: "FIRST-EVER OPEN IS NOT A RETURN",
  },
  {
    // The first version of this mutant pointed at `readJson` and SURVIVED,
    // because `readJson`'s own try/catch swallows a `JSON.parse` throw. That
    // survival is what led to the real defect: the shape check, not the parse.
    name: "parseStored guards the parse but not the shape",
    file: resolve(APP, "src/rules/entries.ts"),
    from: "  if (Array.isArray(parsed) !== Array.isArray(fallback)) return fallback;",
    to: "  // shape check removed",
    catches: "DOES NOT CRASH THE APP TO A WHITE SCREEN",
  },
  {
    name: "parseStored accepts an unexpected null",
    file: resolve(APP, "src/rules/entries.ts"),
    from: "  if (fallback !== null && (parsed === null || typeof parsed !== typeof fallback)) return fallback;",
    to: "  // null and type check removed",
    catches: "WRONG TYPE DOES NOT CRASH HOME",
  },
];

function run(grep) {
  const r = spawnSync(
    "corepack",
    ["pnpm@10.34.3", "exec", "playwright", "test", "--config", "harness/playwright.config.ts", "slice", "-g", grep],
    { cwd: APP, shell: true, encoding: "utf8" },
  );
  return { ok: r.status === 0, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

const originals = new Map();
for (const m of MUTANTS) {
  if (!originals.has(m.file)) originals.set(m.file, readFileSync(m.file, "utf8"));
}
const restore = () => originals.forEach((text, file) => writeFileSync(file, text));
process.on("exit", restore);

// A mutant that does not apply is worse than one that survives: it reports
// nothing while looking like a passing line. So an unmatched pattern is fatal.
let survived = 0;
let notApplied = 0;

console.log(`\nPlanting ${MUTANTS.length} mutants.\n`);

for (const [i, m] of MUTANTS.entries()) {
  const original = originals.get(m.file);
  const count = original.split(m.from).length - 1;
  if (count !== 1) {
    console.log(`  ${String(i + 1).padStart(2)}. NOT APPLIED (${count} matches)  ${m.name}`);
    notApplied++;
    continue;
  }
  try {
    writeFileSync(m.file, original.replace(m.from, m.to));
    const { ok, out } = run(m.catches);
    const ran = /(\d+) (passed|failed)/.test(out);
    if (!ran) {
      console.log(`  ${String(i + 1).padStart(2)}. NO TEST MATCHED "${m.catches}"  ${m.name}`);
      notApplied++;
    } else if (ok) {
      console.log(`  ${String(i + 1).padStart(2)}. SURVIVED  ${m.name}\n      nothing matching "${m.catches}" failed`);
      survived++;
    } else {
      console.log(`  ${String(i + 1).padStart(2)}. caught    ${m.name}`);
    }
  } finally {
    writeFileSync(m.file, original);
  }
}

console.log(`\n${MUTANTS.length - survived - notApplied}/${MUTANTS.length} caught.`);
if (survived || notApplied) {
  console.error(`${survived} survived, ${notApplied} did not apply.\n`);
  process.exit(1);
}
console.log("Every mutant was caught.\n");
