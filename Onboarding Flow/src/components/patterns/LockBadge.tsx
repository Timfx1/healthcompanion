// ============================================================
// PATTERN: LockBadge
//
// The single definition of the premium-locked affordance. The design criteria
// require this treatment to be PIXEL-IDENTICAL everywhere, which is only
// honestly achievable with one implementation — so this file is that
// implementation, and no screen may draw its own.
//
// IT WAS NOT IDENTICAL BEFORE. Two versions had drifted apart:
//   Onboarding  24px, mode-aware fill (surface.border), 12px glyph
//   MainApp     18px, a fixed #5C58788C with a 4px backdrop blur
// Figma node 2:560 — the only frame carrying this treatment — matches the
// Onboarding version, so MainApp was the divergent one and the canonical
// values are the ones encoded in the lock.* pattern tokens.
//
// WHERE IT MAY APPEAR: premium DEPTH only — advanced insights and
// correlations, history beyond the free window, photo compare, multiple
// recoveries.
//
// WHERE IT MAY NEVER APPEAR: the core loop (daily check-in, quick capture,
// timeline, journal, basic pain chart, medications and reminders,
// appointments, safety content) and the ENTIRE doctor report including its
// export. Those are free forever; a badge on any of them is a product bug, not
// a styling choice.
// ============================================================

import { theme, type Mode } from "../tokens";

export default function LockBadge({ mode, size }: { mode: Mode; size?: number }) {
  const t = theme(mode);
  const box = size ?? t.pattern.lock.badgeSize;
  // The glyph scales with the badge so a caller overriding `size` still gets
  // the proportions from the token pair rather than a stretched icon.
  const glyph = (box / t.pattern.lock.badgeSize) * t.pattern.lock.glyphSize;

  return (
    <div
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: box, height: box, background: t.pattern.lock.badgeFill }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 12 12" fill="none" stroke={t.pattern.lock.badgeGlyph} strokeWidth="1.5">
        <rect x="2" y="5" width="8" height="6" rx="1.5" />
        <path d="M4 5V4a2 2 0 014 0v1" strokeLinecap="round" />
      </svg>
    </div>
  );
}
