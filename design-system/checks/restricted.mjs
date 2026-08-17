// ============================================================
// FILE: restricted.mjs
// PURPOSE: Enforce the non-negotiables in CONSUMER code.
//
// build.mjs already validates the token SOURCE (mode pairing, category
// completeness, reserved colour, forbidden names, shadow spread). Those checks
// cannot see a component that hardcodes the safety red or names a variable
// `streak`. This closes that gap.
//
// Each rule maps to a numbered non-negotiable in DESIGN_CRITERIA.md §1.
//
// USAGE: node design-system/checks/restricted.mjs
// EXIT:  1 on any violation.
// ============================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

const SOURCES = [
  "Onboarding Flow/src/components/Onboarding.tsx",
  "Onboarding Flow/src/components/MainApp.tsx",
  "Onboarding Flow/src/App.tsx",
];

const tokens = JSON.parse(readFileSync(resolve(ROOT, "design-system/dist/tokens.json"), "utf8"));

// The reserved alert hues, pulled from the token source rather than retyped so
// this cannot go stale when a value changes.
const SAFETY_HEXES = new Set();
for (const mode of ["dark", "light"]) {
  const s = tokens.modes[mode].color.safety;
  for (const v of Object.values(s)) if (typeof v === "string" && v.startsWith("#")) SAFETY_HEXES.add(v.slice(0, 7).toUpperCase());
}

const violations = [];

for (const rel of SOURCES) {
  const abs = resolve(ROOT, rel);
  if (!existsSync(abs)) continue;
  const lines = readFileSync(abs, "utf8").split("\n");

  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    // JSX comments open with `{/*`, which a leading-`//`-or-`/*` test misses.
    // Without this the lint flags its own documentation — the comment reading
    // "check-in count, NOT a streak" was reported as a streak violation.
    const isComment = /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line);

    // N3 — warm alert colour is reserved for red-flag content. A health app
    // that cries wolf in decoration cannot be trusted when it means it.
    if (!isComment) {
      for (const hex of SAFETY_HEXES) {
        if (line.toUpperCase().includes(hex) && !/safety/i.test(line)) {
          violations.push({ rule: "N3 reserved colour", at, detail: `${hex} appears outside a safety context`, line: line.trim().slice(0, 90) });
        }
      }
    }

    // N1 / N2 — nothing that can visually break, and gaps are rest not failure.
    // Catch the vocabulary before the UI exists: a variable named `streak` is
    // how a breakable chain gets built by accident.
    if (!isComment) {
      for (const word of ["streak", "brokenChain", "missedDay", "missedDays"]) {
        const re = new RegExp(`\\b${word}\\b`, "i");
        if (re.test(line)) {
          violations.push({ rule: "N1/N2 forbidden concept", at, detail: `"${word}" — consistency is accumulation; gaps are rest`, line: line.trim().slice(0, 90) });
        }
      }
    }

    // N5 — the corridor is a range, never a target you can fall short of.
    if (!isComment && /\bcorridor\w*\.?(target|goal)\b/i.test(line)) {
      violations.push({ rule: "N5 corridor is a range", at, detail: "a corridor target/goal line", line: line.trim().slice(0, 90) });
    }

    // Layering — screens may reference semantic and pattern tokens, never a raw
    // primitive. A primitive carries no mode pairing and no contrast contract,
    // so reaching past the semantic layer silently opts out of both.
    if (!isComment && /\btheme\([^)]*\)\.(primitive|primitives)\b/.test(line)) {
      violations.push({ rule: "layering", at, detail: "primitive referenced from screen code — use a semantic or pattern token", line: line.trim().slice(0, 90) });
    }
  });
}

// N4 — never meaning by colour alone. Verified structurally: every category
// family must expose an icon and a label alongside its colours, so a component
// always has a non-colour channel available.
for (const [name, fam] of Object.entries(tokens.modes.dark.color.category)) {
  for (const member of ["mark", "ink", "icon", "label"]) {
    if (!(member in fam)) violations.push({ rule: "N4 colour alone", at: "tokens", detail: `category.${name} is missing "${member}"`, line: "" });
  }
}

if (violations.length) {
  console.error(`RESTRICTED-USE VIOLATIONS — ${violations.length}\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.at}`);
    console.error(`     ${v.detail}`);
    if (v.line) console.error(`     > ${v.line}`);
  }
  process.exit(1);
}

console.log("restricted-use: clean");
console.log(`  reserved hues guarded : ${[...SAFETY_HEXES].join(", ")}`);
console.log(`  category families     : ${Object.keys(tokens.modes.dark.color.category).length}, all complete`);
console.log("  rules checked         : N1/N2 forbidden concepts, N3 reserved colour, N4 colour alone, N5 corridor range, token layering");
