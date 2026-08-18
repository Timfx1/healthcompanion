import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingAnswersPayload } from "../types/onboarding";

const STORAGE_KEY = "@anklepath/onboarding/v1";

export type OnboardingState = {
  injuryType?: string;
  injuryTiming?: string;
  injuryDate?: string;
  symptoms: string[];
  /**
   * Undefined until the user actually picks a number. It used to default to 4,
   * which pre-selected an answer on their behalf and let them walk past the
   * question without ever answering it — the recovery plan then keyed off a
   * pain score nobody reported.
   */
  pain?: number;
  walkingAbility?: string;
  goal?: string;
  notificationsChoice?: "enabled" | "later";
};

type OnboardingContextValue = {
  state: OnboardingState;
  setField: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  toggleSymptom: (symptom: string) => void;
  /** Re-apply answers stored against this account (see `fetchUserState`). */
  restoreOnboarding: (answers: OnboardingAnswersPayload) => void;
  resetOnboarding: () => void;
};

const defaultState: OnboardingState = {
  symptoms: []
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          setState((current) => ({ ...current, ...(JSON.parse(raw) as Partial<OnboardingState>) }));
        }
      } catch {
        // Ignore corrupt/missing cache.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Best-effort persistence.
    });
  }, [hydrated, state]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      setField: (key, valueForKey) => {
        setState((current) => ({ ...current, [key]: valueForKey }));
      },
      toggleSymptom: (symptom) => {
        setState((current) => ({
          ...current,
          symptoms: current.symptoms.includes(symptom)
            ? current.symptoms.filter((item) => item !== symptom)
            : [...current.symptoms, symptom]
        }));
      },
      // Re-applies answers this account gave earlier, so a returning user's plan
      // is personalised straight away instead of them being asked all over again.
      restoreOnboarding: (answers) => {
        setState((current) => ({
          ...current,
          injuryType: answers.injuryType ?? current.injuryType,
          injuryTiming: answers.injuryTiming ?? current.injuryTiming,
          symptoms: answers.symptoms?.length ? answers.symptoms : current.symptoms,
          pain: answers.painScore ?? current.pain,
          walkingAbility: answers.walkingAbility ?? current.walkingAbility,
          goal: answers.recoveryGoal ?? current.goal,
          notificationsChoice: answers.notificationsChoice ?? current.notificationsChoice
        }));
      },
      resetOnboarding: () => {
        setState(defaultState);
      }
    }),
    [state]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }
  return value;
}
