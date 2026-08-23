// ============================================================
// SCREEN: ReportPreview — the doctor report (§4.7, P6, N6)
//
// One artifact, two readers.
//   For the CLINICIAN: what changed since last visit, absorbable in 60 seconds.
//   For the PATIENT:   I have something worth showing, and I control what is in it.
//
// The in-app preview is NOT the print artifact. It is the patient's view of what
// the clinician will see, plus the controls. The printed form is a different
// MEDIUM with its own palette (`tokens/print.json`, 7:1 body contrast).
//
// ─────────────────────────────────────────────────────────────────────────────
// N6 — FREE FOREVER
//
// No lock badge, no paywall, no premium treatment on this surface or its
// export, and no `locked` prop to add one with. This file is registered in
// `restricted.mjs` as a report surface, so importing a gating symbol here FAILS
// THE BUILD. That is deliberate: an audit found the report gated or sold in ten
// places, two of which had already been photographed into passing baselines.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATE vs RENDERING VARIANT
//
// DEPTH — derived from the data, never set by hand:
//   empty   nothing logged. Reachable on DAY ONE, because the report is two
//           taps from Home and a curious new user will tap it. It must say what
//           it becomes without shaming the gap (P2).
//   sparse  logged, but too little to claim a trend. This is where a lesser
//           design draws "improving" from two points. It degrades instead.
//   first   enough data, no prior visit. The data is fine; the ANCHOR is
//           missing, so the range reframes to "since you started".
//   ready   data and a prior visit. The normal case.
//
// CHANGE BLOCK — the visually dominant element, so its degradation IS the
// design:
//   noAnchor | insufficient | noChange | changes
//   `noChange` is the guilt-risk case: it must read as information, never as
//   failure. "Steady" is a legitimate finding and the report says so.
//
// EXPLICITLY NOT A STATE: free/premium. There is one entitlement state here by
// design, which is what N6 means in practice.
// ============================================================

