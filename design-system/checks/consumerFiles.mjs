// ============================================================
// FILE: consumerFiles.mjs
// PURPOSE: Decide, once, what counts as CONSUMER code — so no gate can miss a
// file merely because nobody remembered to add it.
//
// WHY THIS EXISTS. `coverage.mjs` and `restricted.mjs` each carried their own
// hand-written SOURCES list. Every file written since those lists were typed
// was invisible to them until someone noticed: `ReportPreview.tsx` was scanned
// by neither on the day it shipped, and was only added because the gap was
// looked for on purpose. That is the same shape as every other blind spot on
// record here — the contrast manifest declaring pairs nothing renders, the
// literal ratchet flooring itself against its own count, a 2.4-second Toast no
// baseline could photograph. A list you have to remember to update is a list
// that is wrong the moment you stop thinking about it.
//
// SO THE DEFAULT IS INCLUSION. Everything under the prototype's src/ is
// consumer code. Exclusions are enumerated below, each with a reason, and
// `describeExclusions()` prints them on every run — an exclusion nobody can see
// is how this problem started.
// ============================================================

import { readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../..");

const SRC = "Onboarding Flow/src";

// Each entry must state WHY, because "excluded" and "unmeasured" are the same
// thing and only one of them is a decision.
const EXCLUDED = [
  {
    match: (rel) => /\.generated\.(ts|tsx|css)$/.test(rel),
    why: "Generated artifacts. Their values come from the token source by construction; counting them would budget the design system against itself.",
  },
  {
    match: (rel) => rel.endsWith("src/components/tokens.ts"),
    why: "The token entry point. It re-exports the generated values and is the one place a token value is SUPPOSED to appear by name.",
  },
  {
    match: (rel) => rel.endsWith(".d.ts"),
    why: "Type declarations. No runtime values, so nothing to measure.",
  },
];

const EXT = /\.(tsx?|css)$/;

function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (EXT.test(entry)) acc.push(full);
  }
  return acc;
}

/**
 * Every consumer file, repo-relative, sorted. New files are included the moment
 * they exist — that is the whole point.
 */
export function consumerFiles() {
  const base = resolve(ROOT, SRC);
  if (!existsSync(base)) return [];
  return walk(base, [])
    .map((abs) => abs.slice(ROOT.length + 1).split("\\").join("/"))
    .filter((rel) => !EXCLUDED.some((e) => e.match(rel)))
    .sort();
}

/** What was skipped and why, printed by every gate that uses this. */
export function describeExclusions() {
  const base = resolve(ROOT, SRC);
  if (!existsSync(base)) return [];
  const all = walk(base, []).map((abs) => abs.slice(ROOT.length + 1).split("\\").join("/"));
  const out = [];
  for (const rule of EXCLUDED) {
    const hit = all.filter((rel) => rule.match(rel)).sort();
    if (hit.length) out.push({ files: hit, why: rule.why });
  }
  return out;
}
