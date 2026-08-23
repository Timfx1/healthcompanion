import { NavigatorScreenParams } from "@react-navigation/native";

// `mode` distinguishes the paywall shown during onboarding (default — continuing
// routes forward into the app) from the "upgrade" paywall opened later from a
// locked feature (continuing/success just returns the user where they were).
export type PaywallParams = { mode?: "onboarding" | "upgrade" } | undefined;

// "upgrade" means an existing guest is signing in to subscribe, rather than a
// new user starting out — they return to where they were instead of onboarding.
export type SignUpParams = { mode?: "onboarding" | "upgrade" } | undefined;

export type OnboardingStackParamList = {
  Welcome: undefined;
  SignUp: SignUpParams;
  Consent: undefined;
  InjuryType: undefined;
  InjuryTiming: undefined;
  Symptoms: undefined;
  PainWalking: undefined;
  RecoveryGoal: undefined;
  Notifications: undefined;
  PlanLoading: undefined;
  TrialPaywall: PaywallParams;
  FreePlanUnlocked: undefined;
  PremiumTeaser: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Plan: undefined;
  Track: undefined;
  Learn: undefined;
  Profile: undefined;
};

/**
 * The Recovery Companion tabs (spec §5). Four navigable tabs plus a CENTRE
 * ACTION that is not one: check-in opens as a modal, because it is something
 * you do and return from rather than a place you go, and switching tabs would
 * throw away whatever the person was looking at. See navigation/RecoveryTabs.
 */
export type RecoveryTabsParamList = {
  Home: undefined;
  Timeline: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  ExerciseDetail: { exerciseId: string };
  ArticleDetail: { articleId: string };
  TrackerCheckIn: { tracker: "swelling" | "walking" | "rangeOfMotion" | "balance" };
  Reports: undefined;
  Readiness: undefined;
  SignUp: SignUpParams;
  PainCheckIn: undefined;
  Safety: undefined;
  PremiumTeaser: undefined;
  TrialPaywall: PaywallParams;
  NextRecoveryArea: { sourceScreen: "Home" | "Profile" | "Learn" };

  // ── Recovery Companion §5 detail screens ──────────────────────────────────
  //
  // Every one of these is addressable. That is the same discipline the web
  // prototype's `?screen=` routes enforce, and it exists for the same reason:
  // a state nothing can reach is a state nothing checks. The prototype's dead
  // `Toast` branch and its save button with no `onClick` both survived
  // precisely because nothing could get to them.
  //
  // Params are IDs, never pre-built objects. A screen that receives its data
  // already assembled cannot be opened from anywhere except the place that
  // assembled it, and it stops reflecting later edits to that data.
  RcQuickCapture: undefined;
  RcAddEntry: undefined;
  RcJournal: { entryId?: string } | undefined;
  RcMilestone: { milestoneId: string };
  RcShareCard: { title: string; dayN: number; date: string };
  RcMedication: { medicationId: string };
  RcAppointment: { appointmentId: string };
  RcQuestions: { appointmentId: string };
  RcPhotoCapture: undefined;
  RcPhotoCompare: undefined;
  RcReport: undefined;
  RcReportRange: undefined;
  RcArticle: { articleId: string };
  RcSafety: undefined;
  RcWeekly: undefined;
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> | undefined;
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
};
