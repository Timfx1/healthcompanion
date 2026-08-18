import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
};

export function AppButton({ label, onPress, variant = "primary", icon, style, disabled = false }: AppButtonProps) {
  const { palette, tokens } = useAppTheme();
  const variantStyle =
    variant === "primary"
      ? { backgroundColor: tokens.color.accent.default, borderColor: tokens.color.accent.default, shadowColor: tokens.color.accent.default }
      : variant === "secondary"
        ? { backgroundColor: palette.surfaceRaised, borderColor: palette.border }
        : { backgroundColor: "transparent", borderColor: palette.borderSoft };
  const foreground = variant === "primary" ? palette.background : palette.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={foreground} /> : null}
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: "transparent"
  },
  primary: {
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.56
  },
  label: {
    ...typography.bodyStrong,
    textAlign: "center",
    includeFontPadding: false
  }
});
