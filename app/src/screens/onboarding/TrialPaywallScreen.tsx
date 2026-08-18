import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { OnboardingStackParamList } from "../../navigation/types";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackButtonClick, trackEvent } from "../../services/analytics/posthog";
import { BILLING_ENABLED, PAYWALL_COPY } from "../../config/paywall";
import { LEGAL } from "../../config/legal";
import { getCurrentUser } from "../../services/firebase/auth";
import { getPremiumOffer, purchasePremiumPackage, restorePremiumPurchases, PremiumOffer } from "../../services/billing/revenueCat";

export function TrialPaywallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<OnboardingStackParamList, "TrialPaywall">>();
  const { palette , tokens } = useAppTheme();
  const { state } = useOnboarding();
  const { setPremiumActive } = useAppData();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offer, setOffer] = useState<PremiumOffer | null>(null);

  // "upgrade" = opened later from a locked feature; "onboarding" = the wizard step.
  const isUpgrade = route.params?.mode === "upgrade";

  // Prefer the store's localized, currency-converted price over static EUR copy.
  const priceText = offer ? `${offer.priceString} / ${offer.periodLabel}` : PAYWALL_COPY.monthlyPrice;
  const monthlyLabel = offer ? `Subscribe monthly - ${offer.priceString}` : PAYWALL_COPY.monthlyLabel;
  const trialText = offer?.hasFreeTrial ? (offer.trialLabel ?? PAYWALL_COPY.trialLength) : PAYWALL_COPY.trialLength;
  // Primary CTA never promises a trial the actual store product doesn't offer.
  const trialLabel =
    offer && !offer.hasFreeTrial
      ? monthlyLabel
      : offer?.trialLabel
        ? `Start ${offer.trialLabel} trial`
        : PAYWALL_COPY.trialLabel;

  useEffect(() => {
    trackEvent(AnalyticsEvents.paywallViewed, {
      injuryType: state.injuryType,
      recoveryGoal: state.goal,
      sourceScreen: isUpgrade ? "UpgradePaywall" : "TrialPaywall"
    });
    // Load localized pricing from the store when billing is live.
    if (BILLING_ENABLED) {
      getPremiumOffer().then(setOffer).catch(() => undefined);
    }
  }, []);

  const openLegal = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => undefined));
  };

  // After a successful purchase/restore (or "continue free"), return the user to
  // where they came from when upgrading, or forward through onboarding otherwise.
  const leaveAfterUnlock = () => {
    if (isUpgrade && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("FreePlanUnlocked");
  };

  const continueFree = () => {
    trackButtonClick("Continue with Free Plan", "TrialPaywall");
    trackEvent(AnalyticsEvents.paywallSkipped, {
      injuryType: state.injuryType,
      recoveryGoal: state.goal,
      sourceScreen: isUpgrade ? "UpgradePaywall" : "TrialPaywall"
    });
    leaveAfterUnlock();
  };

  /**
   * A subscription has to belong to someone.
   *
   * Guests are anonymous to us: they cannot restore the purchase on a new
   * device, we cannot answer a billing question about them, and they cannot even
   * set a name. Firebase links the anonymous account to the new credential, so
   * signing in here keeps their uid, their check-ins and any entitlement.
   */
  const requiresAccount = async () => {
    const user = await getCurrentUser();
    if (user && !user.isAnonymous) return false;

    trackEvent(AnalyticsEvents.paywallAccountRequired, { sourceScreen: isUpgrade ? "UpgradePaywall" : "TrialPaywall" });
    Alert.alert(
      "Create an account first",
      "Your subscription is tied to your account, so you can restore it on another device. It only takes a moment — your progress so far is kept.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Continue", onPress: () => navigation.navigate("SignUp", { mode: "upgrade" }) }
      ]
    );
    return true;
  };

  const purchase = async (kind: "trial" | "monthly") => {
    trackButtonClick(kind === "trial" ? PAYWALL_COPY.trialLabel : PAYWALL_COPY.monthlyLabel, "TrialPaywall");
    trackEvent(kind === "trial" ? AnalyticsEvents.paywallTrialClicked : AnalyticsEvents.paywallMonthlyClicked, {
      injuryType: state.injuryType,
      recoveryGoal: state.goal,
      price: PAYWALL_COPY.monthlyPrice,
      trialLength: PAYWALL_COPY.trialLength,
      sourceScreen: "TrialPaywall"
    });

    if (!BILLING_ENABLED) {
      Alert.alert(
        "Billing not connected yet",
        "This paywall is ready to activate later. Before charging users, finish RevenueCat and Google Play Billing setup, then enable billing in the app config."
      );
      return;
    }

    if (await requiresAccount()) return;

    setIsPurchasing(true);
    const user = await getCurrentUser();
    const result = await purchasePremiumPackage(user?.uid);
    setIsPurchasing(false);

    if (result.success && result.active) {
      setPremiumActive(true);
      trackEvent(AnalyticsEvents.premiumActivated, { plan: kind, price: PAYWALL_COPY.monthlyPrice });
      Alert.alert("Premium active", "Your premium recovery tools are unlocked.", [
        { text: "Continue", onPress: leaveAfterUnlock }
      ]);
      return;
    }

    if (result.message !== "Purchase cancelled.") {
      Alert.alert("Purchase not completed", result.message ?? "Please try again later.");
    }
  };

  const restorePurchases = async () => {
    trackButtonClick("Restore purchases", "TrialPaywall");
    trackEvent(AnalyticsEvents.paywallRestoreClicked, { sourceScreen: isUpgrade ? "UpgradePaywall" : "TrialPaywall" });
    if (!BILLING_ENABLED) {
      Alert.alert("Billing not connected yet", "Restore purchases will work after billing is enabled.");
      return;
    }
    setIsRestoring(true);
    const user = await getCurrentUser();
    const result = await restorePremiumPurchases(user?.uid);
    setIsRestoring(false);

    if (result.success && result.active) {
      setPremiumActive(true);
      trackEvent(AnalyticsEvents.premiumRestored);

      // Restore itself is never gated: Apple requires the button to work, and
      // reviewers test it. But a restored subscription sitting on an anonymous
      // account is the same orphan we prevent at purchase, so ask afterwards
      // instead of blocking. Premium is already active either way — declining
      // costs them nothing today.
      if (!user || user.isAnonymous) {
        trackEvent(AnalyticsEvents.restoreAccountPrompted);
        Alert.alert(
          "Premium restored",
          "Add an account to keep it. Without one, this subscription cannot be restored again if you change phone or reinstall.",
          [
            { text: "Later", style: "cancel", onPress: leaveAfterUnlock },
            { text: "Add account", onPress: () => navigation.navigate("SignUp", { mode: "upgrade" }) }
          ]
        );
        return;
      }

      Alert.alert("Purchases restored", "Your premium recovery tools are active.", [
        { text: "Continue", onPress: leaveAfterUnlock }
      ]);
      return;
    }

    Alert.alert("No active subscription found", result.message ?? "We could not find an active premium subscription.");
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: tokens.color.accent.surface, borderColor: palette.borderSoft }]}>
          <Ionicons name="shield-checkmark" size={30} color={tokens.color.accent.default} />
        </View>
        <Text style={[styles.kicker, { color: tokens.color.accent.strong }]}>Premium recovery plan</Text>
        <Text style={[styles.title, { color: palette.text }]}>Recover with full guidance</Text>
        <Text style={[styles.subtext, { color: palette.textMuted }]}>
          Add deeper tracking, smarter progression, and return-to-sport tools when you are ready.
        </Text>
      </View>

      <View style={[styles.offerCard, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        <View style={styles.offerTopRow}>
          <View>
            <Text style={[styles.trial, { color: tokens.color.accent.strong }]}>{trialText}</Text>
            <Text style={[styles.price, { color: palette.text }]}>{priceText}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: tokens.color.accent.surface }]}>
            <Text style={[styles.badgeText, { color: tokens.color.category.mood.ink }]}>No charge today</Text>
          </View>
        </View>
        <Text style={[styles.offerNote, { color: palette.textMuted }]}>
          Cancel anytime during the trial. The free plan remains available while billing is inactive.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        {PAYWALL_COPY.benefits.map((feature) => (
          <View key={feature} style={styles.feature}>
            <View style={[styles.check, { backgroundColor: tokens.color.accent.surface }]}>
              <Ionicons name="checkmark" size={17} color={tokens.color.accent.default} />
            </View>
            <Text style={[styles.featureText, { color: palette.text }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton
          label={isPurchasing ? "Opening checkout..." : trialLabel}
          icon="sparkles"
          disabled={isPurchasing || isRestoring}
          onPress={() => purchase("trial")}
        />
        <AppButton
          label={monthlyLabel}
          variant="secondary"
          disabled={isPurchasing || isRestoring}
          onPress={() => purchase("monthly")}
        />
        <AppButton
          label={isRestoring ? "Restoring..." : "Restore purchases"}
          variant="ghost"
          disabled={isPurchasing || isRestoring}
          onPress={restorePurchases}
        />
        <AppButton label="Continue with Free Plan" variant="ghost" onPress={continueFree} />
      </View>

      <Text style={[styles.finePrint, { color: palette.textSubtle }]}>
        AnklePath Premium is an auto-renewing subscription billed at {priceText} through your{" "}
        {Platform.OS === "ios" ? "App Store" : "Google Play"} account.{" "}
        {offer?.hasFreeTrial
          ? `Your ${trialText} free trial converts to a paid subscription unless you cancel at least 24 hours before it ends. `
          : ""}
        It renews automatically until you cancel it in your store account settings. The free plan always stays available.
      </Text>
      <View style={styles.legalRow}>
        <Pressable accessibilityRole="link" onPress={() => openLegal(LEGAL.termsUrl)}>
          <Text style={[styles.legalLink, { color: tokens.color.accent.strong }]}>Terms of Use</Text>
        </Pressable>
        <Text style={[styles.legalDot, { color: palette.textSubtle }]}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => openLegal(LEGAL.privacyUrl)}>
          <Text style={[styles.legalLink, { color: tokens.color.accent.strong }]}>Privacy Policy</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xxxl,
    gap: spacing.lg
  },
  header: {
    alignItems: "center",
    gap: spacing.sm
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
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
  offerCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: spacing.xl,
    gap: spacing.md
  },
  offerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md
  },
  trial: {
    ...typography.bodyStrong
  },
  price: {
    ...typography.h2,
    marginTop: spacing.xs
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  badgeText: {
    ...typography.tiny
  },
  offerNote: {
    ...typography.small
  },
  card: {
    borderWidth: 1,
    borderRadius: 26,
    padding: spacing.xl,
    gap: spacing.lg
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  featureText: {
    ...typography.bodyStrong,
    flex: 1
  },
  actions: {
    gap: spacing.md
  },
  finePrint: {
    ...typography.tiny,
    textAlign: "center"
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  legalLink: {
    ...typography.tiny,
    fontWeight: "700"
  },
  legalDot: {
    ...typography.tiny
  }
});
