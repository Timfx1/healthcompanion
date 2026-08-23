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

const THRESHOLDS = {
  "body-text": 4.5, "large-text": 3.0, "ui-boundary": 3.0, decorative: 0,
  // Print is held higher than screen, and the reason is not perfectionism.
  // Paper has no brightness control, no zoom, no theme fallback, and a clinical
  // report gets photocopied — which crushes midtones. WCAG 4.5:1 assumes an
  // emissive display the reader can adjust; paper offers none of that, so body
  // copy is held to the AAA figure instead.
  "print-body": 7.0, "print-large": 4.5, "print-rule": 3.0, "print-decorative": 0,
};
const isPrintUsage = (u) => u.startsWith("print-");

// ── Token source ────────────────────────────────────────────────────────────
// Reads the GENERATED, RESOLVED tokens rather than parsing a source file. This
// matters for correctness: dist/tokens.json has already resolved every
// reference and every mode pairing, so what this audit measures is exactly what
// the emitters hand to the app. Auditing the authored JSON instead would mean
// re-implementing the resolver here and risking the two drifting apart.
const TOKENS_JSON = resolve(ROOT, "design-system/dist/tokens.json");

function loadTokens() {
  const doc = JSON.parse(readFileSync(TOKENS_JSON, "utf8"));
  // Flatten each mode into dotted paths -> hex, e.g.
  //   dark["color.surface.raised"] = "#1E1D2E"
  const byMode = {};
  for (const [mode, tree] of Object.entries(doc.modes)) {
    const flat = {};
    const walk = (node, path) => {
      if (typeof node === "string") {
        if (/^#[0-9A-Fa-f]{6,8}$/.test(node)) flat[path.join(".")] = normalizeHex(node);
        return;
      }
      if (!node || typeof node !== "object") return;
      for (const [k, v] of Object.entries(node)) walk(v, [...path, k]);
    };
    walk(tree, []);
    byMode[mode] = flat;
  }
  // The print layer is a SIBLING of doc.modes, not a member of it — print is a
  // medium, not a third colour mode, and filing it under `modes` would make the
  // token file argue against the decision it implements. It is merged in here
  // under its own key so that every piece of machinery below (spec resolution,
  // compositing, debt, reporting) applies unchanged.
  if (doc.print) {
    const flat = {};
    const walk = (node, path) => {
      if (typeof node === "string") {
        if (/^#[0-9A-Fa-f]{6,8}$/.test(node)) flat[path.join(".")] = normalizeHex(node);
        return;
      }
      if (!node || typeof node !== "object") return;
      for (const [k, v] of Object.entries(node)) walk(v, [...path, k]);
    };
    walk(doc.print, []);
    byMode.print = flat;
  }
  return byMode;
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
//   "color.text.secondary"       -> dotted semantic path, resolved for the
//                                   pair's own mode
//   "pattern.corridor.band"      -> a pattern token (often already 8-digit hex)
//   "#F2A69E"                    -> literal hex, 6 or 8 digit
//   "color.accent.default@44"    -> token at a 2-hex-digit alpha
//   "color.accent.default@0.267" -> token at a float alpha
//
// Alpha may arrive two ways: baked into an 8-digit hex by the emitter, or
// appended here with @. Both end up in the same place — a colour with a < 1
// that gets composited before measurement.
function resolveSpec(spec, tokens, mode) {
  const [name, alphaPart] = String(spec).split("@");
  const flat = tokens[mode];
  if (!flat) throw new Error(`Unknown mode "${mode}"`);
  const baseHex = name.startsWith("#") ? normalizeHex(name) : flat[name];
  if (!baseHex) throw new Error(`Unknown token "${name}" in ${mode} mode. Use a dotted path from dist/tokens.json, e.g. color.text.secondary`);
  const rgba = toRgba(baseHex);
  if (alphaPart === undefined) return rgba;
  const alpha = alphaPart.includes(".") ? parseFloat(alphaPart) : parseInt(alphaPart, 16) / 255;
  return { ...rgba, a: alpha };
}

// ── Run ─────────────────────────────────────────────────────────────────────
const tokens = loadTokens();
const manifest = JSON.parse(readFileSync(resolve(HERE, "pairs.manifest.json"), "utf8"));

// Each pair is declared ONCE and evaluated in BOTH modes. That is possible
// because semantic tokens are mode-paired: `color.text.secondary` already means
// the right thing in each mode, so a pair does not need a per-mode twin.
//
// It also removes a whole failure mode. Under the previous shape, every pair
// had to be hand-written twice, and a pair that someone only remembered to
// declare for dark would silently go unchecked on light — which is precisely
// the blind spot that let the light-mode palette ship unmeasured.
const results = [];
for (const pair of manifest.pairs) {
  const usage = pair.usage ?? "body-text";
  const threshold = THRESHOLDS[usage];
  if (threshold === undefined) throw new Error(`Pair "${pair.id}": unknown usage class "${usage}"`);

  // A print pair does not declare modes: the usage class already says which
  // token set it belongs to. That removes the one way this could go wrong —
  // a print colour measured against the dark screen palette, or vice versa.
  if (isPrintUsage(usage) && pair.modes) throw new Error(`Pair "${pair.id}": a print-* pair must not declare "modes" — its usage class selects the print token set.`);
  if (!isPrintUsage(usage) && (pair.modes ?? []).includes("print")) throw new Error(`Pair "${pair.id}": declares the print token set but uses a screen usage class "${usage}".`);

  for (const mode of isPrintUsage(usage) ? ["print"] : pair.modes ?? ["dark", "light"]) {
    // Backdrops must be opaque - you cannot measure contrast against something
    // see-through without knowing what is behind it.
    //
    // `composited` names a TRANSLUCENT LAYER that sits between the declared
    // surface and the foreground: a tinted chip on a card, a selected fill on
    // an option. The check composites it here and measures against the result.
    //
    // IT DID NOT ALWAYS. For most of this manifest's life `composited` was a
    // prose field the checker never read, and every pair using it carried a
    // HAND-COMPUTED literal backdrop instead. That worked only for as long as
    // nobody moved a surface or an alpha, and it failed silently in the three
    // places where an author gave a plain surface token as `bg` and assumed the
    // tint was being applied - `education/deep-dive hook` and `share/day label`
    // were measuring their foregrounds against an UNTINTED backdrop while
    // reading, in the manifest, as though the tint were accounted for.
    //
    // The literals were not guesses that could simply be trusted: each one was
    // inverted back through its own alpha to recover the surface underneath,
    // and every one landed on a real token. That is what they are now declared
    // as, so a change to a surface or an alpha moves the measurement with it.
    const surface = resolveSpec(pair.bg, tokens, mode);
    if (surface.a < 1) throw new Error(`Pair "${pair.id}" (${mode}): background "${pair.bg}" is translucent; declare the opaque surface beneath it.`);
    let bg = surface;
    if (pair.composited) {
      const layer = resolveSpec(pair.composited, tokens, mode);
      if (layer.a >= 1) throw new Error(`Pair "${pair.id}" (${mode}): composited layer "${pair.composited}" is opaque. An opaque layer IS the backdrop - declare it as "bg" and drop "composited".`);
      bg = { ...composite(layer, surface), a: 1 };
    }

    const fgRaw = resolveSpec(pair.fg, tokens, mode);
    const fg = composite(fgRaw, bg);
    const ratio = contrastRatio(fg, bg);

    results.push({
      id: pair.id,
      mode,
      usage,
      fg: pair.fg,
      bg: pair.bg,
      composited: fgRaw.a < 1 ? rgbToHex(fg) : null,
      ratio: Math.round(ratio * 100) / 100,
      threshold,
      pass: threshold === 0 ? null : ratio >= threshold,
      note: pair.note ?? null,
      // Debt is scoped PER MODE, not per pair. Most of the known failures fail
      // on light only and pass comfortably on dark — marking the whole pair as
      // debt would exempt the dark side too, and a later dark-mode regression
      // would slip through under a flag that was never meant to cover it.
      debt: pair.debt === true || (Array.isArray(pair.debt) && pair.debt.includes(mode)),
    });
  }
}

function rgbToHex({ r, g, b }) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0").toUpperCase()).join("");
}

// Two classes of failure, and only one of them should break a build.
//
//   REGRESSION — a pair that is expected to pass and does not. Fails CI.
//   DEBT       — a known failure explicitly marked in the manifest and tracked
//                in RECONCILIATION.md with a fix direction.
//
// The distinction matters because a check that is permanently red stops being
// read. Debt is still reported on every run, and the moment a debt pair starts
// passing it is flagged so the marker can be removed — otherwise the manifest
// slowly fills with stale exemptions that hide real problems.
const failures = results.filter((r) => r.pass === false);
const regressions = failures.filter((r) => !r.debt);
const debt = failures.filter((r) => r.debt);
const fixedDebt = results.filter((r) => r.debt && r.pass === true);

if (AS_JSON) {
  console.log(JSON.stringify({ $generated: new Date().toISOString(), summary: { total: results.length, failures: failures.length }, results }, null, 2));
} else {
  const shown = SHOW_ALL ? results : results.filter((r) => r.pass !== true);
  const byMode = {};
  for (const r of shown) (byMode[r.mode] ??= []).push(r);

  // Iterate what actually ran, not a hardcoded pair of modes — print is a third
  // token set and would otherwise be measured and then silently not shown.
  for (const mode of ["dark", "light", "print"]) {
    const rows = byMode[mode] ?? [];
    if (!rows.length) continue;
    console.log(`\n${mode === "print" ? "PRINT (paper — not a mode)" : mode.toUpperCase() + " MODE"}`);
    console.log("  ratio    req   verdict  pair");
    for (const r of rows.sort((a, b) => a.ratio - b.ratio)) {
      const verdict = r.pass === null ? "exempt " : r.pass ? "PASS   " : "FAIL   ";
      const comp = r.composited ? ` (composited ${r.composited})` : "";
      console.log(`  ${String(r.ratio).padStart(6)}  ${String(r.threshold).padStart(4)}   ${verdict}  ${r.id}${comp}`);
      if (!r.pass && r.note) console.log(`                            ^ ${r.note}`);
    }
  }
  console.log(`\n${results.length} pair-mode combinations checked`);
  console.log(`  regressions : ${regressions.length}${regressions.length ? "  <-- fails the build" : ""}`);
  console.log(`  tracked debt: ${debt.length}  (see RECONCILIATION.md)`);
  if (fixedDebt.length) {
    console.log(`\n  ${fixedDebt.length} pair(s) marked as debt now PASS — remove the debt flag:`);
    for (const r of fixedDebt) console.log(`    ${r.id} (${r.mode}) ${r.ratio}:1`);
  }
  if (!SHOW_ALL) console.log("\n(rerun with --all to see passing pairs)");
}

process.exit(regressions.length ? 1 : 0);
