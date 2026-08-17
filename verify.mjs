#!/usr/bin/env node
// ============================================================
// FILE: verify.mjs
// PURPOSE: One command that runs every gate in this repository.
//
// WHY THIS EXISTS. Until now each gate was a separate incantation somebody had
// to remember, and there is no CI. A gate nobody runs is not a gate — it is a
// script with an opinion. This is the single entry point CI calls and the single
// thing to run before pushing.
//
// ORDER MATTERS and is not alphabetical:
//
//   1. drift        — everything downstream reads dist/tokens.json. If that is
//                     stale, every later result describes a build nobody has.
//   2. docs         — same argument for DESIGN_CRITERIA's generated appendix.
//   3. contrast     — reads the resolved tokens; fails on regressions only.
//   4. restricted   — the non-negotiables (N1-N5) in consumer code.
//   5. coverage     — the literal ratchet.
//   6. typecheck    — token name typos, via as-const unions.
//   7. visual       — 36 baselines. LAST because it is by far the slowest, and
//                     because a token-layer failure makes its result meaningless.
//
// USAGE:
//   node verify.mjs              everything
//   node verify.mjs --fast       skip the visual suite (no browser needed)
//
// EXIT: 1 if any gate fails. Every gate runs regardless — a failure does not
// stop the run, because "what else is broken" is the thing you actually want to
// know, and a stop-on-first-failure gate turns one push into five.
// ============================================================

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const FAST = process.argv.includes("--fast");
const APP = resolve(ROOT, "Onboarding Flow");
const PNPM = "corepack pnpm@10.34.3";

const GATES = [
  { name: "drift",      cmd: "node design-system/build/build.mjs --check",     cwd: ROOT, why: "generated artifacts match the token source" },
  { name: "docs",       cmd: "node design-system/build/emit-docs.mjs --check", cwd: ROOT, why: "DESIGN_CRITERIA appendix matches the tokens" },
  { name: "contrast",   cmd: "node design-system/checks/contrast.mjs",         cwd: ROOT, why: "WCAG AA over the declared pair manifest, both modes" },
  { name: "restricted", cmd: "node design-system/checks/restricted.mjs",       cwd: ROOT, why: "non-negotiables N1-N5 in consumer code" },
  { name: "coverage",   cmd: "node design-system/checks/coverage.mjs",         cwd: ROOT, why: "raw-literal ratchet" },
  { name: "typecheck",  cmd: `${PNPM} exec tsc --noEmit`,                      cwd: APP,  why: "token name typos" },
  ...(FAST ? [] : [
    { name: "visual",   cmd: `${PNPM} exec playwright test`,                   cwd: APP,  why: "36 baselines, 18 screens x 2 modes" },
  ]),
];

const results = [];
for (const g of GATES) {
  process.stdout.write(`\n[1m── ${g.name}[0m — ${g.why}\n`);
  const t = Date.now();
  const r = spawnSync(g.cmd, { cwd: g.cwd, shell: true, stdio: "inherit" });
  results.push({ ...g, ok: r.status === 0, ms: Date.now() - t });
}

console.log("\n" + "=".repeat(64));
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(12)} ${(r.ms / 1000).toFixed(1)}s`);
}
if (FAST) console.log("\n  (--fast: the visual suite was skipped)");
console.log("=".repeat(64));

if (failed) {
  console.error(`\n${failed} gate(s) failed.\n`);
  process.exit(1);
}
console.log("\nAll gates green.\n");
