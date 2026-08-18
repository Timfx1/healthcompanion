import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { spacing, typography } from "../../theme";
import { useOnboarding } from "../../state/OnboardingContext";
import { getCurrentUser, signInAsGuest } from "../../services/firebase/auth";
import { saveOnboardingAnswers } from "../../services/firebase/firestore";
import { AnalyticsEvents } from "../../services/analytics/events";
import { identifyUser, trackEvent } from "../../services/analytics/posthog";
import { PAYWALL_ENABLED } from "../../config/paywall";
import { usePremium } from "../../hooks/usePremium";
import { captureUserMessage } from "../../services/monitoring/errorReporting";

const items = ["Injury stage", "Symptoms", "Mobility level", "Recovery goal", "Safety guidance"];

export function PlanLoadingScreen() {
  const navigation = useNavigation<any>();
  const { state } = useOnboarding();
  const { isPremium } = usePremium();
  const [activeCount, setActiveCount] = useState(0);
  const itemAnimations = useMemo(() => items.map(() => new Animated.Value(0)), []);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.personalizedPlanLoadingViewed, {
      injuryType: state.injuryType,
      injuryTiming: state.injuryTiming,
      recoveryGoal: state.goal,
      walkingAbility: state.walkingAbility,
      painScore: state.pain
    });

    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      saveOnboarding().catch(() => undefined);
    }

    const timeouts = items.map((_, index) =>
      setTimeout(() => {
        setActiveCount(index + 1);
        Animated.spring(itemAnimations[index], {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
          tension: 70
        }).start();
      }, index * 500)
    );

    const navigationTimeout = setTimeout(() => {
      // Never show the paywall to someone who has already subscribed — e.g. a
      // returning subscriber whose local state was cleared by a reinstall.
      navigation.navigate(PAYWALL_ENABLED && !isPremium ? "TrialPaywall" : "FreePlanUnlocked");
    }, 3500);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(navigationTimeout);
    };
  }, []);

  const saveOnboarding = async () => {
    const user = (await getCurrentUser()) ?? (await signInAsGuest());
    const payload = {
      injuryType: state.injuryType,
      injuryTiming: state.injuryTiming,
      symptoms: state.symptoms,
      painScore: state.pain,
      walkingAbility: state.walkingAbility,
      recoveryGoal: state.goal,
      notificationsChoice: state.notificationsChoice
    };
    if (user) {
      identifyUser(user.uid, {
        email: user.email,
        isAnonymous: user.isAnonymous,
        userType: user.isAnonymous ? "guest" : "registered",
        injuryType: state.injuryType,
        injuryTiming: state.injuryTiming,
        recoveryGoal: state.goal,
        onboardingCompleted: true
      });
      try {
        await saveOnboardingAnswers(user.uid, payload);
      } catch (error) {
        captureUserMessage("Onboarding save failed", "warning", {
          source: "firebase",
          uid: user.uid,
          action: "saveOnboardingAnswers",
          errorMessage: error instanceof Error ? error.message : "Unknown onboarding save error"
        });
        // Do not block entry into the free plan if Firestore is unavailable.
      }
    }
    trackEvent(AnalyticsEvents.onboardingCompleted, payload);
  };

  return (
    <LinearGradient colors={["#DDEEFF", "#F8FBFF", "#FFFFFF"]} style={styles.gradient}>
      <ScreenContainer scroll={false} style={styles.transparentSafe} contentStyle={styles.content}>
        <View style={styles.centered}>
          <View style={styles.pulseCircle}>
            <Ionicons name="footsteps" size={34} color="#2F7DE1" />
          </View>
          <Text style={styles.title}>Building your ankle recovery plan</Text>
          <Text style={styles.subtext}>Analyzing your answers to shape today's first steps.</Text>
          <View style={styles.checklist}>
            {items.map((item, index) => {
              const active = index < activeCount;
              const scale = itemAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1]
              });
              return (
                <Animated.View
                  key={item}
                  style={[
                    styles.item,
                    active ? styles.itemActive : styles.itemInactive,
                    { transform: [{ scale }] }
                  ]}
                >
                  <View style={[styles.checkIcon, active ? styles.checkIconActive : styles.checkIconInactive]}>
                    {active ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={[styles.itemText, active ? styles.itemTextActive : styles.itemTextInactive]}>{item}</Text>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  transparentSafe: {
    backgroundColor: "transparent"
  },
  content: {
    flex: 1,
    justifyContent: "center"
  },
  centered: {
    alignItems: "center",
    gap: spacing.lg
  },
  pulseCircle: {
    width: 82,
    height: 82,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#2F7DE1",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  title: {
    ...typography.h1,
    color: "#111827",
    textAlign: "center"
  },
  subtext: {
    ...typography.body,
    color: "#5E6B7C",
    textAlign: "center"
  },
  checklist: {
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.md
  },
  item: {
    minHeight: 60,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  itemInactive: {
    backgroundColor: "#EEF2F6"
  },
  itemActive: {
    backgroundColor: "#E8F8EF"
  },
  checkIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  checkIconInactive: {
    backgroundColor: "#D5DEE8"
  },
  checkIconActive: {
    backgroundColor: "#18A35F"
  },
  itemText: {
    ...typography.bodyStrong
  },
  itemTextInactive: {
    color: "#7A8796"
  },
  itemTextActive: {
    color: "#13643B"
  }
});
