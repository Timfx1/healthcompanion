import Constants from "expo-constants";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { captureUserMessage } from "../monitoring/errorReporting";

export type UserDataExport = {
  exportedAt: string;
  appVersion?: string;
  account: Record<string, unknown> | null;
  onboardingAnswers: Record<string, unknown>[];
  painLogs: Record<string, unknown>[];
  deviceData: Record<string, unknown>;
  notes: string[];
};

// Firestore Timestamps and DocumentReferences do not survive JSON.stringify in
// any readable form, so flatten them to ISO strings / paths first. A data export
// the user cannot read would not satisfy Art. 20.
function toPlainValue(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "object") {
    const candidate = value as { toDate?: () => Date; path?: string };
    if (typeof candidate.toDate === "function") return candidate.toDate().toISOString();
    if (Array.isArray(value)) return value.map(toPlainValue);
    if (typeof candidate.path === "string" && Object.keys(value).length === 1) return candidate.path;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toPlainValue(item)]));
  }
  return value;
}

function toPlainDocument(data: Record<string, unknown>, id?: string): Record<string, unknown> {
  const plain = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toPlainValue(value)]));
  return id ? { id, ...plain } : plain;
}

/**
 * Collects everything Recovery Health Companion holds about the signed-in user, for the GDPR
 * Art. 20 portability right. `deviceData` is passed in by the caller because it
 * lives in AppDataContext rather than Firestore — a guest who never synced
 * still gets a complete export of what is on their device.
 */
export async function buildUserDataExport(deviceData: Record<string, unknown>): Promise<UserDataExport> {
  const base: UserDataExport = {
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version,
    account: null,
    onboardingAnswers: [],
    painLogs: [],
    deviceData,
    notes: [
      "This file contains everything Recovery Health Companion stores about your account.",
      "Questions or corrections: see the contact address in our Privacy Policy."
    ]
  };

  const user = auth?.currentUser;
  if (!isFirebaseConfigured || !db || !user) {
    base.notes.push("No signed-in account was found, so only data stored on this device is included.");
    return base;
  }

  try {
    const accountSnap = await getDoc(doc(db, "users", user.uid));
    if (accountSnap.exists()) base.account = toPlainDocument(accountSnap.data());

    const answersSnap = await getDocs(collection(db, "users", user.uid, "onboardingAnswers"));
    base.onboardingAnswers = answersSnap.docs.map((entry) => toPlainDocument(entry.data(), entry.id));

    const logsSnap = await getDocs(collection(db, "users", user.uid, "painLogs"));
    base.painLogs = logsSnap.docs.map((entry) => toPlainDocument(entry.data(), entry.id));
  } catch (error) {
    // Return what we have rather than nothing; the note tells the user why it
    // may be incomplete and how to request the rest.
    base.notes.push("Some server-stored data could not be read. Please try again online, or contact support.");
    captureUserMessage("Data export partially failed", "warning", {
      source: "firebase",
      uid: user.uid,
      errorMessage: error instanceof Error ? error.message : "Unknown Firestore error"
    });
  }

  return base;
}
