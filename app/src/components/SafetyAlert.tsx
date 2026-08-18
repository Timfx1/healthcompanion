import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type SafetyAlertProps = {
  text: string;
};

export function SafetyAlert({ text }: SafetyAlertProps) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.alert, { backgroundColor: palette.warningSoft, borderColor: palette.amber }]}>
      <Ionicons name="warning" size={22} color={palette.amber} />
      <Text style={[styles.text, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
  },
  text: {
    ...typography.small,
    flex: 1
  }
});
