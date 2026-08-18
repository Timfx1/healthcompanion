import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "./AppButton";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";
import { useOnboarding } from "../state/OnboardingContext";
import { recoveryPhase } from "../data/mockRecoveryPlan";
import { AnalyticsEvents } from "../services/analytics/events";
import { getCurrentUser } from "../services/firebase/auth";
import { trackButtonClick, trackEvent } from "../services/analytics/posthog";

type NextRecoveryAreaCardProps = {
  sourceScreen: "Home" | "Profile" | "Learn";
};

export function NextRecoveryAreaCard({ sourceScreen }: NextRecoveryAreaCardProps) {
  const navigation = useNavigation<any>();
  const { palette } = useAppTheme();
  const { state } = useOnboarding();

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        trackEvent(AnalyticsEvents.nextRecoveryAreaCardViewed, {
          uid: user?.uid,
          sourceScreen,
          injuryType: state.injuryType,
          recoveryGoal: state.goal,
          currentPhase: recoveryPhase.label
        });
      })
      .catch(() => {
        trackEvent(AnalyticsEvents.nextRecoveryAreaCardViewed, {
          sourceScreen,
          injuryType: state.injuryType,
          recoveryGoal: state.goal,
          currentPhase: recoveryPhase.label
        });
      });
  }, [sourceScreen, state.goal, state.injuryType]);

  const openRequestScreen = () => {
    trackButtonClick("Request next area", sourceScreen, {
      sourceScreen,
      injuryType: state.injuryType,
      recoveryGoal: state.goal,
      currentPhase: recoveryPhase.label
    });
    navigation.navigate("NextRecoveryArea", { sourceScreen });
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.infoSoft }]}>
        <Ionicons name="body" size={22} color={palette.blue} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: palette.text }]}>Want support for another injury?</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          Ankle recovery stays our focus. Your vote helps choose what we research next.
        </Text>
      </View>
      <AppButton label="Request next area" variant="secondary" onPress={openRequestScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.lg,
    gap: spacing.md
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  },
  copy: {
    gap: spacing.xs
  },
  title: {
    ...typography.bodyStrong
  },
  subtitle: {
    ...typography.small
  }
});
