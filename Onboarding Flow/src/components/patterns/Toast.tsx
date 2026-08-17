// ============================================================
// PATTERN: Toast
//
// Confirm quietly. Non-blocking, auto-dismissing, `pointerEvents: none` so it
// can never intercept a tap. Used by the quick-capture save path, where §7
// requires the write to be optimistic: the entry appears immediately and the
// user never waits on it. The toast confirms; it does not gate. There is also
// no failure variant, deliberately — the capture path must never fail, so there
// is nothing for a toast to apologise for.
//
// A DARK PILL IN BOTH MODES, ON PURPOSE. This is the platform snackbar
// convention and the reason is sound: on a light screen a dark pill reads as
// system chrome rather than as part of the page, which is what makes a
// two-second message noticeable without shouting. `surface.notification` is
// mode-invariant to say so in the token layer rather than in a comment.
//
// ── WHAT WAS ACTUALLY WRONG HERE, AND WHAT WAS NOT ───────────────────────────
//
// This component used to read `s(D.card, "#333", "dark")`. The third argument is
// the MODE, hardcoded — so the selector always took the dark branch and the
// light value "#333" was dead code that never rendered in the product's life.
// The file's own header documented light mode as "#333", which was therefore
// wrong about its own behaviour.
//
// Meanwhile `pattern.toast.*` existed, was mode-paired to surface.card and
// text.primary, and was consumed by nothing — so the tokens described a WHITE
// pill with dark text that no screen had ever drawn.
//
// The screen's intent was right and the tokens were wrong, so the tokens moved.
//
// NOT WRONG: contrast. Every configuration passed comfortably — 15.13:1 as
// rendered, 12.63:1 for the dead value, 13.32/17.25:1 for the old tokens. This
// was dead code and a token family describing a design nobody had built. It was
// never an accessibility defect, and an earlier note in §11 that implied
// otherwise has been corrected.
// ============================================================

import { theme, scale, type Mode } from "../tokens";

export default function Toast({ message, visible, mode }: { message: string; visible: boolean; mode: Mode }) {
  const t = theme(mode).pattern.toast;
  return (
    <div className="absolute flex items-center gap-2 px-4 rounded-full"
      style={{
        top: 52, left: "50%", transform: "translateX(-50%)", height: 36, zIndex: scale.z.toast,
        background: t.surface,
        boxShadow: "0 4px 20px #0000004D",
        opacity: visible ? 1 : 0,
        transition: `opacity ${scale.duration.medium}ms ease-out`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={theme(mode).color.category.mood.mark} strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 7-7" /></svg>
      <span style={{ fontSize: scale.font.size.xs, fontWeight: 600, color: t.label }}>{message}</span>
    </div>
  );
}
