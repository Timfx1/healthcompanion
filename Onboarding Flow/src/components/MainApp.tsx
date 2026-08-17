// ============================================================
// FILE: MainApp.tsx
// PURPOSE: 5-tab main application shell for Recovery Companion.
//   Rendered by App.tsx after onboarding completes.
//   Implements: Home, Timeline, Check-in (modal), Progress, Profile tabs.
//   Applies all design adjustments from FIGMA_DESIGN_ADJUSTMENTS.txt:
//   C1 fast-path check-in, C2 quick capture + weekly card,
//   C3 guilt-free mechanics, C4 corridor band, C5 insight sentences,
//   C6 weekly give-back card, C7 share card, C8 premium surfaces,
//   C9 doctor report, C10 (applied in Onboarding).
//
// ENTRY POINT: App.tsx renders <MainApp initialMode={mode} /> after
//   onboarding completes.
//
// TAB MODEL:
//   `tab` state: "home" | "timeline" | "progress" | "profile"
//   (Note: "checkin" tap opens CheckInModal overlay instead of switching tab.)
//   Tab changes trigger key={tab} on screen wrapper → animate-fade-in (300ms).
//
// OVERLAY LAYER (zIndex hierarchy inside PhoneShell, absolute positioned):
//   TabBar:          absolute bottom-0  (no explicit zIndex)
//   Timeline FAB:    zIndex 10
//   Toast:           zIndex 60  (positioned absolute top 52px)
//   CheckInModal:    zIndex 40  (full-screen, replaces all content)
//   ShareCardScreen: zIndex 45  (full-screen, replaces all content)
//   PaywallSheet:    zIndex 50  (bottom sheet, semi-transparent backdrop)
//
// GLOBAL CONTROLS:
//   Mode toggle: fixed top-right (zIndex 100). ☀️/🌙. bg transition 400ms.
//   Dot nav: below PhoneShell (4 dots for home/timeline/progress/profile).
//     Active dot: 16×6px pill, accent color.
//     Inactive: 6×6px circle.
//     TRANSITION: width + background, 250ms ease-out.
//
// PROPS:
//   initialMode: "dark" | "light" — received from App.tsx (mode from onboarding).
//
// STATE:
//   mode, tab, showCheckIn, showPaywall, shareCard
// ============================================================

import { useState, useRef, useEffect } from "react";
import { D, c as s, theme, type Mode } from "./tokens";

// ============================================================
// LIGHT MODE vs DARK MODE — VISUAL COMPARISON GUIDE (MAIN APP)
//
// This section describes how every tab, card, overlay, and component
// changes between dark (default) and light mode. Use as a design reference
// when recreating either version. Token hex values are in tokens.ts.
//
// ── GLOBAL SHELL (all screens) ──────────────────────────────
//
//   ELEMENT              DARK                          LIGHT
//   ───────────────────────────────────────────────────────────────────────
//   Page background      radial #23204A → #0D0C16      radial #EAE6F8 → #F8F7FC
//                        Rich deep-space indigo        Pale icy lavender
//   Phone shell bg       #15141F                       #F8F7FC
//   Phone shell shadow   Heavy black drop shadow       Soft purple lift shadow
//                        + faint white glow rim         + faint violet rim
//   Status bar text      #9B97B8 (muted lavender)      #6B6890 (slate-purple)
//   Tab bar bg           #1E1D2E (dark indigo panel)   #FFFFFF (clean white)
//   Tab bar border       #2E2C45 (plum line)           #E4E1F5 (pale lilac line)
//   Active tab           #7C6FCD accent                #7C6FCD accent (SAME)
//   Inactive tab         #9B97B8                       #6B6890
//   Log button           Gradient #7C6FCD→#9B8FE0      SAME gradient
//                        Glow shadow rgba(124,111,205,0.33)  same shadow, less dramatic
//   Dot nav (active)     16×6px #7C6FCD pill           16×6px #7C6FCD pill (SAME)
//   Dot nav (inactive)   rgba(255,255,255,0.2) white    rgba(0,0,0,0.15) near-black
//                        Faint white dots on black      Faint dark dots on pale bg
//   Mode toggle button   rgba(255,255,255,0.08) frosted  rgba(0,0,0,0.06) frosted
//                        ☀️ emoji                       🌙 emoji
//
// ── HOME TAB ────────────────────────────────────────────────
//
//   Header area:
//   DARK:  Greeting "Good morning 👋" in #9B97B8 (muted, lavender-gray).
//          Name "Alex" in #F0EFFE (near-white, prominent).
//          Check-in counter pill: rgba(124,111,205,0.13) bg + rgba(124,111,205,0.27) border.
//          Very subtle purple glow pill on dark surface.
//   LIGHT: Greeting in #6B6890 (slightly darker secondary). Name in #1A1830 (near-black).
//          Counter pill: same rgba values — on white bg the tint is barely visible.
//          The pill border reads more clearly as a thin violet outline.
//
//   Quick capture field (C2):
//   DARK:  #1E1D2E bg raised surface, #2E2C45 border. Placeholder text in #5C5878.
//          The field recedes into the dark background — feels embedded.
//          Mic button (empty): #2E2C45 bg. Mic button (with text): solid #7C6FCD.
//   LIGHT: White bg, #E4E1F5 border. Placeholder: #6B6890. Feels like a clean input field.
//          Mic button (empty): pale #E4E1F5. Button (with text): same solid #7C6FCD.
//          The accent mic button pops much more on white bg.
//
//   Day counter card:
//   DARK:  Gradient from #3D3668 (deep indigo-violet) → #1E1D2E (dark surface).
//          Large "Day 46" numeral: #F0EFFE near-white — luminous on the gradient.
//          "82% on track" badge: rgba(124,111,205,0.2) bg — soft purple glow.
//          Inner comparison box: rgba(255,255,255,0.06) — barely-there frosted panel.
//          Feels rich, like a deep-space instrument panel.
//   LIGHT: Gradient from #3D3668 → #EDE9FA (pale lavender-white).
//          The gradient goes from a deep indigo at top to nearly-white at bottom.
//          "Day 46" numeral: #1A1830 near-black — bold and grounded.
//          Badge: same rgba — near-invisible tint on light end of gradient.
//          Inner comparison box: rgba(255,255,255,0.06) — invisible (same as bg).
//          Feels more like a printed card than a cockpit panel.
//
//   Pre-appointment nudge (C9):
//   DARK:  rgba(158,195,245,0.07) bg (nearly invisible blue tint) + rgba(#9EC3F5,0.27) border.
//          Subtle blue-tinted card on dark. Easy to miss if not looking.
//   LIGHT: Same tint values on white bg — the blue border is slightly more visible.
//          But the card is still very quiet in both modes (intentional — it's a nudge).
//
//   Today's action rows:
//   DARK:  Uncompleted: #1E1D2E bg, #2E2C45 border. Dark recessed tiles.
//          Completed: border upgrades to rgba(categoryColor,0.33) — soft color tint.
//          Icon area: rgba(categoryColor,0.13) — just a hint of category color.
//          Completion circle: border-color gray → fills with category color (200ms).
//   LIGHT: Uncompleted: white bg, #E4E1F5 lilac border. Clean form-style rows.
//          Completed: same rgba tint border — more visible on white than on dark.
//          Icon areas: same tints — look like watercolor spots on white.
//          OVERALL: Dark mode feels like a sleek wellness tracker. Light mode
//          feels like a doctor's appointment checklist.
//
//   Weekly give-back card (C6):
//   DARK:  rgba(168,217,184,0.055) bg — just a whisper of mint on dark surface.
//          rgba(168,217,184,0.27) border — faint green outline.
//          Feels like a soft mint frost panel in dark.
//          Inner insight box: rgba(168,217,184,0.10) tint — barely visible.
//   LIGHT: Same rgba values on white bg — the mint tint is very faint,
//          mostly defined by the mint-green border which reads as a clear
//          thin green stroke on white. Airy and calm.
//
//   Doctor report row (C9, Reports section):
//   DARK:  Standard Card (#1E1D2E bg). Icon area: rgba(201,184,240,0.13) — soft meds purple.
//          The 🩻 emoji glows slightly against the dark tile.
//   LIGHT: White card. Icon area: same pale purple tint — just a watercolor square.
//          The chevron → is clearly visible in both modes (muted gray).
//
//   Locked insight card (LockedCard):
//   DARK:  filter: saturate(0.55) opacity(0.75). The card is desaturated AND dimmed.
//          On dark background: the card gets even darker — feels very suppressed.
//          Blur overlay: rgba(21,20,31,0.55) — near-black. Lock badge: #2E2C45 circle.
//          The blur layer creates a dark smoky glass effect.
//   LIGHT: Same filter values on light bg. The card fades toward white/gray.
//          Blur overlay: same rgba(21,20,31,0.55) — this is always dark regardless of mode.
//          The dark overlay on a light card creates a strong contrast — the lock
//          state is MORE obvious in light mode than in dark mode.
//
// ── TIMELINE TAB ────────────────────────────────────────────
//
//   Filter chips:
//   DARK:  Unselected: #1E1D2E bg, #2E2C45 border. Pill buttons recede into dark.
//          Selected: solid #7C6FCD bg, white text. Vivid violet pill on dark row.
//   LIGHT: Unselected: white bg, #E4E1F5 border. Chips look like form tags.
//          Selected: same solid #7C6FCD. On white, the selected chip is bold and clear.
//
//   Timeline entries:
//   DARK:  Icon circles: rgba(categoryColor,0.13) bg + rgba(categoryColor,0.33) border.
//          On dark surface these glow faintly — e.g. mood icon circle glows green.
//          Entry cards: #1E1D2E bg, subtle borders. Deep, layered panels.
//          Connector lines: #2E2C45 — barely visible vertical threads.
//          Milestone cards: category-colored border e.g. rgba(201,184,240,0.33) — soft glow.
//          Milestone title: category color text glows (e.g. #C9B8F0 lavender text).
//   LIGHT: Icon circles: same rgba tints on white — watercolor spots.
//          Entry cards: white bg with #E4E1F5 border — clean paper-like tiles.
//          Connector lines: #E4E1F5 pale lilac — clearly visible on light bg.
//          Milestone cards: category border on white is a crisp colored stroke.
//          Milestone title: same category color text — equally readable on white.
//
//   Rest day entry (C3):
//   DARK:  6px dot circle: #2E2C45 (almost invisible dark plum). Text 45% opacity.
//          Feels nearly invisible — rest days simply don't exist in dark mode.
//   LIGHT: 6px dot circle: #E4E1F5 (pale lilac dot). Text 45% opacity #6B6890.
//          Also very quiet on light, but the lilac dot is fractionally more visible.
//
//   Date headers:
//   DARK:  #9B97B8 text (muted lavender). Blends softly with dark background.
//   LIGHT: #6B6890 (slightly stronger slate-purple). More definition between sections.
//
//   FAB (+ button):
//   DARK:  Gradient accent circle + rgba(124,111,205,0.33) glow shadow.
//          Hovers dramatically against dark background — very prominent.
//   LIGHT: Same gradient, same shadow. Less dramatic pop but still clearly visible.
//
// ── CHECK-IN MODAL ──────────────────────────────────────────
//
//   Background (full-screen):
//   DARK:  #15141F solid fill — the deepest surface. Feels enclosed, intimate.
//   LIGHT: #F8F7FC pale lavender-white — open, clinical, neutral.
//
//   Drag handle:
//   DARK:  #2E2C45 rounded rect — barely visible.
//   LIGHT: #E4E1F5 — pale lilac, clearly a pull handle on white bg.
//
//   Fast-path buttons (C1, 100px):
//   DARK:  Unselected: #1E1D2E bg, 2px #2E2C45 border. Dark tiles in thumb zone.
//          Selected (e.g. Better): rgba(168,217,184,0.27) bg + 2px #A8D9B8 border.
//          The category color wash on dark background is warm and expressive.
//          Selected icon emoji looks lit up, selected word text glows in category color.
//   LIGHT: Unselected: white bg, 2px #E4E1F5 border. Clean blank tiles.
//          Selected: same rgba color wash on white — the tint is faint but the
//          2px colored border carries the selected state clearly.
//          On white, the emoji and colored word text are the primary signals.
//
//   Collapsible "Add detail" row:
//   DARK:  #1E1D2E bg, #2E2C45 border. Dark recessed row.
//   LIGHT: White bg, #E4E1F5 border. Looks like an accordion row in a form.
//
//   Pain slider (detail):
//   DARK:  Unfilled track: #2E2C45 (dark plum).
//          Filled portion follows pain color scale (green→red). Thumb: white.
//          The thumb appears as a white dot on the colored gradient — high contrast.
//   LIGHT: Unfilled track: #E4E1F5 (pale lilac).
//          Same filled pain colors. On light bg the color shift feels more neutral.
//
//   Toggle switch (medications):
//   DARK:  Off: #2E2C45 bg (dark). On: #7C6FCD (violet). Thumb: white.
//          Off state blends with surrounding dark surfaces.
//   LIGHT: Off: #E4E1F5 bg (pale lilac). On: #7C6FCD (violet). Thumb: white.
//          Off state is clearly a pale pill — more visually obvious in light mode.
//
//   Done state (post-check-in):
//   DARK:  Full-screen #15141F. Green checkmark circle glows (0 8px 32px accent55).
//          Feels like a victory screen in a dark game UI.
//   LIGHT: Full-screen #F8F7FC pale lavender. Same glow circle — still prominent
//          but warmer and less dramatic. "Logged ✓" in #1A1830 near-black.
//          Feels like a clean confirmation on a health form.
//
// ── PROGRESS TAB ────────────────────────────────────────────
//
//   Pain trend card:
//   DARK:  Card: #1E1D2E bg. InsightSentence badge: rgba(242,166,158,0.13) pain tint.
//          Sparkline line: #F2A69E coral on dark — warm and clearly visible.
//          Area fill: rgba(242,166,158,0.13) — subtle warm glow under the line.
//          Corridor band: rgba(155,143,224,0.13) lavender fill — quiet on dark.
//          Dashed corridor lines: rgba(155,143,224,0.3) — subtle but clear.
//          History gate gradient: transparent → #1E1D2E. Perfectly invisible join.
//   LIGHT: Card: white. InsightSentence badge: same rgba tint — nearly invisible bg.
//          Sparkline: same #F2A69E coral on white — appears brighter, more saturated.
//          Area fill: faint blush on white — very subtle.
//          Corridor band: rgba(124,111,205,0.10) — whisper of lavender on white card.
//          Dashed lines: rgba(124,111,205,0.25) — visible but restrained.
//          History gate gradient: transparent → #FFFFFF (white). Same clean blend.
//
//   Week comparison card:
//   DARK:  4px category color bars (pain/sleep/energy) against #1E1D2E bg.
//          Bars look like neon-lit data bars on a dark panel.
//          Previous week values: 0.7 opacity — clearly secondary, receding.
//   LIGHT: Same colored bars on white card. More "chart on paper" feel than dark mode.
//          Previous week values: same 0.7 opacity — slightly lighter than main value.
//
//   Mini sparklines (sleep/energy/mobility):
//   DARK:  Category color lines on dark cards — each line has its own glow quality.
//          Sleep: #9EC3F5 soft blue. Energy: #F5D08A warm amber. Mobility: #A8D9B8 mint.
//          Area fills: 13% opacity of each color. On dark surface these are warm color washes.
//   LIGHT: Same category colors on white cards — each line reads as a clean stroke.
//          Area fills nearly invisible on white. More focus on the line itself.
//
//   Advanced insights (LockedCard):
//   DARK:  See LockedCard description above. Dark smoky glass overlay.
//   LIGHT: Dark overlay on pale card — the contrast makes the lock state even clearer.
//
// ── PAYWALL SHEET ───────────────────────────────────────────
//
//   Backdrop:
//   DARK:  rgba(0,0,0,0.55) + blur(4px). Deep smoky overlay over dark phone shell.
//          Makes the underlying content feel very distant and dim.
//   LIGHT: Same rgba(0,0,0,0.55). On a light phone shell this overlay is MORE
//          visually impactful — the light underlying content disappears dramatically.
//
//   Bottom sheet:
//   DARK:  #1E1D2E (raised surface). Deep indigo panel.
//          Premium badge: gradient accentD→accent33 — glowing gradient chip on dark.
//          Plan toggle: unselected = #252438 (card surface). Selected = accent gradient.
//          The gradient difference between unselected and selected is subtle on dark.
//          "SAVE 40%" badge: rgba(168,217,184,0.2) bg, #A8D9B8 text — mint glow.
//   LIGHT: White sheet. The rounded-t-3xl sheet against pale lavender bg creates
//          a visible white panel edge.
//          Premium badge: same gradient — the deep-indigo start looks dark/bold on white.
//          Plan toggle: unselected = #F8F7FC (pale lavender). Selected = accent gradient.
//          On light bg the selected vs unselected contrast is MUCH greater.
//          "SAVE 40%": same rgba — near-invisible tint, text carries it.
//
// ── SHARE CARD SCREEN (C7) ──────────────────────────────────
//
//   Background:
//   DARK:  #15141F — deep ink. The share card itself floats on darkness.
//   LIGHT: #F8F7FC pale lavender. The share card pops as a dark element on light bg.
//
//   Share card (280×496px):
//   NOTE: The share card itself has a HARDCODED dark gradient regardless of mode:
//   linear-gradient(155deg, #3D3668 → #0D0C16 → rgba(#3D3668,0.53)).
//   The card always looks dark. On dark bg it blends with surroundings.
//   On LIGHT bg the dark card creates a dramatic contrast — it looks like
//   a dark photo card laid on a white surface. Very striking.
//
//   Header ("← Back" + title):
//   DARK:  "Back" text and chevron: #9B97B8 muted lavender. Subtle.
//   LIGHT: Same color: #6B6890. Slightly darker on light bg but still secondary.
//
//   "Share" button + privacy note:
//   DARK:  Gradient button: prominent against dark bg. Privacy text: #5C5878 muted.
//   LIGHT: Same gradient. Privacy text: #6B6890 slightly stronger than dark's muted.
//
// ── PROFILE TAB ─────────────────────────────────────────────
//
//   Profile card:
//   DARK:  #1E1D2E card. Avatar circle: gradient accent. Large emoji 🧑 on dark.
//   LIGHT: White card with lilac border. Avatar gradient — same purple on white.
//
//   Premium upgrade row:
//   DARK:  gradient accentD→rgba(accent,0.2). Deep indigo wash row.
//          "Free plan" text: #9B8FE0 (lavender glow). Chevron: #9B8FE0.
//          Blends into dark shell — feels embedded.
//   LIGHT: Same gradient — but the deep-indigo start on a white-surrounded context
//          makes this row the MOST VISUALLY PROMINENT element on the profile screen.
//          Acts like a colored CTA row on a white form page.
//
//   Menu rows (card with borderBottom separators):
//   DARK:  Dark card (#1E1D2E). Separator lines: #2E2C45. Chevrons: #5C5878.
//          Rows feel like sections in a dark settings panel.
//   LIGHT: White card. Separators: #E4E1F5 lilac lines. Chevrons: #6B6890.
//          Rows look exactly like standard iOS Settings screen rows.
//
//   Footer ("Recovery Companion v1.0.0"):
//   DARK:  #5C5878 muted plum. Barely readable — very fine print feel.
//   LIGHT: #B0ACCF pale violet-gray. Slightly more readable on light bg.
//
// ── TOAST NOTIFICATION ──────────────────────────────────────
//   NOTE: Toast always uses hardcoded dark styles (not mode-aware):
//   bg: D.card (#252438) in dark mode call, "#333" fallback in light.
//   DARK:  #252438 bg — dark pill blends naturally with dark shell.
//   LIGHT: "#333" dark gray bg — the toast ALWAYS appears as a dark pill
//          even on a light screen. This creates a "system notification" feel
//          that is intentionally dark regardless of mode — stands out clearly.
//
// ── CATEGORY COLORS (mode-invariant) ────────────────────────
//   These pastel hues DO NOT CHANGE between dark and light mode:
//   Pain:   #F2A69E  (reddish-peach coral)
//   Sleep:  #9EC3F5  (soft powder blue)
//   Energy: #F5D08A  (muted warm amber)
//   Mood:   #A8D9B8  (soft sage green)
//   Meds:   #C9B8F0  (soft lilac-lavender)
//
//   However their perceived saturation DIFFERS by mode:
//   DARK:  These colors appear warmer and more luminous against dark surfaces.
//          The 13% opacity bg tints create gentle color washes — jewel-like.
//   LIGHT: These colors appear slightly more saturated against white.
//          The 13% opacity tints are nearly invisible on white — the full-color
//          text or strokes carry the meaning.
// ============================================================

