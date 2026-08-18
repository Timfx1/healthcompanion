import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { OptionCard } from "../../components/OptionCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { trackerConfigs } from "../../data/trackerCheckIns";
import { MainStackParamList } from "../../navigation/types";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";

export function TrackerCheckInScreen() {
  const route = useRoute<RouteProp<MainStackParamList, "TrackerCheckIn">>();
  const navigation = useNavigation();
  const { palette } = useAppTheme();
  const { trackerCheckIns, addTrackerCheckIn } = useAppData();

  const config = trackerConfigs[route.params.tracker];
  const latest = trackerCheckIns.find((entry) => entry.key === config.key);
  const [selected, setSelected] = useState<number | null>(latest ? latest.value : null);

  const save = () => {
    if (selected === null) return;
    const option = config.options.find((item) => item.value === selected);
    if (!option) return;
    addTrackerCheckIn(config.key, option.value, option.label);
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>{config.title}</Text>
      <Text style={[styles.prompt, { color: palette.textMuted }]}>{config.prompt}</Text>

      <View style={styles.options}>
        {config.options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            subtitle={option.hint}
            selected={selected === option.value}
            onPress={() => setSelected(option.value)}
          />
        ))}
      </View>

      {latest ? (
        <Text style={[styles.last, { color: palette.textMuted }]}>
          Last logged: {latest.label} · {formatWhen(latest.createdAt)}
        </Text>
      ) : null}

      <AppButton label="Save check-in" icon="checkmark-circle" onPress={save} disabled={selected === null} />
    </ScreenContainer>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (sameDay) {
    return `today ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  prompt: {
    ...typography.body
  },
  options: {
    gap: spacing.md
  },
  last: {
    ...typography.small
  }
});
