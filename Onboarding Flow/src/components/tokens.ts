// ============================================================
// FILE: tokens.ts
// PURPOSE: Single source of truth for all design tokens used by both
//   Onboarding.tsx and MainApp.tsx. Importing from this file ensures
//   visual consistency across every screen in the app.
//
// USAGE:
//   import { D, c, type Mode } from "./tokens";
//   - D: object of all hex color values
//   - c(darkVal, lightVal, mode): returns the correct value for current mode
//   - Mode: "dark" | "light" type
//
// DESIGN SYSTEM NOTES:
//   Palette is Bearable-inspired (deep indigo/plum dark surfaces + lavender
//   accent + muted pastel category hues). Never use pure black (#000) for
//   surfaces. Red/coral/amber are reserved for safety states ONLY.
//   60-30-10 rule: 60% neutral surfaces, 30% secondary tint, 10% accent.
// ============================================================

// Recovery Companion — shared design tokens (used by both Onboarding and MainApp)
export const D = {
  // ── Dark surface palette ──────────────────────────────────────────────────
  // base: Deepest background layer. Never pure black.
  base:    "#15141F",
  // raised: Cards, modals, elevated surfaces (slightly lighter + warm-tinted).
  raised:  "#1E1D2E",
  // card: Secondary card surfaces inside raised containers.
  card:    "#252438",
  // border: Subtle dividers and card outlines.
  border:  "#2E2C45",

  // ── Accent (lavender/violet) ───────────────────────────────────────────────
  // accent: Primary CTA buttons, active tab, progress bar, selected states.
  accent:  "#7C6FCD",
  // accentL: Accent text on dark surfaces, lighter highlight variant.
  accentL: "#9B8FE0",
  // accentD: Accent tint for card backgrounds, gradient starts.
  accentD: "#3D3668",

  // ── Dark mode text ────────────────────────────────────────────────────────
  // text: Primary body text on dark surfaces.
  text:    "#F0EFFE",
  // textSec: Secondary/supporting text, labels, captions.
  textSec: "#9B97B8",
  // textMut: Muted/disabled text, placeholders, fine print.
  textMut: "#5C5878",

  // ── Light mode surfaces ───────────────────────────────────────────────────
  // lBase: Light mode page background.
  lBase:   "#F8F7FC",
  // lCard: Light mode card backgrounds.
  lCard:   "#FFFFFF",
  // lBorder: Light mode card outlines.
  lBorder: "#E4E1F5",
  // lText: Light mode primary text.
  lText:   "#1A1830",
  // lTextSec: Light mode secondary text.
  lTextSec:"#6B6890",
  // lTextMut: Light mode muted text (fine print, legal copy).
  lTextMut:"#B0ACCF",

  // ── Pastel category hues ─────────────────────────────────────────────────
  // These color-code data categories throughout the app: chips, charts,
  // timeline entries, insight cards. Muted, never neon.
  // Used to pair with icons/labels — never meaning by color alone (WCAG).
  pain:    "#F2A69E", // Pain data (reddish-peach)
  sleep:   "#9EC3F5", // Sleep data (soft blue)
  energy:  "#F5D08A", // Energy data (muted amber)
  mood:    "#A8D9B8", // Mood data (soft green)
  meds:    "#C9B8F0", // Medication data (soft lavender)

  // ── Safety color ─────────────────────────────────────────────────────────
  // RESERVED: Only for "When to contact a doctor" / red-flag screens.
  // Never used decoratively anywhere else in the app.
  safety:  "#E05548",
};

// ── Type ────────────────────────────────────────────────────────────────────
// Mode is toggled by the ☀️/🌙 button fixed to the top-right of every screen.
// The selected mode is passed down from App.tsx through Onboarding to MainApp.
export type Mode = "dark" | "light";

// ── Helper: mode-aware value selector ────────────────────────────────────────
// USAGE: c(darkValue, lightValue, mode)
// Returns darkValue when mode === "dark", lightValue when mode === "light".
// Aliased as `s` in consuming files for brevity.
export function c(dark: string, light: string, mode: Mode) {
  return mode === "dark" ? dark : light;
}
