import { Platform } from "react-native";
import Constants from "expo-constants";
import PostHog from "posthog-react-native";
import { AnalyticsEvents, AnalyticsEventName } from "./events";
import { AnalyticsProperties, ScreenName } from "../../types/analytics";
import { addSentryBreadcrumb, setSentryContext } from "../monitoring/sentry";
import { captureUserMessage } from "../monitoring/errorReporting";

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export const isPostHogConfigured = Boolean(posthogKey);

function createPostHogClient() {
  if (!posthogKey) return null;
  try {
    return new PostHog(posthogKey, {
      host: posthogHost,
      captureAppLifecycleEvents: true,
      // Healthcompanion reads no feature flags, so skip the /flags/ call the SDK
      // otherwise makes on every launch — it was returning 401 and adding a
      // failed request to every session.
      preloadFeatureFlags: false,
      // Health app: nothing is sent until the user opts in on the consent
      // screen (GDPR Art. 6(1)(a)). setAnalyticsOptIn flips this on.
      defaultOptIn: false
    });
  } catch {
    return null;
  }
}

export const posthog = createPostHogClient();

if (__DEV__) {
  if (posthog) {
    console.log("[Healthcompanion/PostHog] Connected", { host: posthogHost });
  } else {
    console.log("[Healthcompanion/PostHog] Not configured. Add EXPO_PUBLIC_POSTHOG_API_KEY to .env.");
  }
}

function withDefaults(properties: AnalyticsProperties = {}): AnalyticsProperties {
  const merged = {
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version,
    timestamp: new Date().toISOString(),
    ...properties
  };
  return Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== undefined));
}

// Events fired before the user answers the consent screen — app opened, the
// Welcome and SignUp screens, signup_started. Discarding them would blind the
// exact part of the funnel most worth measuring, so hold them here instead:
// nothing leaves the device, and they are only ever sent if the user then opts
// in. Declining drops the buffer unsent.
type BufferedEvent = { eventName: string; properties: AnalyticsProperties };
let pendingEvents: BufferedEvent[] = [];
let consentDecided = false;

// Bounded so a user who never reaches the consent screen cannot grow it without
// limit. The pre-consent stretch is a handful of screens, so this is generous.
const MAX_BUFFERED_EVENTS = 100;

function sendToPostHog(eventName: string, eventProperties: AnalyticsProperties) {
  if (!posthog) return;
  try {
    posthog.capture(eventName, eventProperties as never);
  } catch (error) {
    if (__DEV__) console.log("[Healthcompanion/PostHog] Event failed safely", { eventName });
    captureUserMessage("PostHog event failed", "warning", {
      source: "posthog",
      eventName,
      errorMessage: error instanceof Error ? error.message : "Unknown PostHog error"
    });
  }
}

export function trackEvent(eventName: AnalyticsEventName | string, properties?: AnalyticsProperties) {
  const eventProperties = withDefaults(properties);
  addSentryBreadcrumb(eventName, eventProperties, "analytics");
  if (!posthog) return;

  if (!consentDecided) {
    if (pendingEvents.length < MAX_BUFFERED_EVENTS) {
      pendingEvents.push({ eventName, properties: eventProperties });
    }
    return;
  }

  try {
    posthog.capture(eventName, eventProperties as never);
    if (__DEV__ && (eventName === AnalyticsEvents.premiumWaitlistClicked || eventName === AnalyticsEvents.premiumWaitlistJoined)) {
      console.log("[Healthcompanion/PostHog] Event sent", { eventName, properties: eventProperties });
    }
  } catch (error) {
    // Analytics must never block the app experience.
    if (__DEV__) console.log("[Healthcompanion/PostHog] Event failed safely", { eventName });
    captureUserMessage("PostHog event failed", "warning", {
      source: "posthog",
      eventName,
      errorMessage: error instanceof Error ? error.message : "Unknown PostHog error"
    });
  }
}

export function trackScreen(screenName: ScreenName, properties?: AnalyticsProperties) {
  setSentryContext("navigation", { currentScreen: screenName });
  trackEvent(AnalyticsEvents.screenViewed, { screen: screenName, ...properties });
  if (screenName === "Home") trackEvent(AnalyticsEvents.homeViewed, properties);
}

export function identifyUser(uid: string, properties?: AnalyticsProperties) {
  if (!posthog) return;
  try {
    posthog.identify(uid, withDefaults({ uid, ...properties }) as never);
    if (__DEV__) console.log("[Healthcompanion/PostHog] User identified", { uid });
  } catch (error) {
    // Identification failures should not affect auth or navigation.
    if (__DEV__) console.log("[Healthcompanion/PostHog] Identify failed safely", { uid });
    captureUserMessage("PostHog identify failed", "warning", {
      source: "posthog",
      uid,
      errorMessage: error instanceof Error ? error.message : "Unknown PostHog identify error"
    });
  }
}

// Applies the user's analytics consent. Called when they answer the consent
// screen and whenever they flip the toggle in Profile. Opting out stops events
// leaving the device; local Sentry breadcrumbs are unaffected, since crash
// diagnostics rest on legitimate interest rather than consent.
export function setAnalyticsOptIn(granted: boolean) {
  if (!posthog) return;
  try {
    if (granted) {
      posthog.optIn();
    } else {
      posthog.optOut();
    }

    // First decision of the session settles the buffer: replay it when they
    // opted in, drop it otherwise. Either way the gate opens and later events
    // go straight through.
    const buffered = pendingEvents;
    pendingEvents = [];
    consentDecided = true;
    if (granted) {
      buffered.forEach((event) => sendToPostHog(event.eventName, event.properties));
    }

    if (__DEV__) {
      console.log("[Healthcompanion/PostHog] Analytics consent applied", { granted, replayed: granted ? buffered.length : 0 });
    }
  } catch (error) {
    // Never let a consent toggle throw into the UI.
    captureUserMessage("PostHog opt-in change failed", "warning", {
      source: "posthog",
      granted,
      errorMessage: error instanceof Error ? error.message : "Unknown PostHog opt-in error"
    });
  }
}

export function resetAnalytics() {
  try {
    posthog?.reset();
  } catch {
    // Ignore analytics reset failures.
  }
}

export function trackButtonClick(buttonName: string, screenName: string, properties?: AnalyticsProperties) {
  trackEvent(AnalyticsEvents.buttonClicked, { buttonName, screen: screenName, ...properties });
}

export function trackOnboardingStepViewed(stepName: string, stepNumber: number, properties?: AnalyticsProperties) {
  trackEvent(AnalyticsEvents.onboardingStepViewed, { stepName, stepNumber, ...properties });
}

export function trackOnboardingOptionSelected(stepName: string, selectedOption: string, properties?: AnalyticsProperties) {
  trackEvent(AnalyticsEvents.onboardingOptionSelected, { stepName, selectedOption, ...properties });
}

export function trackWaitlistJoined(properties?: AnalyticsProperties) {
  trackEvent(AnalyticsEvents.premiumWaitlistJoined, properties);
}
