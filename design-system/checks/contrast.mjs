// ============================================================
// FILE: contrast.mjs
// PURPOSE: WCAG 2.x AA contrast audit over a declared manifest of permitted
//   foreground/background pairs, evaluated separately in dark and light mode.
//
// TWO THINGS THIS GETS RIGHT THAT NAIVE CHECKERS DO NOT:
//
//   1. ALPHA COMPOSITING. A token written `#7C6FCD44` is a 27%-opacity
//      lavender. Measuring it as if it were opaque lavender reports a
//      contrast the user never sees. Every translucent foreground is
//      composited over its declared backdrop before luminance is taken.
//
//   2. BOTH MODES, SEPARATELY. The pastel category hues pass comfortably on
//      dark surfaces and fail badly on white. A checker that only samples one
//      mode reports a clean bill of health on a palette that is unreadable in
//      the other.
//
// THRESHOLDS (WCAG 2.2):
//   body-text     4.5:1   normal-weight body copy
//   large-text    3.0:1   >=18.66px bold or >=24px regular
//   ui-boundary   3.0:1   1.4.11 non-text contrast: controls, focus, meaningful borders
//   decorative    exempt  recorded for information, never failed
//
// USAGE: node design-system/checks/contrast.mjs [--json] [--all]
// EXIT:  1 if any non-exempt pair is below its threshold.
// ============================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

const AS_JSON = process.argv.includes("--json");
const SHOW_ALL = process.argv.includes("--all");

const THRESHOLDS = { "body-text": 4.5, "large-text": 3.0, "ui-boundary": 3.0, decorative: 0 };

// ── Token source ────────────────────────────────────────────────────────────
// Read straight from the prototype's tokens.ts so this audit always reflects
// what actually ships, not a transcription of it. Once dist/tokens.json exists
// this switches to the generated file.
const TOKENS_SRC = resolve(ROOT, "Onboarding Flow/src/components/tokens.ts");

function loadTokens() {
  const src = readFileSync(TOKENS_SRC, "utf8");
  const body = src.slice(src.indexOf("export const D"));
  const tokens = {};
  const re = /^\s*([A-Za-z0-9_]+)\s*:\s*"(#[0-9A-Fa-f]{3,8})"/gm;
  let m;
  while ((m = re.exec(body)) !== null) tokens[m[1]] = normalizeHex(m[2]);
  return tokens;
}

function normalizeHex(hex) {
  let h = hex.replace("#", "").toUpperCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 4) h = h.split("").map((c) => c + c).join("");
  return "#" + h;
}

// ── Color math ──────────────────────────────────────────────────────────────
function toRgba(hex) {
  const h = normalizeHex(hex).slice(1);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a };
}

// Source-over compositing in non-linear sRGB. This matches what browsers and
// RN actually do for a translucent layer painted on an opaque backdrop.
function composite(fg, bg) {
  if (fg.a >= 1) return { ...fg, a: 1 };
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }) {
  const lin = (c8) => {
    const c = c8 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── Color spec resolution ───────────────────────────────────────────────────
// A spec is one of:
//   "textSec"      -> token lookup
//   "#F2A69E"      -> literal hex (6 or 8 digit)
//   "accent@44"    -> token at a 2-hex-digit alpha (the prototype's own idiom)
//   "accent@0.267" -> token at a float alpha
function resolveSpec(spec, tokens) {
  const [name, alphaPart] = String(spec).split("@");
  const baseHex = name.startsWith("#") ? normalizeHex(name) : tokens[name];
  if (!baseHex) throw new Error(`Unknown color token: "${name}"`);
  const rgba = toRgba(baseHex);
  if (alphaPart === undefined) return rgba;
  const alpha = alphaPart.includes(".") ? parseFloat(alphaPart) : parseInt(alphaPart, 16) / 255;
  return { ...rgba, a: alpha };
}

// ── Run ─────────────────────────────────────────────────────────────────────
const tokens = loadTokens();
const manifest = JSON.parse(readFileSync(resolve(HERE, "pairs.manifest.json"), "utf8"));

const results = [];
for (const pair of manifest.pairs) {
  const usage = pair.usage ?? "body-text";
  const threshold = THRESHOLDS[usage];
  if (threshold === undefined) throw new Error(`Pair "${pair.id}": unknown usage class "${usage}"`);

  // Backdrops must be opaque — you cannot measure contrast against something
  // see-through without knowing what is behind it.
  const bg = resolveSpec(pair.bg, tokens);
  if (bg.a < 1) throw new Error(`Pair "${pair.id}": background "${pair.bg}" is translucent; declare the opaque surface beneath it.`);

  const fgRaw = resolveSpec(pair.fg, tokens);
  const fg = composite(fgRaw, bg);
  const ratio = contrastRatio(fg, bg);

  results.push({
    id: pair.id,
    mode: pair.mode,
    usage,
    fg: pair.fg,
    bg: pair.bg,
    composited: fgRaw.a < 1 ? rgbToHex(fg) : null,
    ratio: Math.round(ratio * 100) / 100,
    threshold,
    pass: usage === "decorative" ? null : ratio >= threshold,
    note: pair.note ?? null,
  });
}

function rgbToHex({ r, g, b }) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0").toUpperCase()).join("");
}

const failures = results.filter((r) => r.pass === false);

if (AS_JSON) {
  console.log(JSON.stringify({ $generated: new Date().toISOString(), summary: { total: results.length, failures: failures.length }, results }, null, 2));
} else {
  const shown = SHOW_ALL ? results : results.filter((r) => r.pass !== true);
  const byMode = { dark: [], light: [] };
  for (const r of shown) (byMode[r.mode] ??= []).push(r);

  for (const mode of ["dark", "light"]) {
    const rows = byMode[mode] ?? [];
    if (!rows.length) continue;
    console.log(`\n${mode.toUpperCase()} MODE`);
    console.log("  ratio    req   verdict  pair");
    for (const r of rows.sort((a, b) => a.ratio - b.ratio)) {
      const verdict = r.pass === null ? "exempt " : r.pass ? "PASS   " : "FAIL   ";
      const comp = r.composited ? ` (composited ${r.composited})` : "";
      console.log(`  ${String(r.ratio).padStart(6)}  ${String(r.threshold).padStart(4)}   ${verdict}  ${r.id}${comp}`);
      if (!r.pass && r.note) console.log(`                            ^ ${r.note}`);
    }
  }
  console.log(`\n${results.length} pairs checked · ${failures.length} failing AA`);
  if (!SHOW_ALL && failures.length) console.log("(passing pairs hidden — rerun with --all)");
}

process.exit(failures.length ? 1 : 0);
