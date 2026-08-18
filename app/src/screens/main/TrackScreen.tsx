import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { InfoCard } from "../../components/InfoCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { trackerConfigs } from "../../data/trackerCheckIns";
import { TrackerKey, useAppData } from "../../state/AppDataContext";
import { useAppTheme } from "../../state/AppThemeContext";
import { spacing, typography } from "../../theme";

function isToday(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function TrackScreen() {
  const navigation = useNavigation<any>();
  const { painEntries, trackerCheckIns } = useAppData();
  const { palette, tokens } = useAppTheme();

  const trackerSubtitle = (key: TrackerKey) => {
    const latest = trackerCheckIns.find((entry) => entry.key === key);
    if (latest && isToday(latest.createdAt)) return `Today: ${latest.label}`;
    if (latest) return `Last: ${latest.label} · tap to update`;
    return "Tap to log today";
  };
  const latest = painEntries[0];
  const previous = painEntries[1];
  const trend =
    latest && previous
      ? latest.pain < previous.pain
        ? `Pain decreased ${previous.pain - latest.pain} point${previous.pain - latest.pain === 1 ? "" : "s"} since last check-in.`
        : latest.pain > previous.pain
          ? `Pain increased ${latest.pain - previous.pain} point${latest.pain - previous.pain === 1 ? "" : "s"} since last check-in.`
          : "Pain is unchanged since your last check-in."
      : latest
        ? `Latest pain score: ${latest.pain}/10 at ${latest.location}.`
        : "No check-ins yet. Start with a pain check-in today.";

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>Track Recovery</Text>
      <View style={[styles.trend, { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default }]}>
        <Text style={[styles.trendLabel, { color: tokens.color.accent.strong }]}>Recent trend</Text>
        <Text style={[styles.trendText, { color: palette.text }]}>{trend}</Text>
      </View>
      <View style={styles.list}>
        <InfoCard
          title="Pain check-in"
          subtitle={latest ? `${painEntries.length} saved check-in${painEntries.length === 1 ? "" : "s"}` : "Rate pain and add notes"}
          icon="pulse"
          onPress={() => navigation.navigate("PainCheckIn")}
        />
        <InfoCard
          title={trackerConfigs.swelling.title}
          subtitle={trackerSubtitle("swelling")}
          icon={trackerConfigs.swelling.icon}
          onPress={() => navigation.navigate("TrackerCheckIn", { tracker: "swelling" })}
        />
        <InfoCard
          title={trackerConfigs.walking.title}
          subtitle={trackerSubtitle("walking")}
          icon={trackerConfigs.walking.icon}
          onPress={() => navigation.navigate("TrackerCheckIn", { tracker: "walking" })}
        />
        <InfoCard
          title={trackerConfigs.rangeOfMotion.title}
          subtitle={trackerSubtitle("rangeOfMotion")}
          icon={trackerConfigs.rangeOfMotion.icon}
          onPress={() => navigation.navigate("TrackerCheckIn", { tracker: "rangeOfMotion" })}
        />
        <InfoCard
          title={trackerConfigs.balance.title}
          subtitle={trackerSubtitle("balance")}
          icon={trackerConfigs.balance.icon}
          onPress={() => navigation.navigate("TrackerCheckIn", { tracker: "balance" })}
        />
        <InfoCard
          title="Return-to-sport readiness"
          subtitle="Check your logs against the signs physios look for"
          icon="trophy"
          onPress={() => navigation.navigate("Readiness")}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  trend: {
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1
  },
  trendLabel: {
    ...typography.small
  },
  trendText: {
    ...typography.h2,
    marginTop: spacing.sm
  },
  list: {
    gap: spacing.md
  }
});
