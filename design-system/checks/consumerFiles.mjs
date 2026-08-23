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
// SO THE DEFAULT IS INCLUSION. Everything under a consumer tree's src/ is
// consumer code. Exclusions are enumerated below, each with a reason, and
// `describeExclusions()` prints them on every run — an exclusion nobody can see
// is how this problem started.
//
// ─────────────────────────────────────────────────────────────────────────────
// AND THEN IT DID THE SAME THING ONE LEVEL UP.
//
// This module was written to stop gates missing FILES. It then missed an entire
// CONSUMER: `SRC` was the single string "Onboarding Flow/src", so `coverage`
// and `restricted` — every rule they carry between them — had never once looked
// at the React Native app. The spec says one token source and two platforms
// (§7); the discovery layer knew about one.
//
// `consumption.mjs` had already been caught with the identical bug and it is
// recorded in §11: it reported `insight.*` dormant while four RN screens were
// rendering it. The fix there was local, so the general version survived here,
// in the file whose entire purpose is to be the general version.
//
// What the widened scope found on its first run: a live `currentStreak()` in
// `app/src/utils/recoveryInsights.ts` producing "3-day check-in streak" with a
// flame icon, ON THE DOCTOR REPORT — which N1/N2 forbid outright and P2 calls
// the mechanism that manufactures the top abandonment driver. Alongside it, the
// consistency insight scored the user's own logging on a three-step scale and
// rendered anything under 30% in `insight.worsening`, the hue this system
// reserves for a symptom getting worse.
//
// Neither was hiding. Both were plainly written in a file no gate read.
// ============================================================

import { readdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "../..");

const SRC = ["Onboarding Flow/src", "app/src"];

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
  return SRC.flatMap((src) => {
    const base = resolve(ROOT, src);
    if (!existsSync(base)) return [];
    return walk(base, []).map((abs) => abs.slice(ROOT.length + 1).split(String.fromCharCode(92)).join('/'));
  }).filter((rel) => !EXCLUDED.some((e) => e.match(rel))).sort();
}

/** What was skipped and why, printed by every gate that uses this. */
export function describeExclusions() {
  const all = SRC.flatMap((src) => {
    const base = resolve(ROOT, src);
    if (!existsSync(base)) return [];
    return walk(base, []).map((abs) => abs.slice(ROOT.length + 1).split(String.fromCharCode(92)).join('/'));
  });
  const out = [];
  for (const rule of EXCLUDED) {
    const hit = all.filter((rel) => rule.match(rel)).sort();
    if (hit.length) out.push({ files: hit, why: rule.why });
  }
  return out;
}
