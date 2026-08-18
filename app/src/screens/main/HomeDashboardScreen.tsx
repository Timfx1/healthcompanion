import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { InfoCard } from "../../components/InfoCard";
import { NextRecoveryAreaCard } from "../../components/NextRecoveryAreaCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { StatCard } from "../../components/StatCard";
import { injuryDayLabel, todaysCards } from "../../data/mockRecoveryPlan";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackButtonClick, trackEvent } from "../../services/analytics/posthog";
import { buildProgression } from "../../utils/recoveryInsights";
import { usePremium } from "../../hooks/usePremium";

export function HomeDashboardScreen() {
  const navigation = useNavigation<any>();
  const { palette } = useAppTheme();
  const { completedExerciseIds, painEntries, trackerCheckIns } = useAppData();
  const { state } = useOnboarding();
  const exerciseProgress = Math.min(1, completedExerciseIds.length / 4);
  const dayLabel = injuryDayLabel(state.injuryTiming, state.injuryDate);
  // Same derived phase as the Plan tab — otherwise Home would still show the old
  // frozen constant while Plan showed the user's real stage.
  const progression = buildProgression(painEntries, trackerCheckIns, completedExerciseIds, state.injuryTiming);
  const { locked } = usePremium();

  const openUpgrade = () => {
    trackButtonClick("Unlock Premium", "Home");
    trackEvent(AnalyticsEvents.homeUpgradeClicked);
    navigation.navigate("TrialPaywall", { mode: "upgrade" });
  };

  return (
    <ScreenContainer>
      <View style={[styles.headerHero, { backgroundColor: palette.blue }]}>
        <View>
          <Text style={styles.kicker}>AnklePath</Text>
          <Text style={styles.title}>Today's Recovery Plan</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="footsteps" size={22} color={palette.blueDark} />
        </View>
        <View style={styles.statusCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <View style={styles.phasePill}>
                <Text style={styles.phasePillText}>{progression.phase.label}</Text>
              </View>
              <Text style={styles.day}>{dayLabel}</Text>
              <Text style={styles.message}>{progression.phase.focus}</Text>
            </View>
          </View>
          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Weekly plan progress</Text>
              <Text style={styles.progressValue}>{completedExerciseIds.length} of 4 exercises</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${exerciseProgress * 100}%` }]} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.hero}>
        <View style={styles.stats}>
          <StatCard value={`${completedExerciseIds.length}/4`} label="completed" />
          <StatCard value={painEntries[0] ? `${painEntries[0].pain}/10` : "No log"} label="latest pain" />
        </View>
      </View>
      {/* The only upgrade entry point on the tab everyone lands on. Shown solely
          to users who are actually locked out — subscribers and everyone before
          launch never see it. */}
      {locked ? (
        <Pressable
          accessibilityRole="button"
          onPress={openUpgrade}
          style={({ pressed }) => [
            styles.upgrade,
            { backgroundColor: palette.surface, borderColor: palette.purple },
            pressed && styles.pressed
          ]}
        >
          <View style={[styles.upgradeIcon, { backgroundColor: palette.infoSoft }]}>
            <Ionicons name="sparkles" size={20} color={palette.purple} />
          </View>
          <View style={styles.upgradeCopy}>
            <Text style={[styles.upgradeTitle, { color: palette.text }]}>Unlock your recovery report</Text>
            <Text style={[styles.upgradeText, { color: palette.textMuted }]}>
              Plus return-to-sport readiness and the extended exercise library.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.textSubtle} />
        </Pressable>
      ) : null}

      <Text style={[styles.sectionTitle, { color: palette.text }]}>Today</Text>
      <View style={styles.cards}>
        {todaysCards.map((card) => (
          <InfoCard
            key={card.title}
            title={card.title}
            subtitle={card.subtitle}
            icon={card.icon}
            onPress={() => {
              if (card.title === "Pain check-in") {
                trackButtonClick("Pain check-in", "Home");
                trackEvent(AnalyticsEvents.painCheckinClicked, { screen: "Home" });
                navigation.navigate("PainCheckIn");
              }
              if (card.title === "Safety") {
                trackButtonClick("Safety", "Home");
                trackEvent(AnalyticsEvents.redFlagsClicked, { screen: "Home" });
                navigation.navigate("Safety");
              }
              if (card.title === "Today's exercises") {
                trackButtonClick("Today's exercises", "Home");
                trackEvent(AnalyticsEvents.todaysExercisesClicked, { screen: "Home" });
                navigation.navigate("Plan");
              }
              if (card.title === "Learn") {
                trackButtonClick("Learn", "Home");
                trackEvent(AnalyticsEvents.learnArticleClicked, { screen: "Home" });
                navigation.navigate("Learn");
              }
              if (card.title === "Swelling tracker") {
                trackButtonClick("Swelling tracker", "Home");
                trackEvent(AnalyticsEvents.swellingTrackerClicked, { screen: "Home" });
                navigation.navigate("Track");
              }
            }}
          />
        ))}
        <NextRecoveryAreaCard sourceScreen="Home" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: "#FFFFFF"
  },
  kicker: {
    ...typography.small,
    color: "rgba(255,255,255,0.82)",
    marginBottom: spacing.xs
  },
  headerHero: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginHorizontal: -spacing.xl,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    gap: spacing.xl
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    position: "absolute",
    top: spacing.xxxl,
    right: spacing.xl
  },
  hero: {
    gap: spacing.lg
  },
  statusCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.20)",
    padding: spacing.lg,
    gap: spacing.lg
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg
  },
  heroCopy: {
    flex: 1,
    gap: spacing.md
  },
  day: {
    ...typography.h2,
    color: "#FFFFFF"
  },
  phasePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.24)"
  },
  phasePillText: {
    ...typography.small,
    color: "#FFFFFF"
  },
  progressWrap: {
    gap: spacing.sm
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  progressLabel: {
    ...typography.small,
    color: "rgba(255,255,255,0.78)"
  },
  progressValue: {
    ...typography.small,
    color: "#FFFFFF"
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFFFFF"
  },
  message: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)"
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md
  },
  upgrade: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg
  },
  upgradeIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  upgradeCopy: {
    flex: 1,
    gap: 2
  },
  upgradeTitle: {
    ...typography.bodyStrong
  },
  upgradeText: {
    ...typography.small
  },
  pressed: {
    opacity: 0.7
  },
  sectionTitle: {
    ...typography.h2
  },
  cards: {
    gap: spacing.md
  }
});
