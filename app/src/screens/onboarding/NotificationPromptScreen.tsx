import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { useOnboarding } from "../../state/OnboardingContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackButtonClick, trackEvent, trackOnboardingStepViewed } from "../../services/analytics/posthog";
import { colors, spacing, typography } from "../../theme";

const benefits = ["Daily recovery reminders", "Exercise check-ins", "Recovery milestone reminders"];

export function NotificationPromptScreen() {
  const navigation = useNavigation<any>();
  const { setField } = useOnboarding();
  useEffect(() => {
    trackOnboardingStepViewed("Notifications", 6);
    trackEvent(AnalyticsEvents.notificationPromptViewed);
  }, []);
  const next = (choice: "enabled" | "later") => {
    setField("notificationsChoice", choice);
    trackButtonClick(choice === "enabled" ? "Enable Notifications" : "Maybe Later", "Notifications");
    trackEvent(choice === "enabled" ? AnalyticsEvents.notificationEnabledClicked : AnalyticsEvents.notificationMaybeLaterClicked);
    navigation.navigate("PlanLoading");
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Stay on track with reminders</Text>
      <View style={styles.card}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <Ionicons name="notifications" size={20} color={colors.blue} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>
      <AppButton
        label="Enable Notifications"
        style={{ backgroundColor: colors.blue, borderColor: colors.blue }}
        onPress={() => next("enabled")}
      />
      <AppButton label="Maybe Later" variant="secondary" onPress={() => next("later")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    color: colors.text
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  benefitText: {
    ...typography.bodyStrong,
    color: colors.text
  }
});
