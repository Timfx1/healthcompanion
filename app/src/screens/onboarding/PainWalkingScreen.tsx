import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { OptionCard } from "../../components/OptionCard";
import { ProgressHeader } from "../../components/ProgressHeader";
import { SafetyAlert } from "../../components/SafetyAlert";
import { ScreenContainer } from "../../components/ScreenContainer";
import { walkingOptions } from "../../data/onboardingOptions";
import { useOnboarding } from "../../state/OnboardingContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent, trackOnboardingOptionSelected, trackOnboardingStepViewed } from "../../services/analytics/posthog";
import { colors, spacing, typography } from "../../theme";

export function PainWalkingScreen() {
  const navigation = useNavigation<any>();
  const { state, setField } = useOnboarding();
  useEffect(() => {
    trackOnboardingStepViewed("Pain and mobility", 4);
  }, []);

  return (
    <ScreenContainer>
      <ProgressHeader step={4} total={5} />
      <Text style={styles.screenTitle}>Pain and walking ability</Text>
      <Text style={styles.question}>How painful is it today?</Text>
      <View style={styles.anchorRow}>
        <Text style={styles.anchorLabel}>No pain</Text>
        <Text style={styles.painValue}>{state.pain ?? "–"}</Text>
        <Text style={styles.anchorLabel}>Worst pain</Text>
      </View>
      <View style={styles.scale}>
        {Array.from({ length: 11 }, (_, pain) => (
          <Pressable
            key={pain}
            onPress={() => {
              setField("pain", pain);
              trackOnboardingOptionSelected("Pain score", `${pain}`, { stepNumber: 4, painScore: pain });
            }}
            style={[styles.painPill, state.pain === pain && styles.painSelected]}
          >
            <Text style={[styles.painText, state.pain === pain && styles.painTextSelected]}>{pain}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.questionSmall}>Can you walk on the injured ankle?</Text>
      <View style={styles.list}>
        {walkingOptions.map((item) => (
          <OptionCard
            key={item}
            label={item}
            selected={state.walkingAbility === item}
            onPress={() => {
              setField("walkingAbility", item);
              trackOnboardingOptionSelected("Walking ability", item, { stepNumber: 4 });
            }}
          />
        ))}
      </View>
      <SafetyAlert text="Severe pain, deformity, numbness, or inability to bear weight may require medical attention." />
      <AppButton
        label="Continue"
        // Both answers are required now that pain has no pre-selected default.
        disabled={state.pain === undefined || !state.walkingAbility}
        style={{ backgroundColor: colors.blue, borderColor: colors.blue }}
        onPress={() => {
          trackEvent(AnalyticsEvents.onboardingStepCompleted, {
            stepName: "Pain and mobility",
            stepNumber: 4,
            painScore: state.pain,
            walkingAbility: state.walkingAbility
          });
          navigation.navigate("RecoveryGoal");
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    ...typography.h1,
    color: colors.text
  },
  question: {
    ...typography.bodyStrong,
    color: colors.text
  },
  questionSmall: {
    ...typography.h2,
    color: colors.text
  },
  anchorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  anchorLabel: {
    ...typography.small,
    color: colors.textMuted
  },
  painValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.blue
  },
  scale: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  painPill: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  painSelected: {
    backgroundColor: colors.blue,
    borderColor: colors.blue
  },
  painText: {
    ...typography.bodyStrong,
    color: colors.text
  },
  painTextSelected: {
    color: colors.background
  },
  list: {
    gap: spacing.md
  }
});
