import {
  identifyUser,
  resetAnalytics,
  trackButtonClick,
  trackEvent,
  trackOnboardingOptionSelected,
  trackOnboardingStepViewed,
  trackScreen,
  trackWaitlistJoined
} from "../services/analytics/posthog";

export function useAnalytics() {
  return {
    trackEvent,
    trackScreen,
    identifyUser,
    resetAnalytics,
    trackButtonClick,
    trackOnboardingStepViewed,
    trackOnboardingOptionSelected,
    trackWaitlistJoined
  };
}
