import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { OptionCard } from "../../components/OptionCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { recoveryAreaOptions, RecoveryAreaOption } from "../../data/recoveryAreaOptions";
import { recoveryPhase } from "../../data/mockRecoveryPlan";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { getCurrentUser, signInAsGuest } from "../../services/firebase/auth";
import { saveNextRecoveryAreaRequest } from "../../services/firebase/firestore";
import { trackEvent } from "../../services/analytics/posthog";
import { captureAppError } from "../../services/monitoring/errorReporting";

type RouteParams = {
  sourceScreen?: string;
};

export function NextRecoveryAreaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as RouteParams;
  const sourceScreen = params.sourceScreen ?? "Unknown";
  const { palette } = useAppTheme();
  const { state } = useOnboarding();
  const [selectedArea, setSelectedArea] = useState<RecoveryAreaOption | null>(null);
  const [otherText, setOtherText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectArea = (area: RecoveryAreaOption) => {
    setSelectedArea(area);
    getCurrentUser()
      .then((user) => {
        trackEvent(AnalyticsEvents.nextRecoveryAreaSelected, {
          uid: user?.uid,
          selectedArea: area,
          sourceScreen,
          injuryType: state.injuryType,
          recoveryGoal: state.goal,
          currentPhase: recoveryPhase.label
        });
      })
      .catch(() => {
        trackEvent(AnalyticsEvents.nextRecoveryAreaSelected, {
          selectedArea: area,
          sourceScreen,
          injuryType: state.injuryType,
          recoveryGoal: state.goal,
          currentPhase: recoveryPhase.label
        });
      });
  };

  const submitRequest = async () => {
    if (!selectedArea) {
      Alert.alert("Choose an area", "Select the recovery area you would like us to consider next.");
      return;
    }

    if (selectedArea === "Other" && !otherText.trim()) {
      Alert.alert("Tell us what you need", "Add a short note so we know what recovery area you mean.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = (await getCurrentUser()) ?? (await signInAsGuest());
      await saveNextRecoveryAreaRequest({
        uid: user?.uid,
        selectedArea,
        otherText,
        sourceScreen,
        injuryType: state.injuryType,
        recoveryGoal: state.goal,
        currentPhase: recoveryPhase.label
      });

      trackEvent(AnalyticsEvents.nextRecoveryAreaSubmitted, {
        uid: user?.uid,
        selectedArea,
        sourceScreen,
        injuryType: state.injuryType,
        recoveryGoal: state.goal,
        currentPhase: recoveryPhase.label
      });
      setSubmitted(true);
    } catch (error) {
      captureAppError(error, {
        source: "firebase",
        action: "saveNextRecoveryAreaRequest",
        sourceScreen,
        selectedArea
      });
      Alert.alert(
        "Could not submit request",
        "We could not save your request right now. Please check your connection and try again."
      );
      if (__DEV__) {
        console.log("[AnklePath/FeatureRequest] Submit failed", {
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <ScreenContainer contentStyle={styles.successContent}>
        <View style={[styles.successCard, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
          <Text style={[styles.successTitle, { color: palette.text }]}>
            Thanks - this helps us decide what to build next.
          </Text>
          <Text style={[styles.successText, { color: palette.textMuted }]}>
            Ankle recovery remains the current AnklePath focus while we learn what support users want next.
          </Text>
          <AppButton label="Back to app" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>What should we support next?</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          Ankle recovery is our first focus. Tell us which area you would like guidance for next.
        </Text>
      </View>

      <View style={styles.options}>
        {recoveryAreaOptions.map((area) => (
          <OptionCard
            key={area}
            label={area}
            selected={selectedArea === area}
            onPress={() => selectArea(area)}
          />
        ))}
      </View>

      {selectedArea === "Other" ? (
        <View style={styles.otherWrap}>
          <Text style={[styles.inputLabel, { color: palette.text }]}>Tell us what you need</Text>
          <TextInput
            value={otherText}
            onChangeText={setOtherText}
            placeholder="Example: elbow, neck, post-surgery rehab..."
            placeholderTextColor={palette.textSubtle}
            multiline
            style={[
              styles.input,
              {
                backgroundColor: palette.surface,
                borderColor: palette.borderSoft,
                color: palette.text
              }
            ]}
          />
        </View>
      ) : null}

      <AppButton
        label={isSubmitting ? "Submitting..." : "Submit request"}
        disabled={isSubmitting}
        onPress={submitRequest}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm
  },
  title: {
    ...typography.h1
  },
  subtitle: {
    ...typography.body
  },
  options: {
    gap: spacing.md
  },
  otherWrap: {
    gap: spacing.sm
  },
  inputLabel: {
    ...typography.bodyStrong
  },
  input: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.lg,
    ...typography.body,
    textAlignVertical: "top"
  },
  successContent: {
    flex: 1,
    justifyContent: "center"
  },
  successCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.lg
  },
  successTitle: {
    ...typography.h2
  },
  successText: {
    ...typography.body
  }
});
