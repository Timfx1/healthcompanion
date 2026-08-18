import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { PremiumLockCard } from "../../components/PremiumLockCard";
import { SafetyAlert } from "../../components/SafetyAlert";
import { ScreenContainer } from "../../components/ScreenContainer";
import { allExercises } from "../../data/mockRecoveryPlan";
import { MainStackParamList } from "../../navigation/types";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";
import { usePremium } from "../../hooks/usePremium";

export function ExerciseDetailScreen() {
  const route = useRoute<RouteProp<MainStackParamList, "ExerciseDetail">>();
  const { palette } = useAppTheme();
  const { completedExerciseIds, markExerciseComplete } = useAppData();
  const { locked } = usePremium();
  const exercise = allExercises.find((item) => item.id === route.params.exerciseId) ?? allExercises[0];
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const isCompleted = completedExerciseIds.includes(exercise.id);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const targetSeconds = exercise.durationSeconds;
  const progress = Math.min(1, elapsedSeconds / targetSeconds);
  const elapsedLabel = useMemo(() => formatTime(elapsedSeconds), [elapsedSeconds]);
  const targetLabel = useMemo(() => formatTime(targetSeconds), [targetSeconds]);

  const toggleTimer = () => {
    setIsRunning((current) => !current);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const markComplete = () => {
    markExerciseComplete(exercise.id);
    setIsRunning(false);
  };

  const openVideo = async () => {
    try {
      await WebBrowser.openBrowserAsync(exercise.video.url);
    } catch {
      Alert.alert("Couldn't open the video", "Please check your connection and try again.");
    }
  };

  // Safety net: if a premium exercise is somehow reached directly while locked,
  // show the upsell instead of the paid content.
  if (locked && exercise.tier === "premium") {
    return (
      <ScreenContainer>
        <PremiumLockCard
          title={exercise.name}
          subtitle="This guided progression is part of the Premium extended library."
          benefits={["Extended exercise library", "Later-stage strength & control", "Return-to-activity progressions"]}
          sourceScreen="ExerciseDetail"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Pressable
        accessibilityRole="button"
        onPress={openVideo}
        style={[styles.video, { backgroundColor: palette.infoSoft, borderColor: palette.borderSoft }]}
      >
        <View style={[styles.playButton, { backgroundColor: palette.surface }]}>
          <Ionicons name="play" size={42} color={palette.blue} />
        </View>
        <Text style={[styles.videoText, { color: palette.textMuted }]}>Video guide placeholder</Text>
        <Text style={[styles.videoSource, { color: palette.blue }]}>Open guide from {exercise.video.sourceName}</Text>
        <Text style={[styles.thumbnailHint, { color: palette.textMuted }]}>{exercise.video.thumbnailDescription}</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>{exercise.name}</Text>
      <Text style={[styles.purpose, { color: palette.textMuted }]}>{exercise.purpose}</Text>

      <View style={[styles.timerCard, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        <View>
          <Text style={[styles.timerLabel, { color: palette.textMuted }]}>Exercise timer</Text>
          <Text style={[styles.timerValue, { color: palette.text }]}>{elapsedLabel}</Text>
          <Text style={[styles.timerTarget, { color: palette.textMuted }]}>Suggested time: {targetLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={toggleTimer}
          style={[styles.timerButton, { backgroundColor: isRunning ? palette.warningSoft : palette.teal }]}
        >
          <Ionicons name={isRunning ? "pause" : "play"} size={22} color={isRunning ? palette.amber : palette.background} />
        </Pressable>
        <View style={[styles.timerTrack, { backgroundColor: palette.surfaceMuted }]}>
          <View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: palette.teal }]} />
        </View>
        <Pressable onPress={resetTimer}>
          <Text style={[styles.resetText, { color: palette.blue }]}>Reset timer</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Step-by-step</Text>
        {exercise.steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <Text style={[styles.stepNumber, { color: palette.background, backgroundColor: palette.blue }]}>{index + 1}</Text>
            <Text style={[styles.stepText, { color: palette.text }]}>{step}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.card, { backgroundColor: palette.infoSoft, borderColor: palette.blue }]}>
        <Text style={[styles.cardTitle, { color: palette.text }]}>Sets / reps</Text>
        <Text style={[styles.purpose, { color: palette.textMuted }]}>{exercise.prescription}</Text>
      </View>
      <SafetyAlert text={`${exercise.video.safetyCaveat} Stop if pain goes above 5/10.`} />
      <AppButton label={isRunning ? "Pause Timer" : "Start Timer"} icon={isRunning ? "pause" : "timer"} onPress={toggleTimer} />
      <AppButton
        label={isCompleted ? "Completed" : "Mark Complete"}
        variant="secondary"
        icon={isCompleted ? "checkmark-circle" : "ellipse-outline"}
        onPress={markComplete}
      />
    </ScreenContainer>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  video: {
    height: 210,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  playButton: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  videoText: {
    ...typography.small
  },
  videoSource: {
    ...typography.small,
    fontWeight: "700"
  },
  thumbnailHint: {
    ...typography.tiny,
    textAlign: "center",
    paddingHorizontal: spacing.lg
  },
  title: {
    ...typography.h1
  },
  purpose: {
    ...typography.body
  },
  timerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md
  },
  timerLabel: {
    ...typography.small
  },
  timerValue: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "800"
  },
  timerTarget: {
    ...typography.small
  },
  timerButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.xl,
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  timerTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden"
  },
  timerFill: {
    height: "100%",
    borderRadius: 999
  },
  resetText: {
    ...typography.small,
    fontWeight: "700"
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md
  },
  cardTitle: {
    ...typography.h3
  },
  step: {
    flexDirection: "row",
    gap: spacing.md
  },
  stepNumber: {
    ...typography.small,
    width: 26,
    height: 26,
    borderRadius: 10,
    textAlign: "center",
    paddingTop: 4
  },
  stepText: {
    ...typography.body,
    flex: 1
  }
});