// ─── Shared primitives ────────────────────────────────────────────────────────

// ============================================================
// COMPONENT: PhoneShell
// PURPOSE: iOS device frame container. Identical pattern to Onboarding.tsx.
//   Dimensions: 390×844px (height FIXED — not min-height like Onboarding).
//   The fixed height ensures the main app doesn't grow beyond the device frame.
//   Contains: status bar + all screen content + absolute overlays.
// DARK shadow: 0 32px 80px rgba(0,0,0,0.72) + 1px white rim (0.06 opacity).
// LIGHT shadow: 0 24px 64px rgba(100,90,180,0.18) + 1px violet rim.
// ============================================================
function PhoneShell({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col overflow-hidden select-none"
      style={{
        width: 390, height: 844, borderRadius: 44,
        background: s(D.base, D.lBase, mode),
        boxShadow: mode === "dark"
          ? "0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.06)"
          : "0 24px 64px rgba(100,90,180,0.18), 0 0 0 1px rgba(120,110,200,0.12)",
        fontFamily: "Inter, ui-sans-serif, sans-serif",
        fontSize: 14,
        color: s(D.text, D.lText, mode),
      }}>
      {/* Static iOS-style status bar — decorative, not interactive */}
      <div className="flex items-center justify-between shrink-0 px-8 pt-4 pb-0" style={{ color: s(D.textSec, D.lTextSec, mode), fontSize: 12 }}>
        <span style={{ fontWeight: 600 }}>9:41</span>
        <div className="flex gap-1 items-center">
          <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5"/><rect x="9" y="2" width="3" height="9" rx="0.5"/><rect x="13.5" y="0" width="2.5" height="11" rx="0.5" opacity="0.4"/></svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 4c1.9-2.2 4.7-3.5 7-3.5S13.1 1.8 15 4" strokeLinecap="round"/><path d="M3.5 6.5c1.2-1.3 2.8-2 4.5-2s3.3.7 4.5 2" strokeLinecap="round"/><circle cx="8" cy="10" r="1" fill="currentColor" stroke="none"/></svg>
          <svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/><rect x="2" y="2" width="15" height="7" rx="1.5" fill="currentColor"/><path d="M21.5 3.5v4c.8-.4 1.3-1.2 1.3-2s-.5-1.6-1.3-2z" fill="currentColor" fillOpacity="0.4"/></svg>
        </div>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// COMPONENT: Card
// PURPOSE: Standard content card surface. Used across all tabs.
//   borderRadius: 16px. Padding: 14px 16px.
//   DARK shadow: 0 2px 12px rgba(0,0,0,0.25).
//   LIGHT shadow: 0 2px 12px rgba(100,90,180,0.07).
//   INTERACTIVE: When onClick is provided, adds .btn-press (scale 0.97, 120ms)
//   and cursor: pointer. Otherwise non-interactive.
// ============================================================
function Card({ mode, children, style, onClick }: { mode: Mode; children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={onClick ? "btn-press" : ""}
      style={{
        background: s(D.raised, D.lCard, mode),
        border: `1px solid ${s(D.border, D.lBorder, mode)}`,
        borderRadius: 16, padding: "14px 16px",
        boxShadow: mode === "dark" ? "0 2px 12px rgba(0,0,0,0.25)" : "0 2px 12px rgba(100,90,180,0.07)",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}>
      {children}
    </div>
  );
}

// ============================================================
// COMPONENT: SectionLabel
// PURPOSE: Uppercase sub-section heading (11px, 700 weight, 0.08em tracking).
//   Provides visual separation between content groups within a tab.
//   marginBottom: 8px (always consistent).
// ============================================================
function SectionLabel({ label, mode }: { label: string; mode: Mode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: s(D.textSec, D.lTextSec, mode), marginBottom: 8 }}>
      {label}
    </div>
  );
}

// ============================================================
// COMPONENT: LockBadge
// PURPOSE: Visual lock indicator for premium-gated features.
//   C8 RULE: Only used for:
//     - Advanced insight correlations (Sleep↔Pain, Activity patterns)
//     - History depth gate (beyond 30 days)
//     - Photo compare feature
//     - Multiple recovery profiles
//   C8 RULE: NOT shown on:
//     - Check-in flow
//     - Quick capture field
//     - Timeline, journal
//     - Basic charts (pain trend, week comparison, mini sparklines)
//     - Medications
//     - Appointments
//     - Doctor report
//   SIZE: Default 18px circle. Customizable via size prop.
//   APPEARANCE: rgba(92,88,120,0.55) bg, blur(4px), white SVG padlock.
// ============================================================
function LockBadge({ size = 18 }: { size?: number }) {
  return (
    <div className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, background: "rgba(92,88,120,0.55)", backdropFilter: "blur(4px)" }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="1.8">
        <rect x="2" y="5.5" width="8" height="5.5" rx="1.2"/>
        <path d="M4 5.5V4a2 2 0 014 0v1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

// ============================================================
// COMPONENT: LockedCard
// PURPOSE: Overlay wrapper for premium-locked content.
//   C8: Only used for advanced insight cards (not basic charts, doctor report, etc.)
//
// VISUAL EFFECT:
//   Container: filter: saturate(0.55) opacity(0.75) — desaturates underlying content.
//   Overlay: absolute inset-0, rgba(21,20,31,0.55) bg + blur(2px).
//   Center: LockBadge (28px) + hook text (11px semibold, max-width 140px).
//
// INTERACTION:
//   BUTTON: Entire card tappable via onClick on wrapper.
//   ACTION: onUnlock() → setShowPaywall(true) in MainApp → PaywallSheet opens.
//   PRESS FEEDBACK: .btn-press (scale 0.97, 120ms).
//   hook: Short persuasive sentence shown over the blur (e.g. "See how sleep affects your pain").
// ============================================================
function LockedCard({ mode, children, onUnlock, hook }: { mode: Mode; children: React.ReactNode; onUnlock: () => void; hook: string }) {
  return (
    <div onClick={onUnlock} className="btn-press relative overflow-hidden rounded-2xl cursor-pointer"
      style={{ border: `1px solid ${s(D.border, D.lBorder, mode)}`, filter: "saturate(0.55) opacity(0.75)" }}>
      {children}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl"
        style={{ background: "rgba(21,20,31,0.55)", backdropFilter: "blur(2px)" }}>
        <LockBadge size={28} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600, textAlign: "center", maxWidth: 140, lineHeight: 1.3 }}>{hook}</span>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: Toast
// PURPOSE: Non-blocking confirmation notification.
//   Appears at top of phone shell after quick-capture save.
//
// POSITION: absolute, top 52px (below status bar), centered via translateX(-50%).
//   zIndex 60 — above all other overlays.
//   pointerEvents: none — does not block touch events beneath it.
//
// ANIMATION:
//   APPEAR: opacity 0→1 — transition: 250ms ease-out (on visible = true).
//   DISMISS: opacity 1→0 — same transition (on visible = false).
//   AUTO-DISMISS: setTimeout 2400ms in HomeScreen sets visible → false.
//
// CONTENT: Green checkmark SVG + white message text.
// ============================================================
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className="absolute flex items-center gap-2 px-4 rounded-full"
      style={{
        top: 52, left: "50%", transform: "translateX(-50%)", height: 36, zIndex: 60,
        background: s(D.card, "#333", "dark"),
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        opacity: visible ? 1 : 0,
        transition: "opacity 250ms ease-out",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={D.mood} strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 7-7"/></svg>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{message}</span>
    </div>
  );
}

// ============================================================
// COMPONENT: PaywallSheet
// PURPOSE: Premium upgrade bottom sheet. Dismissible, no fake urgency (C8).
//   Shown over a semi-transparent backdrop. Content sheet slides up.
//   Triggered from: LockedCard taps (Progress), Profile upgrade row, Home insight card.
//
// OVERLAY STRUCTURE:
//   Backdrop: absolute inset-0, rgba(0,0,0,0.55), blur(4px), zIndex 50.
//   INTERACTION: Tap backdrop → onClose() (dismiss without upgrading).
//   Content sheet: rounded-t-3xl, stops propagation of taps.
//   ANIMATION: .animate-fade-up — fadeUp 350ms ease-out on mount.
//
// PLAN TOGGLE:
//   Local state: plan = "annual" | "monthly" (default: "annual").
//   SELECTED CARD: gradient accent bg, accent border, accentL text.
//   UNSELECTED CARD: card bg, border.
//   TRANSITION: all 150ms on tap.
//   Annual card shows "SAVE 40%" badge (mood/green color).
//
// CLOSE BUTTON (×): 32px circle, top-right of content header. → onClose().
//
// BUTTONS:
//   "Start free trial":
//     ACTION: onClose() in this prototype (no payment processor wired).
//     VISUAL: Gradient accent, 52px height.
//   Backdrop tap: → onClose().
//   "Restore purchases · Terms · Privacy": → onClose() (prototype stub).
//
// C8 NOTE: "Dismiss to keep using free." copy — never a countdown or dark pattern.
// ============================================================
function PaywallSheet({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const [plan, setPlan] = useState<"annual" | "monthly">("annual");
  return (
    // BACKDROP: semi-transparent. Tap to dismiss (onClose).
    <div className="absolute inset-0 flex flex-col justify-end" style={{ zIndex: 50, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      {/* CONTENT SHEET: Stops propagation so tapping sheet doesn't close.
          ANIMATION: animate-fade-up — fadeUp 350ms ease-out on mount. */}
      <div onClick={e => e.stopPropagation()} className="animate-fade-up rounded-t-3xl flex flex-col"
        style={{ background: s(D.raised, D.lCard, mode), padding: "20px 20px 32px" }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            {/* Premium badge */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `linear-gradient(135deg,${D.accentD},${D.accent}66)`, border: `1px solid ${D.accent}55` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: D.accentL, letterSpacing: "0.08em" }}>✦ PREMIUM</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: s(D.text, D.lText, mode), marginTop: 4 }}>14 days free, then cancel anytime</div>
            {/* C8: explicit "no charge" + easy dismiss copy */}
            <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode) }}>No charge today. Dismiss to keep using free.</div>
          </div>
          {/* BUTTON: Close (×) → onClose() */}
          <button onClick={onClose} className="btn-press flex items-center justify-center rounded-full shrink-0"
            style={{ width: 32, height: 32, background: s(D.border, D.lBorder, mode), border: "none", cursor: "pointer", color: s(D.textSec, D.lTextSec, mode), fontSize: 16, marginLeft: 8 }}>✕</button>
        </div>

        {/* PLAN TOGGLE: annual/monthly selector.
            INTERACTION: Tap → setPlan(p) → selected card updates (all 150ms). */}
        <div className="flex gap-3 mb-4">
          {(["annual","monthly"] as const).map(p => {
            const sel = plan === p;
            return (
              <button key={p} onClick={() => setPlan(p)} className="btn-press flex-1 rounded-xl p-3 text-left"
                style={{ background: sel ? `linear-gradient(135deg,${D.accentD},${D.accent}44)` : s(D.card, D.lBase, mode), border: `1.5px solid ${sel ? D.accent : s(D.border, D.lBorder, mode)}`, cursor: "pointer" }}>
                {p === "annual" && <div style={{ fontSize: 9, fontWeight: 700, color: D.mood, letterSpacing: "0.06em", marginBottom: 2 }}>SAVE 40%</div>}
                <div style={{ fontSize: 13, fontWeight: 600, color: sel ? D.accentL : s(D.text, D.lText, mode) }}>{p === "annual" ? "Annual" : "Monthly"}</div>
                <div style={{ fontSize: 11, color: s(D.textSec, D.lTextSec, mode) }}>{p === "annual" ? "$4.99/mo · $59.99/yr" : "$8.99/mo"}</div>
              </button>
            );
          })}
        </div>

        {/* Premium feature list — non-interactive display rows */}
        <div className="flex flex-col gap-2 mb-4">
          {([[D.meds,"🔬","Advanced insights & correlations"],[D.sleep,"📜","Full history beyond 30 days"],[D.energy,"📷","Photo progress compare"],[D.mood,"♾️","Multiple recovery profiles"]] as [string,string,string][]).map(([color,icon,label]) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 26, height: 26, background: `${color}22` }}><span style={{ fontSize: 13 }}>{icon}</span></div>
              <span style={{ fontSize: 13, color: s(D.text, D.lText, mode) }}>{label}</span>
              <svg className="ml-auto shrink-0" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round"><path d="M2 6.5l3 3 6-6"/></svg>
            </div>
          ))}
        </div>

        {/* BUTTON: "Start free trial" → onClose() (prototype — no payment) */}
        <button onClick={onClose} className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
          style={{ height: 52, background: `linear-gradient(135deg,${theme(mode).color.cta.from},${theme(mode).color.cta.to})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 15, boxShadow: `0 4px 20px ${D.accent}44` }}>
          Start free trial
        </button>
        <div className="text-center mt-2">
          {/* Legal text — prototype stub */}
          <button onClick={onClose} style={{ fontSize: 11, color: s(D.textMut, D.lTextMut, mode), background: "none", border: "none", cursor: "pointer" }}>
            Restore purchases · Terms · Privacy
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: ShareCardScreen
// PURPOSE: C7 — Full-screen share card preview.
//   Triggered only when user explicitly taps "Share" on a milestone entry
//   in the Timeline. Never auto-prompted.
//   zIndex 45 — above check-in (40), below paywall (50).
//
// UI STRUCTURE:
//   Header: back button (← Back) + "Share milestone" title + spacer.
//   Center: Share card (280×496px, story ratio ≈ 9:16).
//   Footer: "Share" button (52px gradient) + privacy disclaimer text.
//
// SHARE CARD VISUAL (280×496px):
//   Background: linear-gradient(155deg, accentD, #0D0C16, accentD88).
//   Border: 1px accent44.
//   Border-radius: 24px (rounded-3xl).
//   Content: brandmark (top) + 🎉 emoji + milestone title + day pill + date.
//   Footer quote: "This app remembers my recovery so I don't have to."
//   ANIMATION: animate-fade-up — fadeUp 350ms ease-out on mount.
//
// BUTTONS:
//   "← Back":
//     BUTTON: text + chevron left icon.
//     ACTION: onClose() → setShareCard(null) in MainApp → screen unmounts.
//   "Share":
//     BUTTON: Gradient, 52px. Prototype — no native share API wired.
//     ACTION: Stub (no-op in this prototype).
//   Privacy note: "Share is always your choice — we never prompt automatically."
//     Non-interactive text (C7 principle).
// ============================================================
function ShareCardScreen({ mode, milestone, onClose }: { mode: Mode; milestone: { title: string; day: number; date: string }; onClose: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ zIndex: 45, background: s(D.base, D.lBase, mode) }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
        {/* BUTTON: "← Back" → onClose() → ShareCardScreen unmounts */}
        <button onClick={onClose} className="btn-press flex items-center gap-2" style={{ background: "none", border: "none", cursor: "pointer", color: s(D.textSec, D.lTextSec, mode) }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5L7 10l5 5"/></svg>
          <span style={{ fontSize: 14 }}>Back</span>
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, color: s(D.text, D.lText, mode) }}>Share milestone</div>
        {/* Spacer for centered title layout */}
        <div style={{ width: 60 }} />
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        {/* SHARE CARD: 280×496px, story ratio 9:16 approximated.
            ANIMATION: animate-fade-up — fadeUp 350ms ease-out on mount. */}
        <div className="animate-fade-up flex flex-col items-center justify-between rounded-3xl overflow-hidden"
          style={{ width: 280, height: 496, background: `linear-gradient(155deg,${D.accentD} 0%,#0D0C16 60%,${D.accentD}88 100%)`, border: `1px solid ${D.accent}44`, padding: "40px 28px 32px" }}>
          {/* Brandmark — subtle watermark at top */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: `${D.accentL}66`, textTransform: "uppercase" }}>Recovery Companion</div>
          {/* Center: milestone celebration content (dynamic from milestone prop) */}
          <div className="flex flex-col items-center text-center gap-3">
            <div style={{ fontSize: 48, lineHeight: 1 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{milestone.title}</div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full" style={{ background: `${D.accent}44`, border: `1px solid ${D.accent}66` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: D.accentL }}>Day {milestone.day}</span>
              </div>
              <span style={{ fontSize: 13, color: s(D.textSec, "rgba(255,255,255,0.5)", mode) }}>{milestone.date}</span>
            </div>
          </div>
          {/* Footer quote — fixed copy */}
          <div style={{ fontSize: 12, color: `${D.accentL}88`, textAlign: "center", fontStyle: "italic" }}>"This app remembers my recovery so I don't have to."</div>
        </div>
      </div>
      <div className="px-5 pb-8 flex flex-col gap-3 shrink-0">
        {/* BUTTON: "Share" — prototype stub (no native share API) */}
        <button className="btn-press w-full flex items-center justify-center gap-2 rounded-2xl font-semibold"
          style={{ height: 52, background: `linear-gradient(135deg,${theme(mode).color.cta.from},${theme(mode).color.cta.to})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 15, boxShadow: `0 4px 20px ${D.accent}44` }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M9 2v10M5 6l4-4 4 4M3 14h12"/></svg>
          Share
        </button>
        {/* C7: explicit opt-in copy — never auto-prompted */}
        <div style={{ fontSize: 11, color: s(D.textMut, D.lTextSec, mode), textAlign: "center" }}>Share is always your choice — we never prompt automatically.</div>
      </div>
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
// ============================================================
// SCREEN: HomeScreen
// TAB: "home"
// PURPOSE: Recovery dashboard — primary daily hub.
//   C2: Quick capture field prominently placed (zero friction journaling).
//   C3: No streak counter, no shame mechanics. Shows accumulation count.
//   C6: Weekly give-back card (dismissible, not evergreen).
//   C8: Doctor report is free forever — no lock badge.
//   C9: Doctor report and pre-appointment nudge are first-class, ≤2 taps away.
//
// CONTENT SECTIONS (top to bottom):
//   1. Header: greeting (or welcome-back), name, check-in counter, notification bell
//   2. Quick capture field (48px, C2)
//   3. Day counter card (gradient, large numeral)
//   4. Pre-appointment nudge (C9 — "Appointment in 2 days")
//   5. Today's actions (3 action rows, 52px each)
//   6. Weekly give-back card (C6 — conditional on weeklyDismissed state)
//   7. Doctor report row (C9, no lock)
//   8. Insight card (advanced — locked with LockedCard, C8)
//
// LOCAL STATE:
//   captureText: current text in quick-capture input.
//   toastVisible: boolean — drives Toast opacity transition.
//   weeklyDismissed: boolean — hides weekly card once dismissed.
//   actionsDone: string[] — tracks which today actions are completed.
//   toastTimer: useRef — setTimeout ref for auto-dismissing toast.
//
// TOAST SEQUENCE:
//   1. User types in quick capture + presses Enter (or taps ✓ icon).
//   2. handleCaptureSave(): clears captureText, sets toastVisible=true.
//   3. Toast appears: opacity 0→1, 250ms ease-out.
//   4. After 2400ms: toastVisible=false → opacity 1→0, 250ms.
//   NOTE: Timer is cleared and reset if user saves again before dismiss.
//
// ISWELCOMEBACK STATE:
//   When isWelcomeBack=true: greeting changes to "Good to see you again 🤗"
//   (C3 — warm return, no mention of missed days or streak broken).
// ============================================================
function HomeScreen({ mode, onCheckIn, onPaywall, isWelcomeBack = false }: { mode: Mode; onCheckIn: () => void; onPaywall: () => void; isWelcomeBack?: boolean }) {
  const [captureText, setCaptureText] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [weeklyDismissed, setWeeklyDismissed] = useState(false);
  const [actionsDone, setActionsDone] = useState<string[]>(["meds"]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // C3: accumulation counter (12 check-ins). Not a streak — no penalty for gaps.
  const checkInCount = 12;

  // INTERACTION SEQUENCE: Quick capture save.
  // 1. User types text + presses Enter or taps ✓ button.
  // 2. captureText cleared immediately.
  // 3. toastVisible → true → Toast fades in (250ms ease-out).
  // 4. Previous timer cleared to prevent early dismiss if user saves again.
  // 5. After 2400ms → toastVisible → false → Toast fades out (250ms).
  function handleCaptureSave() {
    if (!captureText.trim()) return;
    setCaptureText("");
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }

  const todayActions = [
    { id: "checkin",  label: "Daily check-in", icon: "📋", color: D.mood },
    { id: "meds",     label: "Morning meds",   icon: "💊", color: D.meds },
    { id: "exercise", label: "PT exercises",   icon: "🏋️", color: D.energy },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-y-auto" style={{ paddingBottom: 88 }}>
      {/* TOAST: Floats at top. Opacity transition 250ms ease-out. Auto-dismisses at 2400ms. */}
      <Toast message="Added to your timeline" visible={toastVisible} />

      {/* HEADER: Greeting + name + counter + notification bell */}
      <div className="flex items-start justify-between px-5 pt-3 pb-2 shrink-0">
        <div>
          {/* C3: welcome-back path — no recap of missed days */}
          {isWelcomeBack
            ? <div style={{ fontSize: 15, fontWeight: 600, color: s(D.text, D.lText, mode) }}>Good to see you again 🤗</div>
            : <div style={{ fontSize: 13, color: s(D.textSec, D.lTextSec, mode) }}>Good morning 👋</div>
          }
          <div style={{ fontSize: 20, fontWeight: 700, color: s(D.text, D.lText, mode), lineHeight: 1.2 }}>Alex</div>
        </div>
        <div className="flex items-center gap-2">
          {/* C3: check-in count, NOT a streak. Purple dot + "N check-ins" text. */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `${D.accent}22`, border: `1px solid ${D.accent}44` }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill={D.accent}><circle cx="6" cy="6" r="5"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: D.accentL }}>{checkInCount} check-ins</span>
          </div>
          {/* BUTTON: Notification bell (36px) — prototype stub, no action */}
          <button className="btn-press flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: s(D.raised, D.lCard, mode), border: `1px solid ${s(D.border, D.lBorder, mode)}`, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={s(D.textSec, D.lTextSec, mode)} strokeWidth="1.6"><path d="M9 2C6 2 3.5 4.5 3.5 7.5c0 3.5-1.5 4.5-1.5 4.5h14s-1.5-1-1.5-4.5C14.5 4.5 12 2 9 2z" strokeLinecap="round"/><path d="M7 13.5a2 2 0 004 0" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-2">
        {/* C2: QUICK CAPTURE FIELD (48px, full-width).
            PURPOSE: Zero-friction journaling. User can type a note and hit Enter
            or tap the ✓ button to save it to their timeline.
            INTERACTION: onChange → setCaptureText live.
            Enter key → handleCaptureSave().
            Mic icon button (right side):
              STATE: empty text → mic SVG (dark).
              STATE: has text → checkmark SVG (white on accent bg).
              TRANSITION: background 150ms on state change.
              BUTTON PRESS: handleCaptureSave() when captureText is truthy.
              No-op when empty. */}
        <div className="flex items-center gap-2 rounded-2xl px-3"
          style={{ height: 48, background: s(D.raised, D.lCard, mode), border: `1px solid ${s(D.border, D.lBorder, mode)}` }}>
          <input
            type="text" value={captureText} onChange={e => setCaptureText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCaptureSave()}
            placeholder="Note anything… ('knee hurt after stairs')"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: s(D.text, D.lText, mode), fontFamily: "inherit" }}
          />
          {/* Mic/confirm button — changes icon based on captureText presence */}
          <button className="btn-press flex items-center justify-center rounded-xl"
            style={{ width: 32, height: 32, background: captureText ? D.accent : s(D.border, D.lBorder, mode), border: "none", cursor: "pointer", transition: "background 150ms", flexShrink: 0 }}>
            {captureText
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 7l4 4 6-6"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={s(D.textSec, D.lTextSec, mode)} strokeWidth="1.6"><rect x="5" y="1" width="4" height="7" rx="2"/><path d="M2 7c0 3 2.5 5 5 5s5-2 5-5" strokeLinecap="round"/><path d="M7 13v-1"/></svg>
            }
          </button>
        </div>

        {/* DAY COUNTER CARD: Recovery headline card. Non-interactive display.
            Background: gradient from accentD to surface (mode-aware). */}
        {/* Day-N card gradient. Both stops come from pattern.dayCard, which is
            mode-paired. Light mode previously reused the DARK start (accentD, a
            deep indigo) behind near-black text — 1.58:1 at the top of the card.
            Light now mirrors dark rather than copying it: pale-to-white with
            dark text, where dark is deep-to-darker with light text. */}
        <Card mode={mode} style={{ background: `linear-gradient(135deg, ${theme(mode).pattern.dayCard.from} 0%, ${theme(mode).pattern.dayCard.to} 100%)` }}>
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: D.accentL, marginBottom: 2 }}>YOUR RECOVERY</div>
              <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, color: s(D.text, D.lText, mode) }}>Day 46</div>
              <div style={{ fontSize: 13, color: s(D.textSec, D.lTextSec, mode), marginTop: 2 }}>Knee rehab · Started Mar 27</div>
            </div>
            {/* "On track" percentage badge */}
            <div className="flex flex-col items-center justify-center rounded-2xl px-3 py-2" style={{ background: `${D.accent}33`, border: `1px solid ${D.accent}44` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: D.accentL }}>82%</div>
              <div style={{ fontSize: 9, color: s(D.textSec, D.lTextSec, mode) }}>on track</div>
            </div>
          </div>
          {/* Weekly comparison summary — mood/sleep colored inline */}
          <div className="mt-3 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${D.accent}33` }}>
            <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode), lineHeight: 1.5 }}>
              Compared to last week: <span style={{ color: D.mood }}>✅ Pain down</span> · <span style={{ color: D.sleep }}>✅ Walking improved</span>
            </div>
            {/* C3: Motivational copy, not a performance pressure statement */}
            <div style={{ fontSize: 12, color: s(D.textMut, D.lTextSec, mode), marginTop: 2, fontStyle: "italic" }}>"Recovery isn't always linear. Keep going."</div>
          </div>
        </Card>

        {/* C9: PRE-APPOINTMENT NUDGE — first-class prominence, no lock badge.
            BUTTON: "View" (32px, sleep color) → prototype stub (no action). */}
        <Card mode={mode} style={{ background: `${D.sleep}11`, borderColor: `${D.sleep}44` }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 38, height: 38, background: `${D.sleep}22` }}>
              <span style={{ fontSize: 18 }}>📋</span>
            </div>
            <div className="flex-1">
              <div style={{ fontSize: 13, fontWeight: 600, color: s(D.text, D.lText, mode) }}>Appointment in 2 days</div>
              <div style={{ fontSize: 11, color: s(D.textSec, D.lTextSec, mode) }}>Review your report for Dr. Chen?</div>
            </div>
            {/* BUTTON: "View" → prototype stub */}
            <button className="btn-press px-3 rounded-xl font-semibold"
              style={{ height: 32, background: D.sleep, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>
              View
            </button>
          </div>
        </Card>

        {/* TODAY'S ACTIONS: 3 rows (check-in, meds, PT exercises).
            Each row: 52px height, icon + label + completion circle.
            COMPLETION STATE:
              Done: border uses action color (55% opacity). Label has line-through.
              Check circle: action color bg, white checkmark SVG.
              TRANSITION: background 200ms on circle.
            INTERACTION per row:
              "checkin" row: onCheckIn() → opens CheckInModal (zIndex 40).
              Other rows: toggle done/not-done in actionsDone[].
              PRESS FEEDBACK: .btn-press (scale 0.97, 120ms). */}
        <div>
          <SectionLabel label="Today" mode={mode} />
          <div className="flex flex-col gap-2">
            {todayActions.map(a => {
              const done = actionsDone.includes(a.id);
              return (
                <button key={a.id}
                  onClick={() => a.id === "checkin" ? onCheckIn() : setActionsDone(d => done ? d.filter(x => x !== a.id) : [...d, a.id])}
                  className="btn-press flex items-center gap-3 rounded-xl px-3"
                  style={{ height: 52, background: s(D.raised, D.lCard, mode), border: `1px solid ${done ? a.color + "55" : s(D.border, D.lBorder, mode)}`, cursor: "pointer", width: "100%", textAlign: "left" }}>
                  <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: `${a.color}22` }}>
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: done ? s(D.textSec, D.lTextSec, mode) : s(D.text, D.lText, mode), textDecoration: done ? "line-through" : "none" }}>{a.label}</span>
                  {/* Completion circle: transitions from border-color → action color (200ms) */}
                  <div className="flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: done ? a.color : s(D.border, D.lBorder, mode), transition: "background 200ms" }}>
                    {done && <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 5.5l2.5 2.5 4.5-4.5"/></svg>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* C6: WEEKLY GIVE-BACK CARD — appears once a week, dismissible.
            CONDITION: Rendered only when weeklyDismissed === false.
            When dismissed: weeklyDismissed=true → card is removed from DOM.
            CONTENT: Weekly stats (2 positives, 1 neutral) + insight sentence
              + motivational copy.
            DISMISS BUTTON (×): top-right, → weeklyDismissed=true.
            BUTTONS:
              "Save to timeline" → prototype stub (no nav).
              "Dismiss" → weeklyDismissed=true → card removed. */}
        {!weeklyDismissed && (
          <Card mode={mode} style={{ background: `${D.mood}0E`, borderColor: `${D.mood}44` }}>
            <div className="flex items-start justify-between mb-2">
              <div style={{ fontSize: 13, fontWeight: 700, color: s(D.text, D.lText, mode) }}>Your week 🌱</div>
              {/* BUTTON: dismiss (×) → weeklyDismissed=true → card unmounts */}
              <button onClick={() => setWeeklyDismissed(true)} className="btn-press"
                style={{ background: "none", border: "none", cursor: "pointer", color: s(D.textMut, D.lTextSec, mode), fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
            </div>
            {/* Weekly stats rows — 2 positive (✅) + 1 neutral (–) */}
            <div className="flex flex-col gap-1 mb-3">
              <div style={{ fontSize: 13, color: s(D.text, D.lText, mode) }}>✅ Pain down from 4.2 to 2.8 avg</div>
              <div style={{ fontSize: 13, color: s(D.text, D.lText, mode) }}>✅ 5 out of 7 check-ins logged</div>
              <div style={{ fontSize: 13, color: s(D.textSec, D.lTextSec, mode) }}>– Sleep stayed around 6.5h</div>
            </div>
            {/* Personalized insight (stairs example) */}
            <div className="rounded-xl px-3 py-2 mb-3" style={{ background: `${D.mood}1A` }}>
              <div style={{ fontSize: 13, color: s(D.text, D.lText, mode), lineHeight: 1.5 }}>
                You mentioned stairs twice this week — and Friday they felt easier.
              </div>
            </div>
            {/* Motivational closer — C3 compliment, not pressure */}
            <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode), marginBottom: 10 }}>
              Showing up for yourself is the work. 🙌
            </div>
            <div className="flex gap-2">
              {/* BUTTON: "Save to timeline" → prototype stub */}
              <button className="btn-press flex-1 flex items-center justify-center rounded-xl font-medium"
                style={{ height: 36, background: D.mood, color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>
                Save to timeline
              </button>
              {/* BUTTON: "Dismiss" → weeklyDismissed=true */}
              <button onClick={() => setWeeklyDismissed(true)} className="btn-press flex-1 flex items-center justify-center rounded-xl font-medium"
                style={{ height: 36, background: s(D.border, D.lBorder, mode), color: s(D.textSec, D.lTextSec, mode), border: "none", cursor: "pointer", fontSize: 13 }}>
                Dismiss
              </button>
            </div>
          </Card>
        )}

        {/* C9 + C8: DOCTOR REPORT — first-class, NO lock badge (free forever).
            BUTTON: Entire Card with onClick → prototype stub.
            VISUAL: 🩻 icon + "Generate doctor report" title + date range.
            Chevron right indicator. */}
        <div>
          <SectionLabel label="Reports" mode={mode} />
          <Card mode={mode} onClick={() => {}} style={{ cursor: "pointer" }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: `${D.meds}22` }}>
                <span style={{ fontSize: 20 }}>🩻</span>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 600, color: s(D.text, D.lText, mode) }}>Generate doctor report</div>
                <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode) }}>Day 1–46 · Ready to preview</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={s(D.textMut, D.lTextSec, mode)} strokeWidth="1.5" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
            </div>
          </Card>
        </div>

        {/* C8: INSIGHTS — only advanced correlations are locked.
            INTERACTION: LockedCard tap → onPaywall() → PaywallSheet opens (zIndex 50). */}
        <div>
          <SectionLabel label="Insights" mode={mode} />
          <LockedCard mode={mode} onUnlock={onPaywall} hook="See how sleep affects your pain">
            <Card mode={mode}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s(D.text, D.lText, mode), marginBottom: 4 }}>Sleep ↔ Pain correlation</div>
              <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode) }}>Poor sleep (≤6h) correlates with 2× higher next-day pain.</div>
            </Card>
          </LockedCard>
        </div>
      </div>
    </div>
  );
}

