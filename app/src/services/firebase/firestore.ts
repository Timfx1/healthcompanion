import Constants from "expo-constants";
import { Platform } from "react-native";
import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, collection, addDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { OnboardingAnswersPayload } from "../../types/onboarding";
import { captureAppError, captureUserMessage } from "../monitoring/errorReporting";

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* values to your environment.");
  }
  return db;
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as T;
}

function logFirestoreError(action: string, error: unknown) {
  captureUserMessage(`Firestore ${action} failed`, "warning", {
    source: "firebase",
    action,
    errorMessage: error instanceof Error ? error.message : "Unknown Firestore error",
    errorCode: typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined
  });
  if (__DEV__) {
    console.log(`[AnklePath/Firestore] ${action} failed`, {
      message: error instanceof Error ? error.message : "Unknown Firestore error",
      code: typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined
    });
  }
}

export type RestoredUserState = {
  onboardingCompleted: boolean;
  answers?: OnboardingAnswersPayload;
  consent?: {
    healthGranted: boolean;
    /** The version they actually agreed to — never assume it is the current one. */
    healthVersion?: string;
    analyticsGranted: boolean;
    analyticsVersion?: string;
  };
};

/**
 * Reads back what this account has already told us, so a returning user is not
 * asked all of it again.
 *
 * `onboardingCompleted` has always lived in AsyncStorage, which a reinstall or a
 * sign-out wipes — so an existing customer looked brand new and was walked
 * through consent, the whole questionnaire and the paywall a second time.
 * Firestore has been recording the answers all along; this is the first thing to
 * read them.
 *
 * Returns `null` on any failure, including offline. The caller must then fall
 * back to normal onboarding: a user with no signal has to be able to keep going,
 * not sit on a screen that never resolves.
 */
export async function fetchUserState(uid: string): Promise<RestoredUserState | null> {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const firestore = db;
    const [profileSnap, answersSnap] = await Promise.all([
      getDoc(doc(firestore, "users", uid)),
      getDoc(doc(firestore, "users", uid, "onboardingAnswers", "latest"))
    ]);

    if (!profileSnap.exists()) return null;

    const profile = profileSnap.data() as {
      onboardingCompleted?: boolean;
      healthDataConsent?: { granted?: boolean; version?: string };
      analyticsConsent?: { granted?: boolean; version?: string };
    };

    const stored = answersSnap.exists() ? (answersSnap.data() as Partial<OnboardingAnswersPayload>) : undefined;
    const answers: OnboardingAnswersPayload | undefined = stored
      ? {
          injuryType: stored.injuryType,
          injuryTiming: stored.injuryTiming,
          symptoms: Array.isArray(stored.symptoms) ? stored.symptoms : [],
          painScore: typeof stored.painScore === "number" ? stored.painScore : undefined,
          walkingAbility: stored.walkingAbility,
          recoveryGoal: stored.recoveryGoal,
          notificationsChoice: stored.notificationsChoice
        }
      : undefined;

    const consent = profile.healthDataConsent
      ? {
          healthGranted: Boolean(profile.healthDataConsent.granted),
          healthVersion: profile.healthDataConsent.version,
          analyticsGranted: Boolean(profile.analyticsConsent?.granted),
          analyticsVersion: profile.analyticsConsent?.version
        }
      : undefined;

    if (__DEV__) {
      console.log("[AnklePath/Firestore] User state fetched", {
        uid,
        onboardingCompleted: Boolean(profile.onboardingCompleted),
        hasAnswers: Boolean(answers),
        hasConsent: Boolean(consent)
      });
    }

    return { onboardingCompleted: Boolean(profile.onboardingCompleted), answers, consent };
  } catch (error) {
    logFirestoreError("fetchUserState", error);
    return null;
  }
}

