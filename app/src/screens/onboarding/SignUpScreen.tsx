import { useRef, useState } from "react";
import { Alert, Keyboard, Modal, NativeModules, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { colors, spacing, typography } from "../../theme";
import {
  loginWithEmail,
  signInAsGuest,
  signInWithAppleIdentityToken,
  signInWithGoogleIdToken,
  signUpWithEmail
} from "../../services/firebase/auth";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackButtonClick, trackEvent } from "../../services/analytics/posthog";
import { captureAppError } from "../../services/monitoring/errorReporting";
import { useAppData } from "../../state/AppDataContext";
import { useOnboarding } from "../../state/OnboardingContext";
import { useConsent } from "../../state/ConsentContext";
import { fetchUserState } from "../../services/firebase/firestore";

declare const require: (moduleName: string) => unknown;

type GoogleSignInUser = {
  name?: string | null;
  photo?: string | null;
};

// v13+ wraps the result: { type: "success", data: User } | { type: "cancelled", data: null }.
// The top-level idToken/user fields are the pre-v13 shape, kept so an older
// native module in an already-installed build still resolves a token.
type GoogleSignInResult = {
  type?: "success" | "cancelled" | string;
  data?: {
    idToken?: string | null;
    user?: GoogleSignInUser;
  } | null;
  idToken?: string | null;
  user?: GoogleSignInUser;
};

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (config: {
      webClientId?: string;
      iosClientId?: string;
      offlineAccess?: boolean;
      profileImageSize?: number;
    }) => void;
    hasPlayServices: (options?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
    signIn: () => Promise<GoogleSignInResult>;
  };
  statusCodes?: {
    SIGN_IN_CANCELLED?: string;
    IN_PROGRESS?: string;
    PLAY_SERVICES_NOT_AVAILABLE?: string;
    SIGN_IN_REQUIRED?: string;
    NULL_PRESENTER?: string;
  };
};

// iOS presents Google (SFSafariViewController) and Apple sign-in from the
// top-most view controller. If an alert, modal, keyboard or in-app browser is
// still on screen the native call fails with "Unable to open Safari"
// (GIDSignIn -1) or ASAuthorizationError 1000, so let UIKit finish dismissing
// whatever the previous tap left up before starting a native flow.
const NATIVE_UI_SETTLE_MS = 450;
const PRESENTATION_RETRY_MS = 900;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function settleNativeUi() {
  Keyboard.dismiss();
  await wait(NATIVE_UI_SETTLE_MS);
}

// The cancellation code differs per platform and per library version, so read
// it from the module rather than hardcoding one value.
function getGoogleCancelledCode() {
  try {
    const { statusCodes } = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
    return statusCodes?.SIGN_IN_CANCELLED;
  } catch {
    return undefined;
  }
}

function getErrorCode(error: unknown) {
  const code = (error as { code?: string | number } | null)?.code;
  return code === undefined || code === null ? "" : String(code);
}