// ─── TIMELINE SCREEN ──────────────────────────────────────────────────────────
// ============================================================
// SCREEN: TimelineScreen
// TAB: "timeline"
// PURPOSE: Chronological feed of all recovery events.
//   C3: Neutral gap treatment — rest days shown as soft dots, not red/alarming.
//   C7: "Share" button on milestone entries only (user-initiated, never auto).
//
// FILTER CHIPS: 6 options ("All" through "Notes").
//   Horizontal scroll, scrollbar hidden.
//   SELECTED: accent bg, white text, accent border.
//   UNSELECTED: raised/lCard bg, secondary text, border.
//   TRANSITION: all 150ms.
//   BEHAVIOR: setFilter(chip) → entries re-filtered immediately (no animation).
//
// ENTRY TYPES (affects visual treatment):
//   "checkin":   mood color. Standard entry card.
//   "milestone": category color border on card. Bold colored title. "Share" button.
//   "photo":     sleep color.
//   "medication":meds color.
//   "rest":      SPECIAL: no card — just a muted dot + "Rest day" italic text.
//                C3: opacity 0.45. Never red. Never "missed".
//   "appt":      sleep color.
//   "note":      energy color.
//
// TIMELINE VISUAL STRUCTURE (per entry):
//   Left: 32×32px icon circle + vertical connector line.
//   Right: card (62px approx) with title + body text.
//   Connector line: 1px, border color, minHeight 12px, grows to fill gap.
//   Last entry: no connector line.
//
// ENTRY ANIMATION:
//   Each non-rest entry: .animate-fade-up, animationDelay = i × 35ms.
//   Rest entries: not animated (intentionally muted).
//
// C7 SHARE INTERACTION:
//   BUTTON: "Share" text (12px, top-right of milestone card, no icon).
//   ACTION: onShareMilestone({ title, day: 46, date }) → MainApp setShareCard →
//     ShareCardScreen mounts (zIndex 45).
//   Only appears on entries with type === "milestone".
//
// FAB: "+" floating action button, bottom-right.
//   POSITION: absolute, bottom 100px (above tab bar), right 20px, zIndex 10.
//   SIZE: 52×52px circle. Gradient accent. Shadow: 0 4px 20px accent55.
//   ACTION: Prototype stub (no action wired).
// ============================================================
const TIMELINE_ENTRIES = [
  { date: "Today",  type: "checkin",   icon: "📋", color: D.mood,  title: "Check-in",                body: "Pain: 3/10 · Mood: good · Sleep: 7h" },
  { date: "Today",  type: "milestone", icon: "🎉", color: D.meds,  title: "Walked without crutches!", body: "First time since surgery — 50m without support" },
  { date: "Jun 15", type: "photo",     icon: "📷", color: D.sleep, title: "Progress photo",           body: "Swelling comparison — Day 40 vs Day 46" },
  { date: "Jun 14", type: "medication",icon: "💊", color: D.meds,  title: "Naproxen — taken",         body: "500mg · 8:00 AM" },
  { date: "Jun 14", type: "checkin",   icon: "📋", color: D.mood,  title: "Check-in",                body: "Pain: 4/10 · Mood: okay · Sleep: 5.5h" },
  { date: "Jun 13", type: "rest",      icon: "•",  color: "",      title: "Rest day",                 body: "" }, // C3 — neutral rest, not "missed"
  { date: "Jun 12", type: "appt",      icon: "🏥", color: D.sleep, title: "Dr. Chen — Follow-up",    body: "Cleared for light cycling ✅" },
  { date: "Jun 10", type: "note",      icon: "📝", color: D.energy,title: "Journal entry",            body: "Feeling frustrated today. Tried to walk to the mailbox and had to stop." },
  { date: "Jun 8",  type: "milestone", icon: "🎯", color: D.meds,  title: "Milestone: Bend to 90°",  body: "Full ROM target reached — physio confirmed" },
  { date: "Jun 5",  type: "checkin",   icon: "📋", color: D.mood,  title: "Check-in",                body: "Pain: 6/10 · Mood: low · Sleep: 4h" },
];
const FILTER_CHIPS = ["All","Check-ins","Milestones","Meds","Photos","Notes"];

