import { useState, type ReactNode } from "react";
import { Alert, Image, Linking, Modal, Pressable, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { InfoCard } from "../../components/InfoCard";
import { NextRecoveryAreaCard } from "../../components/NextRecoveryAreaCard";
import { PhaseBadge } from "../../components/PhaseBadge";
import { ScreenContainer } from "../../components/ScreenContainer";
import { injuryDayLabel } from "../../data/mockRecoveryPlan";
import { buildProgression } from "../../utils/recoveryInsights";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";
import { useConsent, CONSENT_VERSION } from "../../state/ConsentContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { usePremium } from "../../hooks/usePremium";
import { spacing, typography } from "../../theme";
import { buildProfile } from "../../services/monitoring/sentry";
import { captureAppError } from "../../services/monitoring/errorReporting";
import { getCurrentUser, signOutUser } from "../../services/firebase/auth";
import { deleteAccountAndData, describeDeletionFailure, ReauthRequiredError } from "../../services/firebase/accountDeletion";
import { buildUserDataExport } from "../../services/firebase/dataExport";
import { saveConsentRecord } from "../../services/firebase/firestore";
import { AnalyticsEvents } from "../../services/analytics/events";
import { setAnalyticsOptIn, trackEvent } from "../../services/analytics/posthog";
import { LEGAL } from "../../config/legal";

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, resetOnboarding } = useOnboarding();
  const { palette, isDark, toggleMode , tokens } = useAppTheme();
  const {
    savedArticles,
    painEntries,
    completedExerciseIds,
    trackerCheckIns,
    profile,
    setProfile,
    resetAppData
  } = useAppData();
  const { health, analytics, setAnalyticsConsent, withdrawHealthConsent, resetConsent } = useConsent();
  const { isPremium, gatingActive } = usePremium();
  // Derived from the user's own check-ins, matching Home and the Plan tab.
  const progression = buildProgression(painEntries, trackerCheckIns, completedExerciseIds, state.injuryTiming);
  const isRegistered = profile.authMethod !== "guest" && profile.authMethod !== null;
  const showSentryTest = __DEV__ || buildProfile === "development" || buildProfile === "preview";
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");

  const openNameEditor = () => {
    setNameDraft(profile.displayName);
    setNameModalVisible(true);
  };

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) setProfile({ displayName: trimmed });
    setNameModalVisible(false);
  };

  const openPremium = () => {
    // Once billing is live, non-premium users go to the real upgrade paywall;
    // otherwise the coming-soon teaser (waitlist) as before.
    if (gatingActive && !isPremium) {
      navigation.navigate("TrialPaywall", { mode: "upgrade" });
      return;
    }
    navigation.navigate("PremiumTeaser");
  };

  const premiumSubtitle = isPremium
    ? "Premium active — thank you for your support"
    : gatingActive
      ? "Unlock exportable reports & the extended library"
      : "Free plan - Premium coming soon";

  const emailDeletionRequest = () => {
    const subject = encodeURIComponent("Delete my account");
    const body = encodeURIComponent(
      `Please delete my AnklePath account and associated data.\n\nAccount: ${profile.displayName}`
    );
    Linking.openURL(`mailto:${LEGAL.supportEmail}?subject=${subject}&body=${body}`).catch(() => {});
  };

  const recordConsent = async (healthGranted: boolean, analyticsGranted: boolean) => {
    try {
      const user = await getCurrentUser();
      if (user) {
        await saveConsentRecord(user.uid, { healthGranted, analyticsGranted, version: CONSENT_VERSION });
      }
    } catch {
      // The local record still governs the app; the audit copy can catch up later.
    }
  };

  const toggleAnalyticsConsent = (granted: boolean) => {
    setAnalyticsConsent(granted);
    setAnalyticsOptIn(granted);
    // Fires only when turning analytics on — with it off, nothing leaves the device.
    if (granted) trackEvent(AnalyticsEvents.analyticsConsentChanged, { granted });
    void recordConsent(health.granted, granted);
  };

  const confirmWithdrawConsent = () => {
    Alert.alert(
      "Withdraw consent",
      "We'll stop using your health information to personalise your plan. Your existing data stays until you delete your account — you can do that from this screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: () => {
            withdrawHealthConsent();
            trackEvent(AnalyticsEvents.consentWithdrawn);
            void recordConsent(false, analytics.granted);
            Alert.alert(
              "Consent withdrawn",
              "You can grant it again at any time by restarting onboarding, or delete your account to remove the data."
            );
          }
        }
      ]
    );
  };

  const exportMyData = async () => {
    setIsExporting(true);
    trackEvent(AnalyticsEvents.dataExportRequested);
    try {
      const payload = await buildUserDataExport({
        profile,
        onboardingAnswers: state,
        painEntries,
        trackerCheckIns,
        savedArticles,
        completedExerciseIds
      });
      await Share.share({
        title: "AnklePath data export",
        message: JSON.stringify(payload, null, 2)
      });
    } catch (error) {
      captureAppError(error, { source: "firebase", action: "exportData", sourceScreen: "Profile" });
      Alert.alert("Export failed", "We couldn't build your export just now. Please try again while online.");
    } finally {
      setIsExporting(false);
    }
  };

  const finishAfterDeletion = () => {
    resetOnboarding();
    resetAppData();
    resetConsent();
    const root = navigation.getParent();
    (root ?? navigation).dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Onboarding" }] }));
  };

  const runAccountDeletion = async (password?: string) => {
    setIsDeleting(true);
    trackEvent(AnalyticsEvents.accountDeletionStarted);
    try {
      await deleteAccountAndData(password ? { password } : {});
      trackEvent(AnalyticsEvents.accountDeletionCompleted);
      finishAfterDeletion();
      Alert.alert("Account deleted", "Your account and recovery data have been removed.");
    } catch (error) {
      // Firebase wants a fresh sign-in before deleting. Google and Apple can be
      // re-confirmed silently inside the service; email needs the password.
      if (error instanceof ReauthRequiredError && error.method === "email") {
        setPasswordDraft("");
        setPasswordPrompt(true);
        return;
      }
      captureAppError(error, { source: "auth", action: "deleteAccount", sourceScreen: "Profile" });
      // Say what actually went wrong. Deletion is a legal obligation, so a user
      // who hits a failure needs to know whether to reconnect, sign in again, or
      // email us — not a single generic sentence for every cause.
      Alert.alert("Could not delete account", describeDeletionFailure(error), [
        { text: "Close", style: "cancel" },
        { text: "Email us", onPress: emailDeletionRequest }
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmAccountDeletion = () => {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account, recovery plan answers, pain check-ins and notes. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Email a request instead", onPress: emailDeletionRequest },
        { text: "Delete everything", style: "destructive", onPress: () => void runAccountDeletion() }
      ]
    );
  };

  const submitPasswordAndDelete = () => {
    const password = passwordDraft;
    setPasswordPrompt(false);
    setPasswordDraft("");
    void runAccountDeletion(password);
  };

  const confirmSignOut = () => {
    Alert.alert(
      "Sign out?",
      "This clears your saved progress on this device and returns you to the start.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await signOutUser();
            resetOnboarding();
            resetAppData();
            const root = navigation.getParent();
            (root ?? navigation).dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: "Onboarding" }] })
            );
          }
        }
      ]
    );
  };

  const changeProfilePhoto = async () => {
    if (!isRegistered) {
      Alert.alert("Create an account first", "Profile photos are available for Apple, Google, or Email accounts.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access needed", "Allow photo library access to choose a profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfile({ photoUri: result.assets[0].uri });
    }
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: tokens.color.accent.default }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRegistered ? "Change profile picture" : "Profile picture unavailable for guest accounts"}
          onPress={changeProfilePhoto}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressedAvatar]}
        >
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={32} color={tokens.color.accent.default} />
          )}
          {isRegistered ? (
            <View style={[styles.cameraBadge, { backgroundColor: tokens.color.accent.default }]}>
              <Ionicons name="camera" size={13} color={palette.white} />
            </View>
          ) : null}
        </Pressable>
        <View style={styles.headerCopy}>
          <Pressable
            onPress={openNameEditor}
            accessibilityRole="button"
            accessibilityLabel="Edit your name"
            style={styles.nameRow}
          >
            <Text style={styles.title} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <Ionicons name="pencil" size={15} color="rgba(255,255,255,0.85)" />
          </Pressable>
          <Text style={styles.headerSubtext}>{injuryDayLabel(state.injuryTiming, state.injuryDate)}</Text>
        </View>
        {/* Same reasoning as the Premium row below: for a subscriber this badge
            is a status label, not a way back to an upsell. */}
        {isPremium ? (
          <PhaseBadge label="Premium" />
        ) : (
          <Pressable accessibilityRole="button" onPress={openPremium}>
            <PhaseBadge label="Free plan" />
          </Pressable>
        )}
      </View>

      <ProfileSection title="Recovery Status">
        <InfoCard title="Injury type" subtitle={state.injuryType ?? "Recent ankle sprain"} icon="medical" />
        <InfoCard title="Recovery goal" subtitle={state.goal ?? "Walk without pain"} icon="flag" />
        <InfoCard title="Current phase" subtitle={progression.phase.label} icon="trending-up" />
        <InfoCard title="Exercise completion" subtitle={`${completedExerciseIds.length} of 4 completed today`} icon="checkmark-circle" />
      </ProfileSection>

      <ProfileSection title="Content">
        <InfoCard title="Saved articles" subtitle={`${savedArticles.length} saved`} icon="bookmark" />
        <InfoCard
          title="Reports"
          subtitle={`${painEntries.length} check-in${painEntries.length === 1 ? "" : "s"} ready for summaries`}
          icon="document-text"
          onPress={() => navigation.navigate("Reports")}
        />
        <NextRecoveryAreaCard sourceScreen="Profile" />
      </ProfileSection>

      <ProfileSection title="Settings">
        <View style={[styles.settingRow, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
          <View style={styles.settingIcon}>
            <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={tokens.color.accent.default} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: palette.text }]}>Dark mode</Text>
            <Text style={[styles.settingSubtitle, { color: palette.textMuted }]}>
              {isDark ? "Dark recovery workspace enabled" : "Light Figma-inspired design enabled"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleMode}
            trackColor={{ false: palette.surfaceMuted, true: tokens.color.accent.default }}
            thumbColor={palette.white}
          />
        </View>
        <View style={[styles.settingRow, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
          <View style={styles.settingIcon}>
            <Ionicons name="stats-chart" size={20} color={tokens.color.accent.default} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: palette.text }]}>Product analytics</Text>
            <Text style={[styles.settingSubtitle, { color: palette.textMuted }]}>
              {analytics.granted
                ? "Anonymous usage data helps us improve the app"
                : "Off — no usage data leaves this device"}
            </Text>
          </View>
          <Switch
            value={analytics.granted}
            onValueChange={toggleAnalyticsConsent}
            trackColor={{ false: palette.surfaceMuted, true: tokens.color.accent.default }}
            thumbColor={palette.white}
          />
        </View>
        <InfoCard title="Notifications" subtitle="Recovery reminders ready to configure" icon="notifications" />
        <InfoCard
          title="Premium features"
          subtitle={premiumSubtitle}
          icon="sparkles"
          // Subscribers get a status row, not a link: the old routing sent
          // anyone who was not a locked free user to the "coming soon / join the
          // waitlist" teaser, so people who had already paid were being invited
          // to wait for what they were using. InfoCard drops the chevron when
          // there is no onPress. Cancelling happens in the store account, which
          // the paywall fine print already says.
          onPress={isPremium ? undefined : openPremium}
        />
        {showSentryTest ? (
          <InfoCard
            title="Test Sentry Error"
            subtitle="Development and preview builds only"
            icon="bug"
            onPress={() =>
              captureAppError(new Error("AnklePath Sentry test error"), {
                source: "manual_test",
                sourceScreen: "Profile",
                buildProfile
              })
            }
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={confirmSignOut}
          style={({ pressed }) => [
            styles.signOutRow,
            { backgroundColor: palette.surface, borderColor: palette.borderSoft },
            pressed && styles.signOutPressed
          ]}
        >
          {/* ────────────────────────────────────────────────────────────────
              STOPPED, NOT SOLVED — this block does not compile, on purpose.

              These three references are the only colours in the port with NO
              Recovery Companion equivalent. They mark a DESTRUCTIVE ACTION
              (sign out), and the design system has no destructive role.

              The one red it owns is `safety.*`, and N3 reserves that for
              red-flag health guidance — "never decorative, never for emphasis,
              never for a 'bad' data point". A sign-out button is none of those
              things, and spending the alert hue on it is exactly how an app
              stops being believed when it finally means it. That rule is worth
              more than this button.

              Three options, all of which are a DESIGN decision rather than a
              mapping one, which is why nothing was invented here:
                1. Neutral treatment — text.secondary, no colour at all. Sign
                   out is not dangerous; it is reversible in one tap.
                2. Confirm on press and drop the colour entirely.
                3. Add a deliberate `destructive.*` role, accepting that the
                   product now has two reds and that the reserved one is a
                   little less unique for it.

              Left failing so the choice is made by a person, not by whoever
              needed the build green.
              ──────────────────────────────────────────────────────────────── */}
          <View style={[styles.signOutIcon, { backgroundColor: palette.dangerSoft }]}>
            <Ionicons name="log-out-outline" size={20} color={palette.red} />
          </View>
          <Text style={[styles.signOutText, { color: palette.red }]}>Sign out</Text>
        </Pressable>
      </ProfileSection>

      <ProfileSection title="Legal">
        <InfoCard
          title="Privacy Policy"
          subtitle="How we handle your data"
          icon="lock-closed"
          onPress={() => WebBrowser.openBrowserAsync(LEGAL.privacyUrl)}
        />
        <InfoCard
          title="Terms of Use"
          subtitle="The rules for using AnklePath"
          icon="document-text"
          onPress={() => WebBrowser.openBrowserAsync(LEGAL.termsUrl)}
        />
        <InfoCard
          title="Impressum"
          subtitle="Who operates AnklePath"
          icon="business"
          onPress={() => WebBrowser.openBrowserAsync(LEGAL.impressumUrl)}
        />
        <InfoCard
          title="Health data consent"
          subtitle={
            health.granted
              ? `Granted${health.updatedAt ? ` on ${new Date(health.updatedAt).toLocaleDateString()}` : ""} — tap to withdraw`
              : "Withdrawn — your plan is no longer personalised"
          }
          icon="shield-checkmark"
          onPress={health.granted ? confirmWithdrawConsent : undefined}
        />
        <InfoCard
          title={isExporting ? "Preparing your data..." : "Export my data"}
          subtitle="Download everything we store about you"
          icon="download"
          onPress={isExporting ? undefined : () => void exportMyData()}
        />
        <InfoCard
          title={isDeleting ? "Deleting..." : "Delete account"}
          subtitle="Permanently remove your account and data"
          icon="trash"
          onPress={isDeleting ? undefined : confirmAccountDeletion}
        />
      </ProfileSection>

      <View style={[styles.disclaimer, { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default }]}>
        <Ionicons name="shield-checkmark" size={24} color={tokens.color.accent.default} />
        <View style={styles.disclaimerCopy}>
          <Text style={[styles.disclaimerTitle, { color: palette.text }]}>Medical disclaimer</Text>
          <Text style={[styles.disclaimerText, { color: palette.textMuted }]}>
            This app is not a medical device and does not diagnose, treat, or prevent any condition. It
            provides educational guidance and does not replace professional medical advice.
          </Text>
        </View>
      </View>

      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Edit your name</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={palette.textMuted}
              style={[styles.modalInput, { color: palette.text, borderColor: palette.border }]}
              autoFocus
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <AppButton label="Save" onPress={saveName} />
            <Pressable onPress={() => setNameModalVisible(false)} style={styles.modalCancelBtn}>
              <Text style={[styles.modalCancelText, { color: palette.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Firebase requires a recent sign-in before deleting an account. Google
          and Apple re-confirm through their own sheets; email needs the password. */}
      <Modal
        visible={passwordPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordPrompt(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Confirm it's you</Text>
            <Text style={[styles.modalCancelText, { color: palette.textMuted }]}>
              Enter your password to finish deleting your account.
            </Text>
            <TextInput
              value={passwordDraft}
              onChangeText={setPasswordDraft}
              placeholder="Password"
              placeholderTextColor={palette.textMuted}
              secureTextEntry
              autoFocus
              style={[styles.modalInput, { color: palette.text, borderColor: palette.border }]}
              returnKeyType="done"
              onSubmitEditing={submitPasswordAndDelete}
            />
            <AppButton label="Delete my account" disabled={!passwordDraft} onPress={submitPasswordAndDelete} />
            <Pressable onPress={() => setPasswordPrompt(false)} style={styles.modalCancelBtn}>
              <Text style={[styles.modalCancelText, { color: palette.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginHorizontal: -spacing.xl,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)"
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  pressedAvatar: {
    opacity: 0.82
  },
  headerCopy: {
    flex: 1
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  title: {
    ...typography.h1,
    color: "#FFFFFF",
    flexShrink: 1
  },
  headerSubtext: {
    ...typography.small,
    color: "rgba(255,255,255,0.78)"
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    ...typography.small,
    paddingHorizontal: spacing.xs,
    textTransform: "uppercase"
  },
  sectionContent: {
    gap: spacing.md
  },
  settingRow: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  settingIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(47, 125, 225, 0.12)"
  },
  settingCopy: {
    flex: 1
  },
  settingTitle: {
    ...typography.bodyStrong
  },
  settingSubtitle: {
    ...typography.small,
    marginTop: spacing.xs
  },
  disclaimer: {
    borderRadius: 22,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1
  },
  disclaimerCopy: {
    flex: 1
  },
  disclaimerTitle: {
    ...typography.bodyStrong
  },
  disclaimerText: {
    ...typography.small,
    marginTop: spacing.sm
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.46)",
    justifyContent: "center",
    padding: spacing.xl
  },
  modalCard: {
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.md
  },
  modalTitle: {
    ...typography.h2
  },
  modalInput: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    ...typography.body
  },
  modalCancelBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm
  },
  modalCancelText: {
    ...typography.small
  },
  signOutRow: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  signOutPressed: {
    opacity: 0.85
  },
  signOutIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  },
  signOutText: {
    ...typography.bodyStrong
  }
});
