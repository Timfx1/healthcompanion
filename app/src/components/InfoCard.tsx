import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../theme";
import { useAppTheme } from "../state/AppThemeContext";

type InfoCardProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
  onPress?: () => void;
};

export function InfoCard({ title, subtitle, icon, children, onPress }: InfoCardProps) {
  const { palette, tokens } = useAppTheme();
  const content = (
    <>
      <View style={styles.row}>
        {icon ? (
          <View style={styles.icon}>
            <Ionicons name={icon} size={20} color={tokens.color.accent.default} />
          </View>
        ) : null}
        <View style={styles.text}>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: palette.textMuted }]}>{subtitle}</Text> : null}
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={20} color={palette.textSubtle} /> : null}
      </View>
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: palette.surface, borderColor: palette.borderSoft },
          pressed && styles.pressed
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md
  },
  pressed: {
    opacity: 0.82
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47, 125, 225, 0.12)"
  },
  text: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    ...typography.bodyStrong,
    includeFontPadding: false
  },
  subtitle: {
    ...typography.small
  }
});
