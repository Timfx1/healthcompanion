import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type SafetyAlertProps = {
  text: string;
};

export function SafetyAlert({ text }: SafetyAlertProps) {
  const { palette, tokens } = useAppTheme();

  return (
    <View style={[styles.alert, { backgroundColor: tokens.color.safety.surface, borderColor: tokens.color.safety.mark }]}>
      <Ionicons name="warning" size={22} color={tokens.color.safety.mark} />
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
