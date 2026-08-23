// ============================================================
// FILE: consumption.mjs
// PURPOSE: A token family is not trustworthy because it is DEFINED.
//
//   defined → consumed → rendered → measured
//
// Every arrow is a place a family can be wrong while looking fine, and this
// project has now been bitten at the same one four times:
//
//   toast.*    mode-paired to a WHITE pill no screen had ever drawn. The screen
//              forced the dark value with a hardcoded argument, so the family
//              described a design nobody had built.
//   capture.*  defined and unused while the screen hardcoded the same values
//              through the legacy D object — including a `placeholder` role the
//              field never set at all, so the one string guaranteed to be on
//              screen before a user types was the one string nothing measured.
//   share.*    carried the dayCard bug UNFIXED: 1.58:1 in light, the worst
//              figure in the system, surviving only because ShareCardScreen
//              hardcodes #fff and never rendered the tokens.
//   paywall.savingsLabel
//              referenced a category MARK and used it as TEXT: 1.58:1 again.
//              The screen drew mood.ink instead, so the defect lived entirely
//              inside a definition nothing rendered.
//
// In all four the definition existed, looked reasonable, and was wrong. The
// common factor is not carelessness — nothing rendered them, so nothing could
// disagree.
//
// ─────────────────────────────────────────────────────────────────────────────
// TWO LEVELS, each measuring only what it can measure HONESTLY.
//
// DORMANCY is checked per FAMILY. Role-level dormancy was tried first and
// abandoned: screens alias a family once (const R = theme(mode).pattern.report)
// and then write R.surface, which no source scan can follow without a real
// parser. It reported 38 dormant roles, most of them false. A check that cries
// wolf gets ignored — the exact failure this file exists to prevent, so it does
// not get to commit it.
//
// MEASUREMENT is checked per ROLE, and that IS reliable, because it reads the
// manifest rather than the source. It is also the sharper of the two: the
// paywall's savingsLabel was a colour role no pair named, and role-level
// measurement is what surfaces that class.
//
// RENDERED — the third arrow — is not mechanised here at all. "Has a dev route
// and a baseline" lives in the visual harness, not the token layer. Saying so is
// the point: this closes two of four gaps and leaves the other two visible.
//
// Both counts are RATCHETS and may only shrink.
//
// USAGE: node design-system/checks/consumption.mjs [--list] [--update]
// EXIT:  1 if either count exceeds its budget.
// ============================================================

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { consumerFiles, ROOT } from "./consumerFiles.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LIST = process.argv.includes("--list");
const UPDATE = process.argv.includes("--update");
const BUDGET_FILE = resolve(HERE, "consumption.budget.json");

const tokens = JSON.parse(readFileSync(resolve(ROOT, "design-system/dist/tokens.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(HERE, "pairs.manifest.json"), "utf8"));

// Only colour-bearing entries matter. A role holding a number (aspectRatio,
// dwell, badgeSize) has nothing a contrast pair could measure.
function hasColour(node) {
  if (typeof node === "string") return /^#[0-9A-Fa-f]{6,8}$/.test(node);
  if (!node || typeof node !== "object") return false;
  return Object.values(node).some(hasColour);
}

const familyNames = [];
const roleNames = [];
for (const [fam, node] of Object.entries(tokens.modes.dark.pattern)) {
  if (fam.startsWith("$") || !node || typeof node !== "object" || !hasColour(node)) continue;
  familyNames.push(fam);
  for (const [member, value] of Object.entries(node)) {
    if (member.startsWith("$") || !hasColour(value)) continue;
    roleNames.push(fam + "." + member);
  }
}

// ── THE SECOND CONSUMER ─────────────────────────────────────────────────────
// This scanned only the web prototype until `insight.*` was renamed and the RN
// app stopped compiling. The family was reported DORMANT while four screens in
// app/src were consuming it — a half-truth, which is worse than an unknown
// because it reads like an answer.
//
// The token source has two consumers by design (§7: one source, two platforms),
// so dormancy has to mean "nothing anywhere renders it". The RN app is included
// here on the same terms as the prototype: everything under app/src, minus the
// generated vendored artifacts.
function rnFiles() {
  const base = resolve(ROOT, "app/src");
  if (!existsSync(base)) return [];
  const out = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = dir + "/" + entry;
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry) && !entry.includes(".generated.")) out.push(full);
    }
  })(base);
  return out;
}

// ── CONSUMED (family level) ─────────────────────────────────────────────────
// A family counts as consumed when its name is used as a token PATH, not merely
// when the word appears — so a comment mentioning the Toast does not count as
// drawing one.
const sources = consumerFiles()
  .filter((f) => /\.tsx?$/.test(f))
  .map((f) => readFileSync(resolve(ROOT, f), "utf8"))
  .concat(rnFiles().map((f) => readFileSync(f, "utf8")))
  .join("\n");

const consumed = new Set(
  familyNames.filter((f) => new RegExp("pattern\\." + f + "\\b").test(sources))
);

// ── MEASURED (role level) ───────────────────────────────────────────────────
const declared = new Set();
for (const pair of manifest.pairs) {
  for (const spec of [pair.fg, pair.bg]) {
    const m = String(spec).match(/^pattern\.([A-Za-z0-9]+\.[A-Za-z0-9]+)/);
    if (m) declared.add(m[1]);
  }
  // A TRANSLUCENT token used as a backdrop cannot appear as a bg spec — the
  // contrast check requires an opaque background, so those pairs carry the
  // pre-composited literal instead. The link back to the token it came from
  // lived only in prose, which meant a role could be thoroughly measured and
  // still look unmeasured here. `composited` makes that link machine-readable.
  for (const spec of [].concat(pair.composited ?? [])) {
    const m = String(spec).match(/^pattern\.([A-Za-z0-9]+\.[A-Za-z0-9]+)/);
    if (m) declared.add(m[1]);
  }
}

