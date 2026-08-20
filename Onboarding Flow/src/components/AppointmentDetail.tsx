// ============================================================
// SCREEN: AppointmentDetail (§4.10, N7)
//
// PURPOSE. Before a visit: what you meant to ask, and a route to the report.
// After it: what was said, and what happens next. One screen, because it is one
// appointment — but genuinely two shapes, and the date decides which.
//
// STATES, derived from the date and nothing else:
//   upcoming  the appointment has not happened. The questions list and the
//             report nudge lead, because those are what change the outcome.
//   past      it has happened. Notes-after and the follow-up lead; the questions
//             become a record of what was covered rather than a to-do list.
//
// This is the clearest state split in the product so far: not a variant of one
// layout but a different answer to "what is this screen for right now", and it
// flips on a fact nobody sets by hand.
//
// CONDITIONAL CONTENT, not states: whether an upcoming appointment is soon
// enough to warrant the pre-visit nudge (§4.10 puts it at two days), and whether
// a past one recorded a follow-up. Same distinction the report's red flags use.
//
// N7 — appointments are core loop, free forever.
// ============================================================

import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailSection, DetailCard, DetailButton } from "./patterns/DetailScreen";
import type { Appointment } from "./timelineFixtures";

export type ApptState = "upcoming" | "past";
export function apptStateOf(a: Appointment): ApptState {
  return a.inDays >= 0 ? "upcoming" : "past";
}

export default function AppointmentDetail({ mode, appointment, onClose, onQuestions, onReport }: {
  mode: Mode;
  appointment: Appointment;
  onClose: () => void;
  onQuestions: () => void;
  onReport: () => void;
}) {
  const t = theme(mode);
  const state = apptStateOf(appointment);
  const soon = state === "upcoming" && appointment.inDays <= 2;
  const unanswered = appointment.questions.filter((q) => !q.answered).length;

  return (
    <DetailScreen mode={mode} title="Appointment" onClose={onClose}>
      <div className="flex flex-col gap-1">
        <div style={{ fontSize: scale.font.size.lg, fontWeight: 700, color: t.color.text.primary }}>
          {appointment.who}
        </div>
        <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>
          {appointment.dateLabel} · {appointment.where}
        </div>
      </div>

      {/* §4.10's pre-appointment nudge. Conditional content on the upcoming
          state, and it points at the report — which is free, so this is a
          reminder rather than an upsell wearing one's clothes. */}
      {soon && (
        <div className="rounded-2xl px-4 py-3 flex flex-col gap-2"
          style={{ background: t.color.accent.surface, border: `1px solid ${t.color.accent.edge}` }}>
          <div style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: t.color.text.primary }}>
            {appointment.inDays === 0 ? "That's today" : `In ${appointment.inDays} days`}
          </div>
          <div style={{ fontSize: scale.font.size.xs, color: t.color.text.primary, lineHeight: 1.5 }}>
            Your report has what changed since last time, ready to hand over.
          </div>
          <button onClick={onReport}
            className="btn-press self-start rounded-full px-4"
            style={{
              height: 32, border: "none", cursor: "pointer",
              // The CTA gradient, not accent.strong: text.onAccent measures
              // 2.84:1 on accent.strong in dark, while cta.label on this
              // gradient is already solved and declared at both stops.
              background: `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`,
              fontSize: scale.font.size.xs, fontWeight: 600,
              color: t.color.cta.label,
            }}>
            Review my report
          </button>
        </div>
      )}

      {state === "upcoming" ? (
        <DetailSection mode={mode} label={`Questions to ask${unanswered ? ` · ${unanswered}` : ""}`}>
          {appointment.questions.length === 0 ? (
            <DetailCard mode={mode}>
              <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.55 }}>
                Nothing added yet — anything you think of between now and then
                will be waiting here.
              </div>
            </DetailCard>
          ) : (
            <div className="flex flex-col">
              {appointment.questions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 py-2"
                  style={{ borderTop: i ? `1px solid ${t.color.surface.border}` : "none" }}>
                  <span style={{ fontSize: scale.font.size.sm, color: t.color.text.muted }}>○</span>
                  <span style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.5 }}>{q.text}</span>
                </div>
              ))}
            </div>
          )}
          <DetailButton mode={mode} label="Add a question" onClick={onQuestions} />
        </DetailSection>
      ) : (
        <>
          <DetailSection mode={mode} label="What was said">
            <DetailCard mode={mode}>
              <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.6 }}>
                {appointment.notesAfter ?? "No notes were added after this one."}
              </div>
            </DetailCard>
          </DetailSection>

          {/* Conditional: not every appointment produces a follow-up. */}
          {appointment.followUp && (
            <DetailSection mode={mode} label="Next">
              <DetailCard mode={mode}>
                <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary }}>
                  {appointment.followUp}
                </div>
              </DetailCard>
            </DetailSection>
          )}

          <DetailSection mode={mode} label="What you asked">
            <div className="flex flex-col">
              {appointment.questions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 py-2"
                  style={{ borderTop: i ? `1px solid ${t.color.surface.border}` : "none" }}>
                  <span style={{ fontSize: scale.font.size.sm, color: t.color.accent.strong }}>✓</span>
                  <span style={{ fontSize: scale.font.size.sm, color: t.color.text.secondary, lineHeight: 1.5 }}>{q.text}</span>
                </div>
              ))}
            </div>
          </DetailSection>
        </>
      )}
    </DetailScreen>
  );
}
