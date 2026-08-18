import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { OptionCard } from "../../components/OptionCard";
import { ProgressHeader } from "../../components/ProgressHeader";
import { ScreenContainer } from "../../components/ScreenContainer";
import { injuryTimingOptions } from "../../data/onboardingOptions";
import { estimateInjuryDaysAgo } from "../../data/mockRecoveryPlan";
import { useOnboarding } from "../../state/OnboardingContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent, trackOnboardingOptionSelected, trackOnboardingStepViewed } from "../../services/analytics/posthog";
import { colors, spacing, typography } from "../../theme";

export function InjuryTimingScreen() {
  const navigation = useNavigation<any>();
  const { state, setField } = useOnboarding();
  useEffect(() => {
    trackOnboardingStepViewed("Injury timing", 2);
  }, []);

  const select = (item: string) => {
    setField("injuryTiming", item);
    const daysAgo = estimateInjuryDaysAgo(item);
    setField(
      "injuryDate",
      daysAgo != null ? new Date(Date.now() - daysAgo * 86_400_000).toISOString() : undefined
    );
    trackOnboardingOptionSelected("Injury timing", item, { stepNumber: 2 });
  };

  return (
    <ScreenContainer>
      <ProgressHeader step={2} total={5} />
      <View style={styles.header}>
        <Text style={styles.question}>When did the injury happen?</Text>
        <Text style={styles.helper}>This helps us personalize your recovery plan.</Text>
      </View>
      <View style={styles.list}>
        {injuryTimingOptions.map((item) => (
          <OptionCard key={item} label={item} selected={state.injuryTiming === item} onPress={() => select(item)} />
        ))}
      </View>
      <AppButton
        label="Continue"
        disabled={!state.injuryTiming}
        style={{ backgroundColor: colors.blue, borderColor: colors.blue }}
        onPress={() => {
          trackEvent(AnalyticsEvents.onboardingStepCompleted, { stepName: "Injury timing", stepNumber: 2, injuryTiming: state.injuryTiming });
          navigation.navigate("Symptoms");
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
