import { useState } from "react";
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/AppButton";
import { SafetyAlert } from "../../components/SafetyAlert";
import { ScreenContainer } from "../../components/ScreenContainer";
import { useAppData } from "../../state/AppDataContext";
import { useAppTheme } from "../../state/AppThemeContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { buildDoctorSummary } from "../../utils/doctorSummary";
import { buildProgression } from "../../utils/recoveryInsights";
import { spacing, typography } from "../../theme";

const warnings = [
  "Cannot bear weight",
  "Severe swelling or deformity",
  "Numbness or tingling",
  "Pain getting worse",
  "Signs of infection after surgery",
  "Calf pain or shortness of breath"
];

export function SafetyScreen() {
  const { painEntries, trackerCheckIns, completedExerciseIds, exerciseCompletions, profile } = useAppData();
  const { state: onboarding } = useOnboarding();
  const { palette } = useAppTheme();
  const [summary, setSummary] = useState<string | null>(null);

  const createDoctorSummary = () => {
    const progression = buildProgression(painEntries, trackerCheckIns, completedExerciseIds, onboarding.injuryTiming);
    setSummary(
      buildDoctorSummary({
        profile,
        onboarding,
        painEntries,
        trackerCheckIns,
        exerciseCompletions,
        completedExerciseIds,
        phaseLabel: progression.phase.label
      })
    );
  };

  const shareSummary = () => {
    if (!summary) return;
    Share.share({ title: "Healthcompanion summary", message: summary }).catch(() => undefined);
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>When to seek medical help</Text>
      <View style={styles.list}>
        {warnings.map((warning) => (
          <SafetyAlert key={warning} text={warning} />
        ))}
      </View>
      <AppButton label="Create Doctor Summary" icon="document-text" onPress={createDoctorSummary} />

      {/*
        A modal rather than an Alert: the summary is long enough to need
        scrolling, and an Alert silently truncates it — which is how the user's
        own notes were being dropped before.
      */}
      <Modal visible={summary !== null} animationType="slide" transparent onRequestClose={() => setSummary(null)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: palette.background, borderColor: palette.borderSoft }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: palette.borderSoft }]}>
              <Text style={[styles.sheetTitle, { color: palette.text }]}>Summary for your clinician</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close summary"
                onPress={() => setSummary(null)}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color={palette.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <Text style={[styles.summaryText, { color: palette.text }]} selectable>
                {summary}
              </Text>
            </ScrollView>

            <View style={[styles.sheetFooter, { borderTopColor: palette.borderSoft }]}>
              <AppButton label="Share or save" icon="share-outline" onPress={shareSummary} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  list: {
    gap: spacing.md
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    // Fixed scrim rather than a palette token: it sits over whatever is behind
    // the modal, so it needs to darken in both themes.
    backgroundColor: "rgba(6, 15, 25, 0.55)"
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    overflow: "hidden"
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1
  },
  sheetTitle: {
    ...typography.h3,
    flex: 1
  },
  scroll: {
    flexGrow: 0
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  summaryText: {
    ...typography.small,
    lineHeight: 21
  },
  sheetFooter: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1
  }
});
