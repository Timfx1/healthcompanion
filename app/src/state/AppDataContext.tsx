import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@healthcompanion/appData/v1";

export type PainEntry = {
  id: string;
  pain: number;
  location: string;
  symptoms: string[];
  notes: string;
  createdAt: string;
};

// A dated log of exercise completions, kept alongside `completedExerciseIds`
// (which stays the source of truth for "is this ticked right now"). The plain id
// list has no timestamps, so on its own it cannot answer "how did pain compare on
// days you exercised?" — this does. Additive: data saved before this existed
// simply hydrates as an empty list, exactly like `isPremium` did.
export type ExerciseCompletion = {
  exerciseId: string;
  completedAt: string;
};

export type TrackerKey = "swelling" | "walking" | "rangeOfMotion" | "balance";

export type TrackerCheckIn = {
  id: string;
  key: TrackerKey;
  value: number;
  label: string;
  createdAt: string;
};

export type AuthMethod = "guest" | "apple" | "google" | "email" | null;

export type LocalProfile = {
  displayName: string;
  authMethod: AuthMethod;
  photoUri?: string;
};

export type AppDataValue = {
  completedExerciseIds: string[];
  exerciseCompletions: ExerciseCompletion[];
  painEntries: PainEntry[];
  savedArticles: string[];
  trackerCheckIns: TrackerCheckIn[];
  profile: LocalProfile;
  onboardingCompleted: boolean;
  isPremium: boolean;
  premiumSince?: string;
  hydrated: boolean;
  toggleExerciseComplete: (exerciseId: string) => void;
  markExerciseComplete: (exerciseId: string) => void;
  savePainEntry: (entry: Omit<PainEntry, "id" | "createdAt">) => void;
  toggleArticleSaved: (articleTitle: string) => void;
  addTrackerCheckIn: (key: TrackerKey, value: number, label: string) => void;
  setProfile: (profile: Partial<LocalProfile>) => void;
  completeOnboarding: () => void;
  setPremiumActive: (active: boolean) => void;
  resetAppData: () => void;
};

const DEFAULT_PROFILE: LocalProfile = {
  displayName: "Guest Recovery",
  authMethod: null
};

