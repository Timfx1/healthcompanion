// ============================================================
// FILE: build/build.mjs
// PURPOSE: Resolve the token source into platform artifacts.
//
//   tokens/{primitives,semantic,patterns}.json
//                    |
//        resolve refs + validate
//                    |
//     +--------------+---------------+-------------------+
//     |              |               |                   |
// dist/tokens.json  tokens.css   tokens.web.ts    tokens.native.ts
//   (resolved)     (@theme)      (drop-in D + t)  (RN StyleSheet-safe)
//
// DESIGN RULE THIS ENFORCES: the token layer contains no platform strings.
// No rgba(), no box-shadow, no var(), no px. Only numbers, 6-digit hex,
// refs and structured objects. Every platform string is constructed here,
// which is what lets one source serve both CSS and React Native.
//
// USAGE: node design-system/build/build.mjs [--check]
//   --check  build in memory and compare against the committed dist/,
//            exiting non-zero on any difference. This is the drift gate.
// ============================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DS = resolve(HERE, "..");
const CHECK = process.argv.includes("--check");

const MODES = ["dark", "light"];
const load = (f) => JSON.parse(readFileSync(resolve(DS, "tokens", f), "utf8"));

const primitives = load("primitives.json");
const semantic = load("semantic.json");
const patterns = load("patterns.json");

const errors = [];
const fail = (msg) => errors.push(msg);

// ── Path access ─────────────────────────────────────────────────────────────
const META = new Set(["$layer", "$note", "$provenance", "$intent", "$contract", "$status", "$never", "$forbiddenOn", "$negativeSpace", "$description", "$type", "$value", "$hex"]);

function at(root, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), root);
}

// A ref may point into any layer. Primitives are searched first because
// semantic tokens reference them by their bare path (e.g. {color.indigo.900}),
// and patterns reference semantics by theirs (e.g. {color.text.primary}).
function lookup(path) {
  for (const root of [primitives, semantic, patterns]) {
    const hit = at(root, path);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

const isRef = (v) => typeof v === "string" && /^\{[^}]+\}$/.test(v);
const refPath = (v) => v.slice(1, -1);

// ── Resolution ──────────────────────────────────────────────────────────────
// Resolves a value for ONE mode. Recurses through refs, mode-paired maps and
// colorAlpha composites until it bottoms out at a literal.
function resolveValue(value, mode, trail = []) {
  if (trail.length > 24) { fail(`Circular reference: ${trail.join(" -> ")}`); return null; }

  if (isRef(value)) {
    const path = refPath(value);
    const target = lookup(path);
    if (target === undefined) { fail(`Unresolved reference {${path}} (from ${trail.at(-1) ?? "root"})`); return null; }
    return resolveValue(target, mode, [...trail, path]);
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    // A token node: unwrap to its $value.
    if ("$value" in value) return resolveValue(value.$value, mode, trail);

    // A mode-paired map.
    if (MODES.every((m) => m in value)) return resolveValue(value[mode], mode, trail);

    // A colorAlpha composite -> 8-digit hex.
    if ("base" in value && "alpha" in value) {
      const base = resolveValue(value.base, mode, trail);
      const alphaNode = isRef(value.alpha) ? lookup(refPath(value.alpha)) : value.alpha;
      const hex = alphaNode?.$hex;
      if (!hex) { fail(`Alpha step ${JSON.stringify(value.alpha)} has no $hex byte`); return null; }
      if (typeof base !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(base)) { fail(`colorAlpha base did not resolve to a 6-digit hex: ${base}`); return null; }
      return (base + hex).toUpperCase();
    }

    // A structured group (type role, motion role, gradient): resolve members.
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("$")) continue;
      out[k] = resolveValue(v, mode, trail);
    }
    return out;
  }

  return value;
}

// Walk a token tree and invoke fn(path, node) for every leaf token node.
function walk(node, fn, path = []) {
  if (!node || typeof node !== "object") return;
  if ("$value" in node) { fn(path, node); return; }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("$")) continue;
    walk(v, fn, [...path, k]);
  }
}

// ── Validation ──────────────────────────────────────────────────────────────
// These checks are the reason this system is a build step rather than a
// convention. Each corresponds to a rule in DESIGN_CRITERIA.md.

// V1 — mode pairing. This is the structural fix for the original drift bug:
// a colour role missing its light value is a build failure, not a comment.
walk(semantic, (path, node) => {
  if (node.$type !== "color") return;
  const v = node.$value;
  const paired = v && typeof v === "object" && !Array.isArray(v) && MODES.every((m) => m in v);
  if (!paired) fail(`V1 mode-pairing: semantic.${path.join(".")} is $type color but is not paired { dark, light }`);
});

