import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type ProgressHeaderProps = {
  step: number;
  total: number;
};

export function ProgressHeader({ step, total }: ProgressHeaderProps) {
  const { palette } = useAppTheme();
  const progress = Math.max(0, Math.min(1, step / total));

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { backgroundColor: palette.surfaceMuted }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: palette.blue }]} />
      </View>
      <Text style={[styles.label, { color: palette.textMuted }]}>
        Step {step} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingBottom: spacing.xs
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  },
  label: {
    ...typography.small
  }
});
