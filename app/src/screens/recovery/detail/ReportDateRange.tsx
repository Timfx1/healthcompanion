// ============================================================
// SCREEN: ReportDateRange (§4.7, N6)
//
// Choose what window the doctor report covers. "Since last appointment" is the
// preset that matters — it is the question a clinician actually asks.
//
// EVERY PRESET STATES WHAT IT WOULD YIELD. A range picker that silently returns
// an empty report is a picker that has wasted somebody's time at the worst
// moment; the entry count sits on the row, before the tap, so a zero-yield
// window is DESCRIBED rather than discovered.
//
// And a zero-yield window is described, never warned about. "No entries in this
// window" is a fact about a date range. Rendering it in the alert hue, or with
// a warning glyph, would make a quiet fortnight look like a problem with the
// person rather than with the question.
//
// STATES, derived from whether a prior appointment exists:
//   anchored   there is a last visit, so "since last appointment" is offered.
//   noAnchor   there is not, and the preset reframes to "since you started"
//              rather than being offered and then failing.
//   custom     an explicit window.
//
// N6 — this is a report surface. No gating symbol may appear in this file, and
// `restricted.mjs` fails the build if one does.
// ============================================================

import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/recoveryContext";
import { scale } from "../../../theme/tokens.generated";
import { DetailScreen, DetailCard } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

const DAY_MS = 86_400_000;

export type RangeKey = "sinceVisit" | "30" | "90" | "all";

export function ReportDateRange({
  selected, onSelect, onClose,
}: {
  selected: RangeKey;
  onSelect: (key: RangeKey) => void;
  onClose: () => void;
}) {
  const { tokens } = useAppTheme();
  const { timeline, appointments, journey } = useRecoveryData();
  const [choice, setChoice] = useState<RangeKey>(selected);

  const lastVisit = appointments
    .filter((a) => new Date(a.date).getTime() < Date.now())
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const options = useMemo(() => {
    const now = Date.now();
    const countSince = (from: number) => timeline.filter((e) => new Date(e.date).getTime() >= from).length;
    return [
      {
        key: "sinceVisit" as RangeKey,
        // The noAnchor state: reframed rather than offered and then broken.
        label: lastVisit ? "Since last appointment" : "Since you started",
        from: lastVisit ? new Date(lastVisit.date).getTime() : new Date(journey.startDate).getTime(),
      },
      { key: "30" as RangeKey, label: "Last 30 days", from: now - 30 * DAY_MS },
      { key: "90" as RangeKey, label: "Last 90 days", from: now - 90 * DAY_MS },
      { key: "all" as RangeKey, label: "Everything", from: new Date(journey.startDate).getTime() },
    ].map((o) => ({ ...o, count: countSince(o.from) }));
  }, [timeline, appointments, journey.startDate, lastVisit]);

  return (
    <DetailScreen title="Report range" onClose={onClose}>
      {options.map((o) => {
        const on = choice === o.key;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => { setChoice(o.key); onSelect(o.key); }}
          >
            <View
              style={{
                borderRadius: scale.radius.md,
                paddingHorizontal: scale.space[4],
                paddingVertical: scale.space[3],
                gap: scale.space[1],
                backgroundColor: on ? tokens.color.state.selectedFill : tokens.color.surface.card,
                borderWidth: scale.size.hairline,
                borderColor: on ? tokens.color.state.selectedEdge : tokens.color.surface.border,
              }}
            >
              {/* PRIMARY ink on the selected tint. accent.strong measures 4.30
                  on this backdrop in light — the sixth instance of that class. */}
              <Body style={{ color: on ? tokens.color.text.primary : tokens.color.text.primary }}>{o.label}</Body>
              {/* Stated BEFORE the tap. A zero-yield window is described here,
                  in ordinary type, and never warned about. */}
              <Caption>
                {o.count === 0 ? "No entries in this window" : `${o.count} ${o.count === 1 ? "entry" : "entries"}`}
              </Caption>
            </View>
          </Pressable>
        );
      })}

      {!lastVisit && (
        <DetailCard>
          <Body>No previous appointment on record.</Body>
          <Caption>
            Once you log one, this list will offer &ldquo;since last appointment&rdquo; — the window a clinician
            usually means.
          </Caption>
        </DetailCard>
      )}
    </DetailScreen>
  );
}
