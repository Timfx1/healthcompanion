import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";
import { sanitizeErrorContext } from "../../utils/errorUtils";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const buildProfile =
  process.env.EAS_BUILD_PROFILE ??
  process.env.EXPO_PUBLIC_BUILD_PROFILE ??
  (__DEV__ ? "development" : "production");

export const isSentryConfigured = Boolean(sentryDsn);

export function initSentry() {
  if (!sentryDsn) {
    if (__DEV__) console.log("[AnklePath/Sentry] Not configured. Add EXPO_PUBLIC_SENTRY_DSN to .env.");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: buildProfile,
    release: `${Constants.expoConfig?.slug ?? "anklepath"}@${Constants.expoConfig?.version ?? "0.0.0"}`,
    tracesSampleRate: buildProfile === "production" ? 0.05 : 0.2,
    debug: __DEV__,
    enableAutoSessionTracking: true
  });

  Sentry.setTags({
    appVersion: Constants.expoConfig?.version ?? "unknown",
    buildProfile,
    platform: Platform.OS
  });

  if (__DEV__) console.log("[AnklePath/Sentry] Connected", { buildProfile });
}

export function setSentryUser(user: { uid: string; email?: string | null; isAnonymous?: boolean }) {
  if (!isSentryConfigured) return;
  Sentry.setUser({
    id: user.uid,
    email: user.email ?? undefined,
    isAnonymous: user.isAnonymous
  });
}

export function clearSentryUser() {
  if (!isSentryConfigured) return;
  Sentry.setUser(null);
}

export function setSentryContext(name: string, context: Record<string, unknown>) {
  if (!isSentryConfigured) return;
  Sentry.setContext(name, sanitizeErrorContext(context));
}

export function addSentryBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category = "app",
  level: Sentry.SeverityLevel = "info"
) {
  if (!isSentryConfigured) return;
  Sentry.addBreadcrumb({
    type: "default",
    category,
    message,
    level,
    data: sanitizeErrorContext(data)
  });
}

export { Sentry };
