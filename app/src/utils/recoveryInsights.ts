import { Ionicons } from "@expo/vector-icons";
import { ExerciseCompletion, PainEntry, TrackerCheckIn, TrackerKey } from "../state/AppDataContext";
import { trackerConfigs } from "../data/trackerCheckIns";
import { PHASES, estimateInjuryDaysAgo, exercises } from "../data/mockRecoveryPlan";

// Pure recovery analytics. No React, no storage, no network — data in, result
// out — so the same numbers feed Reports, the Plan tab, Readiness and the
// exported PDF without any of them drifting apart.
//
// Two things to keep in mind when editing:
//   1. painEntries/trackerCheckIns are stored NEWEST FIRST. Anything
//      chronological must copy-and-reverse first ([...entries].reverse()).
//   2. Direction differs per signal — see HIGHER_IS_BETTER below. Flipping one
//      silently inverts a whole insight while still typechecking.

const DAY_MS = 86_400_000;

/** Which way is "better" for each 0-3 tracker. Lower swelling is good; higher everything else is good. */
export const HIGHER_IS_BETTER: Record<TrackerKey, boolean> = {
  swelling: false,
  walking: true,
  rangeOfMotion: true,
  balance: true
};

export const TRACKER_ORDER: TrackerKey[] = ["swelling", "walking", "rangeOfMotion", "balance"];

export type Tone = "good" | "bad" | "neutral";

export type Insight = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: Tone;
  headline: string;
  detail: string;
};

export type ProgressionRecommendation = "advance" | "hold" | "ease_back";

export type ProgressionState = {
  phase: { id: string; label: string; focus: string; index: number };
  progress: number;
  recommendation: ProgressionRecommendation;
  reasons: string[];
  suggestedExercises: string[];
  /** True when there is not enough logged data yet and the phase came from onboarding timing. */
  estimated: boolean;
};

export type ReadinessCriterion = {
  id: string;
  label: string;
  met: boolean;
  gap: string;
};