export async function upsertUserProfile(user: User, extra: Record<string, unknown> = {}) {
  const firestore = requireDb();
  const ref = doc(firestore, "users", user.uid);
  const snap = await getDoc(ref);
  const existingProfile = snap.exists() ? snap.data() : {};
  await setDoc(
    ref,
    withoutUndefined({
      uid: user.uid,
      email: user.email,
      isAnonymous: user.isAnonymous,
      // Reporting classification: guests are anonymous accounts, everyone with a
      // real provider is registered. `extra` (from auth.ts) supplies the exact
      // authMethod and can override userType; this is the always-present default.
      userType: user.isAnonymous ? "guest" : "registered",
      createdAt: snap.exists() ? existingProfile.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      onboardingCompleted: existingProfile.onboardingCompleted ?? false,
      currentRecoveryPhase: "Phase 1: Protect & Reduce Swelling",
      hasJoinedWaitlist: existingProfile.hasJoinedWaitlist ?? false,
      ...extra
    }),
    { merge: true }
  );
  if (__DEV__) console.log("[AnklePath/Firestore] User profile upserted", { uid: user.uid });
}

export async function saveOnboardingAnswers(uid: string, answers: OnboardingAnswersPayload) {
  const firestore = requireDb();
  await setDoc(
    doc(firestore, "users", uid, "onboardingAnswers", "latest"),
    withoutUndefined({
      injuryType: answers.injuryType,
      injuryTiming: answers.injuryTiming,
      symptoms: answers.symptoms,
      painScore: answers.painScore,
      walkingAbility: answers.walkingAbility,
      recoveryGoal: answers.recoveryGoal,
      notificationsChoice: answers.notificationsChoice,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }),
    { merge: true }
  );

  await setDoc(
    doc(firestore, "users", uid),
    withoutUndefined({
      onboardingCompleted: true,
      injuryType: answers.injuryType,
      injuryTiming: answers.injuryTiming,
      mainGoal: answers.recoveryGoal,
      updatedAt: serverTimestamp()
    }),
    { merge: true }
  );
  if (__DEV__) console.log("[AnklePath/Firestore] Onboarding answers saved", { uid });
}

