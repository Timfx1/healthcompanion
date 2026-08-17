// ============================================================
// PATTERN: LockedCard
//
// The premium-depth wrapper. Desaturates and dims the real card underneath,
// then lays a blurred scrim with a LockBadge and a one-line value hook over it.
//
// WHY THE CARD UNDERNEATH IS REAL, not a placeholder: §9 requires value to be
// shown BEFORE the gate. A locked insight shows an actual card with an actual
// hook, so the user can see what they would get. A blank box with a padlock
// teaches people the feature is not worth buying.
//
// WHERE IT MAY APPEAR: premium depth only — advanced insights and correlations,
// history beyond the free window, photo compare, multiple recoveries.
//
// WHERE IT MAY NEVER APPEAR (N6, N7): the core loop — daily check-in, quick
// capture, timeline, journal, basic pain chart, medications and reminders,
// appointments, safety content — and the ENTIRE doctor report including its
// export. Those are free forever; a badge on any of them is a product bug, not
// a styling choice.
//
// KNOWN DIVERGENCE: the scrim (#15141F8C) and hook colour (#FFFFFFD9) are still
// inline. Both are deliberately mode-INVARIANT — the scrim stays dark in light
// mode, which makes the locked state read more strongly there than in dark. That
// is defensible but undeclared, and there is no pattern token for either.
// ============================================================

import { c as s, D, scale, type Mode } from "../tokens";
import LockBadge from "./LockBadge";

export default function LockedCard({ mode, children, onUnlock, hook }: {
  mode: Mode;
  children: React.ReactNode;
  onUnlock: () => void;
  hook: string;
}) {
  return (
    <div onClick={onUnlock} className="btn-press relative overflow-hidden rounded-2xl cursor-pointer"
      style={{ border: `1px solid ${s(D.border, D.lBorder, mode)}`, filter: "saturate(0.55) opacity(0.75)" }}>
      {children}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl"
        style={{ background: "#15141F8C", backdropFilter: "blur(2px)" }}>
        <LockBadge mode={mode} size={28} />
        <span style={{ fontSize: scale.font.size["2xs"], color: "#FFFFFFD9", fontWeight: 600, textAlign: "center", maxWidth: 140, lineHeight: 1.3 }}>{hook}</span>
      </div>
    </div>
  );
}
