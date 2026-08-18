import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ProgressHeader } from "../../components/ProgressHeader";
import { ScreenContainer } from "../../components/ScreenContainer";
import { symptomOptions } from "../../data/onboardingOptions";
import { useOnboarding } from "../../state/OnboardingContext";
import { useAppTheme } from "../../state/AppThemeContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent, trackOnboardingOptionSelected, trackOnboardingStepViewed } from "../../services/analytics/posthog";
import { colors, spacing, typography } from "../../theme";

export function SymptomsScreen() {
  const navigation = useNavigation<any>();
  const { palette, tokens } = useAppTheme();
  const { state, toggleSymptom } = useOnboarding();
  useEffect(() => {
    trackOnboardingStepViewed("Symptoms", 3);
  }, []);

  const select = (item: string) => {
    toggleSymptom(item);
    trackOnboardingOptionSelected("Symptoms", item, { stepNumber: 3 });
  };

  return (
    <ScreenContainer>
      <ProgressHeader step={3} total={5} />
      <View style={styles.header}>
        <Text style={styles.question}>What symptoms are you experiencing?</Text>
        <Text style={styles.helper}>Select all that apply.</Text>
      </View>
      <View style={[styles.infoBox, { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default }]}>
        <Text style={[styles.infoText, { color: palette.textMuted }]}>
          This app provides guidance, not a medical diagnosis.
        </Text>
      </View>
      <View style={styles.grid}>
        {symptomOptions.map((item) => {
          const selected = state.symptoms.includes(item);
          return (
            <Pressable
              key={item}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => select(item)}
              style={({ pressed }) => [
                styles.gridCard,
                { backgroundColor: palette.surface, borderColor: palette.borderSoft },
                selected && { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default },
                pressed && styles.pressed
              ]}
            >
              <Text style={[styles.gridText, { color: palette.text }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <AppButton
        label="Continue"
        disabled={state.symptoms.length === 0}
        style={{ backgroundColor: tokens.color.accent.default, borderColor: tokens.color.accent.default }}
        onPress={() => {
          trackEvent(AnalyticsEvents.onboardingStepCompleted, { stepName: "Symptoms", stepNumber: 3, symptoms: state.symptoms });
          navigation.navigate("PainWalking");
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
  header: {
    gap: spacing.sm
  },
  helper: {
    ...typography.body,
    color: colors.textMuted
  },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg
  },
  infoText: {
    ...typography.small
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md
  },
  gridCard: {
    width: "48%",
    minHeight: 84,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg
  },
  pressed: {
    opacity: 0.85
  },
  gridText: {
    ...typography.bodyStrong,
    textAlign: "center"
  }
});