function TimelineScreen({ mode, onShareMilestone }: { mode: Mode; onShareMilestone: (m: { title: string; day: number; date: string }) => void }) {
  const [filter, setFilter] = useState("All");
  const entries = filter === "All" ? TIMELINE_ENTRIES : TIMELINE_ENTRIES.filter(e => {
    if (filter === "Check-ins")  return e.type === "checkin";
    if (filter === "Milestones") return e.type === "milestone";
    if (filter === "Meds")       return e.type === "medication";
    if (filter === "Photos")     return e.type === "photo";
    if (filter === "Notes")      return e.type === "note";
    return true;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-5 pt-3 pb-1 shrink-0">
        <div style={{ fontSize: 20, fontWeight: 700, color: s(D.text, D.lText, mode) }}>Timeline</div>
      </div>
      {/* FILTER CHIPS: horizontal scroll row.
          INTERACTION: Tap chip → setFilter(chip) → entries update immediately.
          TRANSITION: all 150ms (background, color, border). */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
        {FILTER_CHIPS.map(chip => {
          const sel = filter === chip;
          return (
            <button key={chip} onClick={() => setFilter(chip)} className="btn-press whitespace-nowrap px-3 rounded-xl text-sm font-medium shrink-0"
              style={{ height: 30, background: sel ? D.accent : s(D.raised, D.lCard, mode), color: sel ? "#fff" : s(D.textSec, D.lTextSec, mode), border: `1px solid ${sel ? D.accent : s(D.border, D.lBorder, mode)}`, cursor: "pointer", transition: "all 150ms" }}>
              {chip}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: 88 }}>
        {entries.map((entry, i) => {
          // Show date label when entry is first OR when date changes from previous entry
          const showDate = i === 0 || entries[i - 1].date !== entry.date;
          // C3: rest entries get a distinct (muted) visual treatment
          const isRest = entry.type === "rest";
          return (
            <div key={i}>
              {showDate && (
                // DATE HEADER: uppercase 11px, only shown on first entry of each date group
                <div style={{ fontSize: 11, fontWeight: 700, color: s(D.textSec, D.lTextSec, mode), letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8, marginTop: i > 0 ? 14 : 0 }}>{entry.date}</div>
              )}
              {isRest
                ? (
                  // C3: REST DAY — soft muted dot, no card, opacity 0.45, never alarming
                  <div className="flex gap-3 mb-3">
                    <div className="flex flex-col items-center" style={{ width: 32, flexShrink: 0 }}>
                      <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: s(D.border, D.lBorder, mode) }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: s(D.textMut, D.lTextMut, mode) }} />
                      </div>
                      {i < entries.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 12, background: s(D.border, D.lBorder, mode), marginTop: 4 }} />}
                    </div>
                    <div className="flex items-center flex-1" style={{ opacity: 0.45, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode), fontStyle: "italic" }}>Rest day</span>
                    </div>
                  </div>
                ) : (
                  // STANDARD ENTRY: icon circle + card. Connector line between entries.
                  // ANIMATION: animate-fade-up, delay = i × 35ms (stagger based on index).
                  <div className="flex gap-3 mb-3 animate-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                    <div className="flex flex-col items-center" style={{ width: 32, flexShrink: 0 }}>
                      {/* Icon circle: 22% opacity bg of category color */}
                      <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, background: `${entry.color}22`, border: `1px solid ${entry.color}55` }}>
                        <span style={{ fontSize: 14 }}>{entry.icon}</span>
                      </div>
                      {/* Connector line: hidden on last entry */}
                      {i < entries.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 12, background: s(D.border, D.lBorder, mode), marginTop: 4 }} />}
                    </div>
                    {/* Entry card: milestone gets category-colored border */}
                    <div className="flex-1 rounded-2xl p-3 mb-1" style={{ background: s(D.raised, D.lCard, mode), border: `1px solid ${entry.type === "milestone" ? entry.color + "55" : s(D.border, D.lBorder, mode)}` }}>
                      <div className="flex items-start justify-between">
                        {/* Title: milestone = category color, others = primary text */}
                        <div style={{ fontSize: 14, fontWeight: 600, color: entry.type === "milestone" ? entry.color : s(D.text, D.lText, mode), flex: 1 }}>{entry.title}</div>
                        {/* C7: SHARE BUTTON — milestone only, user-initiated.
                            BUTTON: "Share" text (12px).
                            ACTION: onShareMilestone() → MainApp setShareCard → ShareCardScreen mounts. */}
                        {entry.type === "milestone" && (
                          <button onClick={() => onShareMilestone({ title: entry.title, day: 46, date: entry.date })}
                            className="btn-press ml-2 shrink-0" style={{ background: "none", border: "none", cursor: "pointer", color: s(D.textMut, D.lTextSec, mode), fontSize: 12, padding: 0 }}>
                            Share
                          </button>
                        )}
                      </div>
                      {entry.body && <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode), marginTop: 2, lineHeight: 1.4 }}>{entry.body}</div>}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>
      {/* FAB: "+" button — add new entry.
          POSITION: absolute bottom-right, zIndex 10.
          BUTTON: 52×52px gradient circle. ACTION: Prototype stub (no wired action). */}
      <div className="absolute" style={{ bottom: 100, right: 20, zIndex: 10 }}>
        <button className="btn-press flex items-center justify-center rounded-full"
          style={{ width: 52, height: 52, background: `linear-gradient(135deg,${theme(mode).color.cta.from},${theme(mode).color.cta.to})`, border: "none", cursor: "pointer", boxShadow: `0 4px 20px ${D.accent}55` }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4v14M4 11h14"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── CHECK-IN MODAL ───────────────────────────────────────────────────────────
// ============================================================
// COMPONENT: CheckInModal
// TRIGGER: "Log" tab tap in TabBar OR "Daily check-in" row tap in HomeScreen.
// PURPOSE: C1 — Fast-path check-in. One tap = done. Zero guilt.
//   Position: absolute inset-0, zIndex 40 — covers all screen content.
//   Two internal phases: "form" → "done" (one-way transition).
//
// PHASE: "form"
//   ENTRY ANIMATION: .animate-fade-in — opacity 0→1, 300ms ease-out on mount.
//   CONTENT:
//     - Modal handle (36×4px centered pill)
//     - Header: "How's today?" + close (×) button
//     - C1 FAST-PATH: 3 large buttons (100px height each):
//         📈 Better / ➡️ Same / 📉 Worse
//     - Fast-path note: "One tap logs your check-in. Done in <10 seconds."
//     - "Add detail" collapsible toggle (chevron rotates 200ms ease-out)
//     - Detail panel (conditional on detailOpen state, animate-fade-up)
//
// C1 FAST-PATH INTERACTION SEQUENCE:
//   1. User taps one of the 3 large buttons.
//   2. handleFastTap(i): setFastChoice(i) → selected button highlights (150ms).
//   3. setTimeout 500ms delay.
//   4. After 500ms: setStep("done") → modal transitions to done state.
//
// FAST-PATH BUTTON STATES:
//   DEFAULT: raised/lCard bg, 2px border/lBorder.
//   SELECTED: 44% opacity category color bg, 2px category color border.
//   TRANSITION: all 150ms.
//   Icons: icon = emoji + word label + desc text. NEVER color alone (C8 / accessibility).
//
// DETAIL PANEL (collapsible):
//   TRIGGER: "Add detail" row tap → toggles detailOpen boolean.
//   CHEVRON: rotates 0° → 180° on open (transition: transform 200ms ease-out).
//   CONTENT (animate-fade-up on open):
//     - Pain slider (0–10, PAIN_COLORS array, range input, identical to onboarding)
//     - Energy / Sleep quality / Mobility: 3-option Low/Med/High buttons
//     - Medications taken: toggle switch (50×28px pill)
//     - Quick note: text input (44px)
//     - "Log detailed check-in" button (50px gradient)
//
// TOGGLE SWITCH (medications):
//   APPEARANCE: 50×28px pill.
//   OFF: border/lBorder bg, thumb at left.
//   ON: accent bg, thumb at right.
//   TRANSITION: background 200ms, thumb position via justifyContent flex change.
//
// PHASE: "done"
//   ENTRY: After handleFastTap 500ms delay OR "Log detailed check-in" button.
//   ENTRY ANIMATION: .animate-fade-in — opacity 0→1, 300ms ease-out.
//   CONTENT:
//     - Checkmark circle (80×80px, gradient accent, large SVG checkmark)
//       ANIMATION: animate-fade-up, no delay.
//     - "Logged ✓" + date text: animate-fade-up, delay 80ms.
//     - "Back to home" button: animate-fade-up, delay 160ms.
//   BUTTON: "Back to home" → onClose() → CheckInModal unmounts.
//
// CLOSE BUTTON (×):
//   BUTTON: 30×30px circle, form-phase header.
//   ACTION: onClose() → setShowCheckIn(false) in MainApp → modal unmounts.
// ============================================================
function CheckInModal({ mode, onClose }: { mode: Mode; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "done">("form");
  const [detailOpen, setDetailOpen] = useState(false);
  const [fastChoice, setFastChoice] = useState<number | null>(null);
  const [pain, setPain] = useState(3);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [mobility, setMobility] = useState<number | null>(null);
  const [meds, setMeds] = useState(true);
  const [note, setNote] = useState("");

  const PAIN_COLORS = ["#A8D9B8","#A8D9B8","#B8DDA8","#D9DA8A","#F5D08A","#F5C070","#F5A860","#F2A09E","#F2806E","#E05548","#CC2222"];
  const LEVELS = [{ icon: "⬇️", label: "Low" }, { icon: "➡️", label: "Med" }, { icon: "⬆️", label: "High" }];

  // C1: Icon + word label for each fast-path option. NEVER color-only (accessibility).
  const FAST_OPTIONS = [
    { icon: "📈", word: "Better",  desc: "Improving", color: D.mood },
    { icon: "➡️", word: "Same",    desc: "Stable",    color: D.sleep },
    { icon: "📉", word: "Worse",   desc: "Harder day", color: D.pain },
  ];

  // C1 FAST-PATH HANDLER:
  // STEP 1: setFastChoice(i) → button highlights (150ms transition).
  // STEP 2: setTimeout 500ms → setStep("done") → done state renders.
  function handleFastTap(i: number) {
    setFastChoice(i);
    setTimeout(() => setStep("done"), 500);
  }

  // ── Done phase ────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      // ANIMATION: animate-fade-in — full screen, opacity 0→1, 300ms ease-out
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 animate-fade-in" style={{ background: s(D.base, D.lBase, mode), zIndex: 40 }}>
        {/* ANIMATION: animate-fade-up — checkmark circle, no delay */}
        <div className="animate-fade-up flex items-center justify-center rounded-full" style={{ width: 80, height: 80, background: `linear-gradient(135deg,${D.accentD},${D.accent})`, boxShadow: `0 8px 32px ${D.accent}55` }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M6 20l8 8L34 8" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {/* ANIMATION: animate-fade-up, delay 80ms */}
        <div className="animate-fade-up text-center" style={{ animationDelay: "80ms" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: s(D.text, D.lText, mode) }}>Logged ✓</div>
          <div style={{ fontSize: 14, color: s(D.textSec, D.lTextSec, mode), marginTop: 4 }}>Day 46 · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
        </div>
        {/* ANIMATION: animate-fade-up, delay 160ms
            BUTTON: "Back to home" → onClose() → modal unmounts */}
        <button onClick={onClose} className="btn-press animate-fade-up px-8 rounded-2xl font-semibold"
          style={{ animationDelay: "160ms", height: 50, background: `linear-gradient(135deg,${theme(mode).color.cta.from},${theme(mode).color.cta.to})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 15, boxShadow: `0 4px 20px ${D.accent}44` }}>
          Back to home
        </button>
      </div>
    );
  }

  // ── Form phase ────────────────────────────────────────────────────────────
  return (
    // ANIMATION: animate-fade-in — modal entry, 300ms ease-out
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ zIndex: 40, background: s(D.base, D.lBase, mode) }}>
      {/* Drag handle — decorative, not functional */}
      <div className="flex justify-center pt-3 pb-0 shrink-0">
        <div style={{ width: 36, height: 4, borderRadius: 2, background: s(D.border, D.lBorder, mode) }} />
      </div>
      <div className="flex items-center justify-between px-5 pt-2 pb-2 shrink-0">
        <div style={{ fontSize: 18, fontWeight: 700, color: s(D.text, D.lText, mode) }}>How's today?</div>
        {/* BUTTON: Close (×) → onClose() → modal unmounts. PRESS: .btn-press 120ms. */}
        <button onClick={onClose} className="btn-press flex items-center justify-center rounded-full"
          style={{ width: 30, height: 30, background: s(D.raised, D.lCard, mode), border: `1px solid ${s(D.border, D.lBorder, mode)}`, cursor: "pointer", color: s(D.textSec, D.lTextSec, mode), fontSize: 14 }}>✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
        {/* C1 FAST PATH: 3 large buttons (100px height).
            Placed in thumb-zone for one-handed use. */}
        <div className="flex gap-3">
          {FAST_OPTIONS.map((opt, i) => {
            const sel = fastChoice === i;
            return (
              // INTERACTION: Tap → handleFastTap(i).
              // SEQUENCE: highlight (150ms) → 500ms delay → step="done".
              <button key={i} onClick={() => handleFastTap(i)}
                className="btn-press flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl"
                style={{
                  height: 100,
                  background: sel ? `${opt.color}44` : s(D.raised, D.lCard, mode),
                  border: `2px solid ${sel ? opt.color : s(D.border, D.lBorder, mode)}`,
                  cursor: "pointer", transition: "all 150ms",
                }}>
                <span style={{ fontSize: 30, lineHeight: 1 }}>{opt.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: sel ? opt.color : s(D.text, D.lText, mode) }}>{opt.word}</span>
                <span style={{ fontSize: 10, color: s(D.textSec, D.lTextSec, mode) }}>{opt.desc}</span>
              </button>
            );
          })}
        </div>

        {/* C1: Hint text — communicates speed of fast-path */}
        <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode), textAlign: "center" }}>
          One tap logs your check-in. Done in &lt;10 seconds.
        </div>

        {/* "Add detail" COLLAPSIBLE TOGGLE (44px row).
            CHEVRON: rotate(0) → rotate(180deg) on detailOpen=true.
            TRANSITION: transform 200ms ease-out.
            INTERACTION: tap → setDetailOpen(o => !o). */}
        <button onClick={() => setDetailOpen(o => !o)} className="btn-press flex items-center justify-between w-full rounded-xl px-4"
          style={{ height: 44, background: s(D.raised, D.lCard, mode), border: `1px solid ${s(D.border, D.lBorder, mode)}`, cursor: "pointer" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode) }}>Add detail</span>
          {/* CHEVRON: 0° closed, 180° open. TRANSITION: transform 200ms ease-out. */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={s(D.textSec, D.lTextSec, mode)} strokeWidth="1.8" strokeLinecap="round"
            style={{ transform: detailOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}>
            <path d="M4 6l4 4 4-4"/>
          </svg>
        </button>

        {/* DETAIL PANEL: Conditionally rendered when detailOpen=true.
            ANIMATION: animate-fade-up — fadeUp 350ms ease-out on mount. */}
        {detailOpen && (
          <div className="flex flex-col gap-4 animate-fade-up">
            {/* PAIN SLIDER: identical to onboarding PainScreen.
                Track gradient updates with pain value in real time.
                TRANSITION: background 200ms. Thumb: scale 1.15 on active (120ms). */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode) }}>Pain level</span>
                {/* Pain numeral: PAIN_COLORS[pain] — color changes with value */}
                <span style={{ fontSize: 22, fontWeight: 700, color: PAIN_COLORS[pain], lineHeight: 1 }}>{pain}</span>
              </div>
              <input type="range" min={0} max={10} step={1} value={pain} onChange={e => setPain(Number(e.target.value))}
                className="w-full"
                style={{ appearance: "none", height: 8, borderRadius: 8, outline: "none",
                  background: `linear-gradient(to right, ${PAIN_COLORS[pain]} 0%, ${PAIN_COLORS[pain]} ${pain * 10}%, ${s(D.border, D.lBorder, mode)} ${pain * 10}%, ${s(D.border, D.lBorder, mode)} 100%)`,
                  transition: "background 200ms" }} />
            </div>

            {/* ENERGY / SLEEP / MOBILITY: 3-option Low/Med/High buttons (38px).
                SELECTED: category color 22% bg + category color border.
                TRANSITION: all 150ms. */}
            {([["Energy", energy, setEnergy as (v:number|null)=>void, D.energy],
               ["Sleep quality", sleep, setSleep as (v:number|null)=>void, D.sleep],
               ["Mobility", mobility, setMobility as (v:number|null)=>void, D.mood]] as [string,number|null,(v:number|null)=>void,string][]).map(([label, val, setter, color]) => (
              <div key={label}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode), marginBottom: 8 }}>{label}</div>
                <div className="flex gap-2">
                  {LEVELS.map((l, i) => {
                    const sel = val === i;
                    return (
                      <button key={i} onClick={() => setter(i)} className="btn-press flex-1 flex items-center justify-center gap-1 rounded-xl"
                        style={{ height: 38, background: sel ? `${color}22` : s(D.raised, D.lCard, mode), border: `1px solid ${sel ? color : s(D.border, D.lBorder, mode)}`, cursor: "pointer", transition: "all 150ms" }}>
                        <span style={{ fontSize: 13 }}>{l.icon}</span>
                        <span style={{ fontSize: 12, color: sel ? color : s(D.textSec, D.lTextSec, mode), fontWeight: 500 }}>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* MEDICATIONS TOGGLE: 50×28px pill switch.
                OFF: border-color bg, thumb justified-start.
                ON: accent bg, thumb justified-end.
                TRANSITION: background 200ms. Thumb moves via justifyContent change. */}
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode) }}>Medications taken?</span>
              <button onClick={() => setMeds(!meds)} className="btn-press flex items-center rounded-full"
                style={{ width: 50, height: 28, background: meds ? D.accent : s(D.border, D.lBorder, mode), padding: "0 3px", border: "none", cursor: "pointer", transition: "background 200ms", justifyContent: meds ? "flex-end" : "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)", transition: "transform 200ms" }} />
              </button>
            </div>

            {/* QUICK NOTE: optional text input (44px, rounded-xl). */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: s(D.textSec, D.lTextSec, mode), marginBottom: 6 }}>Quick note <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></div>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="How did today feel…"
                style={{ width: "100%", height: 44, borderRadius: 12, padding: "0 14px", background: s(D.raised, D.lCard, mode), border: `1px solid ${s(D.border, D.lBorder, mode)}`, color: s(D.text, D.lText, mode), fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            </div>

            {/* BUTTON: "Log detailed check-in" → setStep("done").
                VISUAL: Same gradient as fast-path done button. 50px height. */}
            <button onClick={() => setStep("done")} className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
              style={{ height: 50, background: `linear-gradient(135deg,${theme(mode).color.cta.from},${theme(mode).color.cta.to})`, color: "#fff", border: "none", cursor: "pointer", fontSize: 15, boxShadow: `0 4px 20px ${D.accent}44` }}>
              Log detailed check-in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROGRESS SCREEN ──────────────────────────────────────────────────────────
// ============================================================
// SCREEN: ProgressScreen
// TAB: "progress"
// PURPOSE: Data visualization of recovery progress.
//   C4: Corridor band on pain chart (range, not target line).
//   C5: InsightSentence above every chart (trend badge + bold sentence).
//   C8: History depth gate = soft fade + pill button (no hard modal).
//         Advanced insights = LockedCard component.
//
// CONTENT SECTIONS:
//   1. Pain trend card (C5 insight + C4 corridor sparkline + history gate)
//   2. Week comparison card (3 data rows)
//   3. Sleep quality mini sparkline + insight sentence
//   4. Energy mini sparkline + insight sentence
//   5. Mobility mini sparkline + insight sentence
//   6. Advanced insights header
//   7. Sleep↔Pain correlation (LockedCard)
//   8. Activity pattern (LockedCard)
// ============================================================
const PAIN_DATA = [6,7,5,5,4,6,4,3,5,4,3,4,3,4,3,2,4,3,3,2,3,3,2,3,2,3,2,3,3,2];

// ============================================================
// COMPONENT: InsightSentence
// PURPOSE: C5 — Human-readable trend statement above each chart.
//   NEVER relies on color alone — always shows trend icon + word badge + text.
//   Trend badge: rounded-full, category color 22% bg, colored text.
//   Text: 14px semibold, primary text color, 1.35 line-height.
//   marginBottom: 8px (above chart).
// ============================================================
function InsightSentence({ text, trend, color, mode }: { text: string; trend: "up" | "down" | "stable"; color: string; mode: Mode }) {
  const trendIcon = trend === "down" ? "↓" : trend === "up" ? "↑" : "→";
  const trendWord = trend === "down" ? "Decreasing" : trend === "up" ? "Increasing" : "Stable";
  return (
    <div className="flex items-start gap-2 mb-2">
      {/* Trend badge: icon + word. Color provided by caller (never color alone). */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{trendIcon} {trendWord}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: s(D.text, D.lText, mode), lineHeight: 1.35 }}>{text}</div>
    </div>
  );
}

// ============================================================
// COMPONENT: PainSparklineWithCorridor
// PURPOSE: C4 — SVG sparkline chart with optional corridor band.
//   The corridor is always a RANGE (common population range),
//   never a target line or pass/fail threshold.
//
// SVG STRUCTURE:
//   viewBox: 0 0 300 {height}. Scales to container width via preserveAspectRatio="none".
//   Area fill: polyline with fill={color}22 (below the line, to baseline).
//   Line: polyline, 2px stroke, round caps/joins.
//
// CORRIDOR BAND (when showCorridor=true):
//   rect: fills from corridorTop (pain=5) to corridorBot (pain=2).
//   Fill: rgba(155,143,224,0.13) dark / rgba(124,111,205,0.10) light.
//   Top dashed line: 1px, strokeDasharray "4 3", bandBorder color.
//   Bottom dashed line: same. Both indicate RANGE boundaries.
//   corridorLabel (below chart): 10px italic, muted accent color.
//   Text: "Common range for knee rehab, weeks 4–6 · Everyone heals differently ↗"
//
// HISTORY DEPTH GATE (rendered in ProgressScreen, not here):
//   A gradient overlay + pill button is placed BELOW the chart card.
//   This is a soft gate — never a hard modal block.
//   BUTTON: "Unlock full history" pill → onPaywall() → PaywallSheet opens.
// ============================================================
function PainSparklineWithCorridor({ data, color, mode, height = 64, showCorridor = false, corridorLabel = "" }: {
  data: number[]; color: string; mode: Mode; height?: number; showCorridor?: boolean; corridorLabel?: string;
}) {
  const max = Math.max(...data) + 1;
  const w = 300; const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  // C4: corridor = common range for knee rehab weeks 4–6 = pain 2–5
  const corridorTop = h - (5 / max) * h;
  const corridorBot = h - (2 / max) * h;
  const bandColor = mode === "dark" ? "rgba(155,143,224,0.13)" : "rgba(124,111,205,0.10)";
  const bandBorder = mode === "dark" ? "rgba(155,143,224,0.3)" : "rgba(124,111,205,0.25)";
  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {showCorridor && (
          <>
            {/* C4 CORRIDOR BAND: always a RANGE, not a target.
                rect: filled band. dashed lines: range boundaries. */}
            <rect x="0" y={corridorTop} width={w} height={corridorBot - corridorTop} fill={bandColor}/>
            <line x1="0" y1={corridorTop} x2={w} y2={corridorTop} stroke={bandBorder} strokeWidth="1" strokeDasharray="4 3"/>
            <line x1="0" y1={corridorBot} x2={w} y2={corridorBot} stroke={bandBorder} strokeWidth="1" strokeDasharray="4 3"/>
          </>
        )}
        {/* Area fill (below line to baseline) */}
        <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`${color}22`} stroke="none"/>
        {/* Line */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {/* Corridor label — italic, muted accent, 10px */}
      {showCorridor && corridorLabel && (
        <div style={{ fontSize: 10, color: mode === "dark" ? "rgba(155,143,224,0.7)" : "rgba(124,111,205,0.8)", marginTop: 2, fontStyle: "italic" }}>
          {corridorLabel}
        </div>
      )}
    </div>
  );
}

function ProgressScreen({ mode, onPaywall }: { mode: Mode; onPaywall: () => void }) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto" style={{ paddingBottom: 88 }}>
      <div className="px-5 pt-3 pb-3 shrink-0">
        <div style={{ fontSize: 20, fontWeight: 700, color: s(D.text, D.lText, mode) }}>Progress</div>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {/* PAIN TREND CARD: C5 insight sentence above chart + C4 corridor */}
        <Card mode={mode}>
          {/* C5: InsightSentence comes FIRST (above chart), not below */}
          <InsightSentence text="Pain trending down over the last 30 days." trend="down" color={D.pain} mode={mode} />
          {/* C4: Corridor band (pain 2–5, common knee rehab range) */}
          <PainSparklineWithCorridor data={PAIN_DATA} color={D.pain} mode={mode} height={64}
            showCorridor corridorLabel="Common range for knee rehab, weeks 4–6 · Everyone heals differently ↗" />
          <div className="flex justify-between mt-1 mb-2">
            <span style={{ fontSize: 10, color: s(D.textMut, D.lTextSec, mode) }}>Day 1</span>
            <span style={{ fontSize: 10, color: s(D.textMut, D.lTextSec, mode) }}>Day 30</span>
          </div>
          {/* C4 CORRIDOR PHASE CHIP: descriptive label of current phase */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `${D.accentD}`, border: `1px solid ${D.accent}44` }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: D.accentL }}>📍 Weight-bearing usually returns</span>
            </div>
          </div>
          {/* C8 HISTORY DEPTH GATE: soft gradient fade + pill (not hard modal).
              VISUAL: gradient overlay (transparent → card color) from left 0% to 55%.
              BUTTON: "Unlock full history" pill → onPaywall() → PaywallSheet (zIndex 50). */}
          <div className="relative rounded-xl overflow-hidden" style={{ height: 32 }}>
            <div className="absolute inset-0 rounded-xl" style={{ background: `linear-gradient(to right, transparent 0%, ${s(D.raised, D.lCard, mode)} 55%)` }} />
            <button onClick={onPaywall} className="btn-press absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ background: D.accentD, border: `1px solid ${D.accent}66`, cursor: "pointer" }}>
              <LockBadge size={14} />
              <span style={{ fontSize: 11, color: D.accentL, fontWeight: 600 }}>Unlock full history</span>
            </button>
          </div>
        </Card>

        {/* WEEK COMPARISON CARD: 3 metric rows (pain / sleep / energy).
            Each row: colored 4×28px bar + label + this-week value + last-week value. */}
        <Card mode={mode}>
          <SectionLabel label="This week vs last week" mode={mode} />
          {[
            { label: "Avg pain",  this: 2.8, last: 3.6, color: D.pain,   fmt: (v: number) => v.toFixed(1) },
            { label: "Sleep",     this: 7.1, last: 6.2, color: D.sleep,  fmt: (v: number) => v.toFixed(1)+"h" },
            { label: "Energy",    this: 3,   last: 2,   color: D.energy, fmt: (v: number) => ["Low","Med","High"][v-1] ?? v },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-2 mb-2">
              {/* Colored bar: category identifier (not decorative) */}
              <div style={{ width: 4, height: 28, borderRadius: 2, background: row.color }} />
              <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode), width: 70 }}>{row.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: s(D.text, D.lText, mode) }}>{row.fmt(row.this)}</div>
              {/* Previous week value: muted, "← " prefix */}
              <div style={{ fontSize: 11, color: s(D.textSec, D.lTextSec, mode), opacity: 0.7 }}>← {row.fmt(row.last)}</div>
            </div>
          ))}
        </Card>

        {/* MINI SPARKLINES: Sleep / Energy / Mobility.
            C5: InsightSentence above each chart.
            No corridor band (corridor only on main pain chart). */}
        {[
          { label: "Sleep quality", insight: "Sleep averaging 7.1h — up from 6.2h last week.", color: D.sleep,  trend: "up"     as const, data: [5,6,7,6,7,7,8,7,7,8] },
          { label: "Energy",        insight: "Energy gradually improving over the past 10 days.", color: D.energy, trend: "up"     as const, data: [2,3,3,4,3,4,5,4,5,5] },
          { label: "Mobility",      insight: "Mobility scores climbing steadily since week 5.",   color: D.mood,   trend: "up"     as const, data: [3,3,4,4,5,4,5,6,5,6] },
        ].map(chart => (
          <Card key={chart.label} mode={mode} style={{ paddingBottom: 8 }}>
            <InsightSentence text={chart.insight} trend={chart.trend} color={chart.color} mode={mode} />
            <PainSparklineWithCorridor data={chart.data} color={chart.color} mode={mode} height={44} />
          </Card>
        ))}

        {/* C8: ADVANCED INSIGHTS — only these are locked (not basic charts).
            Two LockedCard items:
            1. Sleep→Pain correlation — hook: "See how sleep affects your pain"
            2. Activity pattern — hook: "Discover your best recovery patterns"
            INTERACTION: Tap → onPaywall() → PaywallSheet (zIndex 50). */}
        <SectionLabel label="Advanced insights" mode={mode} />
        <LockedCard mode={mode} onUnlock={onPaywall} hook="See how sleep affects your pain">
          <Card mode={mode}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s(D.text, D.lText, mode), marginBottom: 3 }}>Sleep → Pain correlation</div>
            <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode) }}>Poor sleep (≤6h) predicts 2× higher next-day pain.</div>
          </Card>
        </LockedCard>
        <LockedCard mode={mode} onUnlock={onPaywall} hook="Discover your best recovery patterns">
          <Card mode={mode}>
            <div style={{ fontSize: 13, fontWeight: 600, color: s(D.text, D.lText, mode), marginBottom: 3 }}>Activity pattern</div>
            <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode) }}>Your pain scores are lowest on Tuesdays and Wednesdays.</div>
          </Card>
        </LockedCard>
      </div>
    </div>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
// ============================================================
// SCREEN: ProfileScreen
// TAB: "profile"
// PURPOSE: Account, settings, navigation to secondary features.
//   C8: Premium row is friendly ("depth" framing, no lock on rows).
//
// CONTENT:
//   1. Profile card: avatar circle + name + recovery label + chevron.
//   2. Premium upgrade row: gradient accent, "Free plan" + upgrade text.
//   3. Menu card: 8 rows (50px each, borderBottom separator).
//   4. Version/disclaimer footer.
//
// PREMIUM ROW:
//   BUTTON: full-width, gradient accent bg.
//   ACTION: onPaywall() → PaywallSheet (zIndex 50).
//
// MENU ROWS:
//   8 items: Manage recoveries / Medications / Appointments /
//   Doctor reports / Education hub / Settings /
//   When to contact a doctor / Medical disclaimer.
//   Each: emoji icon + label + chevron right. 50px height.
//   No lock badges — all menu items are accessible (C8).
//   ACTION: Prototype stubs — no navigation implemented.
//
// FOOTER: "Recovery Companion v1.0.0 · Not medical advice" (11px muted).
// ============================================================
function ProfileScreen({ mode, onPaywall }: { mode: Mode; onPaywall: () => void }) {
  const rows = [
    { icon: "🔄", label: "Manage recoveries" },
    { icon: "💊", label: "Medications" },
    { icon: "📅", label: "Appointments" },
    { icon: "🩻", label: "Doctor reports" },
    { icon: "📚", label: "Education hub" },
    { icon: "⚙️", label: "Settings" },
    { icon: "🚨", label: "When to contact a doctor" },
    { icon: "🔒", label: "Medical disclaimer" },
  ];
  return (
    <div className="flex flex-col flex-1 overflow-y-auto" style={{ paddingBottom: 88 }}>
      <div className="px-5 pt-3 pb-4 shrink-0">
        <div style={{ fontSize: 20, fontWeight: 700, color: s(D.text, D.lText, mode) }}>Profile</div>
      </div>
      <div className="flex flex-col gap-3 px-5">
        {/* Profile card — non-interactive identity summary */}
        <Card mode={mode}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-full" style={{ width: 52, height: 52, background: `linear-gradient(135deg,${D.accentD},${D.accent})`, fontSize: 22 }}>🧑</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s(D.text, D.lText, mode) }}>Alex Rivera</div>
              <div style={{ fontSize: 12, color: s(D.textSec, D.lTextSec, mode) }}>Knee rehab · Day 46</div>
            </div>
            <svg className="ml-auto" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={s(D.textMut, D.lTextSec, mode)} strokeWidth="1.5" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
          </div>
        </Card>

        {/* C8 PREMIUM ROW: friendly "depth" framing, not pressure.
            BUTTON: full-width gradient accent row.
            ACTION: onPaywall() → PaywallSheet (zIndex 50). */}
        <button onClick={onPaywall} className="btn-press w-full flex items-center gap-3 rounded-2xl px-4"
          style={{ height: 52, background: `linear-gradient(135deg,${D.accentD},${D.accent}33)`, border: `1px solid ${D.accent}55`, cursor: "pointer", textAlign: "left" }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <div className="flex-1">
            <div style={{ fontSize: 13, fontWeight: 600, color: D.accentL }}>Free plan</div>
            <div style={{ fontSize: 11, color: s(D.textSec, D.lTextSec, mode) }}>Upgrade for insights, full history & photo compare</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={D.accentL} strokeWidth="1.5" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>
        </button>

        {/* MENU CARD: 8 rows in a single card, separated by borderBottom lines.
            All rows are prototype stubs — no navigation implemented. */}
        <Card mode={mode} style={{ padding: 0, overflow: "hidden" }}>
          {rows.map((row, i) => (
            // Each row: 50px height, borderBottom separates items (except last).
            <button key={i} className="btn-press flex items-center gap-3 w-full px-4"
              style={{ height: 50, borderBottom: i < rows.length - 1 ? `1px solid ${s(D.border, D.lBorder, mode)}` : "none", background: "none", border: i < rows.length - 1 ? `1px solid ${s(D.border, D.lBorder, mode)}` : "none", borderLeft: "none", borderRight: "none", borderTop: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{row.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: s(D.text, D.lText, mode), flex: 1 }}>{row.label}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={s(D.textMut, D.lTextSec, mode)} strokeWidth="1.5" strokeLinecap="round"><path d="M5 3l4 4-4 4"/></svg>
            </button>
          ))}
        </Card>

        {/* Version/disclaimer footer — non-interactive */}
        <div className="text-center pt-2" style={{ fontSize: 11, color: s(D.textMut, D.lTextMut, mode) }}>
          Recovery Companion v1.0.0 · Not medical advice
        </div>
      </div>
    </div>
  );
}

// ─── TAB BAR ──────────────────────────────────────────────────────────────────
// ============================================================
// COMPONENT: TabBar
// PURPOSE: Primary 5-tab navigation at the bottom of the screen.
//   Position: absolute bottom-0, width 100%. Height: 82px.
//   paddingBottom: 8px (home indicator safe area approximation).
//
// TAB LAYOUT:
//   5 equal-width flex-1 buttons.
//   Outer 4 tabs: icon (22px SVG) + label (10px). Standard flow.
//   Center tab ("Log"):
//     Elevated circle button: 52×52px, gradient accent, marginTop: -20
//     (rises above the tab bar by 20px for visual hierarchy).
//     Drop shadow: 0 4px 16px accent55.
//     Label "Log" below: 10px, accent color.
//     This tab does NOT change `tab` state — it opens CheckInModal instead.
//
// ACTIVE TAB:
//   Icon: stroke-width 2 (vs 1.6 inactive).
//   Label: fontWeight 600 (vs 400 inactive).
//   Color: D.accent (vs secondary text color).
//
// INTERACTION:
//   All 4 non-center tabs: onChange(t) → setTab(t) in MainApp.
//   Center "Log" tab: onChange("checkin") → intercepted by handleTab() in MainApp
//     → setShowCheckIn(true) (does NOT change `tab` state).
//
// PRESS FEEDBACK: .btn-press on all buttons (scale 0.97, 120ms ease-out).
// ============================================================
export type Tab = "home" | "timeline" | "checkin" | "progress" | "profile";

const TABS: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { id: "home",     label: "Home",     icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={a?2:1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M8 20v-8h6v8"/></svg> },
  { id: "timeline", label: "Timeline", icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={a?2:1.6} strokeLinecap="round"><path d="M4 6h14M4 11h10M4 16h7"/><circle cx="18" cy="16" r="3"/></svg> },
  { id: "checkin",  label: "Log",      icon: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg> },
  { id: "progress", label: "Progress", icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={a?2:1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-6 4 4 4-8 4 4"/></svg> },
  { id: "profile",  label: "Profile",  icon: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={a?2:1.6} strokeLinecap="round"><circle cx="11" cy="7" r="4"/><path d="M2.5 20c0-4.1 3.8-7.5 8.5-7.5s8.5 3.4 8.5 7.5"/></svg> },
];

function TabBar({ active, onChange, mode }: { active: Tab; onChange: (t: Tab) => void; mode: Mode }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center px-2 shrink-0"
      style={{ height: 82, background: s(D.raised, D.lCard, mode), borderTop: `1px solid ${s(D.border, D.lBorder, mode)}`, paddingBottom: 8 }}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        const isCenter = tab.id === "checkin";
        if (isCenter) {
          // CENTER "LOG" TAB: elevated circle button.
          // marginTop: -20 causes it to rise above the tab bar.
          // INTERACTION: onChange("checkin") → handleTab intercepts → CheckInModal opens.
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)} className="btn-press flex-1 flex flex-col items-center justify-center"
              style={{ background: "none", border: "none", cursor: "pointer" }}>
              <div className="flex items-center justify-center rounded-full"
                style={{ width: 52, height: 52, background: `linear-gradient(135deg,${theme(mode).color.cta.from},${theme(mode).color.cta.to})`, boxShadow: `0 4px 16px ${D.accent}55`, marginTop: -20 }}>
                {tab.icon(true)}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: D.accent, marginTop: 2 }}>{tab.label}</span>
            </button>
          );
        }
        return (
          // STANDARD TAB: icon + label, color changes on active.
          // INTERACTION: onChange(tab.id) → setTab(tab.id) in MainApp.
          // TRANSITION: No explicit transition — color change is instant on re-render.
          <button key={tab.id} onClick={() => onChange(tab.id)} className="btn-press flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? D.accent : s(D.textSec, D.lTextSec, mode) }}>
            {tab.icon(isActive)}
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
// ============================================================
// COMPONENT: MainApp  (default export)
// PURPOSE: Root shell of the main application. Manages all tab and overlay state.
//
// ENTRY POINT: App.tsx renders <MainApp initialMode={mode} />.
//
// SCREEN LAYOUT:
//   Page wrapper: full-viewport, centered, 32px padding.
//   Background: radial-gradient (same as Onboarding). TRANSITION: 400ms on mode change.
//   PhoneShell: 390×844px (fixed height in main app — not min-height).
//   Mode toggle: fixed top-right, zIndex 100.
//   Dot nav: below PhoneShell (4 dots only — not 5, no dot for check-in tab).
//
// TAB SWITCHING SEQUENCE:
//   1. User taps a tab button (non-"checkin").
//   2. onChange(t) → handleTab(t) → setTab(t).
//   3. key={tab} changes on the screen wrapper div.
//   4. React unmounts old screen, mounts new screen.
//   5. ANIMATION: .animate-fade-in on new screen — opacity 0→1, 300ms ease-out.
//
// CHECK-IN MODAL SEQUENCE:
//   1. User taps "Log" center tab OR "Daily check-in" row on Home.
//   2. handleTab("checkin") OR onCheckIn() → setShowCheckIn(true).
//   3. CheckInModal mounts (absolute inset-0, zIndex 40, animate-fade-in 300ms).
//   4. User completes check-in (fast-path or detail) → step="done".
//   5. "Back to home" tap → onClose() → setShowCheckIn(false) → CheckInModal unmounts.
//   NOTE: tab state does NOT change when check-in is opened.
//
// PAYWALL SEQUENCE:
//   1. User taps LockedCard, history gate button, or Profile upgrade row.
//   2. onPaywall() → setShowPaywall(true).
//   3. PaywallSheet mounts (absolute inset-0, zIndex 50, animate-fade-up 350ms).
//   4. Tap backdrop or ×, "Start free trial", or legal text → onClose() → unmounts.
//
// SHARE CARD SEQUENCE:
//   1. User taps "Share" on a milestone entry in Timeline.
//   2. onShareMilestone(m) → setShareCard(m) (m = {title, day, date}).
//   3. ShareCardScreen mounts (absolute inset-0, zIndex 45, fade-up card).
//   4. "← Back" → onClose() → setShareCard(null) → unmounts.
//
// STATE:
//   mode: "dark" | "light" — initialized from prop, toggled by mode button.
//   tab: Tab — active tab (not "checkin").
//   showCheckIn: boolean — CheckInModal visibility.
//   showPaywall: boolean — PaywallSheet visibility.
//   shareCard: { title, day, date } | null — ShareCardScreen data.
// ============================================================
export default function MainApp({
  initialMode = "dark" as Mode,
  // TEST HOOKS (visual-parity harness). Both default to the shipped behaviour —
  // Home tab, no overlay — so omitting them leaves MainApp byte-identical in
  // normal use. They exist so the harness can address an overlay directly
  // instead of clicking through to it, which would make baselines depend on
  // interaction timing.
  initialTab = "home" as Tab,
  initialOverlay = null as "checkin" | "paywall" | null,
}: { initialMode?: Mode; initialTab?: Tab; initialOverlay?: "checkin" | "paywall" | null }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [showCheckIn, setShowCheckIn] = useState(initialOverlay === "checkin");
  const [showPaywall, setShowPaywall] = useState(initialOverlay === "paywall");
  const [shareCard, setShareCard] = useState<{ title: string; day: number; date: string } | null>(null);

  // ROUTING: "checkin" tap opens modal instead of switching tab.
  function handleTab(t: Tab) {
    if (t === "checkin") { setShowCheckIn(true); return; }
    setTab(t);
  }

  const screenBg = mode === "dark"
    ? "radial-gradient(ellipse at 30% 20%, #23204A 0%, #0D0C16 100%)"
    : "radial-gradient(ellipse at 30% 20%, #EAE6F8 0%, #F8F7FC 100%)";

  return (
    // Page wrapper — background transitions 400ms on mode change
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", background: screenBg, transition: "background 400ms" }}>

      {/* MODE TOGGLE: fixed top-right, always visible, zIndex 100.
          INTERACTION: Tap → toggles mode dark ↔ light.
          VISUAL EFFECT: Page background transitions 400ms. Phone shell colors update. */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 100 }}>
        <button onClick={() => setMode(m => m === "dark" ? "light" : "dark")} className="btn-press flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`, cursor: "pointer", fontSize: 18 }}>
          {mode === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <PhoneShell mode={mode}>
        {/* SCREEN WRAPPER: key={tab} triggers re-mount on tab switch → animate-fade-in.
            position: relative is required for absolute-positioned overlays inside. */}
        <div key={tab} className="flex flex-col flex-1 overflow-hidden animate-fade-in" style={{ position: "relative" }}>
          {/* TAB CONTENT: Only the active tab renders */}
          {tab === "home"     && <HomeScreen mode={mode} onCheckIn={() => setShowCheckIn(true)} onPaywall={() => setShowPaywall(true)} />}
          {tab === "timeline" && <TimelineScreen mode={mode} onShareMilestone={m => setShareCard(m)} />}
          {tab === "progress" && <ProgressScreen mode={mode} onPaywall={() => setShowPaywall(true)} />}
          {tab === "profile"  && <ProfileScreen mode={mode} onPaywall={() => setShowPaywall(true)} />}

          {/* OVERLAYS: Mounted conditionally. Z-index hierarchy defined at file top.
              CheckInModal: zIndex 40 — full-screen, check-in flow.
              ShareCardScreen: zIndex 45 — full-screen, share preview.
              PaywallSheet: zIndex 50 — bottom sheet + backdrop. */}
          {showCheckIn && <CheckInModal mode={mode} onClose={() => setShowCheckIn(false)} />}
          {showPaywall && <PaywallSheet mode={mode} onClose={() => setShowPaywall(false)} />}
          {shareCard   && <ShareCardScreen mode={mode} milestone={shareCard} onClose={() => setShareCard(null)} />}
        </div>
        <TabBar active={tab} onChange={handleTab} mode={mode} />
      </PhoneShell>

      {/* DOT NAVIGATION: 4 dots (home/timeline/progress/profile — no check-in dot).
          ACTIVE: 16×6px pill, accent color.
          INACTIVE: 6×6px circle, semi-transparent.
          TRANSITION: all 250ms ease-out (width + background).
          INTERACTION: Tap dot → setTab(t) directly (bypasses handleTab check-in logic). */}
      <div className="flex gap-2 mt-4 items-center">
        {(["home","timeline","progress","profile"] as Tab[]).map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ width: tab === t ? 16 : 6, height: 6, borderRadius: 3, background: tab === t ? D.accent : (mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"), transition: "all 250ms", cursor: "pointer" }} />
        ))}
      </div>
    </div>
  );
}
