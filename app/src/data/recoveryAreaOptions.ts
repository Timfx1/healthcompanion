export const recoveryAreaOptions = [
  "Knee",
  "Back",
  "Shoulder",
  "Hip",
  "Wrist",
  "Foot",
  "Achilles",
  "Full body recovery",
  "Other"
] as const;

export type RecoveryAreaOption = (typeof recoveryAreaOptions)[number];