// V2 — category families must be complete. This is how "never meaning by
// colour alone" becomes mechanical rather than reviewed.
for (const [name, fam] of Object.entries(semantic.color.category)) {
  if (name.startsWith("$")) continue;
  for (const member of ["mark", "ink", "icon", "label"]) {
    if (!(member in fam)) fail(`V2 category completeness: color.category.${name} is missing "${member}" — a family without all four cannot satisfy never-meaning-by-colour-alone`);
  }
}

// V3 — the safety hues are reserved. Any token outside color.safety.* or the
// alert primitives that resolves to one of them is a violation.
const ALERT_HEXES = new Set(Object.values(primitives.color.alert).filter((n) => n?.$value).map((n) => n.$value.toUpperCase()));
for (const [layerName, layer] of [["semantic", semantic], ["patterns", patterns]]) {
  walk(layer, (path, node) => {
    const dotted = path.join(".");
    if (dotted.startsWith("color.safety") || dotted.startsWith("safety")) return;
    for (const mode of MODES) {
      const r = resolveValue(node, mode);
      if (typeof r === "string" && ALERT_HEXES.has(r.slice(0, 7).toUpperCase())) {
        fail(`V3 reserved colour: ${layerName}.${dotted} resolves to the safety hue ${r} in ${mode} mode. Warm alert colour is reserved for red-flag content only.`);
      }
    }
  });
}

// V4 — forbidden names. The principle is enforced by the shape of the token
// set: if no token can be named "target", a target line cannot be built.
const FORBIDDEN = patterns.$negativeSpace.forbidden;
for (const [layerName, layer] of [["semantic", semantic], ["patterns", patterns]]) {
  walk(layer, (path) => {
    const leaf = path.at(-1)?.toLowerCase() ?? "";
    for (const word of FORBIDDEN) {
      if (leaf === word) fail(`V4 forbidden name: ${layerName}.${path.join(".")} — "${word}" is prohibited (see patterns.$negativeSpace)`);
    }
  });
}

// V5 — shadows may not carry spread. React Native has no spread, so a token
// using it could not round-trip; rejecting it here prevents a future trap.
walk(primitives, (path, node) => {
  if (node.$type === "shadow" && node.$value?.spread) fail(`V5 shadow spread: ${path.join(".")} uses spread, which React Native cannot express`);
});

// ── Resolve everything ──────────────────────────────────────────────────────
const resolved = { $generated: "design-system/build/build.mjs", modes: {} };
for (const mode of MODES) {
  resolved.modes[mode] = {
    color: resolveValue(semantic.color, mode),
    type: resolveValue(semantic.type, mode),
    motion: resolveValue(semantic.motion, mode),
    pattern: resolveValue(patterns, mode),
  };
}
resolved.primitive = {
  space: resolveValue(primitives.space, "dark"),
  radius: resolveValue(primitives.radius, "dark"),
  size: resolveValue(primitives.size, "dark"),
  z: resolveValue(primitives.z, "dark"),
  duration: resolveValue(primitives.duration, "dark"),
  easing: resolveValue(primitives.easing, "dark"),
  stagger: resolveValue(primitives.stagger, "dark"),
  font: resolveValue(primitives.font, "dark"),
};

