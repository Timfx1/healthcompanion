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
import { consumerFiles, describeExclusions } from "./consumerFiles.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

// Consumer files are DISCOVERED, not listed — a file cannot escape the
// non-negotiables by being new. See checks/consumerFiles.mjs.
const SOURCES = consumerFiles();

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

// ============================================================
// N6 — the doctor report is never gated.
//
// Until now N6's "how it's enforced" column said "checked in review". Review is
// exactly what failed: an audit found TEN sites across the RN app, the web
// prototype and three docs, including a live `usePremium()` early-return that
// replaced the whole report with an upsell, and a lock badge rendered on a
// "Doctor report PDF" row that had been sitting in the visual baselines.
//
// The root cause is on record in the repo. FIGMA_PROMPT_2_HOME_MAIN asked for
// "EXPORT button carries the lock badge (value first, gate at output)";
// FIGMA_DESIGN_ADJUSTMENTS later corrected it to "the ENTIRE doctor report
// (incl. its export button) show NO lock badges anywhere". The correction
// reached Home and stopped there.
//
// Two anchored rules, because a naive "report near premium" grep would fire on
// every line of prose that CORRECTLY states the report is free:
//
//   Rule A — a report surface may not reference a gating symbol.
//   Rule B — a premium-offer surface may not name the report.
//
// Both run on comment-stripped source, so code may document N6 as loudly as it
// likes while the check polices what actually renders.
//
// LIMITATION, stated rather than hidden: like the contrast manifest, the two
// file lists are hand-maintained. A report surface nobody adds here is a report
// surface nobody checks. Add new report and paywall screens to these lists.
// ============================================================

const N6_REPORT_SURFACES = [
  "app/src/screens/main/ReportsScreen.tsx",
  "app/src/services/report/reportHtml.ts",
  "app/src/services/report/exportReport.ts",
  "Onboarding Flow/src/components/ReportPreview.tsx",
  "Onboarding Flow/src/components/reportFixtures.ts",
  "Onboarding Flow/src/components/ReportDateRange.tsx",
  // The RN port. Registered in the SAME change that created them — the list
  // being hand-maintained is the documented weakness of this rule, and a report
  // surface added without a line here is a report surface nobody checks.
  "app/src/screens/recovery/detail/ReportPreview.tsx",
  "app/src/screens/recovery/detail/ReportDateRange.tsx",
];

const N6_PREMIUM_OFFER_SURFACES = [
  "app/src/config/paywall.ts",
  "app/src/screens/onboarding/PremiumTeaserScreen.tsx",
  "app/src/screens/onboarding/TrialPaywallScreen.tsx",
  "app/src/components/PremiumLockCard.tsx",
  "Onboarding Flow/src/components/Onboarding.tsx",
];

// Symbols that gate. `isPremium` is deliberately included: reading the
// entitlement on a report surface has no legitimate purpose, so its presence is
// the tell even when no branch has been written yet.
const N6_GATING_SYMBOLS = [
  "usePremium", "PremiumLockCard", "PREMIUM_GATING_ENABLED", "isPremium",
  "LockBadge", "LockedCard", "gatingActive", "lock.badge", "lock.veil",
];

const N6_REPORT_TERMS = [
  "doctor report", "recovery report", "report pdf", "exportable report",
  "report export", "reports history",
];

// Comment handling is LINE-based, deliberately, not a tokenizer. A
// character-level stripper was written first and lost: JSX prose like
// "Here's what the coming weeks commonly look like" (Onboarding.tsx:1444) opens
// an apostrophe that never closes, after which every "//" stopped registering
// as a comment and the check reported a violation against its own N6 note.
// A line-based filter cannot be fooled by prose. What it gives up is a needle
// hidden in a trailing comment after real code on the same line — which is not
// a way a RENDERED string can hide, and rendered strings are what N6 is about.
function stripComments(src) {
  let inBlock = false;
  return src.split(/\r?\n/).map((raw) => {
    const t = raw.trim();
    if (inBlock) { if (t.includes("*/")) inBlock = false; return ""; }
    if (t.startsWith("/*")) { if (!t.includes("*/")) inBlock = true; return ""; }
    if (t.startsWith("//") || t.startsWith("*")) return "";
    return raw;                    // blanked, not dropped, so line numbers survive
  }).join(String.fromCharCode(10));
}

function n6Scan(files, needles, rule, explain) {
  for (const rel of files) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) continue;
    const lines = stripComments(readFileSync(abs, "utf8")).split("\n");
    lines.forEach((line, i) => {
      for (const needle of needles) {
        if (line.toLowerCase().includes(needle.toLowerCase())) {
          violations.push({ rule, at: `${rel}:${i + 1}`, detail: `${explain} — found "${needle}"`, line: line.trim().slice(0, 100) });
        }
      }
    });
  }
}