// The user backing out is not a failure: never alert on it, never report it.
// Google: SIGN_IN_CANCELLED (Android) / -5 (GIDSignIn). Apple: 1001.
function isUserCancellation(error: unknown, cancelledCode?: string) {
  const code = getErrorCode(error);
  if (code && (code === cancelledCode || ["SIGN_IN_CANCELLED", "-5", "12501", "1001", "ERR_REQUEST_CANCELED"].includes(code))) {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return /ERR_REQUEST_CANCELED|SIGN_IN_CANCELLED|canceled the sign|cancelled the sign|user canceled|user cancelled/i.test(message);
}

// The native sheet could not be put on screen because something else still was.
// Retryable once the previous view controller has gone away.
function isPresentationFailure(error: unknown) {
  const code = getErrorCode(error);
  if (code === "NULL_PRESENTER") return true;
  const message = error instanceof Error ? error.message : "";
  return message.includes("Unable to open Safari") || message.includes("openURL") || message.includes("no presenting view controller");
}

/**
 * True for the everyday mistakes people make at a sign-in form — an email they
 * already registered, a mistyped password, a weak one.
 *
 * These already show a helpful message on screen, so reporting them to Sentry as
 * errors just buries real faults under normal user behaviour. They stay visible
 * to the user; they simply stop counting as application errors.
 */
function isExpectedAuthMistake(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return [
    "auth/email-already-in-use",
    "auth/invalid-credential",
    "auth/wrong-password",
    "auth/user-not-found",
    "auth/invalid-email",
    "auth/weak-password"
  ].some((code) => message.includes(code));
}

function getFriendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not sign in.";
  if (message.includes("auth/operation-not-allowed")) return "This provider is not enabled in Firebase Authentication yet.";
  if (message.includes("auth/email-already-in-use")) return "This email already has an account. Try Log in instead.";
  if (message.includes("auth/invalid-credential")) return "Those login details were not accepted.";
  if (message.includes("auth/weak-password")) return "Use a password with at least 6 characters.";
  // DEVELOPER_ERROR (code 10) means the signing certificate or client ID is not
  // registered — no retry will help. INTERNAL_ERROR (code 8) is Play Services
  // failing transiently, so it is worth another tap.
  if (message.includes("DEVELOPER_ERROR")) {
    return "Google sign-in isn't available on this device yet. Please use Apple, email, or continue as guest for now.";
  }
  if (message.includes("INTERNAL_ERROR")) {
    return "Google couldn't complete the sign-in just now. Try again, or use Apple, email, or continue as guest.";
  }
  if (message.includes("IN_PROGRESS")) return "A sign-in is already open. Finish or close it, then try again.";
  if (message.includes("PLAY_SERVICES_NOT_AVAILABLE")) {
    return "Google Play services needs an update on this device. Please use email or continue as guest for now.";
  }
  if (message.includes("Unable to open Safari") || message.includes("openURL")) {
    return "Couldn't open the Google sign-in page. Close any open menu or keyboard, then try again — or use Apple or email.";
  }
  // ASAuthorizationError.unknown (1000) — Apple's generic failure.
  if (message.includes("authorization attempt failed") || message.includes("1000")) {
    return "Apple sign-in couldn't complete. Make sure you're signed in to iCloud on this device, then try again — or use email.";
  }
  return message;
}

function getNameFromEmail(email: string) {
  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return name ? name.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Email User";
}

