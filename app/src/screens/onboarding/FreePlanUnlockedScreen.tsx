import { StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";
import { usePremium } from "../../hooks/usePremium";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackButtonClick, trackEvent } from "../../services/analytics/posthog";

const benefits = ["Daily guided exercises", "Pain and swelling tracking", "Recovery timeline", "Safety guidance", "Education articles"];

export function FreePlanUnlockedScreen() {
  const navigation = useNavigation<any>();
  const { palette, tokens } = useAppTheme();
  const { completeOnboarding } = useAppData();
  const { isPremium, gatingActive } = usePremium();
  useEffect(() => {
    trackEvent(AnalyticsEvents.freePlanUnlockedViewed);
  }, []);

  const start = () => {
    trackButtonClick("Start My Plan", "FreePlanUnlocked");
    trackEvent(AnalyticsEvents.startMyPlanClicked);
    completeOnboarding();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Main" }] }));
  };

  const seePremium = () => {
    trackButtonClick("See Premium Features", "FreePlanUnlocked");
    // Once the app is genuinely selling, the teaser's "Coming soon / join the
    // waitlist" copy is false — send them to the real paywall instead.
    navigation.navigate(gatingActive ? "TrialPaywall" : "PremiumTeaser", gatingActive ? { mode: "upgrade" } : undefined);
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.success}>
        <View style={[styles.successIcon, { backgroundColor: tokens.color.category.mood.mark, shadowColor: tokens.color.category.mood.mark }]}>
          <Ionicons name="checkmark" size={38} color={palette.background} />
        </View>
        <Text style={[styles.kicker, { color: tokens.color.category.mood.ink }]}>Free plan unlocked</Text>
        <Text style={[styles.title, { color: palette.text }]}>Your recovery plan is ready</Text>
        <Text style={[styles.subtext, { color: palette.textMuted }]}>
          Start with guided exercises, tracking, and clear education for your current recovery stage.
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <View style={[styles.benefitIcon, { backgroundColor: tokens.color.accent.surface }]}>
              <Ionicons name="checkmark" size={16} color={tokens.color.category.mood.ink} />
            </View>
            <Text style={[styles.benefitText, { color: palette.text }]}>{benefit}</Text>
          </View>
        ))}
      </View>
      <AppButton label="Start My Plan" onPress={start} />
      {/* Nothing to sell to someone who already subscribed. */}
      {isPremium ? null : <AppButton label="See Premium Features" variant="secondary" onPress={seePremium} />}
      <Text style={[styles.note, { color: palette.textMuted }]}>Premium is optional. You can start free.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xxxl
  },
  success: {
    alignItems: "center",
    gap: spacing.md
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  kicker: {
    ...typography.small,
    textAlign: "center"
  },
  title: {
    ...typography.h1,
    textAlign: "center"
  },
  subtext: {
    ...typography.body,
    textAlign: "center"
  },
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: 26,
    borderWidth: 1,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  benefitIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    ...typography.bodyStrong
  },
  note: {
    ...typography.small,
    textAlign: "center"
  }
});
