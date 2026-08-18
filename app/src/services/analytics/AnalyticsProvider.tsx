import { PropsWithChildren, useEffect } from "react";
import { PostHogProvider } from "posthog-react-native";
import { isPostHogConfigured, posthog, setAnalyticsOptIn } from "./posthog";
import { useConsent } from "../../state/ConsentContext";

export function AnalyticsProvider({ children }: PropsWithChildren) {
  const { analytics, hydrated } = useConsent();

  // The stored consent is the source of truth, so re-assert it on every launch
  // once it has loaded. Without this the SDK's own persisted opt-in state could
  // drift from what the user actually chose (e.g. after a storage reset).
  //
  // `updatedAt === null` means the user has not answered the consent screen
  // yet — a first install, not a refusal. Staying silent here keeps the
  // pre-consent event buffer open; the consent screen is what settles it.
  useEffect(() => {
    if (!hydrated || analytics.updatedAt === null) return;
    setAnalyticsOptIn(analytics.granted);
  }, [hydrated, analytics.granted, analytics.updatedAt]);

  if (!isPostHogConfigured || !posthog) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog} autocapture={{ captureScreens: false, captureTouches: false }}>{children}</PostHogProvider>;
}
