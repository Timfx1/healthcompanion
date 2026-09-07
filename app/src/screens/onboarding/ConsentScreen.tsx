import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { useAppTheme } from "../../state/AppThemeContext";
import { useConsent, CONSENT_VERSION } from "../../state/ConsentContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { setAnalyticsOptIn, trackEvent } from "../../services/analytics/posthog";
import { getCurrentUser } from "../../services/firebase/auth";
import { saveConsentRecord } from "../../services/firebase/firestore";
import { captureUserMessage } from "../../services/monitoring/errorReporting";
import { LEGAL } from "../../config/legal";
import { colors, spacing, typography } from "../../theme";

export function ConsentScreen() {
  const navigation = useNavigation<any>();
  const { palette, tokens } = useAppTheme();
  const { grantHealthConsent, setAnalyticsConsent } = useConsent();
  // Both start unticked: pre-ticked boxes are not valid consent under GDPR.
  const [healthAccepted, setHealthAccepted] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.consentPromptViewed);
  }, []);

  const continueToOnboarding = async () => {
    grantHealthConsent();
    setAnalyticsConsent(analyticsAccepted);
    // Apply the analytics choice before anything else is tracked, so an opt-out
    // never has a window where events still leave the device.
    setAnalyticsOptIn(analyticsAccepted);
    trackEvent(AnalyticsEvents.consentGranted, { analyticsGranted: analyticsAccepted, version: CONSENT_VERSION });

    // Server-side audit trail. Best-effort: a Firestore hiccup must not block
    // someone from using the app once they have agreed on this device.
    try {
      const user = await getCurrentUser();
      if (user) {
        await saveConsentRecord(user.uid, {
          healthGranted: true,
          analyticsGranted: analyticsAccepted,
          version: CONSENT_VERSION
        });
      }
    } catch (error) {
      captureUserMessage("Consent record write skipped", "warning", {
        source: "firebase",
        errorMessage: error instanceof Error ? error.message : "Unknown Firestore error"
      });
    }

    navigation.navigate("InjuryType");
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your data, your choice</Text>
        <Text style={styles.helper}>
          The next questions cover your injury, symptoms and pain levels. That is health information, so we ask
          permission before collecting any of it.
        </Text>
      </View>

      <View style={[styles.infoBox, { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default }]}>
        <Text style={[styles.infoTitle, { color: palette.text }]}>What we store and why</Text>
        <Text style={[styles.infoText, { color: palette.textMuted }]}>
          Your injury type, symptoms, walking ability, recovery goal, pain check-ins and any notes you write are used
          to build and adjust your recovery plan — nothing else. They are stored in Google Firebase on our behalf and
          are never sold or used for advertising. You can withdraw permission, export everything, or delete your
          account at any time from your Profile.
        </Text>
      </View>

      <View style={styles.choices}>
        <ConsentCheckbox
          checked={healthAccepted}
          onToggle={() => setHealthAccepted((current) => !current)}
          label="I consent to Recovery Health Companion processing my health information to create my recovery plan."
          caption="Required — the plan cannot be built without it."
        />
        <ConsentCheckbox
          checked={analyticsAccepted}
          onToggle={() => setAnalyticsAccepted((current) => !current)}
          label="Share anonymous usage analytics to help improve the app."
          caption="Optional — you can say no and everything still works."
        />
      </View>

      <View style={styles.links}>
        <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(LEGAL.privacyUrl)}>
          <Text style={[styles.linkText, { color: tokens.color.accent.strong }]}>Privacy Policy</Text>
        </Pressable>
        <Text style={[styles.linkDivider, { color: palette.textMuted }]}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(LEGAL.termsUrl)}>
          <Text style={[styles.linkText, { color: tokens.color.accent.strong }]}>Terms of Use</Text>
        </Pressable>
      </View>

      <AppButton
        label="Agree and continue"
        disabled={!healthAccepted}
        style={{ backgroundColor: tokens.color.accent.default, borderColor: tokens.color.accent.default }}
        onPress={continueToOnboarding}
      />
    </ScreenContainer>
  );
}

function ConsentCheckbox({
  checked,
  onToggle,
  label,
  caption
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  caption: string;
}) {
  const { palette, tokens } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.choiceRow,
        { backgroundColor: palette.surface, borderColor: checked ? tokens.color.accent.default : palette.borderSoft },
        pressed && styles.pressed
      ]}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: checked ? tokens.color.accent.default : palette.border },
          checked && { backgroundColor: tokens.color.accent.default }
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={palette.white} /> : null}
      </View>
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceLabel, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.choiceCaption, { color: palette.textMuted }]}>{caption}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl
  },
  header: {
    gap: spacing.sm
  },
  title: {
    ...typography.h1,
    color: colors.text
  },
  helper: {
    ...typography.body,
    color: colors.textMuted
  },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm
  },
  infoTitle: {
    ...typography.bodyStrong
  },
  infoText: {
    ...typography.small
  },
  choices: {
    gap: spacing.md
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg
  },
  pressed: {
    opacity: 0.85
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  choiceCopy: {
    flex: 1,
    gap: spacing.xs
  },
  choiceLabel: {
    ...typography.bodyStrong
  },
  choiceCaption: {
    ...typography.small
  },
  links: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  linkText: {
    ...typography.small,
    textDecorationLine: "underline"
  },
  linkDivider: {
    ...typography.small
  }
});