/** Local calendar day, so "today" matches the user's own device. */
function isSameLocalDay(iso: string, reference = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function logCompletion(log: ExerciseCompletion[], exerciseId: string): ExerciseCompletion[] {
  // One entry per exercise per day is enough for the day-level comparisons.
  if (log.some((entry) => entry.exerciseId === exerciseId && isSameLocalDay(entry.completedAt))) return log;
  return [{ exerciseId, completedAt: new Date().toISOString() }, ...log];
}

function dropTodaysCompletion(log: ExerciseCompletion[], exerciseId: string): ExerciseCompletion[] {
  return log.filter((entry) => !(entry.exerciseId === exerciseId && isSameLocalDay(entry.completedAt)));
}

/**
 * EXPORTED FOR THE RENDER HARNESS, and for nothing else in the app.
 *
 * `harness/` supplies this context filled from the mock fixture, because a
 * browser has no AsyncStorage and a SCREENSHOT should not depend on hydration
 * order. The screens cannot tell the difference: they only ever read the
 * context, never the provider.
 *
 * App code must keep using the hook. Reaching for the context directly would
 * skip the "used outside its provider" guard that the hook exists to give.
 */
export const AppDataContext = createContext<AppDataValue | undefined>(undefined);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [exerciseCompletions, setExerciseCompletions] = useState<ExerciseCompletion[]>([]);
  const [painEntries, setPainEntries] = useState<PainEntry[]>([]);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [profile, setProfileState] = useState<LocalProfile>(DEFAULT_PROFILE);
  const [trackerCheckIns, setTrackerCheckIns] = useState<TrackerCheckIn[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumSince, setPremiumSince] = useState<string | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  // Load any previously saved data once on startup (works in guest mode too).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const stored = JSON.parse(raw) as Partial<{
            completedExerciseIds: string[];
            exerciseCompletions: ExerciseCompletion[];
            painEntries: PainEntry[];
            savedArticles: string[];
            trackerCheckIns: TrackerCheckIn[];
            profile: LocalProfile;
            onboardingCompleted: boolean;
            isPremium: boolean;
            premiumSince: string;
          }>;
          if (Array.isArray(stored.completedExerciseIds)) setCompletedExerciseIds(stored.completedExerciseIds);
          if (Array.isArray(stored.exerciseCompletions)) setExerciseCompletions(stored.exerciseCompletions);
          if (Array.isArray(stored.painEntries)) setPainEntries(stored.painEntries);
          if (Array.isArray(stored.savedArticles)) setSavedArticles(stored.savedArticles);
          if (Array.isArray(stored.trackerCheckIns)) setTrackerCheckIns(stored.trackerCheckIns);
          if (stored.profile) setProfileState((current) => ({ ...current, ...stored.profile }));
          if (typeof stored.onboardingCompleted === "boolean") setOnboardingCompleted(stored.onboardingCompleted);
          // Cached entitlement gives instant premium UI on launch; RevenueCat
          // re-verifies against the store once online (see PremiumSync).
          if (typeof stored.isPremium === "boolean") setIsPremium(stored.isPremium);
          if (typeof stored.premiumSince === "string") setPremiumSince(stored.premiumSince);
        }
      } catch {
        // Ignore corrupt/missing cache and start fresh.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change, but only after the initial load so we never
  // overwrite saved data with the empty starting state.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completedExerciseIds,
        exerciseCompletions,
        painEntries,
        savedArticles,
        trackerCheckIns,
        profile,
        onboardingCompleted,
        isPremium,
        premiumSince
      })
    ).catch(() => {
      // Best-effort persistence; ignore write failures.
    });
  }, [
    hydrated,
    completedExerciseIds,
    exerciseCompletions,
    painEntries,
    savedArticles,
    trackerCheckIns,
    profile,
    onboardingCompleted,
    isPremium,
    premiumSince
  ]);

  const value = useMemo<AppDataValue>(
    () => ({
      completedExerciseIds,
      exerciseCompletions,
      painEntries,
      savedArticles,
      trackerCheckIns,
      profile,
      onboardingCompleted,
      isPremium,
      premiumSince,
      hydrated,
      toggleExerciseComplete: (exerciseId) => {
        // Read from the memo's closure rather than a functional updater: the
        // dated log has to move in step with the id list, and side effects
        // inside a state updater run twice under StrictMode.
        const alreadyDone = completedExerciseIds.includes(exerciseId);
        setCompletedExerciseIds(
          alreadyDone ? completedExerciseIds.filter((id) => id !== exerciseId) : [...completedExerciseIds, exerciseId]
        );
        // Un-ticking means "I did not do this today", so drop only today's entry —
        // earlier days stay in the log so past trends do not silently change.
        setExerciseCompletions((log) => (alreadyDone ? dropTodaysCompletion(log, exerciseId) : logCompletion(log, exerciseId)));
      },
      markExerciseComplete: (exerciseId) => {
        if (completedExerciseIds.includes(exerciseId)) return;
        setCompletedExerciseIds([...completedExerciseIds, exerciseId]);
        setExerciseCompletions((log) => logCompletion(log, exerciseId));
      },
      savePainEntry: (entry) => {
        setPainEntries((current) => [
          {
            ...entry,
            id: `${Date.now()}`,
            createdAt: new Date().toISOString()
          },
          ...current
        ]);
      },
      toggleArticleSaved: (articleTitle) => {
        setSavedArticles((current) =>
          current.includes(articleTitle)
            ? current.filter((title) => title !== articleTitle)
            : [...current, articleTitle]
        );
      },
      addTrackerCheckIn: (key, value, label) => {
        setTrackerCheckIns((current) => [
          { id: `${Date.now()}`, key, value, label, createdAt: new Date().toISOString() },
          ...current
        ]);
      },
      setProfile: (nextProfile) => {
        setProfileState((current) => ({ ...current, ...nextProfile }));
      },
      completeOnboarding: () => {
        setOnboardingCompleted(true);
      },
      setPremiumActive: (active) => {
        setIsPremium(active);
        setPremiumSince((current) => (active ? current ?? new Date().toISOString() : undefined));
      },
      resetAppData: () => {
        setCompletedExerciseIds([]);
        setExerciseCompletions([]);
        setPainEntries([]);
        setSavedArticles([]);
        setTrackerCheckIns([]);
        setProfileState(DEFAULT_PROFILE);
        setOnboardingCompleted(false);
        // Note: we do not clear isPremium here — a paid entitlement belongs to the
        // store account, not this device's onboarding state, and RevenueCat is the
        // source of truth. Sign-out clears it separately via PremiumSync re-check.
      }
    }),
    [
      completedExerciseIds,
      exerciseCompletions,
      painEntries,
      savedArticles,
      trackerCheckIns,
      profile,
      onboardingCompleted,
      isPremium,
      premiumSince,
      hydrated
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return value;
}
