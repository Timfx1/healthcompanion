import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { PhaseBadge } from "../../components/PhaseBadge";
import { PremiumLockCard } from "../../components/PremiumLockCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { allExercises, exercises, premiumExercises } from "../../data/mockRecoveryPlan";
import { useAppData } from "../../state/AppDataContext";
import { useAppTheme } from "../../state/AppThemeContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { usePremium } from "../../hooks/usePremium";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent } from "../../services/analytics/posthog";
import { buildProgression } from "../../utils/recoveryInsights";
import { spacing, typography } from "../../theme";

export function PlanScreen() {
  const navigation = useNavigation<any>();
  const { completedExerciseIds, toggleExerciseComplete, painEntries, trackerCheckIns } = useAppData();
  const { state: onboarding } = useOnboarding();
  const { palette, tokens } = useAppTheme();
  const { locked } = usePremium();
  const completedCount = completedExerciseIds.length;

  // The phase and progress bar are derived from the user's own check-ins for
  // everyone. Only the "why" behind the recommendation is a premium feature.
  const progression = buildProgression(painEntries, trackerCheckIns, completedExerciseIds, onboarding.injuryTiming);

  useEffect(() => {
    trackEvent(AnalyticsEvents.progressionViewed, {
      phase: progression.phase.id,
      recommendation: progression.recommendation,
      estimated: progression.estimated
    });
    if (progression.recommendation === "advance") {
      trackEvent(AnalyticsEvents.progressionAdvanced, { phase: progression.phase.id });
    }
  }, [progression.phase.id, progression.recommendation]);

  const openPremiumExercise = (exerciseId: string) => {
    if (locked) {
      trackEvent(AnalyticsEvents.premiumUpgradeClicked, { sourceScreen: "Plan", exerciseId });
      navigation.navigate("TrialPaywall", { mode: "upgrade" });
      return;
    }
    navigation.navigate("ExerciseDetail", { exerciseId });
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>Daily Rehab Plan</Text>
      <PhaseBadge label={progression.phase.label} />
      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressTitle, { color: palette.text }]}>Recovery stage</Text>
          <Text style={[styles.progressCount, { color: tokens.color.accent.strong }]}>{Math.round(progression.progress * 100)}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor: palette.surfaceMuted }]}>
          <View
            style={[styles.fill, { width: `${progression.progress * 100}%`, backgroundColor: tokens.color.accent.default }]}
          />
        </View>
        <Text style={[styles.phaseFocus, { color: palette.textMuted }]}>
          {progression.phase.focus}
          {progression.estimated ? " Based on your injury timing until you start logging check-ins." : ""}
        </Text>
      </View>

      <ProgressionCard
        locked={locked}
        progression={progression}
        palette={palette}
        onOpenSafety={() => navigation.navigate("Safety")}
        onOpenExercise={openPremiumExercise}
      />

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressTitle, { color: palette.text }]}>Today's exercises</Text>
          <Text style={[styles.progressCount, { color: tokens.color.accent.strong }]}>
            {completedCount}/{exercises.length}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: palette.surfaceMuted }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${(completedCount / exercises.length) * 100}%`,
                backgroundColor: tokens.color.accent.default
              }
            ]}
          />
        </View>
      </View>

      <View style={styles.list}>
        {exercises.map((exercise) => {
          const isCompleted = completedExerciseIds.includes(exercise.id);
          return (
            <Pressable
              key={exercise.id}
              style={({ pressed }) => [
                styles.exercise,
                {
                  backgroundColor: isCompleted ? tokens.color.accent.surface : palette.surface,
                  borderColor: isCompleted ? tokens.color.accent.default : palette.borderSoft
                },
                pressed && styles.pressed
              ]}
              onPress={() => navigation.navigate("ExerciseDetail", { exerciseId: exercise.id })}
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isCompleted }}
                onPress={(event) => {
                  event.stopPropagation();
                  toggleExerciseComplete(exercise.id);
                }}
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isCompleted ? tokens.color.accent.default : "transparent",
                    borderColor: isCompleted ? tokens.color.accent.default : palette.border
                  }
                ]}
              >
                {isCompleted ? <Ionicons name="checkmark" size={18} color={palette.background} /> : null}
              </Pressable>
              <View style={styles.exerciseText}>
                <Text style={[styles.exerciseName, { color: palette.text }]}>{exercise.name}</Text>
                <Text style={[styles.purpose, { color: palette.textMuted }]}>{exercise.purpose}</Text>
                <Text style={[styles.meta, { color: tokens.color.accent.strong }]}>
                  {exercise.prescription} · {exercise.difficulty}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.textSubtle} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.libraryHeader}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Extended library</Text>
        <View style={[styles.premiumTag, { backgroundColor: tokens.color.accent.surface }]}>
          <Ionicons name={locked ? "lock-closed" : "sparkles"} size={12} color={tokens.color.accent.default} />
          <Text style={[styles.premiumTagText, { color: tokens.color.accent.strong }]}>Premium</Text>
        </View>
      </View>
      <Text style={[styles.librarySubtitle, { color: palette.textMuted }]}>
        {locked
          ? "Later-stage strength and return-to-activity progressions. Unlock with Premium."
          : "Later-stage strength and return-to-activity progressions."}
      </Text>

      <View style={styles.list}>
        {premiumExercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            style={({ pressed }) => [
              styles.exercise,
              { backgroundColor: palette.surface, borderColor: palette.borderSoft },
              pressed && styles.pressed
            ]}
            onPress={() => openPremiumExercise(exercise.id)}
          >
            <View style={[styles.lockBadge, { backgroundColor: tokens.color.accent.surface }]}>
              <Ionicons name={locked ? "lock-closed" : "sparkles"} size={16} color={tokens.color.accent.default} />
            </View>
            <View style={styles.exerciseText}>
              <Text style={[styles.exerciseName, { color: palette.text }]}>{exercise.name}</Text>
              <Text style={[styles.purpose, { color: palette.textMuted }]}>{exercise.purpose}</Text>
              <Text style={[styles.meta, { color: tokens.color.accent.strong }]}>
                {exercise.prescription} · {exercise.difficulty}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.textSubtle} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

// The adaptive part of progression: why the plan is holding, advancing, or asking
// the user to ease back. Free users see the headline and an upsell; the reasoning
// is the premium feature.
function ProgressionCard({
  locked,
  progression,
  palette,
  onOpenSafety,
  onOpenExercise
}: {
  locked: boolean;
  progression: ReturnType<typeof buildProgression>;
  palette: ReturnType<typeof useAppTheme>["palette"];
  onOpenSafety: () => void;
  onOpenExercise: (exerciseId: string) => void;
}) {
  const { tokens } = useAppTheme();
  const easeBack = progression.recommendation === "ease_back";
  const advance = progression.recommendation === "advance";

  const accent = easeBack ? tokens.pattern.insight.trendDown : advance ? tokens.pattern.insight.trendUp : tokens.color.accent.default;
  const accentSoft = tokens.color.accent.surface;
  const heading = easeBack
    ? "Ease back for now"
    : advance
      ? "You look ready to progress"
      : "Keep building at this stage";

  if (locked) {
    return (
      <PremiumLockCard
        title="Unlock adaptive progression"
        subtitle="See why your plan is holding or advancing, which criteria you have met, and what to add next."
        benefits={["Why you're at this stage", "Criteria still to reach", "What to add next", "Early ease-back warnings"]}
        sourceScreen="Plan"
      />
    );
  }

  return (
    <View style={[styles.progressionCard, { backgroundColor: palette.surface, borderColor: accent }]}>
      <View style={styles.progressionHeader}>
        <View style={[styles.progressionIcon, { backgroundColor: accentSoft }]}>
          <Ionicons name={easeBack ? "warning" : advance ? "trending-up" : "hourglass"} size={18} color={accent} />
        </View>
        <Text style={[styles.progressionTitle, { color: palette.text }]}>{heading}</Text>
      </View>

      {progression.reasons.map((reason) => (
        <View key={reason} style={styles.reasonRow}>
          <Ionicons name="ellipse" size={6} color={palette.textSubtle} style={styles.reasonDot} />
          <Text style={[styles.reasonText, { color: palette.textMuted }]}>{reason}</Text>
        </View>
      ))}

      {/* Rising pain must lead somewhere, not just be reported. */}
      {easeBack ? <AppButton label="See safety guidance" variant="secondary" onPress={onOpenSafety} /> : null}

      {!easeBack && progression.suggestedExercises.length > 0 ? (
        <View style={styles.suggestions}>
          <Text style={[styles.suggestionsLabel, { color: palette.textMuted }]}>Suggested next</Text>
          {progression.suggestedExercises.map((exerciseId) => {
            const exercise = allExercises.find((item) => item.id === exerciseId);
            if (!exercise) return null;
            return (
              <Pressable
                key={exerciseId}
                onPress={() => onOpenExercise(exerciseId)}
                style={({ pressed }) => [
                  styles.suggestion,
                  { borderColor: palette.borderSoft, backgroundColor: palette.surfaceMuted },
                  pressed && styles.pressed
                ]}
              >
                <Ionicons name="sparkles" size={15} color={tokens.color.accent.default} />
                <Text style={[styles.suggestionText, { color: palette.text }]}>{exercise.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={palette.textSubtle} />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  phaseFocus: {
    ...typography.small,
    marginTop: spacing.sm
  },
  progressionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm
  },
  progressionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  progressionIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  progressionTitle: {
    ...typography.bodyStrong,
    flex: 1
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  reasonDot: {
    marginTop: 6
  },
  reasonText: {
    ...typography.small,
    flex: 1
  },
  suggestions: {
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  suggestionsLabel: {
    ...typography.tiny,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg
  },
  suggestionText: {
    ...typography.body,
    flex: 1
  },
  progressCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  progressTitle: {
    ...typography.h3
  },
  progressCount: {
    ...typography.bodyStrong
  },
  track: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  },
  list: {
    gap: spacing.md
  },
  libraryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md
  },
  sectionTitle: {
    ...typography.h3
  },
  premiumTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  premiumTagText: {
    ...typography.tiny,
    fontWeight: "700"
  },
  librarySubtitle: {
    ...typography.small
  },
  lockBadge: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  exercise: {
    minHeight: 112,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  pressed: {
    opacity: 0.86
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  exerciseText: {
    flex: 1,
    gap: spacing.xs
  },
  exerciseName: {
    ...typography.bodyStrong
  },
  purpose: {
    ...typography.small
  },
  meta: {
    ...typography.small
  }
});
