import {
  AuthCredential,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  OAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { upsertUserProfile } from "./firestore";
import { identifyUser } from "../analytics/posthog";
import { identifyRevenueCatUser } from "../billing/revenueCat";
import { setSentryUser, setSentryContext, clearSentryUser } from "../monitoring/sentry";
import { captureUserMessage } from "../monitoring/errorReporting";

// How the account authenticated. Mirrors the local AuthMethod but is never
// null once a Firebase user exists (a guest is an anonymous Firebase account).
export type FirebaseAuthMethod = "guest" | "apple" | "google" | "email";

// The reporting classification. `userType` splits guests (anonymous accounts)
// from registered users; `authMethod` keeps the exact provider for segmenting.
function classifyUser(user: User, authMethod: FirebaseAuthMethod) {
  return {
    authMethod,
    userType: user.isAnonymous ? ("guest" as const) : ("registered" as const)
  };
}

// When a guest (anonymous account) signs in with a real provider, link the new
// credential to their existing account so the uid — and every Firestore record
// keyed by it — carries over instead of stranding their data under a throwaway
// anonymous uid. If that provider account already exists we fall back to signing
// into it (the guest's anonymous data cannot be merged automatically).
async function linkOrSignInWithCredential(credential: AuthCredential): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not configured.");
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      const linked = await linkWithCredential(current, credential);
      if (__DEV__) console.log("[Healthcompanion/Firebase Auth] Guest upgraded in place", { uid: linked.user.uid });
      return linked.user;
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code !== "auth/credential-already-in-use" && code !== "auth/email-already-in-use") throw error;
      // The provider account already exists — sign into it instead of the guest.
      captureUserMessage("Guest upgrade fell back to existing account", "info", {
        source: "firebase",
        previousUid: current.uid,
        errorCode: code
      });
    }
  }
  const signedIn = await signInWithCredential(auth, credential);
  return signedIn.user;
}

export async function getCurrentUser(): Promise<User | null> {
  return auth?.currentUser ?? null;
}

// Notifies when the Firebase user changes (guest created, upgraded, signed out).
// Fires once immediately with the current user. No-op returning a cleanup fn when
// Firebase is not configured, so callers work the same in offline/guest builds.
export function onAuthChanged(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // Ignore sign-out errors; we still clear local state.
    }
  }
  clearSentryUser();
}

async function safeUpsertUserProfile(user: User, extra: Record<string, unknown> = {}) {
  try {
    await upsertUserProfile(user, extra);
  } catch (error) {
    // Auth can still proceed if Firestore is offline or misconfigured.
    captureUserMessage("Firebase profile write skipped", "warning", {
      source: "firebase",
      uid: user.uid,
      authStatus: "signed_in",
      isAnonymous: user.isAnonymous,
      errorMessage: error instanceof Error ? error.message : "Unknown Firestore error"
    });
    if (__DEV__) {
      console.log("[Healthcompanion/Firebase Auth] Profile write skipped safely", {
        uid: user.uid,
        message: error instanceof Error ? error.message : "Unknown Firestore error"
      });
    }
  }
}

function identifyFirebaseUser(user: User, authMethod: FirebaseAuthMethod, extra: Record<string, unknown> = {}) {
  const classification = classifyUser(user, authMethod);
  setSentryUser({
    uid: user.uid,
    email: user.email,
    isAnonymous: user.isAnonymous
  });
  setSentryContext("auth", {
    authStatus: "signed_in",
    isAnonymous: user.isAnonymous,
    ...classification,
    onboardingCompleted: extra.onboardingCompleted
  });
  // Data minimisation: the analytics processor gets the pseudonymous uid and
  // the segmentation fields, never the email, name, or photo. Those stay in
  // Firebase Auth (and Sentry, where they help support) — usage analytics for a
  // health app has no need to identify the person behind the account.
  identifyUser(user.uid, {
    isAnonymous: user.isAnonymous,
    ...classification,
    ...extra
  });
  void identifyRevenueCatUser(user.uid);
}

export async function signInAsGuest(): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) {
    if (__DEV__) console.log("[Healthcompanion/Firebase Auth] Guest sign-in skipped: Firebase is not configured.");
    return null;
  }
  try {
    const credential = auth.currentUser ?? (await signInAnonymously(auth)).user;
    void safeUpsertUserProfile(credential, classifyUser(credential, "guest"));
    identifyFirebaseUser(credential, "guest", { onboardingCompleted: false });
    if (__DEV__) {
      console.log("[Healthcompanion/Firebase Auth] Anonymous user ready", {
        uid: credential.uid,
        isAnonymous: credential.isAnonymous
      });
    }
    return credential;
  } catch (error) {
    if (__DEV__) {
      console.log("[Healthcompanion/Firebase Auth] Guest sign-in failed safely", {
        message: error instanceof Error ? error.message : "Unknown Firebase Auth error"
      });
    }
    return null;
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) return null;
  const current = auth.currentUser;
  // Upgrade a guest in place; otherwise create a fresh email/password account.
  // If the email is already taken, linking throws auth/email-already-in-use,
  // which getFriendlyAuthError turns into "Try Log in instead."
  const user = current?.isAnonymous
    ? (await linkWithCredential(current, EmailAuthProvider.credential(email, password))).user
    : (await createUserWithEmailAndPassword(auth, email, password)).user;
  await safeUpsertUserProfile(user, classifyUser(user, "email"));
  identifyFirebaseUser(user, "email", { onboardingCompleted: false });
  if (__DEV__) console.log("[Healthcompanion/Firebase Auth] Email sign-up completed", { uid: user.uid });
  return user;
}

export async function loginWithEmail(email: string, password: string): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) return null;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await safeUpsertUserProfile(credential.user, classifyUser(credential.user, "email"));
  identifyFirebaseUser(credential.user, "email");
  if (__DEV__) console.log("[Healthcompanion/Firebase Auth] Email login completed", { uid: credential.user.uid });
  return credential.user;
}

export async function signInWithGoogleIdToken(idToken: string): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) return null;
  const user = await linkOrSignInWithCredential(GoogleAuthProvider.credential(idToken));
  await safeUpsertUserProfile(user, classifyUser(user, "google"));
  identifyFirebaseUser(user, "google", { onboardingCompleted: false });
  if (__DEV__) console.log("[Healthcompanion/Firebase Auth] Google login completed", { uid: user.uid });
  return user;
}

export async function signInWithAppleIdentityToken(
  identityToken: string,
  fullName?: string | null,
  rawNonce?: string
): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) return null;
  const provider = new OAuthProvider("apple.com");
  const user = await linkOrSignInWithCredential(provider.credential({ idToken: identityToken, rawNonce }));
  const displayName = fullName?.trim();
  if (displayName && !user.displayName) {
    await updateProfile(user, { displayName });
  }
  await safeUpsertUserProfile(user, classifyUser(user, "apple"));
  identifyFirebaseUser(user, "apple", { onboardingCompleted: false });
  if (__DEV__) console.log("[Healthcompanion/Firebase Auth] Apple login completed", { uid: user.uid });
  return user;
}
