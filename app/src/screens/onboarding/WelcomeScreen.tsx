import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { colors, spacing, typography , tokens } from "../../theme";

const features: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: "checkmark-circle", text: "Track pain and symptoms" },
  { icon: "trending-up", text: "Follow daily rehab exercises" },
  { icon: "book", text: "Understand your recovery stage" }
];

export function WelcomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer scroll={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Ionicons name="pulse" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.headline}>Guided ankle recovery companion</Text>
        <Text style={styles.subtext}>
          Get your personalized recovery plan, track your progress, and understand what to do at every stage.
        </Text>
        <View style={styles.features}>
          {features.map(({ icon, text }) => (
            <View key={text} style={styles.featureRow}>
              <Ionicons name={icon} size={20} color={tokens.color.accent.default} />
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton
          label="Start Recovery Plan"
          style={{ backgroundColor: tokens.color.accent.default, borderColor: tokens.color.accent.default }}
          onPress={() => navigation.navigate("SignUp")}
        />
        <AppButton label="I already have an account" variant="secondary" onPress={() => navigation.navigate("SignUp")} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg
  },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: tokens.color.accent.default,
    alignItems: "center",
    justifyContent: "center"
  },
  headline: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center"
  },
  subtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center"
  },
  features: {
    alignSelf: "center",
    gap: spacing.md,
    marginTop: spacing.md
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  featureText: {
    ...typography.body,
    color: colors.text
  },
  actions: {
    gap: spacing.md
  }
});
