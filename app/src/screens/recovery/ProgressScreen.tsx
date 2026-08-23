// ============================================================
// SCREEN: Progress — insights, trends and the corridor. Spec §5, §4.6, §4.12.
//
// P4 IS THE RULE THIS SCREEN IS BUILT AROUND: "Never show a chart without a
// plain-language sentence above it." Not beside, not below — above. "Data with
// no payoff" is a top churn cause, and a chart is not a payoff; a sentence
// somebody can repeat to their physiotherapist is.
//
// So every visual block here is preceded by an `InsightSentence`, and the
// sentence is generated from the same data the chart draws. If a block ever
// appears here without one, the screen has stopped doing its job.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE CORRIDOR IS A RANGE (P5, N5)
//
// "Most people with an ankle sprain can bear weight around weeks 2–4" — a
// common experience, with a source, and an easy path to "everyone heals
// differently". Never a deadline, never a target line, and there is no state in
// which this screen can tell somebody they are behind. Past the last phase the
// corridor simply stops rather than pinning the final phase in place, because a
// phase that never ends reads as an overdue notice.
//
// The content is PLACEHOLDER and says so, out loud, in the UI — held to the
// same standard as the safety content, and it must not ship without review.
//
// ─────────────────────────────────────────────────────────────────────────────
// HISTORY FADE (P9)
//
// Free history is 30 days; older history sits behind a soft gradient fade and
// an "unlock full history" pill. A soft fade, never a hard wall, and never a
// modal that interrupts. The doctor report is NOT subject to this — it reads
// the whole history, free, forever (P6/N6).
// ============================================================

import { useMemo } from "react";
import { ScrollView, View } from "react-native";

import { useAppTheme } from "../../state/AppThemeContext";
import { useRecoveryData } from "../../state/RecoveryDataContext";
import { scale } from "../../theme/tokens.generated";
import { dayNumber, type CheckIn, type Trend } from "../../types/recovery";
import { EVERYONE_HEALS_DIFFERENTLY, corridorFor, phaseForDay } from "../../data/recoveryCorridors";
import { Body, Card, Caption, InsightSentence, QuietButton, SectionLabel, Title } from "../../components/recovery/primitives";

const FREE_HISTORY_DAYS = 30;

/** Trend vocabulary is improving / worsening / steady everywhere — screen, paper, report. */
function painTrend(recent: number[], earlier: number[]): { trend: Trend; text: string } {
  if (recent.length < 2 || earlier.length < 2) {
    return { trend: "steady", text: "Not enough logged yet to describe a trend. That is fine — it builds up." };
  }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const delta = avg(recent) - avg(earlier);
  if (delta <= -0.5) return { trend: "improving", text: "Pain has been lower over the last two weeks than the two before." };
  if (delta >= 0.5) return { trend: "worsening", text: "Pain has been higher over the last two weeks than the two before." };
  return { trend: "steady", text: "Pain has held about the same over the last two weeks." };
}

export function RecoveryProgressScreen({ onUnlock }: { onUnlock: () => void }) {
  const { tokens } = useAppTheme();
  const { journey, timeline } = useRecoveryData();

  const day = dayNumber(journey.startDate);
  const corridor = corridorFor(journey.condition);
  const phase = corridor ? phaseForDay(corridor, day) : undefined;

  const { trend, text, painPoints, hiddenCount } = useMemo(() => {
    const now = Date.now();
    const withPain = timeline
      .filter((e) => e.type === "checkin" && typeof (e.data as CheckIn | undefined)?.pain === "number")
      .map((e) => ({ at: new Date(e.date).getTime(), pain: (e.data as CheckIn).pain as number }))
      .sort((a, b) => a.at - b.at);

    const fortnight = 14 * 86_400_000;
    const recent = withPain.filter((p) => p.at >= now - fortnight).map((p) => p.pain);
    const earlier = withPain.filter((p) => p.at < now - fortnight && p.at >= now - 2 * fortnight).map((p) => p.pain);
    const cutoff = now - FREE_HISTORY_DAYS * 86_400_000;

    return {
      ...painTrend(recent, earlier),
      painPoints: withPain.filter((p) => p.at >= cutoff),
      hiddenCount: withPain.filter((p) => p.at < cutoff).length,
    };
  }, [timeline]);

  const maxPain = 10;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.color.surface.base }}
      contentContainerStyle={{ padding: scale.space[4], gap: scale.space[4] }}
    >
      <Title>Progress</Title>

      {/* P4: the sentence comes FIRST, and the chart illustrates it. */}
      <Card>
        <SectionLabel>PAIN</SectionLabel>
        <InsightSentence text={text} trend={trend} />

        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: scale.space[1], height: scale.size.buttonPrimary }}>
          {painPoints.map((p, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                // A chart bar is a MARK, and the accent is the right role for a
                // series with no category of its own. Never `mark` as a stroke
                // that carries meaning — that is the ink role's job.
                backgroundColor: tokens.color.accent.default,
                height: `${Math.max(6, (p.pain / maxPain) * 100)}%`,
                borderRadius: scale.radius.xxs,
              }}
            />
          ))}
          {painPoints.length === 0 && <Caption>No pain scores logged in this window.</Caption>}
        </View>

        {/* P9 history fade. A soft pill, never a wall, and the free experience
            below it stays completely intact. */}
        {hiddenCount > 0 && (
          <View
            style={{
              backgroundColor: tokens.pattern.historyFade.pillFill,
              borderColor: tokens.pattern.historyFade.pillEdge,
              borderWidth: scale.size.hairline,
              borderRadius: scale.radius.full,
              paddingVertical: scale.space[2],
              paddingHorizontal: scale.space[4],
              alignSelf: "flex-start",
            }}
          >
            <Body style={{ color: tokens.pattern.historyFade.pillLabel }}>
              {hiddenCount} earlier entries · Unlock full history
            </Body>
          </View>
        )}
        {hiddenCount > 0 && (
          <Caption>Your doctor report always uses the whole history, free.</Caption>
        )}
      </Card>

      {/* P5 / N5: a RANGE, with a source, and the caveat one tap away. */}
      {corridor && (
        <Card>
          <SectionLabel>COMMON RANGE</SectionLabel>
          {phase ? (
            <>
              <Body>{phase.label}</Body>
              <Caption>
                Days {phase.fromDay}–{phase.toDay}
                {phase.typicalPainRange
                  ? ` · pain commonly around ${phase.typicalPainRange[0]}–${phase.typicalPainRange[1]}`
                  : ""}
              </Caption>
              <Caption>{phase.sourceNote}</Caption>
            </>
          ) : (
            <Body>You are past the ranges we have for this condition. That is not late — it just means the common-experience data stops here.</Body>
          )}
          <Caption>{EVERYONE_HEALS_DIFFERENTLY}</Caption>
          {corridor.needsClinicalReview && (
            <Caption>
              NEEDS CLINICAL REVIEW — this content is placeholder and has not been reviewed by a clinician.
            </Caption>
          )}
        </Card>
      )}

      <Card>
        <SectionLabel>MORE DEPTH</SectionLabel>
        <Body>Correlations across sleep, activity and pain.</Body>
        <Caption>Part of premium. Everything above stays free.</Caption>
        <QuietButton label="See what is included" onPress={onUnlock} />
      </Card>
    </ScrollView>
  );
}
