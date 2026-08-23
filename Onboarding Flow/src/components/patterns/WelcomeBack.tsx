// ============================================================
// COMPONENT: WelcomeBack — the first thing a returning user sees.
//
// TOKENS: pattern.welcomeBack.{surface,edge,message}. This is the family's
// first and only consumer, and building it is what exposed the family's defect:
// `surface` was the system's ONLY use of alpha.tint08, a step whose own note
// calls it a "Hairline fill", while all eight other tinted containers in the
// product use tint13, "the most common tint". A container built on the hairline
// step reads as a rendering fault rather than a decision. It had no `edge`
// either, where every accent-tinted sibling pairs its fill with tint27. Both
// were invisible for exactly as long as nothing drew them.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE CONTRACT IS THE COPY (P2)
//
//   "One warm line, then straight into the fast path. No count of missed days,
//    no catch-up prompt, no apology required."
//
// So this component takes NO props about the absence. It cannot render a day
// count because it is never given one — `absence.ts` returns a boolean and
// destroys the duration. That is the structural version of P2: guilt-free "by
// architecture, not slogans".
//
// It is also NOT interactive. A tap target here would be a catch-up prompt
// wearing a friendlier coat, and the fast path is already one tap away in the
// tab bar and in Today's actions. "Straight into the fast path" means nothing
// stands between the user and it — not that this card is the way there.
//
// HIERARCHY: one line, at body weight, on a tint. Per the standing rule that
// hierarchy on a tinted surface comes from SIZE and WEIGHT rather than
// lightness, the message takes PRIMARY ink — which is also the role that the
// four separate failures of secondary-on-a-tint were fixed into.
//
// ANIMATION: animate-fade-up (350ms ease-out) on mount, the same entrance the
// share card and the weekly reflection use. Suppressed under .no-motion so the
// baseline photographs a settled frame.
// ============================================================

import { theme, scale, type Mode } from "../tokens";

export const WELCOME_BACK_MESSAGE = "Good to see you again. Pick up wherever you like.";

export default function WelcomeBack({ mode }: { mode: Mode }) {
  const t = theme(mode);
  return (
    <div
      className="animate-fade-up"
      data-testid="welcome-back"
      style={{
        background: t.pattern.welcomeBack.surface,
        border: `1px solid ${t.pattern.welcomeBack.edge}`,
        borderRadius: scale.radius.lg,
        padding: `${scale.space[3]}px ${scale.space[4]}px`,
        color: t.pattern.welcomeBack.message,
        fontSize: scale.font.size.sm,
        lineHeight: 1.5,
      }}
    >
      {WELCOME_BACK_MESSAGE}
    </div>
  );
}
