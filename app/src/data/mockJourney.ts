// ============================================================
// FILE: data/mockJourney.ts — the seed journey, per spec §6.
//
// A ~45-day ankle-surgery recovery: captures, check-ins, photos, milestones,
// two appointments, two medications and weekly reflections. Phase 1 is local
// mock data (§7) and this is it.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE FIXTURE IS AN ARGUMENT, NOT DECORATION
//
// Two things are deliberately true of this data and would be easy to sand off:
//
// 1. THERE ARE GAPS. Days 12–16 and 27–29 have nothing in them at all. A
//    fixture with an entry every single day makes an empty-state impossible to
//    see, and "gaps render as neutral rest, never failure" (P2) is a claim you
//    cannot check against data that has no gaps. The Timeline's rest treatment
//    and the welcome-back flow both need a fixture that is honest about a real
//    recovery: people stop logging when they feel bad, and that is precisely
//    when the app must not scold them.
//
// 2. MOST CHECK-INS ARE FAST-PATH ONLY. `quick` and nothing else. P3 says one
//    tap on Better / Same / Worse is a COMPLETE, valid check-in, so the
//    majority of the fixture has to look like that — otherwise every screen
//    gets built and reviewed against rich rows that the real product will
//    rarely see, and the sparse case ends up being the untested one.
//
// The recovery also gets WORSE around days 18–22. Setbacks are normal, P2 asks
// for honest kind copy about them rather than toxic positivity, and a fixture
// that only ever improves cannot exercise that path.
//
// Dates are relative to the journey start so the fixture never goes stale.
// ============================================================

import type {
  Appointment,
  Medication,
  Milestone,
  PhotoEntry,
  RecoveryJourney,
  TimelineEntry,
  WeeklyReflection,
} from "../types/recovery";

const DAY_MS = 86_400_000;

/** Day 1 is the start date, so day N is start + (N-1) days. */
const START = Date.now() - 45 * DAY_MS;
const at = (day: number, hour = 9, minute = 0) =>
  new Date(START + (day - 1) * DAY_MS + hour * 3_600_000 + minute * 60_000).toISOString();

export const JOURNEY: RecoveryJourney = {
  id: "journey-1",
  type: "surgery",
  condition: "Knee surgery (post-operative rehabilitation)",
  bodyPart: "Left knee",
  label: "Knee rehab",
  startDate: new Date(START).toISOString(),
  goal: "Walk the dog around the park without stopping",
  isActive: true,
};

export const MEDICATIONS: Medication[] = [
  {
    id: "med-1",
    journeyId: JOURNEY.id,
    name: "Naproxen",
    dosage: "250 mg",
    schedule: ["08:00", "20:00"],
    startDate: at(1),
    endDate: at(21),
    reminders: true,
  },
  {
    id: "med-2",
    journeyId: JOURNEY.id,
    name: "Paracetamol",
    dosage: "500 mg",
    schedule: ["08:00", "14:00", "20:00"],
    startDate: at(1),
    reminders: false,
  },
];

export const APPOINTMENTS: Appointment[] = [
  {
    id: "appt-1",
    journeyId: JOURNEY.id,
    date: at(14, 11, 30),
    clinician: "Dr Chen",
    location: "Orthopaedics, Level 3",
    questions: ["Is this much swelling normal at two weeks?", "When can I drive?"],
    notesAfter: "Swelling is expected for another few weeks. Driving once I can do an emergency stop without hesitating.",
  },
  {
    id: "appt-2",
    journeyId: JOURNEY.id,
    // Deliberately two days out: §4.10's pre-appointment nudge only exists if
    // the fixture can be within its window.
    date: new Date(Date.now() + 2 * DAY_MS).toISOString(),
    clinician: "Dr Chen",
    location: "Orthopaedics, Level 3",
    questions: [
      "The stiffness in the mornings — is that still expected?",
      "Can I start going up stairs normally?",
    ],
  },
];

export const PHOTOS: PhotoEntry[] = [
  { id: "photo-1", journeyId: JOURNEY.id, uri: "", date: at(3), caption: "Day 3 — dressing changed", bodyArea: "Left knee" },
  { id: "photo-2", journeyId: JOURNEY.id, uri: "", date: at(17), caption: "Swelling looks lower", bodyArea: "Left knee" },
  { id: "photo-3", journeyId: JOURNEY.id, uri: "", date: at(38), caption: "Scar settling", bodyArea: "Left knee" },
];

export const MILESTONES: Milestone[] = [
  { id: "ms-1", journeyId: JOURNEY.id, date: at(6), title: "First shower standing up", emoji: "🚿" },
  { id: "ms-2", journeyId: JOURNEY.id, date: at(19), title: "Walked to the end of the road", emoji: "🚶" },
  { id: "ms-3", journeyId: JOURNEY.id, date: at(30), title: "Day 30", emoji: "🎉" },
  { id: "ms-4", journeyId: JOURNEY.id, date: at(44), title: "Walked without crutches", emoji: "🎉" },
];

export const REFLECTIONS: WeeklyReflection[] = [
  {
    weekStart: at(36),
    comparison: [
      { metric: "Pain", direction: "down", text: "Pain averaged lower than last week" },
      { metric: "Walking", direction: "up", text: "You logged walking on five days instead of three" },
    ],
    noticedDetail: "Three weeks ago you wrote that stairs were hard. This week you did them twice without mentioning them.",
    encouragement: "That is the kind of change that is easy to miss from the inside.",
  },
];

// ── The timeline ────────────────────────────────────────────────────────────
// Built as data rather than typed out row by row, so the GAPS are visible as
// gaps in the day list instead of being an absence nobody notices.

