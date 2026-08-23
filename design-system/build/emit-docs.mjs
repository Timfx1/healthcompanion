// ============================================================
// FILE: build/emit-docs.mjs
// PURPOSE: Generate the token appendix that DESIGN_CRITERIA.md §12 promises,
//   and append it to that document below a fixed marker.
//
// WHY THIS EXISTS AT ALL
//
// DESIGN_CRITERIA.md opens with a rule: the document holds RULES AND INTENT and
// deliberately almost no hex values, pixel sizes or millisecond counts, because
// "a rule that names a raw value in prose is a rule that goes stale the first
// time the value changes."
//
// That rule is right, and it creates an obligation. A design document that
// contains no values is unusable on its own — you cannot review a palette you
// cannot see. §12 therefore promised an appendix of generated tables, produced
// by this file. The promise sat unkept long enough that the document referenced
// a program nobody had written, which is its own species of the drift this
// system exists to prevent: prose asserting something about the repository that
// is not true.
//
// So: the values live in tokens/, the prose lives above the marker, and
// everything below the marker is written by this program from dist/tokens.json.
// Hand-editing below the marker is pointless — the next run overwrites it, and
// --check fails the moment the two diverge.
//
// USAGE: node design-system/build/emit-docs.mjs [--check]
//   --check  render in memory and compare against the committed document,
//            exiting non-zero on any difference. Same contract as build.mjs.
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DS = resolve(HERE, "..");
const REPO = resolve(DS, "..");
const CHECK = process.argv.includes("--check");

const DOC = resolve(REPO, "DESIGN_CRITERIA.md");
const MARKER = "**Appendix — generated token tables:**";

const tokens = JSON.parse(readFileSync(resolve(DS, "dist", "tokens.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(DS, "checks", "pairs.manifest.json"), "utf8"));

const { dark, light } = tokens.modes;
const P = tokens.primitive;

// ── Helpers ─────────────────────────────────────────────────────────────────
//
// NO COLOUR SWATCHES, DELIBERATELY. The obvious improvement here is to render
// each colour as a small data-URI image so the table shows the colour and not
// only its name. It was tried and reverted: 121 colour rows at two swatches
// each took DESIGN_CRITERIA.md from 22KB to 79KB, nearly all of it base64.
//
// The cost is not the file size, it is the diff. This appendix regenerates on
// every token change, and a document whose generated half is mostly base64
// produces reviewable diffs for exactly nobody — which defeats the reason the
// appendix is committed rather than built on demand. The hex IS the value;
// anyone who needs to see it has a colour picker, and the design file is
// canonical for appearance anyway.

// Walk a resolved mode tree into [dottedPath, hex] pairs.
const flatten = (node, prefix = []) => {
  const out = [];
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === "string" && /^#[0-9A-Fa-f]{6,8}$/.test(v)) out.push([[...prefix, k].join("."), v]);
    else if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flatten(v, [...prefix, k]));
  }
  return out;
};

const table = (rows) => rows.join("\n");

// ── Sections ────────────────────────────────────────────────────────────────

function colourSection() {
  const d = new Map(flatten(dark.color));
  const l = new Map(flatten(light.color));
  const rows = [
    "| Role | Dark | Light |",
    "|---|---|---|",
  ];
  for (const [path, dv] of d) {
    const lv = l.get(path);
    rows.push(`| \`${path}\` | \`${dv}\` | \`${lv ?? "—"}\` |`);
  }
  return `### Colour roles\n\nEvery semantic colour, both modes, as the emitters hand them to the app. A role whose two values are identical is mode-invariant **by decision** — see the token's note in \`semantic.json\`.\n\n${table(rows)}`;
}

function patternSection() {
  const d = new Map(flatten(dark.pattern));
  const l = new Map(flatten(light.pattern));
  const rows = ["| Pattern token | Dark | Light |", "|---|---|---|"];
  for (const [path, dv] of d) {
    const lv = l.get(path);
    rows.push(`| \`${path}\` | \`${dv}\` | \`${lv ?? "—"}\` |`);
  }
  return `### Pattern families\n\nProduct concepts with fixed contracts, defined once so they cannot drift between screens. Families with no colour rows (numbers, strings, reserved slots) are omitted here; see \`tokens/patterns.json\`.\n\n${table(rows)}`;
}

function typeSection() {
  const rows = ["| Role | Size | Weight | Line height | Tracking |", "|---|---|---|---|---|"];
  for (const [name, t] of Object.entries(dark.type)) {
    rows.push(`| \`${name}\` | ${t.size}px | ${t.weight} | ${t.lineHeight} | ${t.tracking} |`);
  }
  const scale = Object.entries(P.font.size).map(([k, v]) => `\`${k}\` ${v}px`).join(" · ");
  return `### Type\n\n${table(rows)}\n\n**Scale steps:** ${scale}\n\n**Weights:** ${Object.entries(P.font.weight).map(([k, v]) => `\`${k}\` ${v}`).join(" · ")}. Only 700 qualifies text for the WCAG large-text exemption.`;
}

function motionSection() {
  const rows = ["| Role | Duration | Easing |", "|---|---|---|"];
  for (const [name, m] of Object.entries(dark.motion)) {
    rows.push(`| \`${name}\` | ${m.duration}ms | \`cubic-bezier(${m.easing.join(", ")})\` |`);
  }
  return `### Motion\n\nStored as bezier control points, never as the keyword \`ease-out\` — the keyword resolves to different curves in different engines, and this system targets two.\n\n${table(rows)}`;
}

