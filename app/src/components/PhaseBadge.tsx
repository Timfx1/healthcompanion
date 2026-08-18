import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type PhaseBadgeProps = {
  label: string;
};

export function PhaseBadge({ label }: PhaseBadgeProps) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.badge, { backgroundColor: palette.infoSoft, borderColor: palette.blue }]}>
      <Text style={[styles.text, { color: palette.blueDark }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  text: {
    ...typography.small
  }
});
