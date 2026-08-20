// ============================================================
// SCREEN: Safety — "when to contact a doctor" (§4.8, §10, N3, N7)
//
// PURPOSE. Answer one question well: is this something I should do something
// about? And if so, WHAT — call an ambulance, ring the surgery, or note it down
// for next time. The answer is an action, never a diagnosis (§10).
//
// This is the ONE surface permitted the reserved alert hue, and the first place
// in the product where `safety.*` is the point rather than a passenger. That
// makes it also the easiest place to start crying wolf, so the hue is applied
// per TIER, not per screen: emergency and same-day carry it, routine does not.
//
// N7 — FREE FOREVER. Safety content is on §9's free-forever list, so there is
// no `locked` prop here and no gated variant to build. This file is registered
// as a core-loop surface in checks/restricted.mjs, which fails the build if a
// gating symbol reaches it — the same mechanism that now protects the report.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATE. This screen has ONE, and that is a finding rather than a shortcut.
//
// There is no empty state, because §10 REQUIRES red-flag content for every
// supported recovery type — a Safety screen with nothing on it would be a
// compliance failure, not a state to design. There is no loading state (the
// content is local), no error state, and no entitlement state (N7).
//
// The tiers are content structure, not states, exactly as the report's red-flag
// block is conditional content rather than a state of its own.
//
// Rendering variants — light/dark, dynamic type — are variants, not states.
// ============================================================

import { theme, scale, type Mode } from "./tokens";
import { TIERS, NEEDS_CLINICAL_REVIEW, type Urgency } from "./safetyContent";

export default function SafetyScreen({ mode, onClose, onQuestions }: {
  mode: Mode;
  onClose: () => void;
  onQuestions: () => void;
}) {
  const t = theme(mode);

  // N3, applied WITHIN the screen. Only genuine red flags get the reserved hue;
  // the routine tier is deliberately neutral so the colour still means
  // something when it appears two rows higher.
  const flagged = (u: Urgency) => u !== "routine";

  return (
    <div className="absolute inset-0 flex flex-col animate-fade-up"
      // A full-screen reading surface sits on "raised", matching ReportPreview,
      // so the safety tints composite over a known backdrop rather than the page.
      style={{ background: t.color.surface.raised, zIndex: scale.z.feature }}>

      <div className="flex items-center gap-2 px-5 shrink-0"
        style={{ height: 56, borderBottom: `1px solid ${t.color.surface.border}` }}>
        <button onClick={onClose} className="btn-press flex items-center"
          style={{ background: "none", border: "none", cursor: "pointer", color: t.color.text.secondary }}>
          <span style={{ fontSize: scale.font.size.base }}>←</span>
        </button>
        <div style={{ fontSize: scale.font.size.md, fontWeight: 600, color: t.color.text.primary }}>
          When to contact a doctor
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4 flex flex-col gap-5">

        <div style={{ fontSize: scale.font.size.sm, color: t.color.text.secondary, lineHeight: 1.55 }}>
          Most recoveries have rough days that are completely normal. These are the
          ones worth acting on — sorted by how quickly.
        </div>

        {TIERS.map((tier) => {
          const hue = flagged(tier.urgency);
          return (
            <div key={tier.urgency} className="flex flex-col gap-2">
              <div style={{
                fontSize: scale.font.size.base, fontWeight: 700, lineHeight: 1.3,
                color: hue ? t.color.safety.ink : t.color.text.primary,
              }}>
                {hue ? "⚑ " : ""}{tier.heading}
              </div>
              <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary, lineHeight: 1.5 }}>
                {tier.action}
              </div>

              <div className="flex flex-col gap-2 mt-1">
                {tier.items.map((item) => (
                  // The hue is carried by the FILL and the EDGE; the words are
                  // primary ink. Guidance somebody has to act on must be
                  // maximally readable — safety.ink on its own tint measures
                  // 4.00:1 in light, which is the same trap the report's
                  // red-flag callout fell into and the same fix.
                  <div key={item.text} className="rounded-xl px-3 py-2.5 flex flex-col gap-1"
                    style={hue
                      ? { background: t.color.safety.surface, border: `1px solid ${t.color.safety.mark}` }
                      : { background: t.color.surface.card, border: `1px solid ${t.color.surface.border}` }}>
                    <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.45 }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* ATTRIBUTION SITS ON THE PAGE, not inside the tinted rows.
                  §10 requires sources; it does not require one under every line,
                  and a citation beneath each row is visual noise on a screen
                  somebody reads while worried. Measured, too: text.muted reaches
                  only 4.10:1 on the warm safety tint in light and text.secondary
                  only 4.44 — neither clears AA there, while both are fine on the
                  page. Per-item sources stay in safetyContent.ts, which is what
                  a clinical reviewer needs. */}
              <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, lineHeight: 1.5 }}>
                {[...new Set(tier.items.map((i) => i.source))].join(" · ")}
              </div>
            </div>
          );
        })}

        {/* Routes to the thing that actually helps at an appointment. */}
        <button onClick={onQuestions}
          className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
          style={{
            height: 48, border: `1px solid ${t.color.surface.border}`,
            background: t.color.surface.card, cursor: "pointer",
            fontSize: scale.font.size.sm, color: t.color.text.primary,
          }}>
          Add this to my questions
        </button>

        {/* §10 — permanent, unmissable, and honest about what this is. */}
        <div className="rounded-xl px-3 py-3 flex flex-col gap-1"
          style={{ background: t.color.surface.card, border: `1px solid ${t.color.surface.border}` }}>
          <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.secondary, lineHeight: 1.55 }}>
            Recovery Companion is not a medical device and does not diagnose, treat
            or give clinical advice. This is general guidance about when to seek
            care, not an assessment of your situation. If you are worried, contact
            a clinician — that is always the right call.
          </div>
          {NEEDS_CLINICAL_REVIEW && (
            <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, lineHeight: 1.5 }}>
              Placeholder content pending clinical review. Sources are cited per item.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
