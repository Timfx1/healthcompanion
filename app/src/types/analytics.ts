export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined | string[]>;

export type ScreenName =
  | "Welcome"
  | "SignUp"
  | "InjuryType"
  | "InjuryTiming"
  | "Symptoms"
  | "PainWalking"
  | "RecoveryGoal"
  | "Notifications"
  | "PlanLoading"
  | "FreePlanUnlocked"
  | "PremiumTeaser"
  | "Home"
  | "Plan"
  | "Track"
  | "Learn"
  | "Profile"
  | "ExerciseDetail"
  | "PainCheckIn"
  | "Safety"
  | string;
