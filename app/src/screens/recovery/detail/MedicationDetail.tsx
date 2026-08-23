// ============================================================
// SCREEN: MedicationDetail (§4.9, P2, N1, N2, N7)
//
// What this medication is, when it is due, and what actually happened — without
// turning any of it into a scorecard.
//
// THIS IS THE SCREEN WHERE P2 IS EASIEST TO BREAK, so the token contracts do
// the deciding rather than taste:
//
//   TAKEN doses render as `accumulation.*`. That family's contract is "a count,
//   or dots that only ever accrue. Nothing sequential that can visibly reset" —
//   so there is no streak here and none can be built from these roles.
//
//   SKIPPED doses render as `rest.*`. That contract is "muted neutral, visually
//   quieter than a logged day. Never red, never alert-coloured, never labelled
//   'missed', NEVER COUNTED" — so a skipped dose is quieter than a taken one and
//   the screen states NO TOTAL for it. There is no adherence percentage here for
//   exactly that reason.
//
//   And the safety hue appears nowhere near any of it (N3). A missed painkiller
//   is not a red flag.
//
// STATES, derived from the data:
//   noHistory  added, nothing logged yet. Not an empty state to apologise for —
//              it is day one of this medication.
//   history    doses logged. The log is texture, not a grade.
//
// N7 — medications and their reminders are on §9's free-forever list by name.
// ============================================================

import { View } from "react-native";

import { shortDate } from "../../../rules";

import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/recoveryContext";
import { scale } from "../../../theme/tokens.generated";
import type { Medication, MedicationEvent } from "../../../types/recovery";
import { DetailScreen, DetailButton, DetailCard, DetailSection } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

export function MedicationDetail({ medication, onClose }: { medication: Medication; onClose: () => void }) {
  const { tokens } = useAppTheme();
  const { timeline, logMedication } = useRecoveryData();
  const A = tokens.pattern.accumulation;
  const R = tokens.pattern.rest;

  const events = timeline
    .filter((e) => e.type === "medication" && (e.data as MedicationEvent | undefined)?.medicationId === medication.id)
    .map((e) => e.data as MedicationEvent);

  const taken = events.filter((e) => e.status === "taken");
  // NOTE THE ABSENCE: `skipped` is never counted into a figure. It is drawn and
  // not totalled, which is `rest.*`'s contract taken literally.
  const skipped = events.filter((e) => e.status === "skipped");

  return (
    <DetailScreen title={medication.name} onClose={onClose}>
      <DetailCard>
        <Body>{medication.name} · {medication.dosage}</Body>
        <Caption>
          {medication.schedule.join(", ")}
          {medication.endDate ? ` · until ${shortDate(medication.endDate)}` : ""}
        </Caption>
        <Caption>{medication.reminders ? "Reminders on. They never escalate and back off if ignored." : "Reminders off."}</Caption>
      </DetailCard>

      <DetailSection label="Log a dose">
        <View style={{ flexDirection: "row", gap: scale.space[2] }}>
          <View style={{ flex: 1 }}>
            <DetailButton label="Taken" onPress={() => logMedication(medication.id, "taken")} />
          </View>
          <View style={{ flex: 1 }}>
            {/* Identical weight to "Taken". A skip recorded more quietly than it
                is taken would be the screen having an opinion about it. */}
            <DetailButton label="Skipped" onPress={() => logMedication(medication.id, "skipped")} />
          </View>
        </View>
      </DetailSection>

      {events.length === 0 ? (
        <DetailCard>
          <Body>Nothing logged yet.</Body>
          <Caption>This is day one of this medication, not a gap.</Caption>
        </DetailCard>
      ) : (
        <DetailSection label="What happened">
          <DetailCard>
            {/* Dots that only ever accrue. */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: scale.space[1] }}>
              {taken.map((_, i) => (
                <View
                  key={`t-${i}`}
                  style={{
                    width: scale.size.dot,
                    height: scale.size.dot,
                    borderRadius: scale.radius.full,
                    backgroundColor: A.dotFilled,
                  }}
                />
              ))}
              {skipped.map((_, i) => (
                <View
                  key={`s-${i}`}
                  style={{
                    width: scale.size.dot,
                    height: scale.size.dot,
                    borderRadius: scale.radius.full,
                    backgroundColor: R.mark,
                  }}
                />
              ))}
            </View>
            {/* A count of TAKEN only. There is deliberately no "n skipped" and
                no percentage: the moment either exists, this is a scorecard. */}
            <Caption>{taken.length} taken so far.</Caption>
          </DetailCard>
          <Caption>Quieter dots are doses you skipped. They are recorded for your clinician, not scored.</Caption>
        </DetailSection>
      )}
    </DetailScreen>
  );
}
