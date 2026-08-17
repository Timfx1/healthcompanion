// ============================================================
// FILE: harvest.mjs
// PURPOSE: Read-only inventory of every hardcoded design literal in the
//   Recovery Companion web prototype. Emits extraction/ledger.json — one row
//   per literal with value, kind, file:line, enclosing component and prop.
//
// WHY: The prototype keeps its design values in three places — tokens.ts,
//   the index.css @theme block, and ~200 inline literals across two
//   1,900-line files. The ledger is the complete list of what has to be
//   reconciled against Figma before any token file is authored.
//
// THIS SCRIPT NEVER WRITES TO THE PROTOTYPE. It only reads and reports.
//
// USAGE: node design-system/extraction/harvest.mjs
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

const SOURCES = [
  "Onboarding Flow/src/components/Onboarding.tsx",
  "Onboarding Flow/src/components/MainApp.tsx",
  "Onboarding Flow/src/components/tokens.ts",
  "Onboarding Flow/src/index.css",
];

// ── Comment stripping ───────────────────────────────────────────────────────
// CRITICAL: these files are ~40% documentation by volume, and the light/dark
// comparison guide in MainApp.tsx quotes well over a hundred hex values in
// prose. Scanning raw text would produce a ledger dominated by comments that
// describe values rather than the values themselves.
//
// Comments are blanked out (replaced space-for-space) rather than removed, so
// every byte offset and line number still maps to the original file.
function stripComments(src, isCss) {
  const out = Array.from(src);
  let i = 0;
  const n = src.length;
  let state = "code"; // code | line | block | sq | dq | tpl
  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];
    if (state === "code") {
      if (!isCss && ch === "/" && next === "/") { state = "line"; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      if (ch === "/" && next === "*") { state = "block"; out[i] = " "; out[i + 1] = " "; i += 2; continue; }
      if (ch === "'") { state = "sq"; i++; continue; }
      if (ch === '"') { state = "dq"; i++; continue; }
      if (ch === "`") { state = "tpl"; i++; continue; }
      i++; continue;
    }
    if (state === "line") {
      if (ch === "\n") { state = "code"; i++; continue; }
      out[i] = " "; i++; continue;
    }
    if (state === "block") {
      if (ch === "*" && next === "/") { out[i] = " "; out[i + 1] = " "; state = "code"; i += 2; continue; }
      if (ch !== "\n") out[i] = " ";
      i++; continue;
    }
    // inside a string literal — leave content intact, just find the terminator
    const quote = state === "sq" ? "'" : state === "dq" ? '"' : "`";
    if (ch === "\\") { i += 2; continue; }
    if (ch === quote) { state = "code"; i++; continue; }
    i++;
  }
  return out.join("");
}