import { useMemo } from "react";
import { View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/RecoveryDataContext";
import { scale } from "../../../theme/tokens.generated";
import { dayNumber, type CheckIn, type Trend } from "../../../types/recovery";
import { DetailScreen, DetailButton, DetailCard, DetailSection } from "../../../components/recovery/DetailScreen";
import { Body, Caption, InsightSentence } from "../../../components/recovery/primitives";

export type ReportDepth = "empty" | "sparse" | "first" | "ready";
export type ChangeState = "noAnchor" | "insufficient" | "noChange" | "changes";

const MIN_FOR_TREND = 4;

export function ReportPreview({
  onClose, onOpenRange,
}: {
  onClose: () => void;
  onOpenRange: () => void;
}) {
  const { tokens } = useAppTheme();
  const { journey, timeline, medications, appointments, photos } = useRecoveryData();

  const model = useMemo(() => {
    const inRange = [...timeline].sort((a, b) => b.date.localeCompare(a.date));
    const pains = inRange
      .filter((e) => e.type === "checkin" && typeof (e.data as CheckIn | undefined)?.pain === "number")
      .map((e) => (e.data as CheckIn).pain as number);

    const lastVisit = appointments
      .filter((a) => new Date(a.date).getTime() < Date.now())
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const depth: ReportDepth =
      inRange.length === 0 ? "empty"
        : pains.length < MIN_FOR_TREND ? "sparse"
          : !lastVisit ? "first"
            : "ready";

    // Split around the anchor, not around "now". "Since last visit" has to mean
    // since the visit or the block is a different claim wearing its label.
    const anchor = lastVisit ? new Date(lastVisit.date).getTime() : undefined;
    const since = anchor ? pains.slice(0, inRange.filter((e) => new Date(e.date).getTime() >= anchor).length) : [];
    const before = anchor ? pains.slice(since.length) : [];

    let change: ChangeState = "noAnchor";
    let trend: Trend = "steady";
    let changeText = "";
    if (anchor) {
      if (since.length < 2 || before.length < 2) {
        change = "insufficient";
      } else {
        const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
        const delta = avg(since) - avg(before);
        if (Math.abs(delta) < 0.5) {
          change = "noChange";
          trend = "steady";
          changeText = "Pain has held steady since the last visit.";
        } else {
          change = "changes";
          trend = delta < 0 ? "improving" : "worsening";
          changeText =
            delta < 0
              ? "Pain has been lower on average since the last visit."
              : "Pain has been higher on average since the last visit.";
        }
      }
    }

    return { depth, change, trend, changeText, entries: inRange, lastVisit, pains };
  }, [timeline, appointments]);

  const day = dayNumber(journey.startDate);

  return (
    <DetailScreen
      title="Doctor report"
      onClose={onClose}
      action={<DetailButton label="Range" onPress={onOpenRange} />}
    >
      {/* MASTHEAD. Typographic — Recovery Companion has no brandmark, and
          AnklePath's was removed rather than replaced. */}
      <DetailSection label="OVERVIEW">
        <DetailCard>
          <Body>{journey.condition}</Body>
          <Caption>
            Day {day} · started {new Date(journey.startDate).toLocaleDateString()}
            {model.lastVisit ? ` · since ${new Date(model.lastVisit.date).toLocaleDateString()}` : " · since you started"}
          </Caption>
        </DetailCard>
      </DetailSection>

      {model.depth === "empty" ? (
        <DetailCard>
          <Body>Nothing to report yet.</Body>
          <Caption>
            Once you have checked in a few times, this becomes a one-page summary of what changed — the kind a
            clinician can read in a minute. Nothing is required of you before then.
          </Caption>
        </DetailCard>
      ) : (
        <>
          {/* THE CHANGE BLOCK — the visually dominant element, on the accent
              tint. The heading takes PRIMARY ink: text.secondary on this tint
              measures 4.49:1 over a card, which is the failure class §11
              records six times over. */}
          <View
            style={{
              borderRadius: scale.radius.lg,
              padding: scale.space[4],
              gap: scale.space[2],
              backgroundColor: tokens.pattern.report.changeBlock,
            }}
          >
            <Body style={{ fontWeight: "700" }}>What changed since your last visit</Body>
            {model.change === "noAnchor" && (
              <Body>This is the first report, so there is nothing to compare against yet. Everything below is since you started.</Body>
            )}
            {model.change === "insufficient" && (
              <Body>Not enough logged either side of the last visit to compare fairly. The history below is still complete.</Body>
            )}
            {(model.change === "noChange" || model.change === "changes") && (
              <InsightSentence text={model.changeText} trend={model.trend} />
            )}
            {model.change === "noChange" && (
              // The guilt-risk case, stated as the finding it is.
              <Body>Steady is a finding, not a lack of one.</Body>
            )}
          </View>

          {model.depth === "sparse" && (
            <DetailCard>
              <Body>Not enough yet to describe a trend.</Body>
              <Caption>
                A few more check-ins and this section will fill in. What is here is accurate; it is simply short.
              </Caption>
            </DetailCard>
          )}

          <DetailSection label="PAIN">
            {model.pains.length >= MIN_FOR_TREND ? (
              <DetailCard>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: scale.space[1], height: scale.size.buttonPrimary }}>
                  {model.pains.slice(0, 20).reverse().map((p, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: tokens.color.accent.default,
                        height: `${Math.max(6, (p / 10) * 100)}%`,
                        borderRadius: scale.radius.xxs,
                      }}
                    />
                  ))}
                </View>
                <Caption>{model.pains.length} pain scores logged.</Caption>
              </DetailCard>
            ) : (
              <DetailCard><Caption>{model.pains.length} pain scores logged so far.</Caption></DetailCard>
            )}
          </DetailSection>

          <DetailSection label="KEY EVENTS">
            {model.entries
              .filter((e) => e.type === "milestone" || e.type === "journal")
              .slice(0, 6)
              .map((e) => (
                <DetailCard key={e.id}>
                  <Body>{e.title}</Body>
                  <Caption>{new Date(e.date).toLocaleDateString()}</Caption>
                </DetailCard>
              ))}
          </DetailSection>

          <DetailSection label="MEDICATIONS">
            {medications.map((m) => (
              <DetailCard key={m.id}>
                <Body>{m.name} · {m.dosage}</Body>
                <Caption>{m.schedule.join(", ")}</Caption>
              </DetailCard>
            ))}
          </DetailSection>

          {photos.length > 0 && (
            <DetailSection label="PHOTOS">
              <DetailCard><Caption>{photos.length} on file, on this device.</Caption></DetailCard>
            </DetailSection>
          )}

          {!!model.lastVisit?.questions.length && (
            <DetailSection label="QUESTIONS YOU ASKED">
              {model.lastVisit.questions.map((q, i) => (
                <DetailCard key={i}><Body>{q}</Body></DetailCard>
              ))}
            </DetailSection>
          )}
        </>
      )}

      {/* Free forever, and it says so where somebody would look for a price. */}
      <Caption>This report is always free, including export.</Caption>
    </DetailScreen>
  );
}