export type ReadinessState = {
  score: number;
  verdict: "keep_building" | "nearly_there" | "encouraging";
  criteria: ReadinessCriterion[];
  hasData: boolean;
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Local calendar day key, so "today" matches what the user sees on their phone. */
function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function startOfLocalDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function mean(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function inWindow(iso: string, startMs: number, endMs: number): boolean {
  const time = new Date(iso).getTime();
  return !Number.isNaN(time) && time >= startMs && time < endMs;
}

function trackerEntries(checkIns: TrackerCheckIn[], key: TrackerKey): TrackerCheckIn[] {
  return checkIns.filter((entry) => entry.key === key);
}

/** Newest-first arrays mean index 0 is the latest entry. */
function latestValue(checkIns: TrackerCheckIn[], key: TrackerKey): number | undefined {
  return trackerEntries(checkIns, key)[0]?.value;
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

/** True when a change is big enough to be worth showing, rather than noise. */
function isMeaningful(delta: number, threshold: number): boolean {
  return Math.abs(delta) >= threshold;
}

function medianTime(entries: { createdAt: string }[]): number | undefined {
  const times = entries.map((entry) => new Date(entry.createdAt).getTime()).sort((a, b) => a - b);
  if (times.length === 0) return undefined;
  return times[Math.floor(times.length / 2)];
}

/**
 * How far apart two groups of entries sit in time. Used to reject comparisons
 * between groups drawn from different stretches of the recovery, where any
 * difference would just be the healing trend.
 */
function medianDayGap(groupA: { createdAt: string }[], groupB: { createdAt: string }[]): number {
  const a = medianTime(groupA);
  const b = medianTime(groupB);
  if (a === undefined || b === undefined) return Number.POSITIVE_INFINITY;
  return Math.abs(a - b);
}

type Window = { start: number; end: number };

function recentWindows(now: number): { current: Window; previous: Window } {
  const endOfToday = startOfLocalDay(now) + DAY_MS;
  return {
    current: { start: endOfToday - 7 * DAY_MS, end: endOfToday },
    previous: { start: endOfToday - 14 * DAY_MS, end: endOfToday - 7 * DAY_MS }
  };
}

function painAverageIn(entries: PainEntry[], window: Window): number | undefined {
  return mean(entries.filter((entry) => inWindow(entry.createdAt, window.start, window.end)).map((entry) => entry.pain));
}

function trackerAverageIn(checkIns: TrackerCheckIn[], key: TrackerKey, window: Window): number | undefined {
  return mean(
    trackerEntries(checkIns, key)
      .filter((entry) => inWindow(entry.createdAt, window.start, window.end))
      .map((entry) => entry.value)
  );
}

/** Every local day on which the user logged anything at all. */
function loggedDayKeys(painEntries: PainEntry[], checkIns: TrackerCheckIn[]): Set<string> {
  const keys = new Set<string>();
  painEntries.forEach((entry) => keys.add(dayKey(entry.createdAt)));
  checkIns.forEach((entry) => keys.add(dayKey(entry.createdAt)));
  return keys;
}

/**
 * How many days this person has logged on, ever. A COUNT, not a chain.
 *
 * This replaces a consecutive-day streak, which N1/N2 forbid outright and P2
 * describes as manufacturing the guilt that is the top abandonment driver:
 * "No streaks that can 'break'. Consistency is shown as gentle accumulation
 * ('you've checked in 12 times'), never as a chain with a breakable link."
 *
 * The difference is not cosmetic and it is not framing. A streak is a number
 * that can go DOWN because of something the user did not do; this one cannot go
 * down at all. That is what makes it safe to show on the doctor report, where
 * the old one was being shown with a flame icon.
 */
function checkInCount(loggedDays: Set<string>): number {
  return loggedDays.size;
}

function earliestTimestamp(painEntries: PainEntry[], checkIns: TrackerCheckIn[]): number | undefined {
  const times = [...painEntries, ...checkIns]
    .map((entry) => new Date(entry.createdAt).getTime())
    .filter((time) => !Number.isNaN(time));
  return times.length ? Math.min(...times) : undefined;
}

export function daysTracked(painEntries: PainEntry[], checkIns: TrackerCheckIn[], now = Date.now()): number {
  const earliest = earliestTimestamp(painEntries, checkIns);
  if (earliest === undefined) return 0;
  return Math.max(1, Math.round((now - earliest) / DAY_MS) + 1);
}

// ---------------------------------------------------------------------------
// 1. Advanced progress insights
// ---------------------------------------------------------------------------

/** Maximum cards shown at once, so the Reports tab stays readable. */
const MAX_INSIGHTS = 6;

export function buildProgressInsights(
  painEntries: PainEntry[],
  trackerCheckIns: TrackerCheckIn[],
  exerciseCompletions: ExerciseCompletion[],
  now = Date.now()
): Insight[] {
  const insights: Insight[] = [];
  const { current, previous } = recentWindows(now);

  // --- Pain: this week vs last week -----------------------------------------
  const painNow = painAverageIn(painEntries, current);
  const painBefore = painAverageIn(painEntries, previous);

  if (painNow !== undefined && painBefore !== undefined) {
    const delta = painNow - painBefore;
    const tone: Tone = delta <= -0.5 ? "good" : delta >= 0.5 ? "bad" : "neutral";
    insights.push({
      id: "pain-week",
      icon: "pulse",
      tone,
      headline: isMeaningful(delta, 0.5)
        ? `Pain ${delta < 0 ? "down" : "up"} ${round1(Math.abs(delta))} this week`
        : "Pain steady this week",
      detail: `7-day average ${round1(painNow)}/10, compared with ${round1(painBefore)}/10 the week before.`
    });
  } else if (painNow !== undefined) {
    insights.push({
      id: "pain-week",
      icon: "pulse",
      tone: "neutral",
      headline: `Pain averaging ${round1(painNow)}/10 this week`,
      detail: "Keep logging — after another week there is enough history to compare week on week."
    });
  }

  // --- Trackers: biggest mover in each direction -----------------------------
  type Move = { key: TrackerKey; delta: number; improved: boolean };
  const moves: Move[] = [];

  TRACKER_ORDER.forEach((key) => {
    const currentAverage = trackerAverageIn(trackerCheckIns, key, current);
    const previousAverage = trackerAverageIn(trackerCheckIns, key, previous);
    if (currentAverage === undefined || previousAverage === undefined) return;
    const delta = currentAverage - previousAverage;
    if (!isMeaningful(delta, 0.5)) return;
    moves.push({ key, delta, improved: HIGHER_IS_BETTER[key] ? delta > 0 : delta < 0 });
  });

  const bestMove = moves.filter((move) => move.improved).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const worstMove = moves.filter((move) => !move.improved).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  if (bestMove) {
    const config = trackerConfigs[bestMove.key];
    insights.push({
      id: `tracker-up-${bestMove.key}`,
      icon: config.icon,
      tone: "good",
      headline: `${config.title.replace(" check-in", "")} improving`,
      detail: `Your ${config.title.toLowerCase().replace(" check-in", "")} scores moved in the right direction compared with last week.`
    });
  }

  if (worstMove) {
    const config = trackerConfigs[worstMove.key];
    insights.push({
      id: `tracker-down-${worstMove.key}`,
      icon: config.icon,
      tone: "bad",
      headline: `${config.title.replace(" check-in", "")} slipped back`,
      detail: "Ease off if this keeps moving the wrong way, and check the safety guidance if it comes with new pain."
    });
  }

  // --- Exercise days vs rest days -------------------------------------------
  // Observation only, and deliberately hedged. Pain falls over time during a
  // normal recovery, so if exercise days and rest days sit in different parts of
  // the timeline the gap is mostly the recovery trend, not the exercise. Both
  // groups are therefore taken from the same recent window, which keeps them
  // roughly comparable — it does not make this causal, and the copy must never
  // suggest that it does.
  const exerciseDayKeys = new Set(exerciseCompletions.map((entry) => dayKey(entry.completedAt)));
  if (exerciseDayKeys.size > 0) {
    const comparisonWindow: Window = { start: startOfLocalDay(now) + DAY_MS - 14 * DAY_MS, end: startOfLocalDay(now) + DAY_MS };
    const exerciseDayEntries: PainEntry[] = [];
    const restDayEntries: PainEntry[] = [];
    painEntries
      .filter((entry) => inWindow(entry.createdAt, comparisonWindow.start, comparisonWindow.end))
      .forEach((entry) => {
        (exerciseDayKeys.has(dayKey(entry.createdAt)) ? exerciseDayEntries : restDayEntries).push(entry);
      });

    const onExerciseDays = exerciseDayEntries.map((entry) => entry.pain);
    const onRestDays = restDayEntries.map((entry) => entry.pain);
    const exerciseAverage = mean(onExerciseDays);
    const restAverage = mean(onRestDays);

    // If the two groups sit in different parts of the fortnight — say every
    // exercise day is recent and every rest day is old — the difference is the
    // recovery trend, not the exercise. Only compare groups that are interleaved.
    const groupsOverlapInTime = medianDayGap(exerciseDayEntries, restDayEntries) <= 4 * DAY_MS;

    // Needs a few days on each side before the comparison means anything.
    if (
      exerciseAverage !== undefined &&
      restAverage !== undefined &&
      onExerciseDays.length >= 3 &&
      onRestDays.length >= 3 &&
      groupsOverlapInTime
    ) {
      const delta = restAverage - exerciseAverage;
      if (isMeaningful(delta, 0.5)) {
        insights.push({
          id: "adherence-pain",
          icon: "fitness",
          tone: delta > 0 ? "good" : "neutral",
          headline:
            delta > 0
              ? `Pain averaged ${round1(delta)} lower on days you exercised`
              : `Pain averaged ${round1(Math.abs(delta))} higher on days you exercised`,
          detail:
            "A pattern in your own logs over the last two weeks. Pain also changes on its own as you heal, so this is not evidence that one caused the other."
        });
      }
    }
  }

  // --- Accumulation ----------------------------------------------------------
  // WAS A STREAK, and it was on the doctor report with a flame icon. N1/N2
  // forbid breakable-chain visuals anywhere in this product; the gates could not
  // see it because `consumerFiles.mjs` had never scanned app/src.
  //
  // A count only ever accrues. There is no day on which this number falls, so
  // there is no day on which the app can imply the user let something lapse.
  const loggedDays = loggedDayKeys(painEntries, trackerCheckIns);
  const logged = checkInCount(loggedDays);
  if (logged >= 2) {
    insights.push({
      id: "accumulation",
      icon: "checkmark-circle",
      tone: "good",
      headline: `You have checked in ${logged} ${logged === 1 ? "time" : "times"}`,
      detail: "Every one of them is in the history above."
    });
  }

  // --- Consistency -----------------------------------------------------------
  const tracked = daysTracked(painEntries, trackerCheckIns, now);
  if (tracked >= 5) {
    const window = Math.min(tracked, 14);
    const endOfToday = startOfLocalDay(now) + DAY_MS;
    const recentLogged = [...loggedDays].filter((key) => {
      const [year, month, day] = key.split("-").map(Number);
      const time = new Date(year, month - 1, day).getTime();
      return time >= endOfToday - window * DAY_MS;
    }).length;
    // TONE IS FIXED AT NEUTRAL, and the percentage is gone.
    //
    // This used to score the user's own logging on a three-step scale, and
    // below 30% it rendered in `insight.worsening` — the same hue this system
    // reserves for a symptom getting worse. A person who had a hard fortnight
    // therefore opened the DOCTOR REPORT and found their behaviour marked in
    // the alert colour. P2 is explicit: no red missed days, no empty-day
    // shaming, gaps are neutral rest rather than failure.
    //
    // "bad" remains correct for a symptom — pain rising is honest, and it is a
    // fact about a body rather than a verdict on a person. The line is between
    // reporting the recovery and grading the user, and this was on the wrong
    // side of it. The copy is descriptive now, on the same contract as
    // `rest.label`: "descriptive, never evaluative".
    insights.push({
      id: "consistency",
      icon: "calendar",
      tone: "neutral",
      headline: `Logged on ${recentLogged} of the last ${window} days`,
      detail: "More entries give the trends above more to work with. Quiet days are part of recovery too."
    });
  }

  // --- Plateau ---------------------------------------------------------------
  if (tracked >= 10 && painNow !== undefined && painBefore !== undefined) {
    const painFlat = !isMeaningful(painNow - painBefore, 0.5);
    if (painFlat && moves.length === 0) {
      insights.push({
        id: "plateau",
        icon: "remove-circle",
        tone: "neutral",
        headline: "Your numbers have held steady for over a week",
        detail: "Plateaus are a normal part of recovery, but if it lasts it can be worth revisiting your plan or speaking to a clinician."
      });
    }
  }

  // --- Most-reported symptom -------------------------------------------------
  const symptomCounts = new Map<string, number>();
  painEntries.forEach((entry) => {
    entry.symptoms.forEach((symptom) => symptomCounts.set(symptom, (symptomCounts.get(symptom) ?? 0) + 1));
  });
  const topSymptom = [...symptomCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topSymptom && topSymptom[1] >= 2) {
    insights.push({
      id: "top-symptom",
      icon: "medical",
      tone: "neutral",
      headline: `Most-reported symptom: ${topSymptom[0]}`,
      detail: `Logged in ${topSymptom[1]} of your ${painEntries.length} pain check-ins.`
    });
  }

  // --- Best and hardest day --------------------------------------------------
  if (painEntries.length >= 3) {
    const sorted = [...painEntries].sort((a, b) => a.pain - b.pain);
    const best = sorted[0];
    const hardest = sorted[sorted.length - 1];
    if (best.pain !== hardest.pain) {
      insights.push({
        id: "best-worst",
        icon: "podium",
        tone: "neutral",
        headline: `Best day ${formatDay(best.createdAt)} · hardest ${formatDay(hardest.createdAt)}`,
        detail: `Pain ranged from ${best.pain}/10 to ${hardest.pain}/10 across your check-ins.`
      });
    }
  }

  return insights.slice(0, MAX_INSIGHTS);
}

// ---------------------------------------------------------------------------
// 2. Smarter rehab progression
// ---------------------------------------------------------------------------

type PhaseGate = {
  /** Every condition must hold on the latest values for this phase to be entered. */
  test: (signals: LatestSignals) => boolean;
  /** Human-readable criteria, used to explain a "hold". */
  describe: (signals: LatestSignals) => { label: string; met: boolean }[];
};

type LatestSignals = {
  pain?: number;
  /** 7-day average pain. Guards against one good day promoting a whole phase. */
  painWeek?: number;
  swelling?: number;
  walking?: number;
  rangeOfMotion?: number;
  balance?: number;
};

function latestSignals(painEntries: PainEntry[], trackerCheckIns: TrackerCheckIn[], now = Date.now()): LatestSignals {
  return {
    pain: painEntries[0]?.pain,
    painWeek: painAverageIn(painEntries, recentWindows(now).current),
    swelling: latestValue(trackerCheckIns, "swelling"),
    walking: latestValue(trackerCheckIns, "walking"),
    rangeOfMotion: latestValue(trackerCheckIns, "rangeOfMotion"),
    balance: latestValue(trackerCheckIns, "balance")
  };
}

/**
 * Pain has to be settled on both the latest check-in and the week's average.
 * Without the second half, one good day after a bad week promotes the user
 * straight into a later phase — which is exactly the wrong direction to be
 * wrong in for a rehab app.
 */
function painSettledAt(signals: LatestSignals, limit: number): boolean {
  return atMost(signals.pain, limit) && atMost(signals.painWeek, limit + 1);
}

/** A missing signal never counts as met — we do not promote on absent data. */
function atMost(value: number | undefined, limit: number): boolean {
  return value !== undefined && value <= limit;
}

function atLeast(value: number | undefined, floor: number): boolean {
  return value !== undefined && value >= floor;
}

// Entry gates for phases 1..3 (phase 0 is the baseline everyone starts in).
// Mirrors the staging described in the "How long does recovery take?" article.
const PHASE_GATES: PhaseGate[] = [
  {
    test: (s) => atMost(s.swelling, 2) && painSettledAt(s, 6) && atLeast(s.walking, 1),
    describe: (s) => [
      { label: "Swelling moderate or better", met: atMost(s.swelling, 2) },
      { label: "Pain at or below 6/10", met: painSettledAt(s, 6) },
      { label: "Some weight-bearing walking", met: atLeast(s.walking, 1) }
    ]
  },
  {
    test: (s) => atMost(s.swelling, 1) && painSettledAt(s, 4) && atLeast(s.walking, 2) && atLeast(s.rangeOfMotion, 1),
    describe: (s) => [
      { label: "Swelling mild or gone", met: atMost(s.swelling, 1) },
      { label: "Pain at or below 4/10", met: painSettledAt(s, 4) },
      { label: "Walking short distances", met: atLeast(s.walking, 2) },
      { label: "Movement no longer very stiff", met: atLeast(s.rangeOfMotion, 1) }
    ]
  },
  {
    test: (s) =>
      painSettledAt(s, 2) &&
      atMost(s.swelling, 1) &&
      atLeast(s.walking, 3) &&
      atLeast(s.rangeOfMotion, 2) &&
      atLeast(s.balance, 2),
    describe: (s) => [
      { label: "Pain at or below 2/10", met: painSettledAt(s, 2) },
      { label: "Swelling mild or gone", met: atMost(s.swelling, 1) },
      { label: "Normal unaided walking", met: atLeast(s.walking, 3) },
      { label: "Almost full range of motion", met: atLeast(s.rangeOfMotion, 2) },
      { label: "Steady single-leg balance", met: atLeast(s.balance, 2) }
    ]
  }
];

/** Premium progressions to suggest once the user reaches each phase. */
const PHASE_SUGGESTIONS: Record<number, string[]> = {
  0: [],
  1: ["heel-raises"],
  2: ["heel-raises", "resisted-inversion"],
  3: ["resisted-inversion", "lateral-hops"]
};

function phaseFromTiming(timing?: string): number {
  const days = estimateInjuryDaysAgo(timing);
  if (days == null) return 0;
  if (days < 7) return 0;
  if (days < 21) return 1;
  // Without logged data we never assume readiness for return-to-activity.
  return 2;
}

export function buildProgression(
  painEntries: PainEntry[],
  trackerCheckIns: TrackerCheckIn[],
  completedExerciseIds: string[],
  timing?: string,
  now = Date.now()
): ProgressionState {
  const signals = latestSignals(painEntries, trackerCheckIns, now);
  const hasData = painEntries.length > 0 || trackerCheckIns.length > 0;

  let phaseIndex = 0;
  if (hasData) {
    for (let index = 0; index < PHASE_GATES.length; index += 1) {
      if (PHASE_GATES[index].test(signals)) phaseIndex = index + 1;
      else break;
    }
  } else {
    phaseIndex = phaseFromTiming(timing);
  }

  const nextGate = PHASE_GATES[phaseIndex];
  const nextCriteria = nextGate ? nextGate.describe(signals) : [];
  const metCount = nextCriteria.filter((criterion) => criterion.met).length;
  const fractionToNext = nextCriteria.length ? metCount / nextCriteria.length : 1;
  const progress = Math.min(1, (phaseIndex + fractionToNext) / PHASES.length);

  // Rising pain or swelling overrides any advancement. Progression advice that
  // only ever pushes forward is unsafe.
  const { current, previous } = recentWindows(now);
  const painNow = painAverageIn(painEntries, current);
  const painBefore = painAverageIn(painEntries, previous);
  const painRising = painNow !== undefined && painBefore !== undefined && painNow - painBefore >= 1.5;
  const painHigh = atLeast(signals.pain, 7);
  const swellingSevere = signals.swelling === 3;

  let recommendation: ProgressionRecommendation = "hold";
  const reasons: string[] = [];

  if (painRising || painHigh || swellingSevere) {
    recommendation = "ease_back";
    if (painHigh) reasons.push(`Your latest pain score is ${signals.pain}/10.`);
    if (painRising) reasons.push(`Your 7-day average pain rose from ${round1(painBefore!)} to ${round1(painNow!)}.`);
    if (swellingSevere) reasons.push("Your latest swelling check-in was severe.");
    reasons.push("Ease back to the previous phase's exercises and check the safety guidance before pushing on.");
  } else if (nextGate && metCount === nextCriteria.length && nextCriteria.length > 0) {
    recommendation = "advance";
    reasons.push(`You meet all ${nextCriteria.length} criteria for ${PHASES[phaseIndex + 1]?.label ?? "the next phase"}.`);
  } else if (nextGate) {
    recommendation = "hold";
    const missing = nextCriteria.filter((criterion) => !criterion.met);
    reasons.push(`${metCount} of ${nextCriteria.length} criteria met for the next phase.`);
    missing.forEach((criterion) => reasons.push(`Still to reach: ${criterion.label.toLowerCase()}.`));
    if (!hasData) reasons.push("Log a pain check-in and the four trackers to move this off an estimate.");
  } else {
    recommendation = "hold";
    reasons.push("You are in the final phase. Keep building strength and control before returning to sport.");
  }

  const suggested = (PHASE_SUGGESTIONS[phaseIndex] ?? []).filter((id) => !completedExerciseIds.includes(id));

  return {
    phase: { ...PHASES[phaseIndex], index: phaseIndex },
    progress,
    recommendation,
    reasons,
    suggestedExercises: suggested,
    estimated: !hasData
  };
}

// ---------------------------------------------------------------------------
// 3. Return-to-sport readiness
// ---------------------------------------------------------------------------

/**
 * Encodes the criteria from the app's own "When can I return to sport?" article:
 * full pain-free movement, settled swelling, confident single-leg balance, and
 * controlled hopping. This is never a clearance — see ReadinessScreen copy.
 */
export function buildReadiness(
  painEntries: PainEntry[],
  trackerCheckIns: TrackerCheckIn[],
  completedExerciseIds: string[] = [],
  now = Date.now()
): ReadinessState {
  const signals = latestSignals(painEntries, trackerCheckIns);
  const { current } = recentWindows(now);
  const painWeekAverage = painAverageIn(painEntries, current);
  const hasData = painEntries.length > 0 || trackerCheckIns.length > 0;

  const painSettled = atMost(signals.pain, 2) && painWeekAverage !== undefined && painWeekAverage <= 3;
  const swellingResolved = atMost(signals.swelling, 1);
  const fullMotion = atLeast(signals.rangeOfMotion, 2) && signals.walking === 3;
  const hopWorkDone = completedExerciseIds.includes("lateral-hops");
  const balanceControl = atLeast(signals.balance, 2) && hopWorkDone;

  const criteria: ReadinessCriterion[] = [
    {
      id: "pain",
      label: "Pain settled",
      met: painSettled,
      gap:
        signals.pain === undefined
          ? "Log a pain check-in to measure this."
          : !atMost(signals.pain, 2)
            ? `Latest pain is ${signals.pain}/10 — this looks for 2 or below.`
            : painWeekAverage !== undefined && painWeekAverage > 3
              ? `Your 7-day average is ${round1(painWeekAverage)}/10 — this looks for 3 or below.`
              : "Pain is where this criterion expects it."
    },
    {
      id: "swelling",
      label: "Swelling resolved",
      met: swellingResolved,
      gap:
        signals.swelling === undefined
          ? "Log a swelling check-in to measure this."
          : swellingResolved
            ? "Swelling is mild or gone."
            : "Swelling is still clearly present."
    },
    {
      id: "motion",
      label: "Full motion and walking",
      met: fullMotion,
      // Name only what is actually missing. Telling someone to log a check-in
      // they already logged reads as the app not having noticed.
      gap: (() => {
        const missing: string[] = [];
        if (signals.rangeOfMotion === undefined) missing.push("a range-of-motion");
        if (signals.walking === undefined) missing.push("a walking");
        if (missing.length) return `Log ${missing.join(" and ")} check-in to measure this.`;
        if (fullMotion) return "Movement and walking are where this criterion expects them.";

        const short: string[] = [];
        if (!atLeast(signals.rangeOfMotion, 2)) short.push("almost-full range of motion");
        if (signals.walking !== 3) short.push("comfortable unaided walking");
        return `This looks for ${short.join(" and ")}.`;
      })()
    },
    {
      id: "balance",
      label: "Balance and control",
      met: balanceControl,
      gap:
        signals.balance === undefined
          ? "Log a balance check-in to measure this."
          : !atLeast(signals.balance, 2)
            ? "This looks for a steady single-leg balance of 15 seconds or more."
            : !hopWorkDone
              ? "Complete the controlled lateral hops from the extended library."
              : "Balance and hop control are where this criterion expects them."
    }
  ];

  const metCount = criteria.filter((criterion) => criterion.met).length;
  const score = Math.round((metCount / criteria.length) * 100);
  const verdict = score >= 100 ? "encouraging" : score >= 50 ? "nearly_there" : "keep_building";

  return { score, verdict, criteria, hasData };
}

/** Total exercises in the free daily plan — used for adherence percentages. */
export const FREE_EXERCISE_COUNT = exercises.length;
