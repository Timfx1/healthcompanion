import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type OptionCardProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  subtitle?: string;
  multi?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function OptionCard({ label, selected = false, onPress, subtitle, multi = false, icon }: OptionCardProps) {
  const { palette, tokens } = useAppTheme();

  return (
    <Pressable
      accessibilityRole={multi ? "checkbox" : "button"}
      accessibilityState={{ selected, checked: multi ? selected : undefined }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.borderSoft },
        selected && { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default },
        pressed && styles.pressed
      ]}
    >
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: selected ? palette.surface : palette.surfaceMuted }]}>
          <Ionicons name={icon} size={18} color={tokens.color.accent.default} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text> : null}
      </View>
      <View
        style={[
          styles.check,
          { borderColor: palette.border },
          selected && { backgroundColor: tokens.color.accent.default, borderColor: tokens.color.accent.default }
        ]}
      >
        {selected ? <Ionicons name="checkmark" size={18} color={palette.white} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  pressed: {
    opacity: 0.85
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  textWrap: {
    flex: 1,
    gap: spacing.xs
  },
  label: {
    ...typography.bodyStrong,
    includeFontPadding: false
  },
  subtitle: {
    ...typography.small
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
