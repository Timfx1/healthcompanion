// ============================================================
// PATTERN: Toast
//
// Confirm quietly. Non-blocking, auto-dismissing, pointer-events: none so it
// never intercepts a tap. Used by the quick-capture save path, where §7 requires
// the write to be optimistic: the entry appears immediately and the user never
// waits on it. The toast confirms; it does not gate.
//
// ── A DEFECT RECORDED RATHER THAN QUIETLY FIXED ──────────────────────────────
//
// `background` below reads `s(D.card, "#333", "dark")`. The third argument is
// the MODE, and it is hardcoded to "dark". So the selector always takes the dark
// branch, the light value "#333" is dead code that has never rendered, and this
// component ignores light mode entirely.
//
// It is also the one pattern here whose token family already exists and is
// completely unused: `pattern.toast.{surface,label,dwell}` in patterns.json,
// mode-paired, resolving to surface.card and text.primary.
//
// Not fixed in this commit, for one specific reason: the toast is only ever
// visible after a quick-capture save, and no baseline captures it in that state
// — `app-home` renders it at opacity 0. So a fix here is a change the visual
// harness cannot verify, in the exact place the harness is already known to be
// blind (see DESIGN_CRITERIA.md §11). Wiring the tokens and adding a dev-route
// hook that captures the visible toast belong in the same change, not in an
// extraction pass.
// ============================================================

import { c as s, D, scale } from "../tokens";

export default function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className="absolute flex items-center gap-2 px-4 rounded-full"
      style={{
        top: 52, left: "50%", transform: "translateX(-50%)", height: 36, zIndex: scale.z.toast,
        background: s(D.card, "#333", "dark"),
        boxShadow: "0 4px 20px #0000004D",
        opacity: visible ? 1 : 0,
        transition: `opacity ${scale.duration.medium}ms ease-out`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={D.mood} strokeWidth="2" strokeLinecap="round"><path d="M2 7l3 3 7-7" /></svg>
      <span style={{ fontSize: scale.font.size.xs, fontWeight: 600, color: "#fff" }}>{message}</span>
    </div>
  );
}
