import { normalizeError, sanitizeErrorContext, ErrorContext } from "../../utils/errorUtils";
import { addSentryBreadcrumb, isSentryConfigured, Sentry } from "./sentry";

type MessageLevel = "debug" | "info" | "warning" | "error" | "fatal";

export function captureAppError(error: unknown, context: ErrorContext = {}) {
  const normalizedError = normalizeError(error);
  const safeContext = sanitizeErrorContext(context);

  if (__DEV__) {
    console.error("[Healthcompanion/Error]", normalizedError, safeContext);
  }

  if (!isSentryConfigured) return;

  Sentry.withScope((scope) => {
    Object.entries(safeContext).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(normalizedError);
  });
}

export function captureUserMessage(message: string, level: MessageLevel = "warning", context: ErrorContext = {}) {
  const safeContext = sanitizeErrorContext(context);

  if (__DEV__) {
    console.log("[Healthcompanion/Message]", { message, level, context: safeContext });
  }

  if (!isSentryConfigured) return;

  addSentryBreadcrumb(message, safeContext, "non_fatal", level);
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    Object.entries(safeContext).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureMessage(message);
  });
}