// GDPR Art. 5(2) accountability: keep a server-side record of what the user
// agreed to and when, so consent can be demonstrated rather than asserted. The
// local AsyncStorage copy drives the UI; this one is the audit trail.
export async function saveConsentRecord(
  uid: string,
  consent: { healthGranted: boolean; analyticsGranted: boolean; version: string }
) {
  const firestore = requireDb();
  await setDoc(
    doc(firestore, "users", uid),
    {
      healthDataConsent: {
        granted: consent.healthGranted,
        version: consent.version,
        updatedAt: serverTimestamp()
      },
      analyticsConsent: {
        granted: consent.analyticsGranted,
        version: consent.version,
        updatedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  if (__DEV__) console.log("[AnklePath/Firestore] Consent recorded", { uid, ...consent });
}

export async function savePainLog(uid: string, payload: { painScore: number; symptoms: string[]; painLocation: string; notes: string }) {
  const firestore = requireDb();
  await addDoc(collection(firestore, "users", uid, "painLogs"), {
    painScore: payload.painScore,
    symptoms: payload.symptoms,
    painLocation: payload.painLocation,
    notes: payload.notes,
    createdAt: serverTimestamp()
  });
  if (__DEV__) console.log("[AnklePath/Firestore] Pain log saved", { uid, painScore: payload.painScore });
}

export async function saveNextRecoveryAreaRequest(params: {
  uid?: string | null;
  selectedArea: string;
  otherText?: string;
  sourceScreen: string;
  injuryType?: string;
  recoveryGoal?: string;
  currentPhase?: string;
}) {
  const firestore = requireDb();
  const payload = withoutUndefined({
    uid: params.uid ?? null,
    selectedArea: params.selectedArea,
    otherText: params.otherText?.trim() || undefined,
    sourceScreen: params.sourceScreen,
    createdAt: serverTimestamp(),
    injuryType: params.injuryType,
    recoveryGoal: params.recoveryGoal,
    currentPhase: params.currentPhase,
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version
  });

  await addDoc(collection(firestore, "featureRequests"), payload);

  if (params.uid) {
    await setDoc(
      doc(firestore, "users", params.uid),
      withoutUndefined({
        requestedNextRecoveryArea: params.selectedArea,
        requestedNextRecoveryAreaAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }),
      { merge: true }
    );
  }

  if (__DEV__) {
    console.log("[AnklePath/Firestore] Next recovery area request saved", {
      uid: params.uid ?? null,
      selectedArea: params.selectedArea
    });
  }
}

export async function joinPremiumWaitlist(params: {
  uid?: string | null;
  email?: string | null;
  idToken?: string | null;
  sourceScreen: string;
  injuryType?: string;
  recoveryGoal?: string;
}) {
  let restFailure: unknown;
  if (params.idToken && params.uid) {
    try {
      await joinPremiumWaitlistWithRest(params);
      if (__DEV__) console.log("[AnklePath/Firestore REST] Waitlist signup saved", { uid: params.uid });
      return { alreadyJoined: false };
    } catch (restError) {
      restFailure = restError;
      logFirestoreError("Waitlist REST signup", restError);
    }
  }

  try {
    const firestore = requireDb();
    const waitlistId = params.uid ?? `anonymous-${Date.now()}`;
    const waitlistRef = doc(firestore, "premiumWaitlist", waitlistId);

    const waitlistPayload = withoutUndefined({
      uid: params.uid ?? null,
      email: params.email ?? null,
      joinedAt: serverTimestamp(),
      sourceScreen: params.sourceScreen,
      injuryType: params.injuryType,
      recoveryGoal: params.recoveryGoal,
      appVersion: Constants.expoConfig?.version,
      platform: Platform.OS,
      status: "joined"
    });

    await withTimeout(
      setDoc(waitlistRef, waitlistPayload, { merge: true }),
      10000,
      "Firestore waitlist write timed out."
    );

    if (params.uid) {
      await withTimeout(setDoc(doc(firestore, "users", params.uid), {
        hasJoinedWaitlist: true,
        waitlistJoinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true }), 10000, "Firestore user waitlist update timed out.");
    }

    if (__DEV__) console.log("[AnklePath/Firestore] Waitlist signup saved", { waitlistId, uid: params.uid ?? null });
    return { alreadyJoined: false };
  } catch (error) {
    logFirestoreError("Waitlist signup", error);
    captureAppError(error, {
      source: "firebase",
      action: "joinPremiumWaitlist",
      uid: params.uid,
      sourceScreen: params.sourceScreen
    });
    throw restFailure ?? error;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

function toFirestoreFields(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined).map(([key, fieldValue]) => {
      if (fieldValue === null) return [key, { nullValue: null }];
      if (typeof fieldValue === "boolean") return [key, { booleanValue: fieldValue }];
      if (typeof fieldValue === "number") return [key, { doubleValue: fieldValue }];
      if (typeof fieldValue === "string" && /^\d{4}-\d{2}-\d{2}T/.test(fieldValue)) return [key, { timestampValue: fieldValue }];
      return [key, { stringValue: String(fieldValue) }];
    })
  );
}

async function patchFirestoreDocument(path: string, fields: Record<string, unknown>, idToken: string) {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID.");

  const response = await withTimeout(
    fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: toFirestoreFields(fields)
      })
    }),
    10000,
    `Firestore REST write timed out for ${path}.`
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore REST write failed (${response.status}): ${text}`);
  }
}

async function joinPremiumWaitlistWithRest(params: {
  uid?: string | null;
  email?: string | null;
  idToken?: string | null;
  sourceScreen: string;
  injuryType?: string;
  recoveryGoal?: string;
}) {
  if (!params.uid || !params.idToken) throw new Error("Missing Firebase user or ID token for waitlist REST write.");
  const now = new Date().toISOString();

  await patchFirestoreDocument(`premiumWaitlist/${params.uid}`, withoutUndefined({
    uid: params.uid,
    email: params.email ?? null,
    joinedAt: now,
    sourceScreen: params.sourceScreen,
    injuryType: params.injuryType,
    recoveryGoal: params.recoveryGoal,
    appVersion: Constants.expoConfig?.version,
    platform: Platform.OS,
    status: "joined"
  }), params.idToken);

  try {
    await patchFirestoreDocument(`users/${params.uid}`, {
      hasJoinedWaitlist: true,
      waitlistJoinedAt: now,
      updatedAt: now
    }, params.idToken);
  } catch (error) {
    logFirestoreError("User waitlist flag REST update", error);
  }
}