n6Scan(N6_REPORT_SURFACES, N6_GATING_SYMBOLS, "N6 report gated",
  "A report surface must never reference a gating symbol. The report is free forever, including its export");

n6Scan(N6_PREMIUM_OFFER_SURFACES, N6_REPORT_TERMS, "N6 report sold",
  "A premium-offer surface must never name the doctor report. Selling a free feature is premium treatment");


// ── N7 — the core loop is never gated ───────────────────────────────────────
// Same mechanism as N6, one principle over. §9's free-forever list is the daily
// check-in, quick capture, timeline, journal, basic pain chart, medications and
// reminders, appointments, SAFETY CONTENT, and the whole doctor report.
//
// Worth being precise about why this is a separate list from the report's. The
// report may not be gated because it is the flagship (P6). The core loop may not
// be gated because gating it is the Medisafe failure — the cautionary tale P9
// names by hand. Different reasons, same enforcement, and a surface can move
// between free and premium only by someone editing this list on purpose.
//
// EducationArticle is deliberately NOT here. P9 puts education deep-dives in
// premium, so that screen is the one place in the product where lock.* is legal,
// and it is the reason this check names surfaces rather than banning the tokens
// outright.
const N7_CORE_LOOP_SURFACES = [
  "Onboarding Flow/src/components/SafetyScreen.tsx",
  "Onboarding Flow/src/components/safetyContent.ts",
  "Onboarding Flow/src/components/QuickCaptureSheet.tsx",
  "Onboarding Flow/src/components/AddTimelineEntry.tsx",
  "Onboarding Flow/src/components/patterns/CaptureField.tsx",
  // The timeline detail set. §9 puts journal, medications and reminders, and
  // appointments on the free-forever list by name; milestones and the questions
  // list are part of the same loop. None of the five takes a locked variant.
  "Onboarding Flow/src/components/JournalEntryScreen.tsx",
  "Onboarding Flow/src/components/MilestoneDetail.tsx",
  "Onboarding Flow/src/components/MedicationDetail.tsx",
  "Onboarding Flow/src/components/AppointmentDetail.tsx",
  "Onboarding Flow/src/components/QuestionsForDoctor.tsx",
  // Taking a photo is core loop. COMPARING them is premium (P9), so
  // PhotoCompare is deliberately absent from this list — the gate belongs on
  // the comparison and never on the act of adding a photo.
  "Onboarding Flow/src/components/PhotoCapture.tsx",
  "Onboarding Flow/src/components/WeeklyReflection.tsx",
  "Onboarding Flow/src/components/storage.ts",
  // The RN port. Same reasoning as the report list above.
  //
  // Note what is NOT here: PhotoCompare. Taking a photo is core loop and
  // comparing them is premium (P9), so the gate belongs on the comparison and
  // never on the act of adding a photo. Listing PhotoCompare here would make
  // the build fail on a gate that is CORRECT, which is how a rule gets weakened
  // to make it pass.
  "app/src/screens/recovery/detail/QuickCaptureSheet.tsx",
  "app/src/screens/recovery/detail/AddTimelineEntry.tsx",
  "app/src/screens/recovery/detail/JournalEntryScreen.tsx",
  "app/src/screens/recovery/detail/MilestoneDetail.tsx",
  "app/src/screens/recovery/detail/ShareCardPreview.tsx",
  "app/src/screens/recovery/detail/MedicationDetail.tsx",
  "app/src/screens/recovery/detail/AppointmentDetail.tsx",
  "app/src/screens/recovery/detail/QuestionsForDoctor.tsx",
  "app/src/screens/recovery/detail/PhotoCapture.tsx",
  "app/src/screens/recovery/HomeScreen.tsx",
  "app/src/screens/recovery/TimelineScreen.tsx",
  "app/src/screens/recovery/CheckInScreen.tsx",
  "app/src/state/RecoveryDataContext.tsx",
  "app/src/data/captureTags.ts",
];

n6Scan(N7_CORE_LOOP_SURFACES, N6_GATING_SYMBOLS, "N7 core loop gated",
  "A core-loop surface must never reference a gating symbol. Free forever is P9, and gating the core loop is the failure that principle was written about");

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
console.log(`  files scanned         : ${SOURCES.length} (discovered, not listed)`);
for (const e of describeExclusions()) console.log(`  excluded              : ${e.files.length} — ${e.why.split(".")[0]}`);
console.log("  rules checked         : N1/N2 forbidden concepts, N3 reserved colour, N4 colour alone, N5 corridor range, N6 report never gated, N7 core loop never gated, token layering");