export function SignUpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setProfile, completeOnboarding } = useAppData();
  const { restoreOnboarding } = useOnboarding();
  const { restoreConsent } = useConsent();
  // "upgrade" = a guest who reached the paywall and has to identify themselves
  // before subscribing. They keep their uid (Firebase links the anonymous
  // account), so their data and entitlement survive — we just send them back
  // where they came from instead of through onboarding again.
  const isUpgrade = route.params?.mode === "upgrade";
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  // A ref, not the isBusy state: state lands a frame later, and the crashes we
  // saw came from a second provider being tapped inside that frame.
  const authInFlight = useRef(false);

  /**
   * Sends a returning account straight to Home instead of through onboarding again.
   *
   * `onboardingCompleted` lives in AsyncStorage, which a reinstall or a sign-out
   * clears — so someone who signed up months ago looked brand new and was asked
   * for consent, every injury question and the paywall a second time. Firestore
   * has their answers, so read them back and skip ahead.
   *
   * A `null` result (offline, or no profile yet) falls through to normal
   * onboarding on purpose: never leave someone stuck because a read failed.
   */
  const continueToOnboarding = async (
    displayName: string,
    authMethod: "guest" | "apple" | "google" | "email",
    photoUri?: string | null,
    uid?: string
  ) => {
    setProfile({ displayName, authMethod, photoUri: photoUri ?? undefined });

    if (isUpgrade) {
      // They have already consented and onboarded; return them to the paywall.
      navigation.goBack();
      return;
    }

    // Guests have no prior account state to restore.
    if (uid) {
      const restored = await fetchUserState(uid);
      if (restored?.onboardingCompleted) {
        if (restored.answers) restoreOnboarding(restored.answers);
        // Keeps the version they agreed to, so if the wording has changed since,
        // `hasCurrentHealthConsent` still asks again rather than assuming.
        if (restored.consent) restoreConsent(restored.consent);
        completeOnboarding();
        trackEvent(AnalyticsEvents.returningUserRestored, { authMethod });
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Main" }] }));
        return;
      }
    }

    // Health-data consent is asked for before any injury/symptom question, so
    // every route in — including guest — passes through the consent gate.
    navigation.navigate("Consent");
  };

  const continueAsGuest = () => {
    if (authInFlight.current) return;
    trackButtonClick("Continue as Guest", "SignUp");
    trackEvent(AnalyticsEvents.signupStarted, { method: "Continue as Guest" });
    trackEvent(AnalyticsEvents.guestContinueClicked);
    void signInAsGuest();
    trackEvent(AnalyticsEvents.signupCompleted, { method: "Continue as Guest", isAnonymous: true });
    void continueToOnboarding("Guest Recovery", "guest");
  };

  const continueWithEmail = async () => {
    if (authInFlight.current) return;
    if (!email.trim() || password.length < 6) {
      Alert.alert("Check your details", "Enter an email and a password with at least 6 characters.");
      return;
    }

    authInFlight.current = true;
    setIsBusy(true);
    const method = isLoginMode ? "Email Login" : "Email Sign Up";
    trackButtonClick(method, "SignUp");
    trackEvent(AnalyticsEvents.signupStarted, { method });
    try {
      const user = isLoginMode
        ? await loginWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);

      if (!user) throw new Error("Firebase Auth is not configured.");
      trackEvent(AnalyticsEvents.signupCompleted, { method, isAnonymous: false });
      setEmailModalVisible(false);
      await continueToOnboarding(user.displayName ?? getNameFromEmail(user.email ?? email), "email", user.photoURL, user.uid);
    } catch (error) {
      if (!isExpectedAuthMistake(error)) {
        captureAppError(error, { source: "auth", method: "email", sourceScreen: "SignUp" });
      }
      Alert.alert("Email sign-in failed", getFriendlyAuthError(error));
    } finally {
      authInFlight.current = false;
      setIsBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    if (authInFlight.current) return;
    trackButtonClick("Continue with Google", "SignUp");
    trackEvent(AnalyticsEvents.signupStarted, { method: "Google" });
    if (Constants.appOwnership === "expo") {
      Alert.alert(
        "Use a development build for Google",
        "Google sign-in cannot be tested reliably inside Expo Go because OAuth needs AnklePath's own app scheme. Email and Guest work in Expo Go. To test Google, run an EAS development build."
      );
      return;
    }
    // The web client ID is what mints the ID token Firebase verifies — on
    // Android it is the only one that matters, so a missing one is setup, not
    // a runtime failure.
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
      Alert.alert("Google setup needed", "Add Google OAuth client IDs to .env and enable Google in Firebase Authentication.");
      return;
    }
    if (Platform.OS === "android" && !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      Alert.alert("Google setup needed", "Android Google sign-in needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (the Web client ID) in .env.");
      return;
    }
    if (!NativeModules.RNGoogleSignin) {
      Alert.alert(
        "Rebuild needed",
        "Google Sign-In was added as a native module. Rebuild and reinstall the AnklePath development app, then start Metro again."
      );
      return;
    }

    authInFlight.current = true;
    setIsBusy(true);
    try {
      const { GoogleSignin } = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        offlineAccess: false,
        profileImageSize: 160
      });
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      await settleNativeUi();

      let result: GoogleSignInResult;
      try {
        result = await GoogleSignin.signIn();
      } catch (error) {
        if (!isPresentationFailure(error)) throw error;
        // Something (an alert, the in-app browser) was still on screen. Give it
        // time to dismiss and try once more before surfacing a failure.
        await wait(PRESENTATION_RETRY_MS);
        result = await GoogleSignin.signIn();
      }

      if (result.type === "cancelled" || (result.type === undefined && !result.data && !result.idToken)) {
        trackEvent(AnalyticsEvents.signupCancelled, { method: "Google" });
        return;
      }

      const idToken = result.data?.idToken ?? result.idToken;
      if (!idToken) throw new Error("Google did not return an ID token. Check your Web client ID.");
      const user = await signInWithGoogleIdToken(idToken);
      if (!user) throw new Error("Firebase Auth is not configured.");
      trackEvent(AnalyticsEvents.signupCompleted, { method: "Google", isAnonymous: false });
      await continueToOnboarding(user.displayName ?? result.data?.user?.name ?? result.user?.name ?? "Google User", "google", user.photoURL ?? result.data?.user?.photo ?? result.user?.photo, user.uid);
    } catch (error) {
      if (isUserCancellation(error, getGoogleCancelledCode())) {
        trackEvent(AnalyticsEvents.signupCancelled, { method: "Google" });
        return;
      }
      captureAppError(error, { source: "auth", method: "google", sourceScreen: "SignUp" });
      Alert.alert("Google sign-in failed", getFriendlyAuthError(error));
    } finally {
      authInFlight.current = false;
      setIsBusy(false);
    }
  };

  const continueWithApple = async () => {
    if (authInFlight.current) return;
    trackButtonClick("Continue with Apple", "SignUp");
    trackEvent(AnalyticsEvents.signupStarted, { method: "Apple" });
    if (Constants.appOwnership === "expo") {
      Alert.alert(
        "Use a development build for Apple",
        "Apple sign-in needs AnklePath's own app build and Firebase Apple provider setup. Email and Guest work in Expo Go."
      );
      return;
    }
    if (Platform.OS !== "ios" || !(await AppleAuthentication.isAvailableAsync())) {
      Alert.alert("Apple sign-in unavailable", "Apple sign-in is available on supported iOS devices.");
      return;
    }

    authInFlight.current = true;
    setIsBusy(true);
    try {
      // Apple sign-in with Firebase requires a nonce: Apple receives the SHA-256
      // hash, Firebase receives the raw value and re-hashes it to verify.
      const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, "");
      const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
      const signInWithApple = () =>
        AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL
          ],
          nonce: hashedNonce
        });

      await settleNativeUi();
      let result: AppleAuthentication.AppleAuthenticationCredential;
      try {
        result = await signInWithApple();
      } catch (error) {
        if (!isPresentationFailure(error)) throw error;
        await wait(PRESENTATION_RETRY_MS);
        result = await signInWithApple();
      }
      if (!result.identityToken) throw new Error("Apple did not return an identity token.");
      const fullName = [result.fullName?.givenName, result.fullName?.familyName].filter(Boolean).join(" ");
      const user = await signInWithAppleIdentityToken(result.identityToken, fullName, rawNonce);
      if (!user) throw new Error("Firebase Auth is not configured.");
      trackEvent(AnalyticsEvents.signupCompleted, { method: "Apple", isAnonymous: false });
      await continueToOnboarding(user.displayName ?? (fullName || "Apple User"), "apple", user.photoURL, user.uid);
    } catch (error) {
      if (isUserCancellation(error)) {
        trackEvent(AnalyticsEvents.signupCancelled, { method: "Apple" });
        return;
      }
      captureAppError(error, { source: "auth", method: "apple", sourceScreen: "SignUp" });
      Alert.alert("Apple sign-in failed", getFriendlyAuthError(error));
    } finally {
      authInFlight.current = false;
      setIsBusy(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Let's get started</Text>
        <Text style={styles.subtext}>Choose how you'd like to continue</Text>
      </View>
      <View style={styles.buttons}>
        <AppButton
          label="Continue with Apple"
          icon="logo-apple"
          variant="primary"
          disabled={isBusy}
          style={{ backgroundColor: "#000000", borderColor: "#000000" }}
          onPress={continueWithApple}
        />
        <AppButton label="Continue with Google" icon="logo-google" variant="secondary" disabled={isBusy} onPress={continueWithGoogle} />
        <AppButton label="Continue with Email" icon="mail" variant="secondary" disabled={isBusy} onPress={() => setEmailModalVisible(true)} />
        <Pressable accessibilityRole="button" disabled={isBusy} onPress={continueAsGuest} style={styles.guestLink}>
          <Text style={styles.guestLinkText}>Continue as Guest</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>You can create an account later.</Text>

      <Modal visible={emailModalVisible} transparent animationType="fade" onRequestClose={() => setEmailModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isLoginMode ? "Log in with email" : "Create email account"}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <AppButton
              label={isBusy ? "Working..." : isLoginMode ? "Log In" : "Create Account"}
              disabled={isBusy}
              onPress={continueWithEmail}
            />
            <Pressable onPress={() => setIsLoginMode((current) => !current)} style={styles.modalLink}>
              <Text style={styles.modalLinkText}>{isLoginMode ? "Need an account? Sign up" : "Already have an account? Log in"}</Text>
            </Pressable>
            <Pressable onPress={() => setEmailModalVisible(false)} style={styles.modalLink}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.huge,
    gap: spacing.xxl
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: "center"
  },
  header: {
    gap: spacing.sm,
    alignItems: "center"
  },
  subtext: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center"
  },
  guestLink: {
    alignItems: "center",
    paddingVertical: spacing.md
  },
  guestLinkText: {
    ...typography.bodyStrong,
    color: colors.text,
    textDecorationLine: "underline"
  },
  buttons: {
    gap: spacing.md
  },
  note: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: "center"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.46)",
    justifyContent: "center",
    padding: spacing.xl
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.md
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    ...typography.body
  },
  modalLink: {
    alignItems: "center",
    paddingVertical: spacing.sm
  },
  modalLinkText: {
    ...typography.small,
    color: colors.teal
  },
  modalCancel: {
    ...typography.small,
    color: colors.textMuted
  }
});