function scaleSection() {
  const line = (label, obj, unit = "") =>
    `| ${label} | ${Object.entries(obj).map(([k, v]) => `\`${k}\` ${v}${unit}`).join(" · ")} |`;
  return `### Geometry and elevation\n\n| Scale | Steps |\n|---|---|\n${[
    line("space", P.space, "px"),
    line("radius", P.radius, "px"),
    line("size", P.size, "px"),
    line("z", P.z),
    line("duration", P.duration, "ms"),
  ].join("\n")}\n\nThe \`z\` order is fixed: an overlay must never be authored with an ad-hoc z-index.`;
}

function contrastSection() {
  const counts = manifest.pairs.reduce((acc, p) => {
    const u = p.usage ?? "body-text";
    acc[u] = (acc[u] ?? 0) + 1;
    return acc;
  }, {});
  const modes = manifest.pairs.reduce((n, p) => n + (p.modes ?? ["dark", "light"]).length, 0);
  const rows = Object.entries(counts).map(([u, n]) => `| \`${u}\` | ${n} |`);
  return `### Contrast manifest\n\n**${manifest.pairs.length} declared pairs, ${modes} pair-mode combinations.** Audited by \`checks/contrast.mjs\`, with translucent foregrounds composited over their declared backdrop before measurement.\n\n| Usage class | Pairs |\n|---|---|\n${rows.join("\n")}\n\nThis measures the pairs the manifest DECLARES, not the pairs the app renders. An undeclared combination is unmeasured, not passing — see §11.`;
}

// ── Render ──────────────────────────────────────────────────────────────────
function printSection() {
  if (!tokens.print) return null;
  const rows = ["| Role | Value | On paper |", "|---|---|---|"];
  const notes = {
    "ink.secondary": "Replaces four greys whose worst case was 2.36:1",
    "accent.stroke": "Data stroke, not text — 3:1 floor applies",
    "rule.hairline": "Exempt; the layout separates without it",
    "painDots.filled": "No hue: severity is read by counting",
  };
  for (const [path, v] of flatten(tokens.print)) {
    if (typeof v !== "string" || !v.startsWith("#")) continue;
    rows.push(`| \`${path}\` | \`${v}\` | ${notes[path] ?? ""} |`);
  }
  return `### Print (paper)\n\nA SEPARATE domain, not a third colour mode — single-valued, because paper has no dark counterpart. Body copy is held to **7:1**, not 4.5:1: paper offers no brightness control, no zoom and no theme fallback, and a clinical report gets photocopied. WCAG relative luminance is greyscale luminance, so a pair meeting its ratio here also survives a black-and-white copy.\n\n${table(rows)}\n\nEmitted to \`dist/tokens.print.ts\`. Validated by V6 (single-value) and V6b (the reserved alert hue is off limits on paper too).`;
}

