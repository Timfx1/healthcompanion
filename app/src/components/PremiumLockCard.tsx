import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "./AppButton";
import { useAppTheme } from "../state/AppThemeContext";
import { spacing, typography } from "../theme";
import { PAYWALL_COPY } from "../config/paywall";
import { AnalyticsEvents } from "../services/analytics/events";
import { trackButtonClick, trackEvent } from "../services/analytics/posthog";

type PremiumLockCardProps = {
  title: string;
  subtitle: string;
  benefits?: string[];
  sourceScreen: string;
};

// Reusable upsell shown in place of a premium-only feature for free users.
// Navigates to the "upgrade" paywall (returns the user here after purchase/close).
export function PremiumLockCard({ title, subtitle, benefits, sourceScreen }: PremiumLockCardProps) {
  const navigation = useNavigation<any>();
  const { palette } = useAppTheme();

  useEffect(() => {
    trackEvent(AnalyticsEvents.premiumLockViewed, { sourceScreen });
  }, [sourceScreen]);

  const upgrade = () => {
    trackButtonClick("Unlock Premium", sourceScreen);
    trackEvent(AnalyticsEvents.premiumUpgradeClicked, { sourceScreen });
    navigation.navigate("TrialPaywall", { mode: "upgrade" });
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.infoSoft, borderColor: palette.borderSoft }]}>
        <Ionicons name="lock-closed" size={26} color={palette.purple} />
      </View>
      <Text style={[styles.kicker, { color: palette.purple }]}>Premium feature</Text>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text>

      {benefits && benefits.length > 0 ? (
        <View style={styles.benefits}>
          {benefits.map((benefit) => (
            <View key={benefit} style={styles.benefit}>
              <Ionicons name="sparkles" size={16} color={palette.purple} />
              <Text style={[styles.benefitText, { color: palette.text }]}>{benefit}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <AppButton label="Unlock Premium" icon="sparkles" onPress={upgrade} />
      <Text style={[styles.note, { color: palette.textSubtle }]}>
        {PAYWALL_COPY.trialLength} · {PAYWALL_COPY.monthlyPrice}. Cancel anytime.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 26,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: "center"
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: spacing.xs
  },
  kicker: {
    ...typography.small,
    textAlign: "center"
  },
  title: {
    ...typography.h2,
    textAlign: "center"
  },
  subtitle: {
    ...typography.body,
    textAlign: "center"
  },
  benefits: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginVertical: spacing.md
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  benefitText: {
    ...typography.bodyStrong,
    flex: 1
  },
  note: {
    ...typography.tiny,
    textAlign: "center",
    marginTop: spacing.xs
  }
});
