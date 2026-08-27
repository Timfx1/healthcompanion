import { ExerciseCompletion, LocalProfile, PainEntry, TrackerCheckIn } from "../state/AppDataContext";
import { OnboardingState } from "../state/OnboardingContext";
import { trackerConfigs } from "../data/trackerCheckIns";
import { TRACKER_ORDER, daysTracked } from "./recoveryInsights";

// Builds the text a user hands to a clinician. Pure: data in, string out.
//
// The point is completeness — everything they typed, including the free-text
// notes and the onboarding answers, because a clinician asking "when did this
// start and what have you noticed?" should not have to prise it out of them.
// The previous version showed only the most recent pain score, which meant the
// user's own written notes never left the app.

export type DoctorSummaryInput = {
  profile: LocalProfile;
  onboarding: OnboardingState;
  painEntries: PainEntry[];
  trackerCheckIns: TrackerCheckIn[];
  exerciseCompletions: ExerciseCompletion[];
  completedExerciseIds: string[];
  phaseLabel: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function section(title: string, body: string[]): string[] {
  if (body.length === 0) return [];
  return [title.toUpperCase(), ...body, ""];
}

export function buildDoctorSummary(input: DoctorSummaryInput, now = new Date()): string {
  const { profile, onboarding, painEntries, trackerCheckIns, completedExerciseIds, phaseLabel } = input;
  const lines: string[] = [];

  lines.push(`ANKLEPATH SUMMARY — ${formatDate(now.toISOString())}`);
  lines.push(`Prepared by ${profile.displayName}`);
  lines.push("");

  // --- Background, from onboarding -----------------------------------------
  const background: string[] = [];
  if (onboarding.injuryType) background.push(`Injury: ${onboarding.injuryType}`);
  if (onboarding.injuryTiming) background.push(`When: ${onboarding.injuryTiming}`);
  if (onboarding.injuryDate) background.push(`Injury date: ${formatDate(onboarding.injuryDate)}`);
  if (onboarding.walkingAbility) background.push(`Walking at the start: ${onboarding.walkingAbility}`);
  if (onboarding.pain !== undefined) background.push(`Pain at the start: ${onboarding.pain}/10`);
  if (onboarding.symptoms.length) background.push(`Symptoms reported at the start: ${onboarding.symptoms.join(", ")}`);
  if (onboarding.goal) background.push(`Their goal: ${onboarding.goal}`);
  background.push(`Current stage in app: ${phaseLabel}`);
  lines.push(...section("Background", background));

  // --- Tracking period ------------------------------------------------------
  const tracked = daysTracked(painEntries, trackerCheckIns, now.getTime());
  const overview: string[] = [];
  if (tracked > 0) {
    overview.push(`Tracking for ${tracked} day${tracked === 1 ? "" : "s"}`);
    overview.push(`${painEntries.length} pain check-in${painEntries.length === 1 ? "" : "s"}, ${trackerCheckIns.length} other check-in${trackerCheckIns.length === 1 ? "" : "s"}`);
  }
  if (painEntries.length) {
    const values = painEntries.map((entry) => entry.pain);
    const average = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
    overview.push(`Pain now ${painEntries[0].pain}/10 · average ${average}/10 · range ${Math.min(...values)}–${Math.max(...values)}/10`);
  }
  overview.push(`Exercises completed: ${completedExerciseIds.length}`);
  lines.push(...section("Overview", overview));

  // --- Current measures -----------------------------------------------------
  const measures = TRACKER_ORDER.map((key) => {
    const entries = trackerCheckIns.filter((entry) => entry.key === key);
    if (entries.length === 0) return null;
    const latest = entries[0];
    const earliest = entries[entries.length - 1];
    const movement = entries.length > 1 && latest.label !== earliest.label ? ` (was: ${earliest.label})` : "";
    return `${trackerConfigs[key].title}: ${latest.label}${movement}`;
  }).filter((line): line is string => line !== null);
  lines.push(...section("Current measures", measures));

  // --- Full pain history, including every note ------------------------------
  const history = painEntries.map((entry) => {
    const parts = [`${formatDateTime(entry.createdAt)} — ${entry.pain}/10 at ${entry.location}`];
    if (entry.symptoms.length) parts.push(`  Symptoms: ${entry.symptoms.join(", ")}`);
    // The whole reason this feature exists: the user's own words.
    if (entry.notes.trim()) parts.push(`  Note: ${entry.notes.trim()}`);
    return parts.join("\n");
  });
  lines.push(...section("Pain check-ins", history));

  // --- Their notes collected together ---------------------------------------
  const notes = painEntries
    .filter((entry) => entry.notes.trim())
    .map((entry) => `${formatDate(entry.createdAt)}: ${entry.notes.trim()}`);
  if (notes.length > 1) {
    lines.push(...section("All written notes", notes));
  }

  if (painEntries.length === 0 && trackerCheckIns.length === 0) {
    lines.push("No check-ins logged yet, so this summary only covers the answers given when setting up.");
    lines.push("");
  }

  lines.push("—");
  lines.push("This is a self-reported summary from the Healthcompanion app. It is not a medical assessment,");
  lines.push("and Healthcompanion is not a medical device. It does not diagnose or provide clinical advice.");

  return lines.join("\n");
}