if (errors.length) {
  console.error(`\nTOKEN BUILD FAILED — ${errors.length} error(s):\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}

// ── Legacy surface ──────────────────────────────────────────────────────────
// The prototype's existing `D` object, reproduced key-for-key from the token
// source. This is what makes the consumer swap a ZERO-DIFF change: the same
// names resolve to the same values, so nothing renders differently. It is a
// migration shim with a deliberate end date, not a permanent API — new code
// uses the mode-resolved `t` object instead.
const D_MAP = {
  base: ["color.surface.base", "dark"], raised: ["color.surface.raised", "dark"],
  card: ["color.surface.card", "dark"], border: ["color.surface.border", "dark"],
  accent: ["color.accent.default", "dark"], accentL: ["color.accent.strong", "dark"],
  accentD: ["color.accent.dim", "dark"], text: ["color.text.primary", "dark"],
  textSec: ["color.text.secondary", "dark"], textMut: ["color.text.muted", "dark"],
  lBase: ["color.surface.base", "light"], lCard: ["color.surface.raised", "light"],
  lBorder: ["color.surface.border", "light"], lText: ["color.text.primary", "light"],
  lTextSec: ["color.text.secondary", "light"], lTextMut: ["color.text.muted", "light"],
  pain: ["color.category.pain.mark", "dark"], sleep: ["color.category.sleep.mark", "dark"],
  energy: ["color.category.energy.mark", "dark"], mood: ["color.category.mood.mark", "dark"],
  meds: ["color.category.meds.mark", "dark"], safety: ["color.safety.mark", "dark"],
};
const D = {};
for (const [key, [path, mode]] of Object.entries(D_MAP)) {
  const node = at(semantic, path);
  if (!node) { console.error(`Legacy D map points at a missing token: ${path}`); process.exit(1); }
  D[key] = resolveValue(node, mode);
}

// ── Emitters ────────────────────────────────────────────────────────────────
const BANNER = (ext) => {
  const l = ext === "css" ? ["/*", " *", " */"] : ["//", "//", "//"];
  return [
    `${l[0]} GENERATED FILE — DO NOT EDIT.`,
    `${l[1]} Source: design-system/tokens/*.json`,
    `${l[1]} Rebuild: node design-system/build/build.mjs`,
    `${l[1]} Verify:  node design-system/build/build.mjs --check`,
    `${l[2]}`,
    "",
  ].join("\n");
};

// dist/tokens.css — Tailwind v4 @theme plus a light-mode override block.
function emitCss() {
  const flat = (obj, prefix = []) => {
    const out = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flat(v, [...prefix, k]));
      else if (typeof v === "string" && v.startsWith("#")) out.push([[...prefix, k].join("-"), v]);
    }
    return out;
  };
  const dark = flat(resolved.modes.dark.color);
  const light = flat(resolved.modes.light.color);

  let css = BANNER("css");

  // WHAT MAY GO IN @theme, AND WHY IT MATTERS
  //
  // In Tailwind v4 an @theme key is not an inert custom property — it REDEFINES
  // the matching utility scale. Emitting --radius-xl here silently redefines
  // `rounded-xl` for the whole app; emitting --spacing-3 redefines `gap-3`.
  //
  // That is not hypothetical: the first version of this emitter wrote the
  // radius and spacing scales into @theme, which changed `rounded-xl` from
  // Tailwind's 12px to our 16px and `rounded-2xl` from 16px to 24px. Those two
  // utilities appear 47 times across the two screen files, and the visual
  // parity run failed on 30+ screens.
  //
  // So @theme carries ONLY colours and the font family — the same surface the
  // hand-written block had. Geometry scales are emitted below as namespaced
  // custom properties that cannot collide with any utility, and are consumed
  // through the typed `scale` export rather than through class names.
  css += "@theme {\n";
  css += `  --font-sans: ${primitives.font.family.$value.map((f) => (f.includes(" ") ? `'${f}'` : f)).join(", ")};\n\n`;
  for (const [name, val] of dark) css += `  --color-${name}: ${val};\n`;
  css += "}\n\n";

  css += "/* Geometry scales. Deliberately OUTSIDE @theme and prefixed --rc- so they\n";
  css += "   cannot redefine a Tailwind utility scale. Reference material for CSS\n";
  css += "   authors; the typed `scale` export is the real consumer. */\n";
  css += ":root {\n";
  for (const [k, v] of Object.entries(resolved.primitive.radius)) css += `  --rc-radius-${k}: ${v}px;\n`;
  for (const [k, v] of Object.entries(resolved.primitive.space)) css += `  --rc-space-${k}: ${v}px;\n`;
  for (const [k, v] of Object.entries(resolved.primitive.z)) css += `  --rc-z-${k}: ${v};\n`;
  for (const [k, v] of Object.entries(resolved.primitive.duration)) css += `  --rc-duration-${k}: ${v}ms;\n`;
  css += "}\n\n";
  css += "/* Light mode. Same role names, different values — so a component never\n";
  css += "   branches on mode to pick a colour. */\n";
  css += ':root[data-theme="light"] {\n';
  for (const [name, val] of light) css += `  --color-${name}: ${val};\n`;
  css += "}\n";
  return css;
}

// dist/tokens.web.ts — legacy D + mode-resolved theme.
function emitWeb() {
  let ts = BANNER("ts");
  ts += `export type Mode = "dark" | "light";\n\n`;
  ts += "/**\n * Legacy flat palette, preserved key-for-key from the original tokens.ts so\n * the consumer swap is a zero-diff change.\n *\n * @deprecated Use `theme(mode)` instead. `D` pairs badly with `c(dark, light)`:\n * because both take RAW VALUES, they invite a hardcoded hex at the call site,\n * which is how 200+ literals accumulated in the first place.\n */\n";
  ts += `export const D = ${JSON.stringify(D, null, 2)} as const;\n\n`;
  ts += "/** @deprecated Mode-select helper retained for one migration pass. */\n";
  ts += `export function c(dark: string, light: string, mode: Mode) {\n  return mode === "dark" ? dark : light;\n}\n\n`;
  ts += "// Mode-resolved themes. `theme(mode).color.surface.raised` is already the\n// right value — there is no raw-value channel for a literal to sneak through.\n";
  ts += `const THEMES = ${JSON.stringify(resolved.modes, null, 2)} as const;\n\n`;
  ts += `export const scale = ${JSON.stringify(resolved.primitive, null, 2)} as const;\n\n`;
  ts += `export function theme(mode: Mode) {\n  return THEMES[mode];\n}\n\n`;
  ts += `export type Theme = (typeof THEMES)["dark"];\n`;
  return ts;
}

// dist/tokens.native.ts — React Native shapes.
function emitNative() {
  let ts = BANNER("ts");
  ts += "// React Native surface. Differences from the web emitter, all of them\n";
  ts += "// forced by the platform:\n";
  ts += "//   - dimensions are bare numbers, never `px` strings\n";
  ts += "//   - translucent colours are 8-digit hex, which RN parses natively;\n";
  ts += "//     rgba() strings are avoided because RN rejects them in some props\n";
  ts += "//   - easing is exported as cubic-bezier control points for\n";
  ts += "//     Easing.bezier(...) in Reanimated, not as a CSS keyword\n";
  ts += "//   - shadows would convert with shadowRadius = blur / 2, because iOS\n";
  ts += "//     shadowRadius is not CSS blur\n\n";
  ts += `export type Mode = "dark" | "light";\n\n`;
  ts += `const THEMES = ${JSON.stringify(resolved.modes, null, 2)} as const;\n\n`;
  ts += `export const scale = ${JSON.stringify(resolved.primitive, null, 2)} as const;\n\n`;
  ts += `export function theme(mode: Mode) {\n  return THEMES[mode];\n}\n\n`;
  ts += `export type Theme = (typeof THEMES)["dark"];\n`;
  ts += `export type ColorRole = keyof Theme["color"];\n`;
  return ts;
}

const artifacts = {
  "tokens.json": JSON.stringify(resolved, null, 2) + "\n",
  "tokens.css": emitCss(),
  "tokens.web.ts": emitWeb(),
  "tokens.native.ts": emitNative(),
};

// Consumer copies. The generated artifacts are vendored into the web prototype
// rather than imported across the repo boundary, because Vite restricts imports
// from outside its project root and the prototype is a regenerable sandbox that
// should not depend on a sibling directory's layout.
const CONSUMERS = {
  "Onboarding Flow/src/components/tokens.generated.ts": artifacts["tokens.web.ts"],
  "Onboarding Flow/src/tokens.generated.css": artifacts["tokens.css"],
};
const REPO = resolve(DS, "..");

// ── Write or check ──────────────────────────────────────────────────────────
const targets = [
  ...Object.entries(artifacts).map(([n, c]) => [resolve(DS, "dist", n), c, `dist/${n}`]),
  ...Object.entries(CONSUMERS).map(([n, c]) => [resolve(REPO, n), c, n]),
];

if (CHECK) {
  let drifted = 0;
  for (const [path, content, label] of targets) {
    if (!existsSync(path)) { console.error(`DRIFT: ${label} is missing`); drifted++; continue; }
    if (readFileSync(path, "utf8") !== content) { console.error(`DRIFT: ${label} does not match a fresh build`); drifted++; }
  }
  if (drifted) {
    console.error(`\n${drifted} artifact(s) drifted. Run: node design-system/build/build.mjs`);
    process.exit(1);
  }
  console.log(`In sync with tokens/ (${targets.length} artifacts).`);
} else {
  for (const [path, content] of targets) writeFileSync(path, content, "utf8");
  const colorCount = Object.keys(resolved.modes.dark.color).length;
  console.log(`Built ${targets.length} artifacts (4 in dist/, 2 vendored into the prototype).`);
  console.log(`  colour role groups : ${colorCount}`);
  console.log(`  pattern families   : ${Object.keys(resolved.modes.dark.pattern).length}`);
  console.log(`  legacy D keys      : ${Object.keys(D).length}`);
  console.log(`  validations passed : V1 mode-pairing, V2 category completeness, V3 reserved colour, V4 forbidden names, V5 shadow spread`);
}
