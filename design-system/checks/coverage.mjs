// ============================================================
// FILE: coverage.mjs
// PURPOSE: A ratchet. Counts raw design literals still hardcoded in consumer
//   code and fails if the count grows.
//
// WHY A RATCHET RATHER THAN A BAN: the prototype has ~700 literal occurrences.
// Forbidding all of them outright would mean either a single enormous unstaged
// rewrite or a permanently red check that everyone learns to ignore. A budget
// that may only shrink lets the migration land in reviewable slices while
// making backsliding impossible — which is the actual goal.
//
// USAGE:
//   node design-system/checks/coverage.mjs            check against the budget
//   node design-system/checks/coverage.mjs --update   lower the budget to now
//   node design-system/checks/coverage.mjs --list     show remaining offenders
// EXIT: 1 if any category exceeds its budget.
// ============================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const BUDGET_FILE = resolve(HERE, "coverage.budget.json");

const UPDATE = process.argv.includes("--update");
const LIST = process.argv.includes("--list");

// Consumer files only. Generated artifacts are exempt by definition — they are
// where the literals are SUPPOSED to live.
const SOURCES = [
  "Onboarding Flow/src/components/Onboarding.tsx",
  "Onboarding Flow/src/components/MainApp.tsx",
  "Onboarding Flow/src/index.css",
];

// Reuse the comment stripper's contract: comments are blanked space-for-space
// so offsets and line numbers survive. Without this the huge annotation blocks
// in these files would dominate the count with values that are documentation,
// not code.
function stripComments(src, isCss) {
  // split("") — one element per UTF-16 CODE UNIT, deliberately NOT Array.from.
  //
  // This line used to read `Array.from(src)`, which splits by code POINT: an
  // emoji outside the BMP becomes ONE element instead of the two units it
  // occupies. The loop below walks `src[i]` and writes `out[i]`, both of which
  // are code-unit indexed, so from the first astral character onward the two
  // arrays were misaligned — and these screen files are full of emoji (📋 🎉
  // 💊 …). 38 of them in Onboarding.tsx, 44 in MainApp.tsx.
  //
  // The damage was not what you would guess. The counts barely moved (349
  // actual against 350 reported) because a regex still finds roughly the same
  // number of matches in a shifted string. What broke was POSITION: the drift
  // put the blanking writes over newline characters, merging lines, so
  // Onboarding.tsx collapsed from 1,917 lines to 1,208 and MainApp.tsx from
  // 1,936 to 1,182. Every line number `--list` printed after the first emoji
  // pointed at the wrong line, which is why it kept reporting comment lines
  // that contain no literal at all.
  //
  // That made the ratchet's headline trustworthy and its ONLY actionable
  // output useless — `--list` is what you follow to find the call sites during
  // a migration. Worth stating plainly: the bug was invisible precisely
  // because the number everyone reads was right.
  const out = src.split("");
  let i = 0, state = "code";
  while (i < src.length) {
    const ch = src[i], next = src[i + 1];
    if (state === "code") {
      if (!isCss && ch === "/" && next === "/") { state = "line"; out[i] = out[i + 1] = " "; i += 2; continue; }
      if (ch === "/" && next === "*") { state = "block"; out[i] = out[i + 1] = " "; i += 2; continue; }
      if (ch === "'") { state = "sq"; i++; continue; }
      if (ch === '"') { state = "dq"; i++; continue; }
      if (ch === "`") { state = "tpl"; i++; continue; }
      i++; continue;
    }
    if (state === "line") { if (ch === "\n") state = "code"; else out[i] = " "; i++; continue; }
    if (state === "block") {
      if (ch === "*" && next === "/") { out[i] = out[i + 1] = " "; state = "code"; i += 2; continue; }
      if (ch !== "\n") out[i] = " ";
      i++; continue;
    }
    const q = state === "sq" ? "'" : state === "dq" ? '"' : "`";
    if (ch === "\\") { i += 2; continue; }
    if (ch === q) state = "code";
    i++;
  }
  return out.join("");
}

