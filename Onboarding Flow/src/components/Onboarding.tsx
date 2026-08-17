// ============================================================
// FILE: Onboarding.tsx
// PURPOSE: Complete 12-screen onboarding wizard for Recovery Companion.
//   Collects user's recovery context (type, condition, date, symptoms, pain
//   baseline, goal, notifications consent) then presents plan reveal,
//   free-plan celebration, premium teaser, and trial paywall.
//
// ENTRY POINT: Rendered by App.tsx when phase === "onboarding".
// EXIT: When user taps "Start free trial" or "Continue free" on screen 12
//   (PaywallScreen), onComplete(mode) is called → App.tsx transitions to MainApp.
//
// NAVIGATION MODEL:
//   Linear wizard. `screen` (0–11) indexes into the `screens` array.
//   next() increments, back() decrements. No skipping except on screens
//   that provide an explicit "Skip" secondary button.
//
// SCREEN INDEX MAP:
//   0  WelcomeScreen
//   1  RecoveryTypeScreen
//   2  ConditionScreen
//   3  StartDateScreen
//   4  SymptomsScreen
//   5  PainScreen
//   6  GoalScreen
//   7  NotificationsScreen
//   8  PlanLoadingScreen  (auto-advances internally)
//   9  FreePlanScreen
//   10 PremiumTeaserScreen
//   11 PaywallScreen      (calls onComplete on exit)
//
// SHARED STATE (UserData):
//   recoveryType, condition, bodyPart, startDate, symptoms[],
//   painScore, goal, notifications
//   Collected across screens 1–7 and passed to onComplete implicitly
//   (not yet persisted — this is UI-layer only).
//
// SCREEN TRANSITIONS:
//   Each screen swap wraps the screen node in a div with key={screen} and
//   className="animate-fade-in". This re-mounts the div on each screen change,
//   triggering the CSS animation.
//   ANIMATION: fadeIn — opacity 0→1, duration 300ms, easing ease-out.
//
// PROGRESS BAR:
//   Visible on screens 1–8 (step = screen index, total = 8).
//   Fills from left using CSS transition: width 500ms ease-out.
//   Not shown on screen 0 (Welcome) or screens 9–11 (post-wizard).
//
// DARK/LIGHT MODE:
//   Toggled by the fixed ☀️/🌙 button (top-right, zIndex 100).
//   Controlled by useMode() hook unless initialMode prop is provided.
//   Page background: radial-gradient transitions in 400ms.
//   Passed to every sub-screen via `mode` prop.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { D, c as s2, theme, scale, type Mode } from "./tokens";
import LockBadge from "./patterns/LockBadge";

// ============================================================
// LIGHT MODE vs DARK MODE — VISUAL COMPARISON GUIDE (ONBOARDING)
//
// This section describes, screen by screen, how the visual design shifts
// between dark mode (default) and light mode. Use this as a reference
// when recreating either version in VS Code or Figma.
//
// ── TOKEN REFERENCE ─────────────────────────────────────────
//
//   LAYER          DARK (#hex)      LIGHT (#hex)       Visual character
//   ─────────────────────────────────────────────────────────────────────
//   Page bg        #15141F          #F8F7FC            Deep ink-navy  ↔  Pale icy-lavender
//   Phone shell    #15141F          #F8F7FC            Same as page bg
//   Raised surface #1E1D2E          #FFFFFF            Stormy indigo  ↔  Pure white
//   Card surface   #252438          #FFFFFF            Slightly lighter indigo  ↔  Pure white
//   Border         #2E2C45          #E4E1F5            Subtle plum    ↔  Soft lilac outline
//   Accent         #7C6FCD          #7C6FCD            SAME — lavender-violet in both modes
//   Accent light   #9B8FE0          #9B8FE0            SAME — slightly brighter violet
//   Accent dim     #3D3668          #3D3668            SAME — deep indigo tint
//   Primary text   #F0EFFE          #1A1830            Off-white warm ↔  Near-black navy
//   Secondary text #9B97B8          #6B6890            Muted lavender ↔  Deeper slate-purple
//   Muted text     #5C5878          #B0ACCF            Dim plum       ↔  Pale violet-gray
//   Page gradient  radial from #23204A → #0D0C16       radial from #EAE6F8 → #F8F7FC
//
// ── PHONE SHELL SHADOW ──────────────────────────────────────
//   DARK:  Heavy dramatic drop shadow (0 32px 80px #000000B8) +
//          a 1px "glow rim" in faint white (#FFFFFF0F).
//          The phone feels like it's floating in darkness.
//   LIGHT: Soft lavender lift shadow (0 24px 64px #645AB42E) +
//          a 1px violet-tinted rim (#786EC81F).
//          The phone looks like a clean frosted glass panel.
//
// ── SCREEN 0: WELCOME ───────────────────────────────────────
//   DARK:
//     - Page background: deep indigo-black radial gradient.
//     - Illustration circle: rich purple radial gradient (#9B8FE0 → #7C6FCD → #3D3668).
//       Outer glow ring visible: #7C6FCD45.
//     - "Recovery Companion" wordmark: D.accent (#7C6FCD), vibrant against dark.
//     - Headline: near-white (#F0EFFE) on dark — very high contrast.
//     - Body paragraph: muted lavender (#9B97B8) — softer, clearly secondary.
//     - Value prop rows: deep raised surface (#1E1D2E) with subtle plum border.
//       Feels like dark-glass tiles.
//     - Mode toggle button: dark frosted glass look (#FFFFFF14 bg).
//
//   LIGHT:
//     - Page background: pale icy-lavender radial gradient (almost white).
//     - Illustration circle: identical purple gradient (accent is the same hex) —
//       but now pops MORE against the light background, feels more saturated/vivid.
//     - "Recovery Companion" wordmark: same D.accent — equally readable.
//     - Headline: deep navy (#1A1830) on pale lavender — warm and grounded.
//     - Body paragraph: medium slate-purple (#6B6890) — slightly darker secondary tone.
//     - Value prop rows: pure white (#FFFFFF) cards — crisp, clinical, clean.
//       Border is soft lilac (#E4E1F5) — barely visible, very refined.
//     - Mode toggle button: subtle dark-on-light frosted look (#0000000F bg).
//     - OVERALL FEEL: Clean, optimistic, airy. Like a medical wellness app.
//
// ── SCREEN 1: RECOVERY TYPE ─────────────────────────────────
//   DARK:
//     - Back button: #1E1D2E bg, #2E2C45 border. Looks like a dark floating button.
//     - Option cards (72px): #1E1D2E bg, #2E2C45 border.
//       SELECTED: gradient from #3D3668 → #7C6FCD33 + #7C6FCD border.
//       Selected title text: #9B8FE0 (bright lavender). Check circle: #7C6FCD.
//       The selected card glows subtly against the dark background.
//     - Emoji icons at 26px feel luminous against dark.
//     - "Continue" (disabled): #2E2C45 bg, #5C5878 muted text — very flat/dead.
//
//   LIGHT:
//     - Back button: pure white bg, #E4E1F5 lilac border.
//     - Option cards: white bg, very subtle lilac border.
//       SELECTED: gradient from deep-indigo (#3D3668) to #7C6FCD33 —
//       this gradient looks richer in light mode because the unselected cards are
//       stark white, making the colored selected state really stand out.
//       Selected border: same #7C6FCD accent — vivid violet line on white bg.
//     - "Continue" (disabled): #E4E1F5 bg, #6B6890 text — soft, clearly inactive.
//     - OVERALL DIFFERENCE: In dark mode selected cards look like glowing panels.
//       In light mode selected cards look like branded colored stamps on white.
//
// ── SCREEN 2: CONDITION ─────────────────────────────────────
//   DARK:
//     - Section labels ("BODY AREA", "CONDITION"): #9B97B8 muted lavender-gray.
//     - Chips (unselected): #1E1D2E bg, #2E2C45 border — dark pill shapes.
//     - Chips (selected): solid #7C6FCD bg, white text, #7C6FCD border.
//       In dark mode: selected chips look like neon-lit lavender buttons.
//
//   LIGHT:
//     - Section labels: #6B6890 slate-purple — slightly more authoritative.
//     - Chips (unselected): white bg, #E4E1F5 lilac border — almost invisible.
//       Very minimal, form-like appearance.
//     - Chips (selected): solid #7C6FCD bg, white text — accent chip is SAME HEX.
//       But against the white bg it feels much bolder and more decisive than dark mode.
//     - OVERALL: Light mode chip grid looks like a clean HTML form. Dark mode
//       chip grid looks like a sci-fi control panel.
//
// ── SCREEN 3: START DATE ────────────────────────────────────
//   DARK:
//     - Card container: #1E1D2E bg with #2E2C45 border. Dark frosted-glass quality.
//     - Calendar SVG icon: deep purple (#3D3668) body with #7C6FCD top strip and
//       #9B8FE0 details. Appears jewel-like against the dark surface.
//     - Date input (empty): dark bg #252438, #2E2C45 border, #5C5878 muted text.
//     - Date input (filled): border upgrades to #7C6FCD accent. Text: #F0EFFE.
//       The glowing accent border on a dark input is very prominent.
//     - Day counter text (when date selected): #9B8FE0 — soft lavender on dark.
//
//   LIGHT:
//     - Card container: white bg with #E4E1F5 lilac border.
//     - Calendar SVG: same colors (purple gradient) — actually MORE eye-catching
//       against white than in dark mode.
//     - Date input (empty): #F8F7FC bg (pale lavender-white), lilac border, #6B6890 text.
//     - Date input (filled): #7C6FCD accent border — same vivid violet but on light
//       bg it reads as a stronger visual signal. Text: #1A1830.
//     - Day counter: same #9B8FE0 lavender — appears slightly more saturated on white.
//
// ── SCREEN 4: SYMPTOMS ──────────────────────────────────────
//   DARK:
//     - Category colored dots (Pain/Mobility/Energy/Mood) glow visibly against dark bg.
//     - Unselected chips: dark pill, barely visible border.
//     - Selected chips: category color at 13% opacity bg + category-colored text.
//       e.g. Pain chip selected: #F2A69E21 bg + #F2A69E text.
//       Subtle, warm-tinted on dark — elegant, not garish.
//
//   LIGHT:
//     - Category dots: same hex colors but less contrast difference against white —
//       still clearly visible but "softer."
//     - Selected chips: same rgba(color,0.13) bg — but on white bg this reads as
//       a very faint tint. Selected text: #333 (hardcoded for light mode) instead of
//       category color — darker, more legible on the light tint.
//     - OVERALL: Dark mode feels colorful and expressive. Light mode feels
//       restrained and clinical — the tints are barely perceptible.
//
// ── SCREEN 5: PAIN LEVEL ────────────────────────────────────
//   DARK:
//     - Large pain numeral (80px): color shifts green→amber→red as value rises.
//       On dark bg, green (#A8D9B8) looks minty-fresh, red (#E05548) looks alarming.
//     - Slider track: unfilled portion uses #2E2C45 (dark plum).
//       Filled portion: matching pain color.
//     - Slider thumb: white circle, very visible against dark filled area.
//     - Emoji row: inactive emojis at 0.4 opacity — barely visible on dark.
//
//   LIGHT:
//     - Same pain numeral — identical color scale, but surrounded by light bg.
//       Green numerals feel more neutral/positive. Red feels softer on white.
//     - Slider track unfilled: #E4E1F5 (pale lilac) — much lighter than dark mode's plum.
//     - Slider filled: same pain color — appears more saturated by contrast.
//     - Emoji row: 0.4 opacity emojis on light bg — still clearly visible (pale gray).
//     - OVERALL: Dark mode makes the pain colors feel visceral. Light mode
//       makes them feel clinical and measured — same info, different emotional weight.
//
// ── SCREEN 6: GOAL ──────────────────────────────────────────
//   DARK: Same pattern as RecoveryTypeScreen. Dark card rows glow when selected.
//   LIGHT: Same pattern — white cards, selected rows show the gradient-over-white
//     contrast (deep indigo gradient on white is very striking).
//
// ── SCREEN 7: NOTIFICATIONS ─────────────────────────────────
//   DARK:
//     - Bell illustration: deep indigo radial gradient (accentD) + outer glow ring.
//       The glow #7C6FCD33 is only visible in dark mode.
//     - Benefit rows: #1E1D2E raised tiles — dark glass.
//     - Primary button: gradient accent, glow shadow visible against dark bg.
//
//   LIGHT:
//     - Bell: same purple gradient — pops strongly against pale lavender bg.
//       The glow ring is invisible (lost against light).
//     - Benefit rows: white cards with lilac border — lighter and airier.
//     - Primary button: same gradient — glow shadow (#7C6FCD59) less
//       dramatic on light bg but still visible as a soft purple lift.
//
// ── SCREEN 8: PLAN LOADING ──────────────────────────────────
//   DARK (loading phase):
//     - Spinner ring: conic-gradient accent (#7C6FCD) on dark bg. The sweeping
//       violet arc looks like a glowing radar sweep.
//     - Checklist items: inactive circles are #2E2C45 (very dark). When they
//       complete they turn #7C6FCD — the transition is dramatic (dark→bright violet).
//     - Text transitions: #5C5878 → #F0EFFE (dim → bright) — high visual impact.
//
//   LIGHT (loading phase):
//     - Same spinner ring — but on pale background the conic arc looks more like
//       a progress indicator on a form than a radar sweep. Less dramatic.
//     - Checklist: inactive circles are #E4E1F5 (pale lilac). Completion → #7C6FCD.
//       Transition is gentle (pale → violet) not dramatic.
//     - Text: #B0ACCF → #1A1830 — pale lavender becoming near-black.
//
//   DARK (ready phase):
//     - Checkmark circle: accent gradient glow (0 8px 32px #7C6FCD54).
//       Glowing green circle on black. Feels like a success signal in a dark cockpit.
//     - Timeline bars (staggered): each color (pain/sleep/energy/mood) glows against
//       the #1E1D2E card background. Very rich and colorful.
//     - Phase chips: soft semi-transparent category color badges. Jewel-like on dark.
//
//   LIGHT (ready phase):
//     - Checkmark circle: same glow — but on white card it's more subtle.
//     - Timeline bars: category colors on white card feel more clinical — like a
//       medical progress chart — rather than the dark mode's data-art aesthetic.
//     - Phase chips: same category tints on white bg — barely tinted, very quiet.
//
// ── SCREEN 9: FREE PLAN ─────────────────────────────────────
//   DARK:
//     - "FREE PLAN UNLOCKED" badge: #A8D9B821 bg + #A8D9B8 border text.
//       Soft mint chip against dark. Celebratory but not harsh.
//     - Feature rows: dark raised tiles (#1E1D2E) with colored icon tiles inside.
//       Each icon area: category color at 13% opacity — glowing tint on dark.
//     - Green check circles: #A8D9B833 bg — mint glow on dark surface.
//
//   LIGHT:
//     - Badge: same #A8D9B821 — on white bg this appears as a very pale
//       mint tint. #A8D9B8 text is clearly green but the bg is almost invisible.
//     - Feature rows: white cards, lilac borders. Category icon areas: same pale tints
//       — on white they look like pastel watercolor splashes.
//     - Green check circles: mint bg on white — clearly visible, soft.
//     - OVERALL: Dark mode feels like a celebration (glow, color). Light mode
//       feels like a clean onboarding checklist. Same emotional intent, different energy.
//
// ── SCREEN 10: PREMIUM TEASER ───────────────────────────────
//   DARK:
//     - "PREMIUM" badge: linear-gradient(accentD → rgba(accent,0.33)) — glows.
//     - Locked feature rows: 0.7 opacity. On dark bg this means they fade into
//       the deep surface — very subtle, not aggressive locked-state treatment.
//     - Lock badge circles: #2E2C45 (dark plum) bg with white padlock SVG.
//
//   LIGHT:
//     - "PREMIUM" badge: same gradient — but on white bg the deep-indigo start
//       creates a visible dark rectangle that contrasts strongly. Bold.
//     - Locked rows: 0.7 opacity on white cards — rows look faded, washed-out.
//       More obviously "locked" in light mode because the desaturation is more visible.
//     - Lock circles: #E4E1F5 (pale lilac) bg — very quiet, non-aggressive.
//
// ── SCREEN 11: PAYWALL ──────────────────────────────────────
//   DARK:
//     - Plan toggle cards (annual/monthly): dark card bg vs gradient-selected state.
//       Selected card: deep indigo gradient — subtle difference from unselected.
//       Selected title: #9B8FE0 (lavender) — warm glow.
//     - "SAVE 40%" badge: #A8D9B833 bg + #A8D9B8 text — mint on dark.
//     - Benefit checkmarks: #7C6FCD accent marks — bright violet on dark.
//     - "Continue free" secondary: transparent, #2E2C45 border — dim on dark.
//
//   LIGHT:
//     - Plan toggle: unselected cards are white — stark contrast with selected
//       (deep indigo gradient). The difference is MORE obvious in light mode.
//     - "SAVE 40%" badge: same mint rgba on white — very faint tint, text carries it.
//     - "✦" symbol at top: appears in primary text color (#1A1830) — heavy, dark.
//       In dark mode it's near-white (#F0EFFE) — feels like a star.
//     - "Continue free" secondary: white bg, #E4E1F5 border — almost invisible button.
//
// ── PROGRESS BAR (all data screens 1–8) ─────────────────────
//   DARK: Track: #2E2C45 (dark plum). Fill: #7C6FCD (violet). Subtle contrast.
//   LIGHT: Track: #E4E1F5 (pale lilac). Fill: #7C6FCD (violet). High contrast.
//          The fill is MORE visible in light mode because the track is lighter.
//
// ── MODE TOGGLE BUTTON ───────────────────────────────────────
//   DARK:  #FFFFFF14 bg — barely-there frosted white circle.
//          Shows ☀️ emoji. Fixed top-right, subtle.
//   LIGHT: #0000000F bg — barely-there frosted dark circle.
//          Shows 🌙 emoji. Same size, same subtlety.
// ============================================================

