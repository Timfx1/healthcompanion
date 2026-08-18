import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CONSENT_STORAGE_KEY = "@anklepath/consent/v1";

// Bump when the wording of what users agree to changes materially. A stored
// consent recorded against an older version no longer counts as granted, so the
// consent screen asks again instead of silently relying on a stale agreement.
export const CONSENT_VERSION = "2026-08-12";

export type ConsentRecord = {
  granted: boolean;
  version: string;
  updatedAt: string | null;
};

type ConsentState = {
  // GDPR Art. 9(2)(a): explicit consent to process health data (injury,
  // symptoms, pain scores, notes). Required before onboarding collects any.
  health: ConsentRecord;
  // Art. 6(1)(a): separate, optional consent for product analytics. Kept apart
  // from health consent on purpose — bundling them would invalidate both.
  analytics: ConsentRecord;
};

type ConsentValue = ConsentState & {
  hydrated: boolean;
  /** True only when health consent was granted against the current version. */
  hasCurrentHealthConsent: boolean;
  grantHealthConsent: () => void;
  /** Re-apply a consent recorded earlier, keeping the version they agreed to. */
  restoreConsent: (stored: {
    healthGranted: boolean;
    healthVersion?: string;
    analyticsGranted: boolean;
    analyticsVersion?: string;
    updatedAt?: string | null;
  }) => void;
  withdrawHealthConsent: () => void;
  setAnalyticsConsent: (granted: boolean) => void;
  resetConsent: () => void;
};

const EMPTY_RECORD: ConsentRecord = { granted: false, version: CONSENT_VERSION, updatedAt: null };

const DEFAULT_STATE: ConsentState = {
  health: EMPTY_RECORD,
  analytics: EMPTY_RECORD
};

function record(granted: boolean): ConsentRecord {
  return { granted, version: CONSENT_VERSION, updatedAt: new Date().toISOString() };
}

const ConsentContext = createContext<ConsentValue | undefined>(undefined);

export function ConsentProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ConsentState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
        if (raw && !cancelled) {
          const stored = JSON.parse(raw) as Partial<ConsentState>;
          setState((current) => ({
            health: { ...current.health, ...stored.health },
            analytics: { ...current.analytics, ...stored.analytics }
          }));
        }
      } catch {
        // A corrupt record must fail closed: no consent until asked again.
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
    AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Best-effort persistence; the consent screen reappears if this fails.
    });
  }, [hydrated, state]);

  const value = useMemo<ConsentValue>(
    () => ({
      ...state,
      hydrated,
      hasCurrentHealthConsent: state.health.granted && state.health.version === CONSENT_VERSION,
      grantHealthConsent: () => setState((current) => ({ ...current, health: record(true) })),
      withdrawHealthConsent: () => setState((current) => ({ ...current, health: record(false) })),
      setAnalyticsConsent: (granted) => setState((current) => ({ ...current, analytics: record(granted) })),
      // Re-hydrates a consent the user gave earlier, on another device or before
      // a reinstall. Deliberately does NOT go through grantHealthConsent, which
      // stamps CONSENT_VERSION: that would relabel a stale agreement as current
      // and skip the re-consent the version check exists to force. The stored
      // version is written verbatim so `hasCurrentHealthConsent` still decides.
      restoreConsent: (stored) =>
        setState({
          health: {
            granted: stored.healthGranted,
            version: stored.healthVersion ?? "unknown",
            updatedAt: stored.updatedAt ?? null
          },
          analytics: {
            granted: stored.analyticsGranted,
            version: stored.analyticsVersion ?? stored.healthVersion ?? "unknown",
            updatedAt: stored.updatedAt ?? null
          }
        }),
      resetConsent: () => setState(DEFAULT_STATE)
    }),
    [state, hydrated]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const value = useContext(ConsentContext);
  if (!value) {
    throw new Error("useConsent must be used inside ConsentProvider");
  }
  return value;
}