const CATEGORIES = {
  // Ordered worst-first: rgba() is the most damaging because React Native
  // rejects it in several props, so every one of these is a future port bug.
  "rgba()": {
    re: /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)/g,
    why: "Not portable — RN rejects rgba() in several props. Use a colorAlpha token, which emits 8-digit hex.",
  },
  "raw hex": {
    re: /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(?![0-9A-Fa-f])/g,
    why: "A colour with no role. Use a semantic or pattern token.",
  },
  "raw duration": {
    re: /\b\d+(?:\.\d+)?m?s\b/g,
    why: "Use a motion role so timing stays consistent and portable to Reanimated.",
  },
  "raw z-index": {
    re: /\bzIndex\s*:\s*-?\d+/g,
    why: "Use the z scale — the elevation order is fixed and must not be re-decided per component.",
  },
  "raw radius": {
    re: /\bborderRadius\s*:\s*\d+/g,
    why: "Use the radius scale.",
  },
  "raw font size": {
    re: /\bfontSize\s*:\s*\d+/g,
    // 170 -> 23. The 147 that went were exact matches for an existing scale
    // step, so they became scale.font.size.* with no pixel moving anywhere.
    //
    // The 23 that remain are OFF-SCALE — 9, 17, 20, 22, 26, 30, 32, 40, 48, 52,
    // 56, 80 — and are deliberately left visible rather than snapped to their
    // nearest neighbour. Snapping would change real sizes while looking like a
    // mechanical refactor, which is the most expensive kind of diff to review.
    // Whether they become new steps, collapse into existing ones, or stay as
    // one-offs is a type-scale decision, not a codemod.
    //
    // The `why` below still points at TYPE ROLES rather than bare sizes, and
    // that remains the destination: a role carries weight, line height and
    // tracking with the size. Applying roles is NOT zero-diff — most call sites
    // set no line height, so adopting one would move text — so it is a separate,
    // deliberate pass. Bare sizes are the honest intermediate step, and they
    // match how scale.duration.* and scale.radius.* are already consumed.
    why: "Use a type role, which carries size, weight, line height and tracking together.",
  },
};

const counts = {};
const offenders = {};
for (const key of Object.keys(CATEGORIES)) { counts[key] = 0; offenders[key] = []; }

for (const rel of SOURCES) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) continue;
  const raw = readFileSync(abs, "utf8");
  const code = stripComments(raw, rel.endsWith(".css"));
  const rawLines = raw.split("\n");

  code.split("\n").forEach((line, idx) => {
    for (const [key, { re }] of Object.entries(CATEGORIES)) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        counts[key]++;
        offenders[key].push(`${rel}:${idx + 1}  ${rawLines[idx].trim().slice(0, 90)}`);
      }
    }
  });
}

const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : { $note: "", budgets: {} };

if (UPDATE) {
  const prev = budget.budgets ?? {};
  const next = {};
  for (const [k, v] of Object.entries(counts)) {
    // The ratchet only ever tightens. If a count went UP, --update refuses to
    // raise the budget to match — that would defeat the entire mechanism.
    next[k] = prev[k] === undefined ? v : Math.min(prev[k], v);
  }
  writeFileSync(BUDGET_FILE, JSON.stringify({
    $note: "Maximum permitted raw literals per category in consumer code. MAY ONLY DECREASE. Regenerate with --update after a migration slice; --update will not raise a budget even if the count grew.",
    $generated: new Date().toISOString().slice(0, 10),
    budgets: next,
  }, null, 2) + "\n", "utf8");
  console.log("Budget updated:");
  for (const [k, v] of Object.entries(next)) {
    const delta = prev[k] === undefined ? "new" : `was ${prev[k]}`;
    console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}   (${delta})`);
  }
  process.exit(0);
}

let over = 0;
console.log("CATEGORY         count  budget");
for (const [k, v] of Object.entries(counts)) {
  const b = budget.budgets?.[k];
  const flag = b === undefined ? "" : v > b ? "  OVER BUDGET" : v < b ? "  (ratchet: run --update)" : "";
  if (b !== undefined && v > b) over++;
  console.log(`  ${k.padEnd(14)} ${String(v).padStart(5)}  ${String(b ?? "-").padStart(6)}${flag}`);
}

if (LIST) {
  for (const [k, list] of Object.entries(offenders)) {
    if (!list.length) continue;
    console.log(`\n${k} — ${CATEGORIES[k].why}`);
    for (const o of list.slice(0, 25)) console.log(`  ${o}`);
    if (list.length > 25) console.log(`  … and ${list.length - 25} more`);
  }
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`\ntotal raw literals: ${total}`);
if (over) {
  console.error(`\n${over} category(ies) over budget. The ratchet may only tighten — replace the literals with tokens.`);
  process.exit(1);
}