// ─── Types ────────────────────────────────────────────────────────────────────
// Mode re-exported from tokens

// UserData: accumulates across the wizard.
// All fields start empty/default. Screens update these via setData().
interface UserData {
  recoveryType: string;
  condition: string;
  bodyPart: string;
  startDate: string;
  symptoms: string[];
  painScore: number;
  goal: string;
  notifications: boolean;
}

const TOTAL_SCREENS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// useMode: manages dark/light toggle. Returns [currentMode, toggleFn].
// NOTE: If Onboarding receives an `initialMode` prop, the toggle is still
// available internally but the external mode overrides it.
function useMode(): [Mode, () => void] {
  const [mode, setMode] = useState<Mode>("dark");
  return [mode, () => setMode(m => m === "dark" ? "light" : "dark")];
}

// s: shorthand for mode-aware value selection.
// Returns `dark` when mode === "dark", `light` otherwise.
function s(dark: string, light: string, mode: Mode) {
  return mode === "dark" ? dark : light;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ============================================================
// COMPONENT: PhoneShell
// PURPOSE: Decorative phone-frame container. Wraps every onboarding screen
//   to give a mobile device presentation in the browser.
//   Width: 390px (iPhone 14 logical width). minHeight: 844px.
//   Border radius: 44px (approximates iOS device corner radius).
//   Includes a static fake status bar (time "9:41", signal/wifi/battery icons).
// DARK shadow: 0 32px 80px #000000B8 + 1px white rim (0.06 opacity).
// LIGHT shadow: 0 24px 64px #645AB42E + 1px violet rim.
// ============================================================
function PhoneShell({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden select-none"
      style={{
        width: 390,
        minHeight: 844,
        borderRadius: scale.radius.shell,
        background: s(D.base, D.lBase, mode),
        boxShadow: mode === "dark"
          ? "0 32px 80px #000000B8, 0 0 0 1px #FFFFFF0F"
          : "0 24px 64px #645AB42E, 0 0 0 1px #786EC81F",
        fontFamily: "Inter, ui-sans-serif, sans-serif",
      }}
    >
      {/* Static iOS-style status bar — decorative, not interactive */}
      <div className="flex items-center justify-between px-8 pt-4 pb-1 shrink-0" style={{ color: s(D.textSec, D.lTextSec, mode), fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>9:41</span>
        <div className="flex gap-1 items-center">
          <SignalIcon /><WifiIcon /><BatteryIcon />
        </div>
      </div>
      {children}
    </div>
  );
}

// Decorative SVG status bar icons — no interactions
function SignalIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="0.5" opacity="1"/>
      <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5" opacity="1"/>
      <rect x="9" y="2" width="3" height="9" rx="0.5" opacity="1"/>
      <rect x="13.5" y="0" width="2.5" height="11" rx="0.5" opacity="0.4"/>
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 4c1.9-2.2 4.7-3.5 7-3.5S13.1 1.8 15 4" strokeLinecap="round"/>
      <path d="M3.5 6.5c1.2-1.3 2.8-2 4.5-2s3.3.7 4.5 2" strokeLinecap="round"/>
      <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
      <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/>
      <rect x="2" y="2" width="15" height="7" rx="1.5" fill="currentColor"/>
      <path d="M21.5 3.5v4c.8-.4 1.3-1.2 1.3-2s-.5-1.6-1.3-2z" fill="currentColor" fillOpacity="0.4"/>
    </svg>
  );
}

// ============================================================
// COMPONENT: ProgressBar
// PURPOSE: Slim horizontal progress indicator shown on screens 1–8.
//   Visually tracks the user's position in the data-collection phase.
// VISUAL: 3px tall track. Filled portion uses D.accent color.
// ANIMATION: CSS transition width 500ms ease-out on step change.
//   Triggered every time next()/back() changes the `screen` index.
// ============================================================
function ProgressBar({ step, total, mode }: { step: number; total: number; mode: Mode }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="px-6 pt-1 pb-3 shrink-0">
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 3, background: s(D.border, D.lBorder, mode) }}
      >
        {/* ANIMATION: width transition — 500ms ease-out — triggered on step change */}
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: D.accent }}
        />
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: PrimaryButton
// PURPOSE: Main CTA button used on every onboarding screen.
//   height: 56px. Full-width. Rounded-2xl (border-radius ~16px).
//   Font: 16px semibold. Press feedback via .btn-press (scale 0.97, 120ms).
//
// STATES:
//   DEFAULT: Gradient background linear-gradient(135deg, #7C6FCD, #9B8FE0).
//     Box shadow: 0 4px 20px #7C6FCD59. White text.
//   DISABLED: Solid border-color background. Muted text. No shadow. cursor:default.
//   LOADING: Gradient preserved. Label replaced with spinning circle.
//     ANIMATION: .animate-spin-slow — 1.8s linear infinite rotation.
//   PRESSED: .btn-press active — scale 0.97, opacity 0.88, 120ms ease-out.
// ============================================================
function PrimaryButton({ label, onClick, mode, loading = false, disabled = false }: {
  label: string; onClick: () => void; mode: Mode; loading?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="btn-press w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-base"
      style={{
        height: 56,
        background: disabled ? s(D.border, D.lBorder, mode) : `linear-gradient(135deg, ${theme(mode).color.cta.from} 0%, ${theme(mode).color.cta.to} 100%)`,
        color: disabled ? s(D.textMut, D.lTextSec, mode) : "#fff",
        boxShadow: disabled ? "none" : `0 4px 20px #7C6FCD59`,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        fontSize: 16,
        letterSpacing: "0.01em",
      }}
    >
      {/* LOADING STATE: spinner replaces label text.
          ANIMATION: spin-slow — 1.8s linear infinite. border-t-transparent creates gap. */}
      {loading
        ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin-slow inline-block" />
        : label}
    </button>
  );
}

