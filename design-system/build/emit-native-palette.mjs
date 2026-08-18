// ============================================================
// FILE: build/emit-native-palette.mjs
// PURPOSE: Emit an AnklePath-shaped flat palette from the token source, so the
//   React Native screens can be ported without rewriting 439 call sites by hand.
//
// WHY A BRIDGE AT ALL
//
// AnklePath screens read a flat 25-key `AppPalette` off AppThemeContext: 439
// references across 31 files. Rewriting each to reach `theme(mode).color.…`
// would be a thousand-line diff nobody could review, and this exact problem was
// already solved once here — the legacy `D` object is what made the web token
// swap a zero-diff change. This is that trick again, aimed at React Native.
//
// WHAT IS MAPPED, AND WHAT IS DELIBERATELY NOT
//
// Only STRUCTURAL NEUTRALS are mapped: surfaces, text steps, borders, white.
// Those are honestly one-to-one — both systems mean the same thing by "the
// page", "a card", "secondary text".
//
// Every key that carries MEANING is omitted on purpose, so the compiler lists
// it for a human:
//
//   teal, tealDark, blue, blueDark
//     AnklePath's brand identity. There is no "the Recovery Companion blue".
//     Each of the 73 sites has to say whether it meant the accent, a data
//     category, or a link.
//
//   red, green, amber, purple
//     These look mappable and are not. `palette.red` currently colours a SIGN
//     OUT button and a "bad" data point. Pointing it at safety.mark would put
//     the reserved red-flag hue on both — which N3 forbids in almost exactly
//     those words ("never decorative", "never for a bad data point"). `green`
//     colours a data TONE, which is text, so it needs ink rather than mark:
//     the same mark-as-text trap the web prototype was just cleaned of.
//
//   successSoft, warningSoft, dangerSoft, infoSoft
//     Status tints. Each needs a category chosen and a check that it is a fill
//     and not text.
//
// About 291 of the 439 references swap mechanically. The remaining ~148 stop
// the build until somebody decides what they meant, which is the entire point:
// a bridge that mapped everything would compile on day one and quietly ship
// AnklePath's colour semantics inside a product whose rules differ.
// ============================================================

const NL = String.fromCharCode(10);

export const RC_PALETTE_MAP = {
  background:     "color.surface.base",
  backgroundSoft: "color.surface.base",
  surface:        "color.surface.raised",
  surfaceRaised:  "color.surface.card",
  surfaceMuted:   "color.surface.border",
  text:           "color.text.primary",
  textMuted:      "color.text.secondary",
  textSubtle:     "color.text.muted",
  border:         "color.surface.border",
  borderSoft:     "color.surface.border",
  white:          "color.text.onAccent",
};

export const RC_OMITTED = [
  "teal", "tealDark", "blue", "blueDark",
  "red", "green", "amber", "purple",
  "successSoft", "warningSoft", "dangerSoft", "infoSoft",
];

// modes: string[]; at/resolveValue/semantic are passed in so this file stays a
// pure emitter with no knowledge of how the token tree is loaded.
export function emitNativePalette({ modes, semantic, at, resolveValue }) {
  const palettes = {};
  for (const mode of modes) {
    const pal = { mode };
    for (const [key, path] of Object.entries(RC_PALETTE_MAP)) {
      const node = at(semantic, path);
      if (!node) throw new Error("RC palette map points at a missing token: " + path);
      pal[key] = resolveValue(node, mode);
    }
    palettes[mode] = pal;
  }

  const typeFields = Object.keys(RC_PALETTE_MAP).map((k) => "  " + k + ": string;");

  return [
    "",
    "/**",
    " * AnklePath-shaped palette, generated from the token source.",
    " *",
    " * A MIGRATION SHIM with a deliberate end date. Ported screens read",
    " * palette.text, and this lets them keep doing so while the values beneath",
    " * become Recovery Companion's. New code should use theme(mode) instead:",
    " * this shape is FLAT, so it cannot express mark-vs-ink, and that is the one",
    " * distinction this system most needs components to make.",
    " *",
    " * OMITTED ON PURPOSE: " + RC_OMITTED.join(", ") + ".",
    " * These carry meaning rather than structure, and are absent so that every",
    " * site using one FAILS TO COMPILE and gets re-domained by hand. See",
    " * build/emit-native-palette.mjs for why each one is unsafe to map.",
    " */",
    "export type RcPalette = {",
    "  mode: Mode;",
    ...typeFields,
    "};",
    "",
    "const RC_PALETTES = " + JSON.stringify(palettes, null, 2) + " as const;",
    "",
    "export function appPalette(mode: Mode): RcPalette {",
    "  return RC_PALETTES[mode];",
    "}",
    "",
    "/** AnklePath keys Recovery Companion deliberately does not provide. */",
    "export const RC_UNMAPPED_KEYS = " + JSON.stringify(RC_OMITTED) + " as const;",
    "",
  ].join(NL);
}
