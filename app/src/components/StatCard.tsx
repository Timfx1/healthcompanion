import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type StatCardProps = {
  value: string;
  label: string;
};

export function StatCard({ value, label }: StatCardProps) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: palette.surfaceRaised, borderColor: palette.borderSoft }]}>
      <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.label, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
  },
  value: {
    ...typography.h2
  },
  label: {
    ...typography.small,
    marginTop: spacing.xs
  }
});