// ============================================================
// COMPONENT: SecondaryButton
// PURPOSE: Lower-emphasis action (skip, "maybe later", "continue free").
//   height: 48px. Transparent background with border. Secondary text color.
//   Press feedback via .btn-press (scale 0.97, 120ms).
// ============================================================
function SecondaryButton({ label, onClick, mode }: { label: string; onClick: () => void; mode: Mode }) {
  return (
    <button
      onClick={onClick}
      className="btn-press w-full flex items-center justify-center rounded-2xl font-medium text-sm"
      style={{
        height: 48,
        background: "transparent",
        color: s(D.textSec, D.lTextSec, mode),
        border: `1px solid ${s(D.border, D.lBorder, mode)}`,
        cursor: "pointer",
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </button>
  );
}

// ============================================================
// COMPONENT: BackButton
// PURPOSE: Left-chevron navigation button shown at top of screens 1–8+.
//   BUTTON: "Back"
//   ACTION: Decrements screen index by 1 via back().
//   NAVIGATION: Current screen → previous screen.
//   TRANSITION: Screen re-mounts with animate-fade-in (300ms ease-out).
//   SIZE: 40×40px. Rounded-xl. Press feedback via .btn-press.
// ============================================================
function BackButton({ onClick, mode }: { onClick: () => void; mode: Mode }) {
  return (
    <button
      onClick={onClick}
      className="btn-press flex items-center justify-center rounded-xl"
      style={{
        width: 40, height: 40,
        background: s(D.raised, D.lCard, mode),
        border: `1px solid ${s(D.border, D.lBorder, mode)}`,
        color: s(D.text, D.lText, mode),
        cursor: "pointer",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 5L7 10l5 5" />
      </svg>
    </button>
  );
}

// ============================================================
// COMPONENT: ScreenHeader
// PURPOSE: Standard title + subtitle block used at the top of most screens.
//   ANIMATION: animate-fade-up (fadeUp 350ms ease-out) with configurable delay.
//   Title: 24px semibold. Subtitle: 15px secondary color, 1.5 line-height.
// ============================================================
function ScreenHeader({ title, subtitle, mode, delay = 0 }: { title: string; subtitle?: string; mode: Mode; delay?: number }) {
  return (
    <div className="animate-fade-up px-6 mb-6" style={{ animationDelay: `${delay}ms` }}>
      <h1 className="font-semibold mb-1" style={{ fontSize: 24, lineHeight: "1.25", color: s(D.text, D.lText, mode) }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 15, color: s(D.textSec, D.lTextSec, mode), lineHeight: "1.5" }}>{subtitle}</p>}
    </div>
  );
}

// ============================================================
// SCREEN 0: WelcomeScreen
// PURPOSE: Brand moment. First screen the user sees. Sets tone: warm, calm.
// ENTRY: App launch (phase === "onboarding", screen === 0). No progress bar.
//
// UI ELEMENTS:
//   - Circular illustration (180×180px): heart SVG + ECG line
//   - App wordmark (11px uppercase, accent color)
//   - Headline: "Your recovery, remembered." (28px semibold)
//   - Subheading (15px, secondary color)
//   - 3 value prop rows (48px each, card bg)
//   - "Get started" primary button (56px)
//   - "Already have an account? Sign in" text link (36px height)
//
// ANIMATIONS (entry, sequential):
//   1. Illustration circle: animate-pulse-soft — scale 1→1.04→1, opacity
//      0.7→1→0.7. Duration: 2400ms ease-in-out, loops INFINITE. Starts
//      immediately on mount.
//   2. Wordmark + headline block: animate-fade-up, delay 80ms.
//      (fadeUp: opacity 0→1, translateY 16px→0, 350ms ease-out)
//   3. Value props list: animate-fade-up, delay 160ms.
//   4. Button area: animate-fade-up, delay 240ms.
//
// BUTTONS:
//   "Get started":
//     BUTTON: Primary, 56px, gradient accent.
//     ACTION: Calls next() → advances to screen 1 (RecoveryTypeScreen).
//     NAVIGATION: Screen 0 → Screen 1.
//     TRANSITION: key={screen} change triggers animate-fade-in (300ms ease-out).
//   "Already have an account? Sign in":
//     BUTTON: Text-only, 36px height.
//     ACTION: Currently no-op (sign-in flow not implemented in this prototype).
//     PRESS FEEDBACK: .btn-press scale 0.97, 120ms.
// ============================================================
function WelcomeScreen({ mode, onNext }: { mode: Mode; onNext: () => void }) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-8">
      {/* Illustration area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0 pt-4">
        {/* ANIMATION: animate-pulse-soft — gently pulses the illustration.
            scale: 1 → 1.04 → 1. opacity: 0.7 → 1 → 0.7.
            duration: 2400ms. easing: ease-in-out. loop: infinite.
            Starts immediately when component mounts. */}
        <div
          className="animate-pulse-soft flex items-center justify-center rounded-full mb-6"
          style={{
            width: 180, height: 180,
            background: `radial-gradient(circle at 40% 35%, ${D.accentL}33, ${D.accent}55 55%, ${D.accentD}88)`,
            boxShadow: `0 0 60px ${D.accent}44`,
          }}
        >
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
            {/* Heart with pulse line */}
            <path d="M44 68S18 50 18 32a14 14 0 0128 0 14 14 0 0128 0C74 50 44 68 44 68z"
              fill={D.accentL} opacity="0.9"/>
            <path d="M20 44h8l5-10 7 20 6-14 4 8 4-4h14"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>

        {/* ANIMATION: animate-fade-up, delay 80ms — headline block entry */}
        <div className="animate-fade-up text-center" style={{ animationDelay: "80ms" }}>
          <div className="font-semibold mb-1" style={{ fontSize: 11, letterSpacing: "0.12em", color: D.accent, textTransform: "uppercase" }}>
            Recovery Companion
          </div>
          <h1 className="font-semibold mb-3" style={{ fontSize: 28, lineHeight: "1.2", color: s(D.text, D.lText, mode) }}>
            Your recovery,<br />remembered.
          </h1>
          <p style={{ fontSize: 15, color: s(D.textSec, D.lTextSec, mode), lineHeight: "1.6", maxWidth: 280 }}>
            A calm personal space to track your healing — day by day, at your own pace.
          </p>
        </div>

        {/* ANIMATION: animate-fade-up, delay 160ms — value props list entry */}
        <div className="w-full mt-8 flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "160ms" }}>
          {[
            { icon: "🩺", text: "Symptom & pain tracking" },
            { icon: "📅", text: "Personalized timeline" },
            { icon: "📊", text: "Progress insights" },
          ].map((item, i) => (
            // Non-interactive display rows — no tap handler
            <div key={i} className="flex items-center gap-3 px-4 rounded-2xl" style={{
              height: 48,
              background: s(D.raised, D.lCard, mode),
              border: `1px solid ${s(D.border, D.lBorder, mode)}`,
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: s(D.text, D.lText, mode), fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ANIMATION: animate-fade-up, delay 240ms — button area entry */}
      <div className="flex flex-col gap-3 pt-6 animate-fade-up" style={{ animationDelay: "240ms" }}>
        {/* BUTTON: "Get started"
            ACTION: next() → screen 0 → screen 1 (RecoveryTypeScreen).
            TRANSITION: Screen wrapper key change → animate-fade-in 300ms ease-out. */}
        <PrimaryButton label="Get started" onClick={onNext} mode={mode} />
        {/* BUTTON: "Already have an account? Sign in"
            ACTION: Prototype stub — no navigation implemented. */}
        <button
          className="btn-press text-sm font-medium"
          style={{ background: "none", border: "none", color: s(D.textSec, D.lTextSec, mode), cursor: "pointer", height: 36 }}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 1: RecoveryTypeScreen
// PURPOSE: User selects their recovery category. Required before advancing.
// ENTRY: next() from WelcomeScreen. Progress bar step 1/8.
//
// UI ELEMENTS:
//   - BackButton (40×40px, top-left)
//   - ScreenHeader: "What are you recovering from?"
//   - 5 option cards (72px each, full-width):
//     Injury / Surgery / Illness / Chronic condition / Rehabilitation
//   - "Continue" primary button (disabled until a type is selected)
//
// OPTION CARD STATES:
//   DEFAULT: background D.raised/lCard. Border 1.5px D.border/lBorder.
//   SELECTED: background linear-gradient(135deg, D.accentD, D.accent33).
//     Border 1.5px D.accent. Accent-colored title text.
//     Check circle (22×22px, D.accent fill) appears at right.
//   TRANSITION on selection: border-color 150ms, background 150ms.
//
// ANIMATIONS (entry):
//   Cards fade+rise individually using .animate-fade-up + .stagger-N:
//   Card 0: delay 60ms. Card 1: 120ms. Card 2: 180ms. Card 3: 240ms. Card 4: 300ms.
//   (fadeUp: 350ms ease-out, translateY 16px→0)
//
// BUTTONS:
//   BackButton: → screen 0. TRANSITION: animate-fade-in 300ms.
//   "Continue" (PRIMARY): Disabled until value !== "". → screen 2.
//     DISABLED STATE: border-color bg, muted text, no shadow, cursor default.
// ============================================================
const RECOVERY_TYPES = [
  { id: "injury",    label: "Injury",            icon: "🤕", desc: "Sprains, fractures, muscle tears" },
  { id: "surgery",   label: "Surgery",           icon: "🏥", desc: "Post-operative recovery" },
  { id: "illness",   label: "Illness",           icon: "🤒", desc: "Acute or viral conditions" },
  { id: "chronic",   label: "Chronic condition", icon: "♾️", desc: "Long-term health management" },
  { id: "rehab",     label: "Rehabilitation",    icon: "💪", desc: "Physical or occupational therapy" },
];

function RecoveryTypeScreen({ mode, value, onChange, onNext, onBack }: {
  mode: Mode; value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <BackButton onClick={onBack} mode={mode} />
      </div>
      <ScreenHeader title="What are you recovering from?" subtitle="We'll build your plan around this." mode={mode} />
      <div className="flex flex-col gap-3 flex-1">
        {RECOVERY_TYPES.map((t, i) => {
          const selected = value === t.id;
          return (
            // INTERACTION: Tap option card.
            // ACTION: onChange(t.id) → sets recoveryType in UserData.
            // STATE CHANGE: Card transitions to SELECTED state (150ms).
            // ANIMATION: Entry uses .animate-fade-up + .stagger-N (60ms increments).
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`btn-press flex items-center gap-4 px-4 rounded-2xl text-left animate-fade-up stagger-${i + 1}`}
              style={{
                height: 72,
                background: selected ? `linear-gradient(135deg, ${D.accentD} 0%, ${D.accent}33)` : s(D.raised, D.lCard, mode),
                border: `1.5px solid ${selected ? D.accent : s(D.border, D.lBorder, mode)}`,
                cursor: "pointer",
                transition: "border-color 150ms, background 150ms",
              }}
            >
              <span style={{ fontSize: 26, width: 36, textAlign: "center" }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: selected ? D.accentL : s(D.text, D.lText, mode) }}>{t.label}</div>
                <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode), marginTop: 1 }}>{t.desc}</div>
              </div>
              {/* Check indicator — only visible when this option is selected */}
              {selected && (
                <div className="ml-auto flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: D.accent }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        {/* BUTTON: "Continue" — disabled until recoveryType is set */}
        <PrimaryButton label="Continue" onClick={onNext} mode={mode} disabled={!value} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 2: ConditionScreen
// PURPOSE: User selects affected body area (required) and optional condition.
//   Body area is required to enable "Continue". Condition is optional.
// ENTRY: Screen 1. Progress bar step 2/8.
//
// UI ELEMENTS:
//   - BackButton
//   - ScreenHeader: "Tell us about your condition"
//   - "Body area" chip grid (12 options, 34px height chips)
//   - "Condition (optional)" chip grid (10 options, 34px height chips)
//   - "Continue" primary button (disabled until bodyPart is set)
//   - "Skip for now" secondary button (always enabled — skips condition only)
//
// CHIP STATES:
//   DEFAULT: D.raised/lCard bg, border D.border/lBorder, secondary text.
//   SELECTED: D.accent bg, white text, D.accent border.
//   TRANSITION: all 150ms.
//   NOTE: Only ONE item can be selected per group (radio behavior).
//
// BUTTONS:
//   BackButton: → screen 1.
//   "Continue": Disabled until bodyPart !== "". → screen 3.
//   "Skip for now": Always enabled. Calls onNext() → screen 3.
//     (Condition data stays as empty string; bodyPart still required.)
// ============================================================
const BODY_PARTS = ["Neck", "Shoulder", "Elbow", "Wrist / Hand", "Back", "Hip", "Knee", "Ankle / Foot", "Head", "Chest", "Abdomen", "Full body"];
const CONDITIONS = ["ACL tear", "Rotator cuff", "Herniated disc", "Hip replacement", "Knee replacement", "Broken bone", "Appendectomy", "COVID recovery", "Fibromyalgia", "Other"];

function ConditionScreen({ mode, condition, bodyPart, onCondition, onBodyPart, onNext, onBack }: {
  mode: Mode; condition: string; bodyPart: string;
  onCondition: (v: string) => void; onBodyPart: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-8">
      <div className="flex items-center gap-3 mb-6"><BackButton onClick={onBack} mode={mode} /></div>
      <ScreenHeader title="Tell us about your condition" subtitle="This helps us personalise your timeline." mode={mode} />
      <div className="flex flex-col gap-5 flex-1">
        <div>
          <div className="mb-2" style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode), letterSpacing: "0.06em", textTransform: "uppercase" }}>Body area</div>
          <div className="flex flex-wrap gap-2">
            {BODY_PARTS.map(p => {
              const sel = bodyPart === p;
              return (
                // INTERACTION: Tap chip → onBodyPart(p) → updates bodyPart in UserData.
                // STATE CHANGE: Selected chip turns accent. Previous selection deselects.
                // TRANSITION: all 150ms (background, color, border-color).
                <button key={p} onClick={() => onBodyPart(p)} className="btn-press px-3 rounded-xl text-sm font-medium"
                  style={{
                    height: 34, background: sel ? D.accent : s(D.raised, D.lCard, mode),
                    color: sel ? "#fff" : s(D.textSec, D.lTextSec, mode),
                    border: `1px solid ${sel ? D.accent : s(D.border, D.lBorder, mode)}`,
                    cursor: "pointer", transition: "all 150ms",
                  }}>{p}</button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2" style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode), letterSpacing: "0.06em", textTransform: "uppercase" }}>Condition (optional)</div>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => {
              const sel = condition === c;
              return (
                // INTERACTION: Tap chip → onCondition(c) → updates condition in UserData.
                // TRANSITION: all 150ms.
                <button key={c} onClick={() => onCondition(c)} className="btn-press px-3 rounded-xl text-sm font-medium"
                  style={{
                    height: 34, background: sel ? D.accent : s(D.raised, D.lCard, mode),
                    color: sel ? "#fff" : s(D.textSec, D.lTextSec, mode),
                    border: `1px solid ${sel ? D.accent : s(D.border, D.lBorder, mode)}`,
                    cursor: "pointer", transition: "all 150ms",
                  }}>{c}</button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="pt-4 flex flex-col gap-3">
        {/* BUTTON: "Continue" — disabled until bodyPart is selected */}
        <PrimaryButton label="Continue" onClick={onNext} mode={mode} disabled={!bodyPart} />
        {/* BUTTON: "Skip for now" — advances without selecting condition */}
        <SecondaryButton label="Skip for now" onClick={onNext} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 3: StartDateScreen
// PURPOSE: User picks when their recovery began. Enables the day counter.
// ENTRY: Screen 2. Progress bar step 3/8.
//
// UI ELEMENTS:
//   - BackButton
//   - ScreenHeader: "When did your recovery start?"
//   - Card with calendar SVG icon + HTML date input + live day counter
//   - "Continue" primary button (disabled until date is set)
//   - "Not sure yet" secondary button
//
// DATE INPUT:
//   type="date", max=today (future dates disallowed).
//   colorScheme matches dark/light mode.
//   When empty: border D.border, muted text color.
//   When filled: border 1.5px D.accent, primary text color.
//   TRANSITION: border-color 150ms (via inline style, not CSS transition).
//
// LIVE DAY COUNTER:
//   APPEARS: Only when value !== "" (animate-fade-in, 300ms ease-out).
//   CONTENT: "Day N of your recovery" — N calculated from date to today.
//   COLOR: D.accentL (accent light).
//
// CARD ENTRY ANIMATION:
//   Outer card div: animate-fade-up, delay 100ms. (350ms ease-out)
//
// BUTTONS:
//   BackButton: → screen 2.
//   "Continue": Disabled until startDate is set. → screen 4.
//   "Not sure yet": Always enabled. Calls onNext() → screen 4 with empty date.
// ============================================================
function StartDateScreen({ mode, value, onChange, onNext, onBack }: {
  mode: Mode; value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <div className="flex flex-col flex-1 px-6 pb-8">
      <div className="flex items-center gap-3 mb-6"><BackButton onClick={onBack} mode={mode} /></div>
      <ScreenHeader title="When did your recovery start?" subtitle="We'll count your days from here." mode={mode} />
      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* ANIMATION: animate-fade-up, delay 100ms — card entry */}
        <div className="animate-fade-up flex items-center justify-center" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col items-center justify-center rounded-3xl gap-4" style={{
            width: "100%", padding: "32px 24px",
            background: s(D.raised, D.lCard, mode),
            border: `1px solid ${s(D.border, D.lBorder, mode)}`,
          }}>
            {/* Decorative calendar SVG icon — not interactive */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="8" width="40" height="36" rx="8" fill={D.accentD} />
              <rect x="4" y="8" width="40" height="14" rx="8" fill={D.accent} />
              <rect x="4" y="15" width="40" height="7" fill={D.accent} />
              <rect x="14" y="2" width="4" height="12" rx="2" fill={D.accentL} />
              <rect x="30" y="2" width="4" height="12" rx="2" fill={D.accentL} />
              <circle cx="16" cy="30" r="3" fill={D.accentL} opacity="0.7" />
              <circle cx="24" cy="30" r="3" fill={D.accentL} opacity="0.7" />
              <circle cx="32" cy="30" r="3" fill={D.accentL} opacity="0.7" />
            </svg>
            {/* INTERACTION: Native date picker.
                onChange → updates startDate in UserData immediately on each change.
                max=today prevents future date selection. */}
            <input
              type="date"
              max={today}
              value={value}
              onChange={e => onChange(e.target.value)}
              className="rounded-xl px-4 text-center font-semibold"
              style={{
                height: 52, width: "100%",
                background: s(D.card, D.lBase, mode),
                color: value ? s(D.text, D.lText, mode) : s(D.textMut, D.lTextSec, mode),
                border: `1.5px solid ${value ? D.accent : s(D.border, D.lBorder, mode)}`,
                fontSize: 18,
                outline: "none",
                colorScheme: mode === "dark" ? "dark" : "light",
              }}
            />
            {/* CONDITIONAL ELEMENT: Day counter.
                APPEARS WHEN: value !== "" (date selected).
                ANIMATION: animate-fade-in — opacity 0→1, 300ms ease-out.
                CONTENT: Calculates days since start date dynamically. */}
            {value && (
              <div className="animate-fade-in" style={{ fontSize: 14, color: D.accentL, fontWeight: 500 }}>
                Day {Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 86400000) + 1)} of your recovery
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="pt-4 flex flex-col gap-3">
        <PrimaryButton label="Continue" onClick={onNext} mode={mode} disabled={!value} />
        {/* BUTTON: "Not sure yet" — always enabled, skips date entry */}
        <SecondaryButton label="Not sure yet" onClick={onNext} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 4: SymptomsScreen
// PURPOSE: Multi-select symptom picker, grouped by category.
//   User selects zero or more symptoms. Skip is always available.
// ENTRY: Screen 3. Progress bar step 4/8.
//
// UI ELEMENTS:
//   - BackButton
//   - ScreenHeader: "Any current symptoms?"
//   - 4 symptom groups (Pain / Mobility / Energy / Mood)
//     Each group: colored dot + label + row of chips
//   - "Continue (N selected)" or "Continue" primary button
//   - "Skip" secondary button
//
// CHIP STATES:
//   DEFAULT: D.raised/lCard bg, secondary text.
//   SELECTED: semi-transparent category color bg (${color}22),
//     category-colored text (dark mode) or #333 (light mode).
//     Category-colored border.
//   TRANSITION: all 150ms.
//   BEHAVIOR: Multi-select. Tapping a selected chip deselects it.
//
// ANIMATIONS (entry, per group):
//   Group 0: .animate-fade-up .stagger-1 (60ms delay)
//   Group 1: .animate-fade-up .stagger-2 (120ms)
//   Group 2: .animate-fade-up .stagger-3 (180ms)
//   Group 3: .animate-fade-up .stagger-4 (240ms)
//
// INTERACTION: toggleSymptom(sym) in parent (Onboarding):
//   If already selected → removes from symptoms[].
//   If not selected → appends to symptoms[].
//
// BUTTON LABEL:
//   selected.length > 0: "Continue (N selected)"
//   selected.length === 0: "Continue"
//   Always enabled (zero selections is valid).
// ============================================================
const SYMPTOM_GROUPS = [
  { label: "Pain", color: "#F2A69E", items: ["Sharp pain", "Dull ache", "Burning", "Stiffness"] },
  { label: "Mobility", color: "#9EC3F5", items: ["Limited range", "Swelling", "Weakness", "Numbness"] },
  { label: "Energy", color: "#F5D08A", items: ["Fatigue", "Brain fog", "Poor sleep", "Low stamina"] },
  { label: "Mood", color: "#A8D9B8", items: ["Anxious", "Low mood", "Frustrated", "Hopeful"] },
];

function SymptomsScreen({ mode, selected, onToggle, onNext, onBack }: {
  mode: Mode; selected: string[]; onToggle: (s: string) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6"><BackButton onClick={onBack} mode={mode} /></div>
      <ScreenHeader title="Any current symptoms?" subtitle="Select all that apply — you can update these anytime." mode={mode} />
      <div className="flex flex-col gap-5 flex-1">
        {SYMPTOM_GROUPS.map((g, gi) => (
          // ANIMATION: Each group fades up with stagger delay (60ms × group index)
          <div key={g.label} className={`animate-fade-up stagger-${gi + 1}`}>
            <div className="flex items-center gap-2 mb-2">
              {/* Colored dot: identifies the category (color + label, never color alone) */}
              <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode), letterSpacing: "0.07em", textTransform: "uppercase" }}>{g.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.items.map(item => {
                const sel = selected.includes(item);
                return (
                  // INTERACTION: Tap chip → onToggle(item).
                  // ACTION: Adds or removes item from symptoms[].
                  // TRANSITION: all 150ms (background, color, border-color).
                  <button key={item} onClick={() => onToggle(item)} className="btn-press px-3 rounded-xl text-sm font-medium"
                    style={{
                      height: 34,
                      background: sel ? `${g.color}22` : s(D.raised, D.lCard, mode),
                      color: sel ? (mode === "dark" ? g.color : "#333") : s(D.textSec, D.lTextSec, mode),
                      border: `1px solid ${sel ? g.color : s(D.border, D.lBorder, mode)}`,
                      cursor: "pointer", transition: "all 150ms",
                    }}>{item}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 flex flex-col gap-3">
        {/* BUTTON label reflects selection count */}
        <PrimaryButton label={selected.length ? `Continue (${selected.length} selected)` : "Continue"} onClick={onNext} mode={mode} />
        <SecondaryButton label="Skip" onClick={onNext} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 5: PainScreen
// PURPOSE: Sets pain baseline (0–10). Expressive large numeral + slider + emoji.
// ENTRY: Screen 4. Progress bar step 5/8.
//
// UI ELEMENTS:
//   - BackButton
//   - ScreenHeader: "Current pain level?"
//   - Large pain numeral (80px font, color changes with value)
//   - Pain label text below numeral (e.g. "Moderate")
//   - Range slider (0–10, step 1)
//   - 3 scale labels (0, 5, 10)
//   - 5 emoji quick-select buttons
//   - "Continue" primary button (always enabled)
//
// PAIN NUMERAL:
//   Color: PAIN_COLORS[value] — green (0) → yellow (4–5) → red (9–10).
//   TRANSITION: color 200ms (inline style transition).
//   Label: PAIN_LABELS[value] ("None", "Mild", "Moderate", "Severe", "Intense", "Unbearable").
//   TRANSITION: all 150ms.
//
// RANGE SLIDER:
//   Track background: linear-gradient — filled portion uses PAIN_COLORS[value],
//   unfilled portion uses D.border/lBorder. Updates in real time.
//   TRANSITION: background 200ms.
//   Thumb: 24×24px white circle with drop shadow (see index.css).
//   Thumb PRESSED state: scale 1.15, 120ms ease-out.
//
// EMOJI QUICK-SELECT:
//   5 emojis map to approximate pain scores (0, 2, 5, 7, 10).
//   opacity: 1 if close to current value (±1.5), else 0.4.
//   TRANSITION: opacity 150ms.
//   INTERACTION: Tap emoji → sets pain score to mapped value.
//
// ANIMATIONS (entry):
//   Numeral+label block: animate-fade-up, delay 80ms.
//   Slider: animate-fade-up, delay 140ms.
//   Emoji row: animate-fade-up, delay 180ms.
// ============================================================
const PAIN_LABELS = ["None", "Mild", "Mild", "Mild", "Moderate", "Moderate", "Moderate", "Severe", "Severe", "Intense", "Unbearable"];
const PAIN_COLORS = ["#A8D9B8","#A8D9B8","#B8DDA8","#D9DA8A","#F5D08A","#F5C070","#F5A860","#F2A09E","#E0748A","#D4607F","#BA4A79"];

function PainScreen({ mode, value, onChange, onNext, onBack }: {
  mode: Mode; value: number; onChange: (v: number) => void; onNext: () => void; onBack: () => void;
}) {
  const color = PAIN_COLORS[value];
  return (
    <div className="flex flex-col flex-1 px-6 pb-8">
      <div className="flex items-center gap-3 mb-6"><BackButton onClick={onBack} mode={mode} /></div>
      <ScreenHeader title="Current pain level?" subtitle="Be honest — this is just for your baseline." mode={mode} />
      <div className="flex-1 flex flex-col justify-center items-center gap-8">
        {/* ANIMATION: animate-fade-up, delay 80ms — numeral entry */}
        <div className="animate-fade-up flex flex-col items-center gap-1" style={{ animationDelay: "80ms" }}>
          {/* REACTIVE: color transitions 200ms as slider moves */}
          <div style={{ fontSize: 80, fontWeight: 600, lineHeight: 1, color, transition: "color 200ms" }}>{value}</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: s(D.textSec, D.lTextSec, mode), transition: "all 150ms" }}>{PAIN_LABELS[value]}</div>
        </div>

        {/* ANIMATION: animate-fade-up, delay 140ms — slider entry */}
        <div className="w-full animate-fade-up" style={{ animationDelay: "140ms" }}>
          {/* INTERACTION: Drag slider → onChange(Number) → updates painScore in UserData.
              Track gradient updates in real time (transition: background 200ms). */}
          <input
            type="range" min={0} max={10} step={1} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full"
            style={{
              appearance: "none", height: 8, borderRadius: scale.radius.sm, outline: "none",
              background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 10}%, ${s(D.border, D.lBorder, mode)} ${value * 10}%, ${s(D.border, D.lBorder, mode)} 100%)`,
              transition: "background 200ms",
            }}
          />
          <div className="flex justify-between mt-2">
            {[0, 5, 10].map(n => (
              <span key={n} style={{ fontSize: 11, color: s(D.textMut, D.lTextSec, mode) }}>{n}</span>
            ))}
          </div>
        </div>

        {/* ANIMATION: animate-fade-up, delay 180ms — emoji row entry */}
        <div className="flex justify-between w-full animate-fade-up" style={{ animationDelay: "180ms" }}>
          {["😌","😐","😟","😣","😭"].map((e, i) => (
            // INTERACTION: Tap emoji → sets pain score to nearest mapped value (0,2,5,7,10).
            // Opacity reflects proximity to current value: 1 if near, 0.4 if far.
            // TRANSITION: opacity 150ms.
            <button key={i} onClick={() => onChange(i * 2.5 | 0)} className="btn-press text-2xl"
              style={{ background: "none", border: "none", cursor: "pointer", opacity: Math.abs(value - i * 2.5) < 1.5 ? 1 : 0.4, transition: "opacity 150ms" }}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-4">
        {/* Always enabled — 0 is a valid pain score */}
        <PrimaryButton label="Continue" onClick={onNext} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 6: GoalScreen
// PURPOSE: User selects their primary recovery goal. Required before advancing.
// ENTRY: Screen 5. Progress bar step 6/8.
//
// UI ELEMENTS:
//   - BackButton
//   - ScreenHeader: "What's your recovery goal?"
//   - 6 goal option rows (56px height):
//     Become pain-free / Move freely / Return to work / Return to sport /
//     Manage condition / Simply feel better
//   - "Continue" primary button (disabled until goal is selected)
//
// OPTION ROW STATES:
//   DEFAULT: D.raised/lCard bg, border 1.5px D.border/lBorder.
//   SELECTED: gradient accent bg, accent border, accentL text, check circle at right.
//   TRANSITION: all 150ms.
//
// ANIMATIONS (entry):
//   Rows 0–4 use .animate-fade-up .stagger-1 through .stagger-5 (60ms increments).
//   Row 5 uses .stagger-5 (capped at 300ms).
// ============================================================
const GOALS = [
  { id: "pain_free",   label: "Become pain-free",           icon: "✨" },
  { id: "move_better", label: "Move freely again",          icon: "🏃" },
  { id: "return_work", label: "Return to work",             icon: "💼" },
  { id: "return_sport","label": "Return to sport/activity", icon: "⚽" },
  { id: "manage",      label: "Manage my condition",        icon: "⚖️" },
  { id: "feel_better", label: "Simply feel better",         icon: "🌱" },
];

function GoalScreen({ mode, value, onChange, onNext, onBack }: {
  mode: Mode; value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-8">
      <div className="flex items-center gap-3 mb-6"><BackButton onClick={onBack} mode={mode} /></div>
      <ScreenHeader title="What's your recovery goal?" subtitle="No pressure — this guides your timeline." mode={mode} />
      <div className="flex flex-col gap-3 flex-1">
        {GOALS.map((g, i) => {
          const sel = value === g.id;
          return (
            // INTERACTION: Tap goal row → onChange(g.id) → sets goal in UserData.
            // STATE CHANGE: Row transitions to SELECTED (150ms).
            <button key={g.id} onClick={() => onChange(g.id)} className={`btn-press flex items-center gap-3 px-4 rounded-2xl text-left animate-fade-up stagger-${Math.min(i+1,5)}`}
              style={{
                height: 56,
                background: sel ? `linear-gradient(135deg, ${D.accentD} 0%, ${D.accent}33)` : s(D.raised, D.lCard, mode),
                border: `1.5px solid ${sel ? D.accent : s(D.border, D.lBorder, mode)}`,
                cursor: "pointer", transition: "all 150ms",
              }}>
              <span style={{ fontSize: 22 }}>{g.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: sel ? D.accentL : s(D.text, D.lText, mode) }}>{g.label}</span>
              {sel && (
                <div className="ml-auto flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: D.accent }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        <PrimaryButton label="Continue" onClick={onNext} mode={mode} disabled={!value} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 7: NotificationsScreen
// PURPOSE: Value-framed notification consent screen. Both choices advance.
// ENTRY: Screen 6. Progress bar step 7/8.
//
// UI ELEMENTS:
//   - BackButton
//   - Notification bell illustration (120×120px circle, pulsing)
//   - Headline: "Stay on track" + supporting paragraph
//   - 3 benefit rows (44px each, non-interactive)
//   - "Allow notifications" primary button
//   - "Maybe later" secondary button
//
// ILLUSTRATION ANIMATION:
//   animate-pulse-soft — same as Welcome screen illustration.
//   scale 1→1.04→1, opacity 0.7→1→0.7. Duration: 2400ms. Loop: infinite.
//
// ANIMATIONS (entry, sequential):
//   1. Bell illustration: animate-pulse-soft (starts on mount, infinite).
//   2. Headline block: animate-fade-up, delay 80ms.
//   3. Benefit rows: animate-fade-up, delay 160ms.
//   4. Button area: animate-fade-up, delay 240ms.
//
// BUTTONS:
//   "Allow notifications":
//     ACTION: onNext(true) → sets notifications=true in UserData, then next().
//     → screen 8 (PlanLoadingScreen).
//   "Maybe later":
//     ACTION: onNext(false) → sets notifications=false, then next().
//     → screen 8 (PlanLoadingScreen).
//   BackButton: → screen 6.
//
// NOTE: Both primary and secondary actions advance the wizard. The choice
//   is recorded in UserData.notifications but has no other effect in prototype.
// ============================================================
function NotificationsScreen({ mode, onNext, onBack }: { mode: Mode; onNext: (allow: boolean) => void; onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 px-6 pb-8">
      <div className="flex items-center gap-3 mb-6"><BackButton onClick={onBack} mode={mode} /></div>
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        {/* ANIMATION: animate-pulse-soft — 2400ms ease-in-out, infinite loop */}
        <div className="animate-pulse-soft flex items-center justify-center rounded-full" style={{
          width: 120, height: 120,
          background: `radial-gradient(circle, ${D.accentD} 0%, ${D.accent}44 80%)`,
          boxShadow: `0 0 40px ${D.accent}33`,
        }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <path d="M28 8C18 8 12 16 12 24v10l-4 6h40l-4-6V24C44 16 38 8 28 8z" fill={D.accentL} opacity="0.9"/>
            <path d="M23 44a5 5 0 0010 0" fill={D.accentL} opacity="0.6"/>
            <circle cx="28" cy="10" r="4" fill={D.accent}/>
          </svg>
        </div>
        {/* ANIMATION: animate-fade-up, delay 80ms */}
        <div className="animate-fade-up text-center" style={{ animationDelay: "80ms" }}>
          <h1 className="font-semibold mb-2" style={{ fontSize: 24, color: s(D.text, D.lText, mode) }}>Stay on track</h1>
          <p style={{ fontSize: 15, color: s(D.textSec, D.lTextSec, mode), lineHeight: 1.6 }}>
            Gentle daily reminders help you log consistently — research shows consistent logging speeds recovery.
          </p>
        </div>
        {/* ANIMATION: animate-fade-up, delay 160ms — benefit rows */}
        <div className="animate-fade-up w-full flex flex-col gap-3" style={{ animationDelay: "160ms" }}>
          {["Daily check-in at 8 PM", "Milestone celebrations", "Medication reminders (optional)"].map((item, i) => (
            // Non-interactive display rows
            <div key={i} className="flex items-center gap-3 px-4 rounded-xl" style={{
              height: 44, background: s(D.raised, D.lCard, mode),
              border: `1px solid ${s(D.border, D.lBorder, mode)}`,
            }}>
              <div className="w-2 h-2 rounded-full" style={{ background: D.accent }} />
              <span style={{ fontSize: 14, color: s(D.text, D.lText, mode) }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      {/* ANIMATION: animate-fade-up, delay 240ms — button area */}
      <div className="flex flex-col gap-3 pt-4 animate-fade-up" style={{ animationDelay: "240ms" }}>
        {/* BUTTON: "Allow notifications" → onNext(true) → screen 8 */}
        <PrimaryButton label="Allow notifications" onClick={() => onNext(true)} mode={mode} />
        {/* BUTTON: "Maybe later" → onNext(false) → screen 8 */}
        <SecondaryButton label="Maybe later" onClick={() => onNext(false)} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 8: PlanLoadingScreen  (two internal phases: "loading" → "ready")
// PURPOSE: Simulates plan generation with animated progress, then reveals
//   the personalised timeline with corridor preview.
// ENTRY: Screen 7. No progress bar (screen > 8).
//
// ── PHASE 1: "loading" ───────────────────────────────────────
// ANIMATION SEQUENCE (on mount):
//   1. setInterval fires every 80ms, increments progress by 4 (0→100).
//      Total duration: ~2000ms (25 ticks × 80ms).
//   2. Conic gradient ring rotates while spinning:
//      .animate-spin-slow — 1800ms linear infinite rotation.
//      Ring fill = conic-gradient(D.accent {progress}%, transparent).
//      Updates in real time as progress increments.
//   3. Step checklist: each step lights up (accent bg, checkmark SVG)
//      when progress passes its threshold:
//      "Analysing your profile"  → done at progress > 25
//      "Building your timeline"  → done at progress > 55
//      "Calibrating milestones"  → done at progress > 80
//      "Finalising your plan"    → done at progress >= 100
//      TRANSITION per step: background 300ms, color 300ms.
//   4. When progress reaches 100: interval clears, then
//      setTimeout 300ms → setPhase("ready").
//
// ── PHASE 2: "ready" ─────────────────────────────────────────
// ANIMATION SEQUENCE (on phase change to "ready"):
//   1. Checkmark circle: animate-fade-up (350ms ease-out). No delay.
//      96×96px circle, gradient accent bg, large white SVG checkmark.
//   2. "Your timeline is ready" headline: animate-fade-up, delay 80ms.
//   3. Timeline preview card: animate-fade-up, delay 160ms.
//      Contains recovery phase bars (animated via animate-fade-in with delays
//      300ms + i×80ms per bar).
//   4. "See your plan" button: animate-fade-up, delay 400ms.
//
// CORRIDOR PREVIEW (inside timeline card):
//   4 phase bars with labels: Rest & stabilise / Gentle mobility /
//   Strengthening / Return to activity.
//   Each bar uses animate-fade-in with staggered delays (300ms, 380ms, 460ms, 540ms).
//   Below bars: 3 phase chips (Rest phase / Mobility returns / Strength phase).
//   Footer: "Everyone heals differently — this is a common range, not a target."
//
// BUTTON:
//   "See your plan":
//     ACTION: next() → screen 9 (FreePlanScreen).
//     TRANSITION: animate-fade-in 300ms on screen wrapper change.
// ============================================================
function PlanLoadingScreen({ mode, onNext }: { mode: Mode; onNext: () => void }) {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ANIMATION: Auto-advancing progress simulation.
  // interval: 80ms. increment: +4 per tick. total: ~2000ms to reach 100.
  // On completion: 300ms delay before switching to "ready" phase.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timerRef.current!);
          setTimeout(() => setPhase("ready"), 300);
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(timerRef.current!);
  }, []);

  const steps = [
    { label: "Analysing your profile", done: progress > 25 },
    { label: "Building your timeline",  done: progress > 55 },
    { label: "Calibrating milestones",  done: progress > 80 },
    { label: "Finalising your plan",    done: progress >= 100 },
  ];

  if (phase === "loading") {
    return (
      <div className="flex flex-col flex-1 px-6 pb-8 justify-center items-center gap-8">
        {/* ANIMATION: animate-fade-in on mount (300ms ease-out) */}
        <div className="animate-fade-in">
          <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
            {/* ANIMATION: Conic gradient ring + spin-slow rotation.
                Ring fill sweeps from 0% to 100% as progress increments.
                Rotation: .animate-spin-slow — 1800ms linear infinite. */}
            <div className="absolute inset-0 rounded-full animate-spin-slow" style={{
              background: `conic-gradient(${D.accent} ${progress}%, transparent ${progress}%)`,
            }}/>
            <div className="absolute inset-1 rounded-full" style={{ background: s(D.base, D.lBase, mode) }} />
            <span style={{ fontSize: 32 }}>🩺</span>
          </div>
        </div>
        {/* ANIMATION: animate-fade-up, delay 100ms */}
        <div className="w-full animate-fade-up" style={{ animationDelay: "100ms" }}>
          <h2 className="font-semibold text-center mb-6" style={{ fontSize: 22, color: s(D.text, D.lText, mode) }}>
            Building your recovery plan…
          </h2>
          <div className="flex flex-col gap-3">
            {steps.map((step, i) => (
              // REACTIVE: Each step's circle bg transitions accent/border over 300ms.
              // Checkmark SVG appears once done. Text color transitions 300ms.
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full shrink-0" style={{
                  width: 22, height: 22,
                  background: step.done ? D.accent : s(D.border, D.lBorder, mode),
                  transition: "background 300ms",
                }}>
                  {step.done
                    ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                    : <div className="w-2 h-2 rounded-full" style={{ background: s(D.textMut, D.lTextSec, mode) }} />
                  }
                </div>
                <span style={{ fontSize: 14, color: step.done ? s(D.text, D.lText, mode) : s(D.textMut, D.lTextSec, mode), transition: "color 300ms" }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Ready state (phase === "ready") ──────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 px-6 pb-8 justify-between">
      <div className="flex-1 flex flex-col justify-center items-center gap-5">
        {/* ANIMATION: animate-fade-up — checkmark circle entry, no delay */}
        <div className="animate-fade-up flex items-center justify-center rounded-full" style={{
          width: 96, height: 96,
          background: `linear-gradient(135deg, ${D.accentD}, ${D.accent})`,
          boxShadow: `0 8px 32px ${D.accent}55`,
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M6 24l12 12L42 10" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {/* ANIMATION: animate-fade-up, delay 80ms */}
        <div className="animate-fade-up text-center" style={{ animationDelay: "80ms" }}>
          <h1 className="font-semibold mb-2" style={{ fontSize: 26, color: s(D.text, D.lText, mode) }}>Your timeline is ready</h1>
          <p style={{ fontSize: 15, color: s(D.textSec, D.lTextSec, mode) }}>Personalised to your recovery</p>
        </div>

        {/* ANIMATION: animate-fade-up, delay 160ms — corridor preview card */}
        <div className="w-full animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="rounded-2xl p-4" style={{ background: s(D.raised, D.lCard, mode), border: `1px solid ${s(D.border, D.lBorder, mode)}` }}>
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode) }}>RECOVERY TIMELINE</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: D.accent }}>Day 1</span>
            </div>
            <div style={{ fontSize: 11, color: s(D.textMut, D.lTextSec, mode), marginBottom: 10, fontStyle: "italic" }}>
              Here's what the coming weeks commonly look like
            </div>
            {[
              { week: "Week 1–2", label: "Rest & stabilise",   pct: 100, color: D.pain },
              { week: "Week 3–4", label: "Gentle mobility",    pct: 65,  color: D.sleep },
              { week: "Week 5–8", label: "Strengthening",      pct: 30,  color: D.energy },
              { week: "Week 9+",  label: "Return to activity", pct: 10,  color: D.mood },
            ].map((row, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 11, color: s(D.textSec, D.lTextSec, mode) }}>{row.week}</span>
                  <span style={{ fontSize: 11, color: s(D.textMut, D.lTextSec, mode) }}>{row.label}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 6, background: s(D.border, D.lBorder, mode) }}>
                  {/* ANIMATION: Each bar uses animate-fade-in with staggered delays:
                      Bar 0: 300ms. Bar 1: 380ms. Bar 2: 460ms. Bar 3: 540ms. */}
                  <div className="h-full rounded-full animate-fade-in" style={{ width: `${row.pct}%`, background: row.color, animationDelay: `${300 + i * 80}ms` }} />
                </div>
              </div>
            ))}
            {/* Phase chips — non-interactive, informational */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[
                { label: "🛌 Rest phase", color: D.pain },
                { label: "🚶 Mobility returns", color: D.sleep },
                { label: "💪 Strength phase", color: D.energy },
              ].map(chip => (
                <div key={chip.label} className="px-2 py-0.5 rounded-full" style={{ background: `${chip.color}22`, border: `1px solid ${chip.color}44` }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: chip.color }}>{chip.label}</span>
                </div>
              ))}
            </div>
            {/* Disclaimer — tone: common range, not a target */}
            <div style={{ fontSize: 10, color: s(D.textMut, D.lTextSec, mode), marginTop: 8, fontStyle: "italic" }}>
              Everyone heals differently — this is a common range, not a target.
            </div>
          </div>
        </div>
      </div>
      {/* ANIMATION: animate-fade-up, delay 400ms — button entry */}
      <div className="pt-4 animate-fade-up" style={{ animationDelay: "400ms" }}>
        {/* BUTTON: "See your plan" → next() → screen 9 (FreePlanScreen) */}
        <PrimaryButton label="See your plan" onClick={onNext} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 9: FreePlanScreen
// PURPOSE: Celebratory screen. User must feel they already won something
//   before any paywall appears. Lists all free features.
// ENTRY: Screen 8. No progress bar.
//
// UI ELEMENTS:
//   - 🎉 emoji (56px)
//   - "FREE PLAN UNLOCKED" badge (mood/green color)
//   - Headline + supporting text
//   - 5 feature rows (52px each) with pastel icons and checkmarks
//   - "Start my recovery" primary button
//
// FEATURE ROWS:
//   Non-interactive. Each has: colored icon area + label + green checkmark dot.
//   Colors: D.mood (check-ins), D.sleep (timeline), D.meds (journal),
//           D.energy (charts), D.pain (medication log).
//   These rows share .stagger-N classes for entry order.
//
// ANIMATIONS:
//   Header block (emoji + badge + headline): animate-fade-up, no delay.
//   Feature rows list: animate-fade-up, delay 100ms.
//   Button: animate-fade-up, delay 360ms.
//
// BUTTON:
//   "Start my recovery":
//     ACTION: next() → screen 10 (PremiumTeaserScreen).
// ============================================================
function FreePlanScreen({ mode, onNext }: { mode: Mode; onNext: () => void }) {
  const features = [
    { icon: "📅", label: "Daily check-ins", color: D.mood },
    { icon: "📊", label: "Recovery timeline", color: D.sleep },
    { icon: "📝", label: "Symptom journal", color: D.meds },
    { icon: "📉", label: "Basic charts", color: D.energy },
    { icon: "💊", label: "Medication log", color: D.pain },
  ];
  return (
    <div className="flex flex-col flex-1 px-6 pb-8 justify-between">
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        {/* ANIMATION: animate-fade-up — header block entry, no delay */}
        <div className="animate-fade-up text-center">
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 8 }}>🎉</div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-3" style={{
            background: `${D.mood}22`, border: `1px solid ${D.mood}66`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: D.mood, letterSpacing: "0.06em" }}>FREE PLAN UNLOCKED</span>
          </div>
          <h1 className="font-semibold mb-2" style={{ fontSize: 24, color: s(D.text, D.lText, mode) }}>You already have everything you need</h1>
          <p style={{ fontSize: 15, color: s(D.textSec, D.lTextSec, mode), lineHeight: 1.6 }}>Your free plan includes all the essentials to track your recovery.</p>
        </div>
        {/* ANIMATION: animate-fade-up, delay 100ms — feature rows */}
        <div className="w-full animate-fade-up flex flex-col gap-2" style={{ animationDelay: "100ms" }}>
          {features.map((f, i) => (
            // Non-interactive display rows. .stagger-N adds entry delay.
            <div key={i} className={`flex items-center gap-3 px-4 rounded-2xl stagger-${i+1}`} style={{
              height: 52, background: s(D.raised, D.lCard, mode),
              border: `1px solid ${s(D.border, D.lBorder, mode)}`,
            }}>
              <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: `${f.color}22` }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: s(D.text, D.lText, mode) }}>{f.label}</span>
              {/* Green check indicator — always present, not interactive */}
              <div className="ml-auto flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: `${D.mood}33` }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke={D.mood} strokeWidth="2" strokeLinecap="round"><path d="M2 5.5l2.5 2.5 4.5-4.5"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ANIMATION: animate-fade-up, delay 360ms */}
      <div className="pt-4 animate-fade-up" style={{ animationDelay: "360ms" }}>
        {/* BUTTON: "Start my recovery" → next() → screen 10 */}
        <PrimaryButton label="Start my recovery" onClick={onNext} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 10: PremiumTeaserScreen
// PURPOSE: Friendly premium benefits screen. Shows locked features to
//   surface value before the paywall. Both paths ("Start trial" and
//   "Continue free") lead to screen 11 (PaywallScreen / final step).
// ENTRY: Screen 9. No progress bar.
//
// UI ELEMENTS:
//   - "✦ PREMIUM" gradient badge
//   - Headline: "Go deeper with Premium"
//   - 5 locked feature rows (52px, opacity 0.7):
//     Advanced insights / Full history / Doctor report /
//     Photo compare / Multiple profiles
//   - Lock badge on each row (24×24px, D.border bg, lock SVG)
//   - "Start 14-day free trial" primary button
//   - "Continue with free plan" secondary button
//
// LOCKED FEATURE ROWS:
//   opacity: 0.7 — intentionally desaturated/subdued to signal locked state.
//   Lock badge (right): muted border-colored circle with lock icon.
//   NOT using the LockedCard component — simpler lock treatment here.
//
// ANIMATIONS:
//   Header badge+headline: animate-fade-up, no delay.
//   Feature rows list: animate-fade-up, delay 100ms.
//   Button area: animate-fade-up, delay 300ms.
//
// BUTTONS:
//   "Start 14-day free trial": → next() → screen 11 (PaywallScreen).
//   "Continue with free plan": → onSkip() (= next()) → screen 11.
//   NOTE: Both call next() — screen 11 is PaywallScreen, the final step.
// ============================================================
function PremiumTeaserScreen({ mode, onNext, onSkip }: { mode: Mode; onNext: () => void; onSkip: () => void }) {
  const premiumFeatures = [
    { icon: "🔬", label: "Advanced insights & correlations", color: D.meds, locked: true },
    { icon: "📜", label: "Full history export", color: D.sleep, locked: true },
    { icon: "🩻", label: "Doctor report PDF", color: D.energy, locked: true },
    { icon: "📷", label: "Photo progress compare", color: D.pain, locked: true },
    { icon: "♾️", label: "Multiple recovery profiles", color: D.mood, locked: true },
  ];
  return (
    <div className="flex flex-col flex-1 px-6 pb-8 justify-between">
      <div className="flex-1 flex flex-col justify-center items-center gap-5">
        {/* ANIMATION: animate-fade-up — header entry, no delay */}
        <div className="animate-fade-up text-center">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-3" style={{
            background: `linear-gradient(135deg, ${D.accentD}, ${D.accent}55)`,
            border: `1px solid ${D.accent}66`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: D.accentL, letterSpacing: "0.08em" }}>✦ PREMIUM</span>
          </div>
          <h1 className="font-semibold mb-2" style={{ fontSize: 24, color: s(D.text, D.lText, mode) }}>Go deeper with Premium</h1>
          <p style={{ fontSize: 15, color: s(D.textSec, D.lTextSec, mode), lineHeight: 1.6 }}>Unlock advanced tools for faster, smarter recovery.</p>
        </div>
        {/* ANIMATION: animate-fade-up, delay 100ms — feature rows */}
        <div className="w-full animate-fade-up flex flex-col gap-2" style={{ animationDelay: "100ms" }}>
          {premiumFeatures.map((f, i) => (
            // opacity 0.7 — locked/subdued visual state
            <div key={i} className="flex items-center gap-3 px-4 rounded-2xl" style={{
              height: 52,
              background: s(D.raised, D.lCard, mode),
              border: `1px solid ${s(D.border, D.lBorder, mode)}`,
              opacity: 0.7,
            }}>
              <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: `${f.color}22` }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: s(D.textSec, D.lTextSec, mode) }}>{f.label}</span>
              {/* Lock badge. Was drawn inline here AND separately in MainApp,
                  with different sizes and fills — the exact drift the shared
                  pattern component exists to prevent. */}
              <div className="ml-auto flex">
                <LockBadge mode={mode} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ANIMATION: animate-fade-up, delay 300ms */}
      <div className="flex flex-col gap-3 pt-4 animate-fade-up" style={{ animationDelay: "300ms" }}>
        {/* BUTTON: "Start 14-day free trial" → onNext() → screen 11 */}
        <PrimaryButton label="Start 14-day free trial" onClick={onNext} mode={mode} />
        {/* BUTTON: "Continue with free plan" → onSkip() → screen 11 */}
        <SecondaryButton label="Continue with free plan" onClick={onSkip} mode={mode} />
      </div>
    </div>
  );
}

// ============================================================
// SCREEN 11: PaywallScreen  (final onboarding screen)
// PURPOSE: Trial paywall with plan selector. Both "Start free trial"
//   and "Continue free" call onComplete() → exits onboarding → MainApp.
// ENTRY: Screen 10. No progress bar.
//
// UI ELEMENTS:
//   - "✦" symbol (40px) + headline "14 days free, then cancel anytime."
//   - Plan toggle: Annual / Monthly (two side-by-side cards)
//   - 5 benefit rows with pastel icons + checkmarks
//   - "Start free trial" primary button
//   - "Continue free" secondary button
//   - "Restore purchases · Terms · Privacy" text link
//
// PLAN TOGGLE STATE:
//   initial: "annual" selected.
//   SELECTED CARD: gradient accent bg, 1.5px accent border, accentL title text.
//   UNSELECTED CARD: D.raised/lCard bg, D.border/lBorder border.
//   TRANSITION: all 150ms on click.
//   Annual card shows "SAVE 40%" green badge.
//
// ANIMATIONS:
//   Header: animate-fade-up, no delay.
//   Plan selector: animate-fade-up, delay 80ms.
//   Benefits: animate-fade-up, delay 140ms.
//   Button area: animate-fade-up, delay 260ms.
//
// BUTTONS:
//   "Start free trial":
//     ACTION: onNext() = onComplete?.(mode) → exits onboarding.
//     NAVIGATION: → App.tsx sets phase="app" → MainApp renders.
//   "Continue free":
//     ACTION: onSkip() = onComplete?.(mode) → same as above.
//     NOTE: Both paths are equal exits. The plan selection is visual-only
//     (not yet wired to a payment processor in this prototype).
//   "Restore purchases" text button: no-op in this prototype.
// ============================================================
function PaywallScreen({ mode, onNext, onSkip }: { mode: Mode; onNext: () => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<"monthly" | "annual">("annual");
  return (
    <div className="flex flex-col flex-1 px-6 pb-6 justify-between overflow-y-auto">
      <div className="flex-1 flex flex-col gap-5">
        {/* ANIMATION: animate-fade-up — header entry, no delay */}
        <div className="animate-fade-up text-center pt-2">
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 8 }}>✦</div>
          <h1 className="font-semibold mb-1" style={{ fontSize: 24, color: s(D.text, D.lText, mode) }}>
            14 days free,<br />then cancel anytime.
          </h1>
          <p style={{ fontSize: 14, color: s(D.textSec, D.lTextSec, mode) }}>No charge today.</p>
        </div>

        {/* ANIMATION: animate-fade-up, delay 80ms — plan selector */}
        <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
          {(["annual","monthly"] as const).map(plan => {
            const sel = selected === plan;
            return (
              // INTERACTION: Tap plan card → setSelected(plan).
              // STATE CHANGE: Selected card gets gradient bg + accent border (150ms transition).
              <button key={plan} onClick={() => setSelected(plan)} className="btn-press flex-1 rounded-2xl p-4 text-left"
                style={{
                  background: sel ? `linear-gradient(135deg, ${D.accentD}, ${D.accent}44)` : s(D.raised, D.lCard, mode),
                  border: `1.5px solid ${sel ? D.accent : s(D.border, D.lBorder, mode)}`,
                  cursor: "pointer", transition: "all 150ms",
                }}>
                {plan === "annual" && (
                  <div className="inline-flex px-2 py-0.5 rounded-full mb-2" style={{ background: `${D.mood}33`, fontSize: 10, fontWeight: 700, color: D.mood, letterSpacing: "0.06em" }}>SAVE 40%</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 600, color: sel ? D.accentL : s(D.text, D.lText, mode) }}>
                  {plan === "annual" ? "Annual" : "Monthly"}
                </div>
                <div style={{ fontSize: 13, color: s(D.textSec, D.lTextSec, mode) }}>
                  {plan === "annual" ? "$4.99/mo · $59.99/yr" : "$8.99/mo"}
                </div>
              </button>
            );
          })}
        </div>

        {/* ANIMATION: animate-fade-up, delay 140ms — benefits list */}
        <div className="animate-fade-up flex flex-col gap-2" style={{ animationDelay: "140ms" }}>
          {[
            { icon: "🔬", label: "Advanced insights", color: D.meds },
            { icon: "📜", label: "Full history & export", color: D.sleep },
            { icon: "🩻", label: "Doctor report PDF", color: D.energy },
            { icon: "📷", label: "Photo progress compare", color: D.pain },
            { icon: "♾️", label: "Multiple recoveries", color: D.mood },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg" style={{ width: 28, height: 28, background: `${f.color}22` }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
              </div>
              <span style={{ fontSize: 14, color: s(D.text, D.lText, mode) }}>{f.label}</span>
              <div className="ml-auto">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3"/></svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ANIMATION: animate-fade-up, delay 260ms — button area */}
      <div className="flex flex-col gap-2 pt-4 animate-fade-up" style={{ animationDelay: "260ms" }}>
        {/* BUTTON: "Start free trial" → onComplete(mode) → exits onboarding → MainApp */}
        <PrimaryButton label="Start free trial" onClick={onNext} mode={mode} />
        {/* BUTTON: "Continue free" → same exit path, no trial started */}
        <SecondaryButton label="Continue free" onClick={onSkip} mode={mode} />
        <div className="text-center pt-1">
          {/* Legal/utility link — no-op in this prototype */}
          <button style={{ fontSize: 11, color: s(D.textMut, D.lTextSec, mode), background: "none", border: "none", cursor: "pointer" }}>
            Restore purchases · Terms · Privacy
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: Onboarding  (default export)
// PURPOSE: Root wizard shell. Manages screen index, UserData accumulation,
//   mode toggle, and PhoneShell layout.
//
// PROPS:
//   onComplete(mode): Called when user exits screen 11 (either button).
//     Receives current mode so App.tsx can pass it to MainApp.
//   initialMode: Optional. If provided, overrides internal mode state
//     (used when Onboarding is launched with a specific mode from App.tsx).
//
// RELATIONSHIP TO App.tsx:
//   App.tsx renders <Onboarding onComplete={(m) => { setMode(m); setPhase("app"); }} />
//   When onComplete fires, App.tsx unmounts Onboarding and mounts MainApp.
//
// SCREEN SWITCHING:
//   next(): setScreen(s => Math.min(s + 1, 11))
//   back(): setScreen(s => Math.max(s - 1, 0))
//   Screen content is selected from the `screens` array by index.
//   The screen content div has key={screen} so React re-mounts it on change.
//   TRANSITION: className="animate-fade-in" — opacity 0→1, 300ms ease-out.
//
// PAGE BACKGROUND:
//   dark mode:  radial-gradient(ellipse at 30% 20%, #23204A, #0D0C16)
//   light mode: radial-gradient(ellipse at 30% 20%, #EAE6F8, #F8F7FC)
//   TRANSITION: background 400ms (CSS transition on the wrapper div).
//
// MODE TOGGLE BUTTON:
//   Fixed position: top 16px, right 16px. zIndex 100. Always visible.
//   Shows ☀️ in dark mode (tap → light), 🌙 in light mode (tap → dark).
//   WIDTH/HEIGHT: 40×40px. Rounded-xl.
//   INTERACTION: .btn-press — scale 0.97, 120ms. No other animation.
//
// SCREEN INDICATOR DOTS:
//   12 dots below PhoneShell. Active dot: 16×6px, accent color.
//   Inactive dots: 6×6px, semi-transparent white/black.
//   TRANSITION: width and background — 250ms ease-out — on screen change.
//   Not interactive (purely informational).
// ============================================================
export default function Onboarding({ onComplete, initialMode, initialScreen }: { onComplete?: (mode: Mode) => void; initialMode?: Mode; initialScreen?: number } = {}) {
  const [_mode, toggleMode] = useMode();
  // If initialMode is provided (from App.tsx), it overrides internal toggle.
  const mode: Mode = initialMode ?? _mode;
  // initialScreen is a TEST HOOK for the visual-parity harness: it lets the
  // runner open any wizard step directly rather than clicking through eleven
  // screens to reach the paywall. Undefined in normal use, so the flow still
  // starts at the welcome screen.
  const [screen, setScreen] = useState(initialScreen ?? 0);
  const [data, setData] = useState<UserData>({
    recoveryType: "", condition: "", bodyPart: "",
    startDate: "", symptoms: [], painScore: 3,
    goal: "", notifications: false,
  });

  // NAVIGATION: Advance one screen. Capped at TOTAL_SCREENS - 1.
  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  // NAVIGATION: Go back one screen. Capped at 0.
  const back = () => setScreen(s => Math.max(s - 1, 0));

  // Progress bar: visible on screens 1–8 (data collection phase).
  const showProgress = screen >= 1 && screen <= 8;
  const progressStep  = screen; // 1 of 8

  // INTERACTION: Symptom chip toggle.
  // Adds symptom to symptoms[] if not present, removes it if present.
  function toggleSymptom(sym: string) {
    setData(d => ({
      ...d,
      symptoms: d.symptoms.includes(sym)
        ? d.symptoms.filter(x => x !== sym)
        : [...d.symptoms, sym],
    }));
  }

  // RELATIONSHIP: screens[] maps screen index to rendered component.
  // Each component receives mode + relevant UserData slice + next/back callbacks.
  // Changing `screen` causes key={screen} to change on the wrapper div,
  // re-mounting the screen content and triggering animate-fade-in.
  const screens = [
    <WelcomeScreen mode={mode} onNext={next} />,
    <RecoveryTypeScreen mode={mode} value={data.recoveryType}
      onChange={v => setData(d => ({ ...d, recoveryType: v }))} onNext={next} onBack={back} />,
    <ConditionScreen mode={mode} condition={data.condition} bodyPart={data.bodyPart}
      onCondition={v => setData(d => ({ ...d, condition: v }))}
      onBodyPart={v => setData(d => ({ ...d, bodyPart: v }))}
      onNext={next} onBack={back} />,
    <StartDateScreen mode={mode} value={data.startDate}
      onChange={v => setData(d => ({ ...d, startDate: v }))} onNext={next} onBack={back} />,
    <SymptomsScreen mode={mode} selected={data.symptoms} onToggle={toggleSymptom} onNext={next} onBack={back} />,
    <PainScreen mode={mode} value={data.painScore}
      onChange={v => setData(d => ({ ...d, painScore: v }))} onNext={next} onBack={back} />,
    <GoalScreen mode={mode} value={data.goal}
      onChange={v => setData(d => ({ ...d, goal: v }))} onNext={next} onBack={back} />,
    <NotificationsScreen mode={mode} onNext={(allow) => { setData(d => ({ ...d, notifications: allow })); next(); }} onBack={back} />,
    <PlanLoadingScreen mode={mode} onNext={next} />,
    <FreePlanScreen mode={mode} onNext={next} />,
    <PremiumTeaserScreen mode={mode} onNext={next} onSkip={next} />,
    // Screen 11: onNext/onSkip both call onComplete(mode) if provided, else next().
    <PaywallScreen mode={mode} onNext={() => onComplete?.(mode) ?? next()} onSkip={() => onComplete?.(mode) ?? next()} />,
  ];

  return (
    // Page wrapper — background transitions 400ms on mode change
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "32px 16px",
      background: mode === "dark"
        ? "radial-gradient(ellipse at 30% 20%, #23204A 0%, #0D0C16 100%)"
        : "radial-gradient(ellipse at 30% 20%, #EAE6F8 0%, #F8F7FC 100%)",
      transition: "background 400ms",
    }}>
      {/* MODE TOGGLE: Fixed top-right. Switches dark ↔ light.
          INTERACTION: .btn-press (scale 0.97, 120ms) + mode change (bg 400ms). */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: scale.z.dev }}>
        <button onClick={toggleMode} className="btn-press flex items-center justify-center rounded-xl"
          style={{
            width: 40, height: 40,
            background: mode === "dark" ? "#FFFFFF14" : "#0000000F",
            border: `1px solid ${mode === "dark" ? "#FFFFFF1F" : "#0000001A"}`,
            cursor: "pointer", fontSize: 18,
          }}>
          {mode === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <PhoneShell mode={mode}>
        {/* Progress bar: visible on screens 1–8 */}
        {showProgress && <ProgressBar step={progressStep} total={8} mode={mode} />}
        {/* SCREEN TRANSITION: key={screen} causes re-mount → animate-fade-in (300ms ease-out) */}
        <div key={screen} className="flex flex-col flex-1 animate-fade-in" style={{ overflow: "hidden" }}>
          {screens[screen]}
        </div>
      </PhoneShell>

      {/* SCREEN INDICATOR DOTS:
          Active: 16×6px pill, D.accent color.
          Inactive: 6×6px circle, semi-transparent.
          TRANSITION: width + background, 250ms ease-out, on screen change.
          Not interactive (display only). */}
      <div className="flex gap-1.5 mt-5">
        {Array.from({ length: TOTAL_SCREENS }).map((_, i) => (
          <div key={i} style={{
            width: i === screen ? 16 : 6, height: 6, borderRadius: scale.radius.xs,
            background: i === screen ? D.accent : (mode === "dark" ? "#FFFFFF33" : "#00000026"),
            transition: "all 250ms ease-out",
          }} />
        ))}
      </div>
    </div>
  );
}