const appendix = [
  `${MARKER} generated by \`design-system/build/emit-docs.mjs\` from \`design-system/dist/tokens.json\`.`,
  "**Everything below this line is written by that program. Do not hand-edit it** — the next run overwrites it, and `--check` fails the moment the two diverge. To change a value, edit `design-system/tokens/` and rebuild.",
  "",
  "---",
  "",
  colourSection(),
  "",
  patternSection(),
  "",
  printSection(),
  "",
  typeSection(),
  "",
  motionSection(),
  "",
  scaleSection(),
  "",
  contrastSection(),
  "",
].join("\n");

// ── Structural integrity ────────────────────────────────────────────────────
//
// §11 records this document being duplicated into itself twice, by a `$` +
// backtick in a String.replace replacement. Both times it survived commits,
// because the appendix check below only ever looked BELOW the marker, and the
// prose above it had no test at all. The document's own conclusion was that
// "a document has no test, so the only thing standing between it and silent
// corruption is somebody reading it." This is that test.
//
// A spliced prefix always duplicates the H1 and every `## ` heading above the
// splice point. Uniqueness of headings is therefore a cheap, exact detector:
// it would have failed on the first bad commit instead of the fourth copy.
function checkStructure(text) {
  const prose = text.slice(0, text.indexOf(MARKER) === -1 ? text.length : text.indexOf(MARKER));
  const seen = new Map();
  for (const line of prose.split(String.fromCharCode(10))) {
    if (!/^#{1,2} /.test(line)) continue;
    seen.set(line, (seen.get(line) ?? 0) + 1);
  }
  const dupes = [...seen].filter(([, n]) => n > 1);
  if (dupes.length === 0) return;
  console.error("CORRUPTION: DESIGN_CRITERIA.md repeats headings above the appendix marker.");
  console.error("A heading appearing N times means N-1 copies of the document are spliced into it.");
  for (const [line, n] of dupes) console.error(`  ${n}x  ${line}`);
  console.error("Cause, both previous times: a `$` followed by a backtick in a String.replace");
  console.error("replacement means 'insert everything before the match'. Use a replacer function.");
  process.exit(1);
}
const doc = readFileSync(DOC, "utf8");
const cut = doc.indexOf(MARKER);
if (cut === -1) {
  console.error(`Marker not found in DESIGN_CRITERIA.md:\n  ${MARKER}\nThe appendix is anchored to it; restore the line or update MARKER here.`);
  process.exit(1);
}
const next = doc.slice(0, cut) + appendix;

checkStructure(doc);

if (CHECK) {
  if (doc !== next) {
    console.error("DRIFT: DESIGN_CRITERIA.md appendix does not match a fresh render.");
    console.error("Run: node design-system/build/emit-docs.mjs");
    process.exit(1);
  }
  console.log("DESIGN_CRITERIA.md appendix is in sync with the tokens.");
} else {
  writeFileSync(DOC, next, "utf8");
  const colours = flatten(dark.color).length;
  console.log("Wrote the token appendix into DESIGN_CRITERIA.md.");
  console.log(`  colour roles     : ${colours}`);
  console.log(`  pattern colours  : ${flatten(dark.pattern).length}`);
  console.log(`  type roles       : ${Object.keys(dark.type).length}`);
  console.log(`  motion roles     : ${Object.keys(dark.motion).length}`);
  console.log(`  declared pairs   : ${manifest.pairs.length}`);
}
