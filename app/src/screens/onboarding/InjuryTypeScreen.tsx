import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { OptionCard } from "../../components/OptionCard";
import { ProgressHeader } from "../../components/ProgressHeader";
import { ScreenContainer } from "../../components/ScreenContainer";
import { injuryTypes } from "../../data/onboardingOptions";
import { useOnboarding } from "../../state/OnboardingContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent, trackOnboardingOptionSelected, trackOnboardingStepViewed } from "../../services/analytics/posthog";
import { colors, spacing, typography , tokens } from "../../theme";

const injuryTypeIcons: (keyof typeof Ionicons.glyphMap)[] = [
  "information-circle-outline",
  "flash-outline",
  "pulse-outline",
  "shield-outline",
  "footsteps-outline",
  "help-circle-outline"
];

export function InjuryTypeScreen() {
  const navigation = useNavigation<any>();
  const { state, setField } = useOnboarding();
  useEffect(() => {
    trackEvent(AnalyticsEvents.onboardingStarted);
    trackOnboardingStepViewed("Injury stage", 1);
  }, []);

  const select = (item: string) => {
    setField("injuryType", item);
    trackOnboardingOptionSelected("Injury stage", item, { stepNumber: 1 });
  };

  return (
    <ScreenContainer>
      <ProgressHeader step={1} total={5} />
      <View style={styles.header}>
        <Text style={styles.question}>What best describes your ankle issue?</Text>
        <Text style={styles.helper}>Select the option that matches your situation.</Text>
      </View>
      <View style={styles.list}>
        {injuryTypes.map((item, index) => (
          <OptionCard
            key={item}
            label={item}
            icon={injuryTypeIcons[index]}
            selected={state.injuryType === item}
            onPress={() => select(item)}
          />
        ))}
      </View>
      <AppButton
        label="Continue"
        disabled={!state.injuryType}
        style={{ backgroundColor: tokens.color.accent.default, borderColor: tokens.color.accent.default }}
        onPress={() => {
          trackEvent(AnalyticsEvents.onboardingStepCompleted, { stepName: "Injury stage", stepNumber: 1, injuryType: state.injuryType });
          navigation.navigate("InjuryTiming");
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