type Seed = { day: number; hour?: number } & Omit<TimelineEntry, "id" | "journeyId" | "date">;

const SEEDS: Seed[] = [
  { day: 1, hour: 7, type: "milestone", title: "Recovery started", detail: "Knee surgery (post-operative rehabilitation)", isAutoGenerated: true },
  { day: 1, hour: 20, type: "checkin", title: "Worse", isAutoGenerated: false, data: { quick: "worse", pain: 8, mood: 1, sleep: 1 } },
  { day: 2, hour: 21, type: "capture", title: "couldn't sleep, knee throbbing whenever I moved", isAutoGenerated: false, data: { text: "couldn't sleep, knee throbbing whenever I moved", autoTags: ["pain", "sleep"] } },
  { day: 3, hour: 10, type: "photo", title: "Day 3 — dressing changed", isAutoGenerated: false },
  { day: 3, hour: 20, type: "checkin", title: "Same", isAutoGenerated: false, data: { quick: "same" } },
  { day: 4, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 5, hour: 19, type: "capture", title: "managed the stairs once, very slowly", isAutoGenerated: false, data: { text: "managed the stairs once, very slowly", autoTags: ["mobility"] } },
  { day: 6, hour: 8, type: "milestone", title: "First shower standing up", detail: "🚿", isAutoGenerated: false },
  { day: 6, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better", pain: 5 } },
  { day: 7, hour: 20, type: "checkin", title: "Same", isAutoGenerated: false, data: { quick: "same" } },
  { day: 8, hour: 9, type: "journal", title: "A week in", detail: "Slower than I expected but I can get around the flat now. Trying not to compare myself to the timeline the physio gave me.", isAutoGenerated: false },
  { day: 9, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 10, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better", pain: 4, sleep: 2 } },
  { day: 11, hour: 18, type: "capture", title: "forgot the evening naproxen", isAutoGenerated: false, data: { text: "forgot the evening naproxen", autoTags: ["medication"] } },

  // ── days 12–16: nothing. A real gap, on purpose. ──

  { day: 17, hour: 10, type: "photo", title: "Swelling looks lower", isAutoGenerated: false },
  { day: 17, hour: 20, type: "checkin", title: "Same", isAutoGenerated: false, data: { quick: "same" } },
  { day: 14, hour: 12, type: "appointment", title: "Dr Chen — Orthopaedics", detail: "Two-week review", isAutoGenerated: false },
  { day: 18, hour: 21, type: "capture", title: "did too much yesterday and I am paying for it", isAutoGenerated: false, data: { text: "did too much yesterday and I am paying for it", autoTags: ["pain"] } },
  { day: 18, hour: 22, type: "checkin", title: "Worse", isAutoGenerated: false, data: { quick: "worse", pain: 7, mood: 1 } },
  { day: 19, hour: 20, type: "checkin", title: "Worse", isAutoGenerated: false, data: { quick: "worse" } },
  { day: 19, hour: 17, type: "milestone", title: "Walked to the end of the road", detail: "🚶", isAutoGenerated: false },
  { day: 20, hour: 20, type: "checkin", title: "Same", isAutoGenerated: false, data: { quick: "same" } },
  { day: 21, hour: 20, type: "checkin", title: "Same", isAutoGenerated: false, data: { quick: "same", pain: 5 } },
  { day: 22, hour: 9, type: "journal", title: "Setback week", detail: "Went backwards after overdoing it. Reminding myself this is not a straight line.", isAutoGenerated: false },
  { day: 23, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 24, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 25, hour: 19, type: "capture", title: "slept through the night for the first time", isAutoGenerated: false, data: { text: "slept through the night for the first time", autoTags: ["sleep"] } },
  { day: 26, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better", pain: 3 } },

  // ── days 27–29: nothing. ──

  { day: 30, hour: 8, type: "milestone", title: "Day 30", detail: "🎉", isAutoGenerated: true },
  { day: 30, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 32, hour: 20, type: "checkin", title: "Same", isAutoGenerated: false, data: { quick: "same" } },
  { day: 33, hour: 18, type: "capture", title: "stairs twice today and did not think about it", isAutoGenerated: false, data: { text: "stairs twice today and did not think about it", autoTags: ["mobility"] } },
  { day: 34, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better", pain: 2 } },
  { day: 36, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 38, hour: 10, type: "photo", title: "Scar settling", isAutoGenerated: false },
  { day: 39, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 40, hour: 20, type: "checkin", title: "Same", isAutoGenerated: false, data: { quick: "same" } },
  { day: 41, hour: 9, type: "reflection", title: "Your week", detail: "Three weeks ago stairs were hard. This week you did them twice.", isAutoGenerated: true },
  { day: 42, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better", pain: 2, mood: 3, sleep: 3 } },
  { day: 43, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better" } },
  { day: 44, hour: 16, type: "milestone", title: "Walked without crutches", detail: "🎉", isAutoGenerated: false },
  { day: 45, hour: 20, type: "checkin", title: "Better", isAutoGenerated: false, data: { quick: "better", pain: 1 } },
];

export const TIMELINE: TimelineEntry[] = SEEDS.map((seed, i) => ({
  id: `entry-${i + 1}`,
  journeyId: JOURNEY.id,
  type: seed.type,
  date: at(seed.day, seed.hour ?? 9),
  title: seed.title,
  detail: seed.detail,
  data: seed.data,
  isAutoGenerated: seed.isAutoGenerated,
})).sort((a, b) => b.date.localeCompare(a.date));

/** Local day keys that have at least one entry — the basis for rest days. */
export function loggedDays(entries: TimelineEntry[]): Set<string> {
  return new Set(entries.map((e) => e.date.slice(0, 10)));
}
