// ============================================================
// SCREEN: AppointmentDetail (§4.10, N7)
//
// Before a visit: what you meant to ask, and a route to the report. After it:
// what was said, and what happens next. One screen, because it is one
// appointment — but genuinely two shapes, and the DATE decides which.
//
// STATES, derived from the date and nothing else:
//   upcoming  it has not happened. The questions list and the report nudge
//             LEAD, because those are what change the outcome.
//   past      it has happened. Notes-after and the follow-up lead; the questions
//             become a record of what was covered rather than a to-do list.
//
// This is the clearest state split in the product: not a variant of one layout
// but a different answer to "what is this screen for right now", flipping on a
// fact nobody sets by hand.
//
// CONDITIONAL CONTENT, not states: whether an upcoming appointment is close
// enough to warrant the pre-visit nudge (§4.10 puts it at two days), and whether
// a past one recorded a follow-up.
//
// N7 — appointments are core loop, free forever. The route to the report from
// here carries no badge and no gate: N6 makes that a build failure, not a
// review note.
// ============================================================

import { useAppTheme } from "../../../state/AppThemeContext";
import { scale } from "../../../theme/tokens.generated";
import type { Appointment } from "../../../types/recovery";
import { DetailScreen, DetailButton, DetailCard, DetailSection } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

const DAY_MS = 86_400_000;

export function AppointmentDetail({
  appointment, onClose, onOpenReport, onOpenQuestions,
}: {
  appointment: Appointment;
  onClose: () => void;
  onOpenReport: () => void;
  onOpenQuestions: () => void;
}) {
  const { tokens } = useAppTheme();
  const when = new Date(appointment.date).getTime();
  const upcoming = when > Date.now();
  const daysUntil = Math.ceil((when - Date.now()) / DAY_MS);
  const soon = upcoming && daysUntil <= 2;

  return (
    <DetailScreen title={upcoming ? "Upcoming appointment" : "Past appointment"} onClose={onClose}>
      <DetailCard>
        <Body>{appointment.clinician ?? "Appointment"}</Body>
        <Caption>
          {new Date(appointment.date).toLocaleString()}
          {appointment.location ? ` · ${appointment.location}` : ""}
        </Caption>
      </DetailCard>

      {upcoming ? (
        <>
          {/* Conditional content, not a state. A question, never an instruction. */}
          {soon && (
            <DetailCard>
              <Body>{daysUntil <= 1 ? "This is tomorrow." : "This is in two days."}</Body>
              <Caption>Would it help to look over your report first?</Caption>
              {/* Free, unbadged, one tap. */}
              <DetailButton label="Open doctor report" onPress={onOpenReport} />
            </DetailCard>
          )}

          <DetailSection label="What you wanted to ask">
            {appointment.questions.length === 0 ? (
              <DetailCard>
                <Body>Nothing written down yet.</Body>
                <Caption>Questions are easiest to catch when they occur to you, not in the waiting room.</Caption>
              </DetailCard>
            ) : (
              appointment.questions.map((q, i) => (
                <DetailCard key={i}>
                  <Body>{q}</Body>
                </DetailCard>
              ))
            )}
            <DetailButton label="Add a question" onPress={onOpenQuestions} />
          </DetailSection>
        </>
      ) : (
        <>
          <DetailSection label="Notes after">
            <DetailCard>
              {appointment.notesAfter ? (
                <Body>{appointment.notesAfter}</Body>
              ) : (
                <>
                  <Body>No notes from this one.</Body>
                  <Caption>You can still add them whenever you like.</Caption>
                </>
              )}
            </DetailCard>
          </DetailSection>

          {!!appointment.followUpDate && (
            <DetailSection label="Follow-up">
              <DetailCard>
                <Body>{new Date(appointment.followUpDate).toLocaleDateString()}</Body>
              </DetailCard>
            </DetailSection>
          )}

          <DetailSection label="What you asked">
            {appointment.questions.length === 0 ? (
              <DetailCard>
                <Body>Nothing was written down beforehand.</Body>
              </DetailCard>
            ) : (
              appointment.questions.map((q, i) => (
                <DetailCard key={i}>
                  <Body>{q}</Body>
                </DetailCard>
              ))
            )}
          </DetailSection>
        </>
      )}
    </DetailScreen>
  );
}