// ── SEMANTIC ROLES ──────────────────────────────────────────────────────────
// The pattern layer is not the whole token surface. `color.accent.surface` and
// `color.accent.edge` are used on almost every screen in this product and were
// named by no pair at all — they are translucent, so they appear in the manifest
// only as pre-composited literals, exactly the gap the `composited` field was
// added to close for patterns.
//
// MEASUREMENT ONLY, and deliberately no dormancy check here. Semantic roles are
// reached through the legacy `D` alias as often as by their full path, so
// source scanning would be even less reliable than it was for pattern roles —
// and a check that cries wolf gets ignored.
const semanticRoles = [];
(function walkColour(node, path) {
  if (typeof node === "string") {
    if (/^#[0-9A-Fa-f]{6,8}$/.test(node)) semanticRoles.push(path.join("."));
    return;
  }
  if (!node || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) walkColour(v, path.concat(k));
})(tokens.modes.dark.color, ["color"]);

const declaredSemantic = new Set();
for (const pair of manifest.pairs) {
  for (const spec of [pair.fg, pair.bg].concat(pair.composited ?? [])) {
    const name = String(spec).split("@")[0];
    if (name.startsWith("color.")) declaredSemantic.add(name);
  }
}
const unmeasuredSemantic = semanticRoles.filter((r) => !declaredSemantic.has(r));

const dormant = familyNames.filter((f) => !consumed.has(f));
// Roles inside a dormant family are already reported by that family, so they are
// not counted twice. "Unmeasured" means: this renders, and nothing checks it.
const unmeasured = roleNames.filter((r) => consumed.has(r.split(".")[0]) && !declared.has(r));

const budget = existsSync(BUDGET_FILE)
  ? JSON.parse(readFileSync(BUDGET_FILE, "utf8"))
  : { dormant: dormant.length, unmeasured: unmeasured.length };

if (UPDATE) {
  writeFileSync(BUDGET_FILE, JSON.stringify({
    $note: "Token consumption ratchet. BOTH NUMBERS MAY ONLY DECREASE.",
    $principle: "defined -> consumed -> rendered -> measured. A definition is not evidence.",
    $generated: new Date().toISOString().slice(0, 10),
    dormant: Math.min(budget.dormant ?? dormant.length, dormant.length),
    unmeasured: Math.min(budget.unmeasured ?? unmeasured.length, unmeasured.length),
    $dormantFamilies: dormant,
    $unmeasuredRoles: unmeasured,
    unmeasuredSemantic: Math.min(budget.unmeasuredSemantic ?? unmeasuredSemantic.length, unmeasuredSemantic.length),
    $unmeasuredSemanticRoles: unmeasuredSemantic,
  }, null, 2) + "\n");
  console.log("consumption budget updated: dormant " + dormant.length + ", unmeasured " + unmeasured.length);
  process.exit(0);
}

console.log("consumption: " + familyNames.length + " pattern families, " + roleNames.length + " colour roles");
console.log("  measured   : " + (roleNames.length - unmeasured.length) + " of " + roleNames.length + " roles");
console.log("  dormant    : " + dormant.length + " families  (budget " + budget.dormant + ")" + (dormant.length ? " — " + dormant.join(", ") : ""));
console.log("  unmeasured : " + unmeasured.length + " pattern roles  (budget " + budget.unmeasured + ")" + (unmeasured.length ? " — " + unmeasured.join(", ") : ""));
console.log("  semantic   : " + (semanticRoles.length - unmeasuredSemantic.length) + " of " + semanticRoles.length + " measured  (budget " + budget.unmeasuredSemantic + " unmeasured)" + (unmeasuredSemantic.length ? " — " + unmeasuredSemantic.join(", ") : ""));

if (LIST) {
  console.log("");
  for (const r of roleNames) {
    const c = consumed.has(r.split(".")[0]) ? "consumed" : "DORMANT ";
    const m = declared.has(r) ? "measured  " : "UNMEASURED";
    console.log("  " + r.padEnd(28) + " " + c + "  " + m);
  }
}

let failed = false;
if (dormant.length > budget.dormant) {
  console.error("\nDormant families over budget by " + (dormant.length - budget.dormant) + ".");
  console.error("A family nothing consumes is a family nothing can disagree with — which is how");
  console.error("toast.*, capture.*, share.* and paywall.savingsLabel each shipped a defect that");
  console.error("looked exactly like a definition.");
  failed = true;
}
if (unmeasured.length > budget.unmeasured) {
  console.error("\nUnmeasured roles over budget by " + (unmeasured.length - budget.unmeasured) + ".");
  console.error("These RENDER and no contrast pair names them. Declare them in pairs.manifest.json.");
  failed = true;
}
if (unmeasuredSemantic.length > (budget.unmeasuredSemantic ?? Infinity)) {
  console.error("");
  console.error("Unmeasured SEMANTIC roles over budget by " + (unmeasuredSemantic.length - budget.unmeasuredSemantic) + ".");
  console.error("The pattern layer is not the whole token surface.");
  failed = true;
}
if (failed) process.exit(1);
