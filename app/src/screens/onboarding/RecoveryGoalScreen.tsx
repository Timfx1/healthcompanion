import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { OptionCard } from "../../components/OptionCard";
import { ProgressHeader } from "../../components/ProgressHeader";
import { ScreenContainer } from "../../components/ScreenContainer";
import { recoveryGoals } from "../../data/onboardingOptions";
import { useOnboarding } from "../../state/OnboardingContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent, trackOnboardingOptionSelected, trackOnboardingStepViewed } from "../../services/analytics/posthog";
import { colors, spacing, typography } from "../../theme";

const goalIcons: (keyof typeof Ionicons.glyphMap)[] = [
  "footsteps-outline",
  "trophy-outline",
  "trending-down-outline",
  "pulse-outline",
  "flash-outline",
  "shield-outline"
];

export function RecoveryGoalScreen() {
  const navigation = useNavigation<any>();
  const { state, setField } = useOnboarding();
  useEffect(() => {
    trackOnboardingStepViewed("Recovery goal", 5);
  }, []);

  const select = (item: string) => {
    setField("goal", item);
    trackOnboardingOptionSelected("Recovery goal", item, { stepNumber: 5 });
  };

  return (
    <ScreenContainer>
      <ProgressHeader step={5} total={5} />
      <View style={styles.header}>
        <Text style={styles.question}>What is your main goal?</Text>
        <Text style={styles.helper}>This helps us personalize your recovery plan.</Text>
      </View>
      <View style={styles.list}>
        {recoveryGoals.map((item, index) => (
          <OptionCard
            key={item}
            label={item}
            icon={goalIcons[index]}
            selected={state.goal === item}
            onPress={() => select(item)}
          />
        ))}
      </View>
      <AppButton
        label="Continue"
        disabled={!state.goal}
        style={{ backgroundColor: colors.blue, borderColor: colors.blue }}
        onPress={() => {
          trackEvent(AnalyticsEvents.onboardingStepCompleted, { stepName: "Recovery goal", stepNumber: 5, recoveryGoal: state.goal });
          navigation.navigate("Notifications");
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  question: {
    ...typography.h1,
    color: colors.text
  },
  list: {
    gap: spacing.md
  },
  header: {
    gap: spacing.sm
  },
  helper: {
    ...typography.body,
    color: colors.textMuted
  }
});
