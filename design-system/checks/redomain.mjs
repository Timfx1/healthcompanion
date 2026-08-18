// ============================================================
// FILE: redomain.mjs
// PURPOSE: A ratchet over the React Native re-domain, mirroring coverage.mjs.
//
// WHY THIS EXISTS. The RN app's typecheck is RED ON PURPOSE. The generated
// palette deliberately omits every AnklePath key that carries meaning rather
// than structure, so each site using one fails to compile and has to be
// re-domained by a person. That is the mechanism, not a defect.
//
// But this project's own rule is that a permanently red check stops being read.
// So the raw failure is not the gate — the COUNT is. It may only shrink. You
// cannot add a new `palette.blue`, and you cannot stall: every slice of the port
// lowers a number that can never go back up.
//
// USAGE:
//   node design-system/checks/redomain.mjs           check against the budget
//   node design-system/checks/redomain.mjs --update  lower the budget to now
//   node design-system/checks/redomain.mjs --list    show what is left, by key
// EXIT: 1 if the count exceeds the budget, or if the app is not installed.
// ============================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const APP = resolve(ROOT, "app");
const BUDGET_FILE = resolve(HERE, "redomain.budget.json");

const UPDATE = process.argv.includes("--update");
const LIST = process.argv.includes("--list");

if (!existsSync(resolve(APP, "node_modules"))) {
  console.log("redomain: skipped — app/node_modules is absent (cd app && npm install)");
  process.exit(0);
}

let out = "";
try {
  execFileSync("npx", ["tsc", "--noEmit"], { cwd: APP, encoding: "utf8", shell: true });
} catch (e) {
  out = (e.stdout ?? "") + (e.stderr ?? "");
}

// ── Hardcoded colour literals ───────────────────────────────────────────────
// The type-driven re-domain has a BLIND SPOT worth naming: it can only see
// references to a palette KEY. A raw "#2F7DE1" in a LinearGradient is invisible
// to it, because the compiler has no opinion about a string.
//
// That is not hypothetical. The splash and plan-loading screens still gradient
// in AnklePath's brand blue, and typecheck was perfectly happy about it. The web
// side has coverage.mjs for exactly this; the port needs the same, and it
// belongs here rather than in the web ratchet because this is port residue
// rather than design-system drift.
//
// Counted, budgeted, may only shrink. Some of these are genuine brand decisions
// — what replaces AnklePath's splash gradient is a design call, not a mapping —
// so the ratchet holds the line without pretending to make that choice.
const HEX_RE = new RegExp("#[0-9A-Fa-f]{6}", "g");
function litFiles(dir, acc) {
  for (const e of readdirSync(dir)) {
    const full = dir + "/" + e;
    if (statSync(full).isDirectory()) litFiles(full, acc);
    else if ((e.endsWith(".ts") || e.endsWith(".tsx")) && !e.includes("tokens.generated")) acc.push(full);
  }
  return acc;
}
const litByFile = {};
let literals = 0;
for (const file of [...litFiles(APP + "/src", []), APP + "/App.tsx"]) {
  if (!existsSync(file)) continue;
  const n = (readFileSync(file, "utf8").match(HEX_RE) ?? []).length;
  if (n) { litByFile[file.replace(APP + "/", "")] = n; literals += n; }
}

const errors = out.split("\n").filter((l) => l.includes("error TS"));
const byKey = {};
const byFile = {};
for (const line of errors) {
  const key = line.match(/Property '([a-zA-Z]+)' does not exist/)?.[1];
  if (key) byKey[key] = (byKey[key] ?? 0) + 1;
  const file = line.split("(")[0];
  if (file) byFile[file] = (byFile[file] ?? 0) + 1;
}

// Anything that is NOT a missing-palette-key error is a real breakage, not
// pending re-domain work, and must never be absorbed into the budget.
const unrelated = errors.filter((l) => !/Property '[a-zA-Z]+' does not exist on type 'RcPalette'/.test(l));

const total = errors.length;
const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : { total: total };

if (UPDATE) {
  const next = Math.min(budget.total ?? total, total);
  writeFileSync(BUDGET_FILE, JSON.stringify({
    $note: "Remaining React Native re-domain sites. MAY ONLY DECREASE. Each is a place where an AnklePath colour carried meaning that Recovery Companion encodes differently, so a person has to choose. --update will not raise this even if the count grew.",
    $generated: new Date().toISOString().slice(0, 10),
    total: next,
    byKey,
  }, null, 2) + "\n", "utf8");
  console.log(`redomain budget: ${next} (was ${budget.total ?? "new"})`);
  process.exit(0);
}

console.log(`redomain: ${total} palette sites pending  (budget ${budget.total})`);
for (const [k, n] of Object.entries(byKey).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(14)} ${String(n).padStart(4)}`);
}

if (LIST) {
  console.log("\nby file:");
  for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${f}`);
  }
}

if (unrelated.length) {
  console.error(`\n${unrelated.length} error(s) are NOT pending re-domain work — these are real breakage:`);
  for (const l of unrelated.slice(0, 10)) console.error("  " + l.trim());
  process.exit(1);
}

const litBudget = budget.literals ?? literals;
console.log(`           ${literals} hardcoded hex literals  (budget ${litBudget})`);
if (LIST) {
  console.log("");
  console.log("hex literals by file:");
  for (const [f, n] of Object.entries(litByFile).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
}
if (literals > litBudget) {
  console.error("");
  console.error(`Hex literals over budget by ${literals - litBudget}. Use a token.`);
  process.exit(1);
}

if (total > budget.total) {
  console.error(`\nOver budget by ${total - budget.total}. The re-domain ratchet may only tighten.`);
  process.exit(1);
}
if (total < budget.total) console.log(`\n${budget.total - total} fewer than budget — run --update to lock it in.`);