// ── Component attribution ───────────────────────────────────────────────────
// Both monoliths are flat: every screen and primitive is a top-level
// `function Name(...)`. Nearest preceding definition is therefore an accurate
// enclosing-component attribution, not a heuristic guess.
const DEF_PATTERNS = [
  /^\s*(?:export\s+)?(?:default\s+)?function\s+([A-Za-z0-9_]+)/,
  /^\s*(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>/,
  /^\s*(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*[[{]/,
];

function buildDefIndex(lines) {
  const defs = [];
  lines.forEach((line, idx) => {
    for (const re of DEF_PATTERNS) {
      const m = line.match(re);
      if (m) { defs.push({ line: idx + 1, name: m[1] }); break; }
    }
  });
  return defs;
}

function componentAt(defs, lineNo) {
  let name = "<module>";
  for (const d of defs) {
    if (d.line <= lineNo) name = d.name; else break;
  }
  return name;
}

// ── Prop attribution ────────────────────────────────────────────────────────
// Looks left from the match for the nearest `identifier:` or CSS `property:`
// so a bare "#7C6FCD" is recorded as backgroundColor / borderColor / color.
function propAt(lineText, matchIndex) {
  const before = lineText.slice(0, matchIndex);
  const m = before.match(/([A-Za-z-][A-Za-z0-9-]*)\s*:\s*[^:]*$/);
  return m ? m[1] : null;
}

// ── Extractors ──────────────────────────────────────────────────────────────
// Order matters: 8-digit hex must be tried before 6-digit, and the
// `${D.token}NN` template form before the bare-hex scan, so the longest
// meaningful form wins and we never double-count a prefix.
const EXTRACTORS = [
  {
    kind: "token-alpha",
    // `${D.accent}22` — a token reference with an 8-digit-hex alpha suffix.
    // Already the correct cross-platform form; these are the rows that need
    // no conversion, only a name.
    re: /\$\{\s*(?:D\.)?([A-Za-z0-9_]+)\s*\}([0-9A-Fa-f]{2})(?![0-9A-Fa-f])/g,
    map: (m) => ({ value: `\${${m[1]}}${m[2]}`, base: m[1], alphaHex: m[2].toUpperCase(), alpha: +(parseInt(m[2], 16) / 255).toFixed(3) }),
  },
  {
    kind: "hex",
    re: /#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(?![0-9A-Fa-f])/g,
    map: (m) => {
      const raw = m[0].toUpperCase();
      const body = raw.slice(1);
      return body.length === 8
        ? { value: raw, base: `#${body.slice(0, 6)}`, alphaHex: body.slice(6), alpha: +(parseInt(body.slice(6), 16) / 255).toFixed(3) }
        : { value: raw };
    },
  },
  {
    kind: "rgba",
    re: /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*([\d.]+)\s*)?\)/g,
    map: (m) => ({ value: m[0].replace(/\s+/g, ""), alpha: m[1] === undefined ? 1 : +m[1] }),
  },
  {
    kind: "gradient",
    re: /(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/g,
    map: (m) => ({ value: m[0].replace(/\s+/g, " ").trim() }),
  },
  {
    kind: "shadow",
    re: /(?:boxShadow|box-shadow|textShadow|text-shadow)\s*:\s*["'`]([^"'`]+)["'`]/g,
    map: (m) => ({ value: m[1].replace(/\s+/g, " ").trim() }),
  },
  {
    kind: "numeric",
    re: /\b(fontSize|borderRadius|zIndex|lineHeight|letterSpacing|borderWidth|fontWeight|opacity|width|height|minHeight|maxWidth|gap|padding|margin)\s*:\s*(-?[\d.]+)\b/g,
    map: (m) => ({ value: m[2], prop: m[1] }),
  },
  {
    kind: "duration",
    re: /\b(\d+(?:\.\d+)?)(ms|s)\b/g,
    map: (m) => ({ value: m[2] === "s" ? `${Math.round(parseFloat(m[1]) * 1000)}ms` : `${m[1]}ms`, raw: m[0] }),
  },
  {
    kind: "easing",
    re: /cubic-bezier\([^)]*\)|\b(?:ease-in-out|ease-out|ease-in|linear|ease)\b(?=\s*[;"'`,)]|\s+\d)/g,
    map: (m) => ({ value: m[0].replace(/\s+/g, "") }),
  },
];

// ── Run ─────────────────────────────────────────────────────────────────────
const rows = [];
const fileStats = [];

for (const rel of SOURCES) {
  const abs = resolve(ROOT, rel);
  let raw;
  try {
    raw = readFileSync(abs, "utf8");
  } catch {
    console.error(`SKIP (not found): ${rel}`);
    continue;
  }
  const isCss = rel.endsWith(".css");
  const code = stripComments(raw, isCss);
  const rawLines = raw.split("\n");
  const codeLines = code.split("\n");
  const defs = isCss ? [] : buildDefIndex(codeLines);

  let fileRows = 0;
  codeLines.forEach((lineText, idx) => {
    const lineNo = idx + 1;
    // Track which character spans are already claimed, so `#7C6FCD22` inside a
    // token-alpha match is not re-counted by the bare-hex extractor.
    const claimed = [];
    const overlaps = (a, b) => claimed.some(([x, y]) => a < y && b > x);

    for (const ex of EXTRACTORS) {
      ex.re.lastIndex = 0;
      let m;
      while ((m = ex.re.exec(lineText)) !== null) {
        const start = m.index;
        const end = start + m[0].length;
        if (overlaps(start, end)) continue;
        claimed.push([start, end]);
        const mapped = ex.map(m);
        rows.push({
          kind: ex.kind,
          ...mapped,
          file: rel,
          line: lineNo,
          component: isCss ? "<css>" : componentAt(defs, lineNo),
          prop: mapped.prop ?? propAt(lineText, start),
          context: rawLines[idx].trim().slice(0, 120),
          decision: null, // one of: map | new | collapse | keep-literal — filled in during E2
          token: null,
          note: null,
        });
        fileRows++;
      }
    }
  });
  fileStats.push({ file: rel, lines: rawLines.length, literals: fileRows, components: defs.length });
}

// ── Cluster ─────────────────────────────────────────────────────────────────
// Group identical values so the reconciliation pass decides once per distinct
// value, not once per occurrence. The >=2 rule ("used twice means it is a
// token") operates on these counts.
const clusters = new Map();
for (const r of rows) {
  const key = `${r.kind}::${r.value}`;
  if (!clusters.has(key)) clusters.set(key, { kind: r.kind, value: r.value, occurrences: 0, components: new Set(), props: new Set(), files: new Set() });
  const cl = clusters.get(key);
  cl.occurrences++;
  cl.components.add(r.component);
  if (r.prop) cl.props.add(r.prop);
  cl.files.add(r.file);
}

const clusterList = [...clusters.values()]
  .map((c) => ({
    kind: c.kind,
    value: c.value,
    occurrences: c.occurrences,
    mustTokenize: c.occurrences >= 2,
    components: [...c.components].sort(),
    props: [...c.props].sort(),
    files: [...c.files].sort(),
    decision: null,
    token: null,
  }))
  .sort((a, b) => a.kind.localeCompare(b.kind) || b.occurrences - a.occurrences || a.value.localeCompare(b.value));

const byKind = {};
for (const c of clusterList) {
  byKind[c.kind] ??= { distinct: 0, occurrences: 0 };
  byKind[c.kind].distinct++;
  byKind[c.kind].occurrences += c.occurrences;
}

const ledger = {
  $generated: new Date().toISOString(),
  $generator: "design-system/extraction/harvest.mjs",
  $note: "Read-only inventory. `decision` is null until the E2 reconciliation pass fills it with map | new | collapse | keep-literal.",
  sources: fileStats,
  summary: {
    totalOccurrences: rows.length,
    totalDistinct: clusterList.length,
    mustTokenize: clusterList.filter((c) => c.mustTokenize).length,
    byKind,
  },
  clusters: clusterList,
  rows,
};

const outPath = resolve(HERE, "ledger.json");
writeFileSync(outPath, JSON.stringify(ledger, null, 2) + "\n", "utf8");

// ── Report ──────────────────────────────────────────────────────────────────
console.log("SOURCES");
for (const f of fileStats) {
  console.log(`  ${String(f.literals).padStart(4)} literals  ${String(f.lines).padStart(5)} lines  ${String(f.components).padStart(3)} defs  ${f.file}`);
}
console.log(`\nTOTAL: ${rows.length} occurrences / ${clusterList.length} distinct values`);
console.log(`Used >=2 times (must become tokens): ${ledger.summary.mustTokenize}\n`);

console.log("BY KIND                distinct   occurrences");
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1].distinct - a[1].distinct)) {
  console.log(`  ${k.padEnd(20)} ${String(v.distinct).padStart(6)} ${String(v.occurrences).padStart(13)}`);
}

for (const kind of ["hex", "token-alpha", "rgba"]) {
  const top = clusterList.filter((c) => c.kind === kind).slice(0, 12);
  if (!top.length) continue;
  console.log(`\nTOP ${kind.toUpperCase()}`);
  for (const c of top) console.log(`  ${String(c.occurrences).padStart(3)}x  ${c.value.padEnd(26)} ${c.props.slice(0, 3).join(",")}`);
}

console.log(`\nWrote ${relative(ROOT, outPath)}`);
