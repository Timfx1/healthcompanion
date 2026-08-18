import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  User
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { captureUserMessage } from "../monitoring/errorReporting";

declare const require: (moduleName: string) => unknown;

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (config: { webClientId?: string; iosClientId?: string; offlineAccess?: boolean }) => void;
    signIn: () => Promise<{ type?: string; data?: { idToken?: string | null } | null; idToken?: string | null }>;
  };
};

/**
 * Provider the account must re-authenticate with. Firebase refuses to delete an
 * account whose sign-in is older than a few minutes (`auth/requires-recent-login`).
 */
export type ReauthMethod = "guest" | "apple" | "google" | "email";

export class ReauthRequiredError extends Error {
  constructor(public method: ReauthMethod) {
    super("Recent sign-in required before this account can be deleted.");
    this.name = "ReauthRequiredError";
  }
}

/**
 * Turns a deletion failure into something the user can act on.
 *
 * The screen used to show one generic "something blocked the deletion" for every
 * cause, which told the user nothing and made real failures impossible to
 * diagnose from a bug report. Account deletion is a legal obligation (GDPR Art.
 * 17, App Store 5.1.1(v)), so when it fails the person needs to know whether to
 * reconnect, sign in again, or contact us.
 */
export function describeDeletionFailure(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;

  switch (code) {
    case "auth/requires-recent-login":
    case "auth/user-token-expired":
    case "auth/invalid-user-token":
      return "For your security, this needs a fresh sign-in. Sign out, sign back in, then delete your account within a few minutes.";
    case "auth/network-request-failed":
    case "unavailable":
      return "We could not reach the server. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That password was not correct. Try again.";
    case "permission-denied":
      return "The server refused part of the deletion. Please email us and we will complete it for you.";
    default:
      break;
  }

  if (error instanceof ReauthRequiredError) {
    if (error.method === "guest") {
      return "This guest account could not be removed automatically. Please email us and we will delete it for you.";
    }
    return "We could not confirm your sign-in. Sign out, sign back in, then try again.";
  }

  const message = error instanceof Error ? error.message : "";
  return message
    ? `${message}\n\nIf this keeps happening, email us and we will delete your account for you.`
    : "Something blocked the deletion. Sign out, sign back in and try again — or email us and we'll do it for you within 30 days.";
}

// Firestore caps a batch at 500 writes; stay under it with room to spare.
const BATCH_LIMIT = 400;

async function deleteCollectionDocs(path: [string, ...string[]]) {
  if (!db) return;
  const snapshot = await getDocs(collection(db, ...path));
  if (snapshot.empty) return;

  const docs = snapshot.docs;
  for (let index = 0; index < docs.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);
    docs.slice(index, index + BATCH_LIMIT).forEach((entry) => batch.delete(entry.ref));
    await batch.commit();
  }
}

/**
 * Removes everything this user owns in Firestore. Runs while they are still
 * signed in, because the security rules key off their uid — after
 * `deleteUser` the client would no longer be allowed to touch any of it.
 *
 * Each step is individually guarded: a single collection failing (offline, or a
 * rule that forbids the query) must not strand the account half-deleted, and
 * the auth record is the part that legally matters most.
 */
async function deleteFirestoreData(uid: string) {
  if (!isFirebaseConfigured || !db) return;

  const steps: { label: string; run: () => Promise<void> }[] = [
    { label: "painLogs", run: () => deleteCollectionDocs(["users", uid, "painLogs"]) },
    { label: "onboardingAnswers", run: () => deleteCollectionDocs(["users", uid, "onboardingAnswers"]) },
    { label: "premiumWaitlist", run: async () => void (await deleteDoc(doc(db!, "premiumWaitlist", uid))) },
    {
      label: "featureRequests",
      run: async () => {
        // Top-level collection keyed by uid rather than nested under the user,
        // so it needs a query. If the rules disallow it these stay behind —
        // they hold no health data, only a requested feature name.
        const matches = await getDocs(query(collection(db!, "featureRequests"), where("uid", "==", uid)));
        await Promise.all(matches.docs.map((entry) => deleteDoc(entry.ref)));
      }
    },
    { label: "userDocument", run: async () => void (await deleteDoc(doc(db!, "users", uid))) }
  ];

  for (const step of steps) {
    try {
      await step.run();
    } catch (error) {
      captureUserMessage("Account data deletion step failed", "warning", {
        source: "firebase",
        action: `delete:${step.label}`,
        uid,
        errorMessage: error instanceof Error ? error.message : "Unknown Firestore error"
      });
    }
  }
}

async function getGoogleCredential() {
  // Deliberately re-implements the minimal Google flow rather than importing
  // from SignUpScreen: that file's sign-in path shipped hours ago and is not
  // worth destabilising for ~15 shared lines. Revisit once 1.0.3 is settled.
  const { GoogleSignin } = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false
  });
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken ?? result.idToken;
  if (!idToken) throw new ReauthRequiredError("google");
  return GoogleAuthProvider.credential(idToken);
}

async function getAppleCredential() {
  const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, "");
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const result = await AppleAuthentication.signInAsync({ nonce: hashedNonce });
  if (!result.identityToken) throw new ReauthRequiredError("apple");
  return new OAuthProvider("apple.com").credential({ idToken: result.identityToken, rawNonce });
}

/** Which provider a signed-in user would have to re-authenticate with. */
export function reauthMethodFor(user: User): ReauthMethod {
  if (user.isAnonymous) return "guest";
  const providers = user.providerData.map((entry) => entry.providerId);
  if (providers.includes("apple.com")) return "apple";
  if (providers.includes("google.com")) return "google";
  return "email";
}

async function reauthenticate(user: User, password?: string) {
  const method = reauthMethodFor(user);
  if (method === "guest") return;

  if (method === "google") {
    await reauthenticateWithCredential(user, await getGoogleCredential());
    return;
  }
  if (method === "apple" && Platform.OS === "ios") {
    await reauthenticateWithCredential(user, await getAppleCredential());
    return;
  }
  if (method === "email" && user.email && password) {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    return;
  }
  throw new ReauthRequiredError(method);
}

/**
 * Deletes the user's stored data and then the account itself (GDPR Art. 17,
 * and the in-app deletion Apple requires under Guideline 5.1.1(v)).
 *
 * Throws `ReauthRequiredError` when Firebase needs a fresh sign-in it cannot
 * obtain without more input — for email accounts, call again with `password`.
 */
export async function deleteAccountAndData(options: { password?: string } = {}): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase Auth is not configured.");
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You are not signed in on this device.");
  }

  const uid = user.uid;
  await deleteFirestoreData(uid);

  try {
    await deleteUser(user);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code !== "auth/requires-recent-login") throw error;

    const method = reauthMethodFor(user);
    if (method === "email" && !options.password) throw new ReauthRequiredError("email");

    // An anonymous account has no credential to re-authenticate with, so
    // `reauthenticate` is a no-op for guests and retrying `deleteUser` would
    // fail with exactly the same error. Surface it as something actionable
    // instead of looping into the generic failure.
    if (method === "guest") throw new ReauthRequiredError("guest");

    await reauthenticate(user, options.password);
    await deleteUser(user);
  }

  if (__DEV__) console.log("[AnklePath/Firebase Auth] Account and data deleted", { uid });
}
