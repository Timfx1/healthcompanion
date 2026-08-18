import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { PremiumLockCard } from "../../components/PremiumLockCard";
import { SafetyAlert } from "../../components/SafetyAlert";
import { ScreenContainer } from "../../components/ScreenContainer";
import { useAppData } from "../../state/AppDataContext";
import { AppPalette, useAppTheme } from "../../state/AppThemeContext";
import { usePremium } from "../../hooks/usePremium";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent } from "../../services/analytics/posthog";
import { ReadinessCriterion, buildReadiness } from "../../utils/recoveryInsights";
import { spacing, typography } from "../../theme";

// Return-to-sport readiness.
//
// This screen must never read as medical clearance. It reports which of the
// signs physios commonly look for the user's own logs currently show, and always
// points back to a clinician for the actual decision. Wording here is
// deliberately conservative — see the SafetyAlert at the bottom.

const VERDICT_COPY = {
  keep_building: {
    title: "Keep building",
    body: "Several of the signs below are not showing yet. Staying with your current phase is the right call for now."
  },
  nearly_there: {
    title: "Getting closer",
    body: "Some signs are showing and others are not yet. Keep working the criteria that are still open."
  },
  encouraging: {
    title: "Signs look encouraging",
    body: "Your logs currently show all four signs. That is a good place to have the return-to-sport conversation with a clinician."
  }
} as const;

export function ReadinessScreen() {
  const navigation = useNavigation<any>();
  const { palette } = useAppTheme();
  const { painEntries, trackerCheckIns, completedExerciseIds } = useAppData();
  const { locked } = usePremium();

  const readiness = buildReadiness(painEntries, trackerCheckIns, completedExerciseIds);

  useEffect(() => {
    if (locked) return;
    trackEvent(AnalyticsEvents.readinessViewed, { score: readiness.score, verdict: readiness.verdict });
    readiness.criteria
      .filter((criterion) => criterion.met)
      .forEach((criterion) => trackEvent(AnalyticsEvents.readinessCriterionMet, { criterion: criterion.id }));
  }, [locked, readiness.score]);

  if (locked) {
    return (
      <ScreenContainer>
        <Text style={[styles.title, { color: palette.text }]}>Return-to-sport readiness</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          Check your own logs against the signs physios commonly look for before returning to sport.
        </Text>
        <View style={{ marginTop: spacing.md }}>
          <PremiumLockCard
            title="Unlock readiness tracking"
            subtitle="See which return-to-sport signs your check-ins show, and exactly what is still missing."
            benefits={["Pain and swelling checks", "Movement and walking checks", "Balance and hop control", "What is still missing"]}
            sourceScreen="Readiness"
          />
        </View>
      </ScreenContainer>
    );
  }

  const metCount = readiness.criteria.filter((criterion) => criterion.met).length;
  const verdict = VERDICT_COPY[readiness.verdict];

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>Return-to-sport readiness</Text>
      <Text style={[styles.subtitle, { color: palette.textMuted }]}>
        Based on the signs described in the "When can I return to sport?" guide, checked against your own logs.
      </Text>

      {!readiness.hasData ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
          <Ionicons name="clipboard-outline" size={34} color={palette.blue} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Nothing logged yet</Text>
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            These are the four signs this screen will track for you once you start logging on the Track tab.
          </Text>
        </View>
      ) : (
        <View style={[styles.scoreCard, { backgroundColor: palette.infoSoft, borderColor: palette.blue }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color: palette.text }]}>
              {metCount}
              <Text style={[styles.scoreTotal, { color: palette.textMuted }]}>/{readiness.criteria.length}</Text>
            </Text>
            <View style={styles.scoreCopy}>
              <Text style={[styles.verdictTitle, { color: palette.text }]}>{verdict.title}</Text>
              <Text style={[styles.verdictBody, { color: palette.textMuted }]}>{verdict.body}</Text>
            </View>
          </View>
          <View style={[styles.track, { backgroundColor: palette.surfaceMuted }]}>
            <View style={[styles.fill, { width: `${readiness.score}%`, backgroundColor: palette.teal }]} />
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: palette.text }]}>The four signs</Text>
      <View style={styles.list}>
        {readiness.criteria.map((criterion) => (
          <CriterionRow key={criterion.id} palette={palette} criterion={criterion} hasData={readiness.hasData} />
        ))}
      </View>

      <SafetyAlert text="These are signs physios commonly look for — they are not medical clearance. Confirm with a clinician before returning to sport, and stop if pain or giving way returns." />

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("ArticleDetail", { articleId: "return-to-sport" })}
        style={({ pressed }) => [
          styles.readMore,
          { borderColor: palette.borderSoft, backgroundColor: palette.surface },
          pressed && styles.pressed
        ]}
      >
        <Ionicons name="book-outline" size={18} color={palette.blue} />
        <Text style={[styles.readMoreText, { color: palette.text }]}>Read: When can I return to sport?</Text>
        <Ionicons name="chevron-forward" size={18} color={palette.textSubtle} />
      </Pressable>
    </ScreenContainer>
  );
}

function CriterionRow({
  palette,
  criterion,
  hasData
}: {
  palette: AppPalette;
  criterion: ReadinessCriterion;
  hasData: boolean;
}) {
  // With no logs at all, show the criteria as a neutral goal list rather than
  // four red crosses on a brand new user's first visit.
  const showAsGoal = !hasData;
  const iconName = showAsGoal ? "ellipse-outline" : criterion.met ? "checkmark-circle" : "close-circle";
  const iconColor = showAsGoal ? palette.textSubtle : criterion.met ? palette.green : palette.amber;

  return (
    <View style={[styles.criterion, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
      <Ionicons name={iconName} size={22} color={iconColor} />
      <View style={styles.criterionCopy}>
        <Text style={[styles.criterionLabel, { color: palette.text }]}>{criterion.label}</Text>
        <Text style={[styles.criterionGap, { color: palette.textMuted }]}>{criterion.gap}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  subtitle: {
    ...typography.body
  },
  empty: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm
  },
  emptyTitle: {
    ...typography.h3
  },
  emptyText: {
    ...typography.small,
    textAlign: "center"
  },
  scoreCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg
  },
  score: {
    ...typography.h1
  },
  scoreTotal: {
    ...typography.h3
  },
  scoreCopy: {
    flex: 1,
    gap: spacing.xs
  },
  verdictTitle: {
    ...typography.bodyStrong
  },
  verdictBody: {
    ...typography.small
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  },
  sectionTitle: {
    ...typography.h3
  },
  list: {
    gap: spacing.sm
  },
  criterion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg
  },
  criterionCopy: {
    flex: 1,
    gap: spacing.xs
  },
  criterionLabel: {
    ...typography.bodyStrong
  },
  criterionGap: {
    ...typography.small
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg
  },
  readMoreText: {
    ...typography.body,
    flex: 1
  },
  pressed: {
    opacity: 0.7
  }
});
