export type OnboardingAnswersPayload = {
  injuryType?: string;
  injuryTiming?: string;
  symptoms: string[];
  // Optional because the user may not have answered yet — `withoutUndefined`
  // strips it before the write rather than storing a number nobody reported.
  painScore?: number;
  walkingAbility?: string;
  recoveryGoal?: string;
  notificationsChoice?: "enabled" | "later";
};

export type UserProfilePayload = {
  uid: string;
  email?: string | null;
  isAnonymous: boolean;
  onboardingCompleted?: boolean;
  currentRecoveryPhase?: string;
  injuryType?: string;
  injuryTiming?: string;
  mainGoal?: string;
  hasJoinedWaitlist?: boolean;
};
