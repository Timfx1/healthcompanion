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
};

export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> | undefined;
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
};
