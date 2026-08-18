import { Alert, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { getCurrentUser, signInAsGuest } from "../../services/firebase/auth";
import { joinPremiumWaitlist } from "../../services/firebase/firestore";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackButtonClick, trackEvent, trackWaitlistJoined } from "../../services/analytics/posthog";

const features = [
  "Advanced progress insights",
  "Smarter rehab progression",
  "Return-to-sport readiness tools",
  "Exportable recovery reports",
  "Extended exercise library"
];

function getWaitlistErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown waitlist error";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("client is offline") || lowerMessage.includes("offline")) {
    return [
      "The app could not reach Cloud Firestore yet.",
      "",
      "Check your phone connection, then restart Metro with a clear cache. If this continues, confirm Firestore rules allow signed-in users to write premiumWaitlist/{uid}.",
      "",
      "You can still continue with the free plan."
    ].join("\n");
  }

  if (lowerMessage.includes("permission") || lowerMessage.includes("permission-denied")) {
    if (lowerMessage.includes("consumer_invalid") || lowerMessage.includes("permission denied on resource project")) {
      return [
        "Firestore is rejecting the Firebase project ID in your app config.",
        "",
        `The app is using project ID: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "missing"}`,
        "",
        "Open Firebase Console > Project settings > General and copy the exact Project ID into EXPO_PUBLIC_FIREBASE_PROJECT_ID, then restart Metro with a clear cache.",
        "",
        "Also confirm Cloud Firestore API is enabled for that same project."
      ].join("\n");
    }
    return "Cloud Firestore rejected the waitlist write. Publish the Firestore test rules from README, then try again.";
  }

  return `${message}\n\nYou can still continue with the free plan.`;
}

export function PremiumTeaserScreen() {
  const navigation = useNavigation<any>();
  const { palette } = useAppTheme();
  const { completeOnboarding } = useAppData();
  const { state } = useOnboarding();
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.premiumScreenViewed, {
      injuryType: state.injuryType,
      recoveryGoal: state.goal,
      sourceScreen: "PremiumTeaser"
    });
  }, []);

  const free = () => {
    trackButtonClick("Continue with Free Plan", "PremiumTeaser");
    trackEvent(AnalyticsEvents.continueFreePlanClicked);
    completeOnboarding();
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Main" }] }));
      return;
    }
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "MainTabs" }] }));
  };

  const joinWaitlist = async () => {
    if (hasJoined || isJoining) return;
    setIsJoining(true);
    trackButtonClick("Join Premium Waitlist", "PremiumTeaser");
    trackEvent(AnalyticsEvents.premiumWaitlistClicked, {
      injuryType: state.injuryType,
      recoveryGoal: state.goal,
      sourceScreen: "PremiumTeaser"
    });
    try {
      const user = (await getCurrentUser()) ?? (await signInAsGuest());
      if (!user) {
        throw new Error("Guest sign-in did not return a Firebase user. Check that Anonymous sign-in is enabled.");
      }
      const idToken = await user.getIdToken(true);
      const result = await joinPremiumWaitlist({
        uid: user.uid,
        email: user.email,
        idToken,
        sourceScreen: "PremiumTeaser",
        injuryType: state.injuryType,
        recoveryGoal: state.goal
      });
      setHasJoined(true);
      trackWaitlistJoined({
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        injuryType: state.injuryType,
        recoveryGoal: state.goal,
        sourceScreen: "PremiumTeaser",
        alreadyJoined: result.alreadyJoined
      });
      Alert.alert("You're on the list", "Premium is still optional. You can keep using the free plan now.");
    } catch (error) {
      trackEvent(AnalyticsEvents.premiumWaitlistFailed, {
        injuryType: state.injuryType,
        recoveryGoal: state.goal,
        sourceScreen: "PremiumTeaser"
      });
      if (__DEV__) {
        console.log("[AnklePath/Waitlist] Join failed", {
          message: error instanceof Error ? error.message : "Unknown waitlist error"
        });
      }
      Alert.alert(
        "Could not join waitlist",
        __DEV__ ? getWaitlistErrorMessage(error) : "Please try again later. You can still continue with the free plan."
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: palette.infoSoft, borderColor: palette.borderSoft }]}>
          <Ionicons name="sparkles" size={30} color={palette.purple} />
        </View>
        <Text style={[styles.kicker, { color: palette.purple }]}>Optional upgrade</Text>
        <Text style={[styles.title, { color: palette.text }]}>Unlock more recovery tools</Text>
        <Text style={[styles.subtext, { color: palette.textMuted }]}>Get extra guidance when you need it, while continuing to use the free plan.</Text>
      </View>
      <View style={[styles.price, { backgroundColor: palette.infoSoft, borderColor: palette.borderSoft }]}>
        <Text style={[styles.priceText, { color: palette.text }]}>Coming soon</Text>
        <Text style={[styles.priceSubtext, { color: palette.textMuted }]}>No payment today. The free plan stays open.</Text>
      </View>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        {features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <Ionicons name="sparkles" size={19} color={palette.purple} />
            <Text style={[styles.featureText, { color: palette.text }]}>{feature}</Text>
          </View>
        ))}
      </View>
      <AppButton label="Continue with Free Plan" onPress={free} />
      <AppButton
        label={hasJoined ? "Waitlist Joined" : isJoining ? "Joining..." : "Join Premium Waitlist"}
        variant="secondary"
        onPress={joinWaitlist}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xxxl
  },
  header: {
    alignItems: "center",
    gap: spacing.md
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
  price: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
  },
  priceText: {
    ...typography.h2
  },
  priceSubtext: {
    ...typography.small,
    marginTop: spacing.xs
  },
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: 26,
    borderWidth: 1,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  featureText: {
    ...typography.bodyStrong
  }
});
