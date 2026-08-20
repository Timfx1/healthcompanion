// ============================================================
// FIXTURES: the timeline detail screens, as DATA.
//
// Same discipline as reportFixtures.ts. Nothing here sets a state; every screen
// derives its state from these numbers and dates, so a baseline named "past" is
// a photograph of what a past date actually produces.
// ============================================================

export type JournalEntry = {
  id: string;
  dayN: number;
  date: string;
  text: string;
  /** §4.5 — one tap promotes an entry to a milestone. */
  promoted: boolean;
};

export type Milestone = {
  id: string;
  dayN: number;
  date: string;
  title: string;
  note?: string;
  /** Auto-generated (Day 7/30/100) or promoted from a journal entry. */
  origin: "auto" | "promoted";
};

export type DoseLog = {
  date: string;
  /** `skipped` is NEVER rendered as a failure — see MedicationDetail. */
  status: "taken" | "skipped";
};

export type Medication = {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  /** Whether a dose is due right now. Derived upstream from the schedule. */
  dueNow: boolean;
  log: DoseLog[];
};

export type Question = { id: string; text: string; answered: boolean };

export type Appointment = {
  id: string;
  who: string;
  where: string;
  /** Days from today. Negative is past — the screen derives its state from this. */
  inDays: number;
  dateLabel: string;
  questions: Question[];
  notesAfter?: string;
  followUp?: string;
};

// ── Journal ─────────────────────────────────────────────────────────────────
export const journalExisting: JournalEntry = {
  id: "j1", dayN: 44, date: "25 Apr",
  text: "Walked to the end of the road and back without thinking about it once. Did not notice until I was already home, which is new.\n\nStairs still need the handrail on the way down.",
  promoted: false,
};

export const journalPromoted: JournalEntry = { ...journalExisting, promoted: true };

export const journalBlank: JournalEntry = { id: "new", dayN: 46, date: "Today", text: "", promoted: false };

// ── Milestone ───────────────────────────────────────────────────────────────
export const milestonePromoted: Milestone = {
  id: "m1", dayN: 44, date: "25 Apr",
  title: "Walked without crutches",
  note: "First time since surgery — 50m without support.",
  origin: "promoted",
};

export const milestoneAuto: Milestone = {
  id: "m2", dayN: 30, date: "11 Apr",
  title: "Day 30",
  origin: "auto",
};

// ── Medication ──────────────────────────────────────────────────────────────
export const medDue: Medication = {
  id: "med1", name: "Ibuprofen", dose: "400mg", schedule: "As needed, up to 3× daily",
  dueNow: true,
  log: [
    { date: "Today",  status: "taken" },
    { date: "Yest.",  status: "taken" },
    { date: "26 Apr", status: "skipped" },
    { date: "25 Apr", status: "taken" },
    { date: "24 Apr", status: "taken" },
    { date: "23 Apr", status: "skipped" },
    { date: "22 Apr", status: "taken" },
  ],
};

export const medNoHistory: Medication = {
  id: "med2", name: "Paracetamol", dose: "1g", schedule: "Morning and evening",
  dueNow: false, log: [],
};

// ── Appointments ────────────────────────────────────────────────────────────
export const apptUpcoming: Appointment = {
  id: "a1", who: "Dr Chen — orthopaedics", where: "St Mary's, Clinic 4",
  inDays: 2, dateLabel: "Thu 29 Apr, 10:15",
  questions: [
    { id: "q1", text: "Is the swelling after stairs something to worry about?", answered: false },
    { id: "q2", text: "When can I start running again?", answered: false },
    { id: "q3", text: "Should I keep taping the ankle?", answered: false },
  ],
};

export const apptPast: Appointment = {
  id: "a2", who: "Priya Nair — physiotherapy", where: "Riverside Practice",
  inDays: -13, dateLabel: "Tue 13 Apr, 09:00",
  questions: [
    { id: "q4", text: "Can I swim yet?", answered: true },
    { id: "q5", text: "How long will the stiffness last?", answered: true },
  ],
  notesAfter: "Cleared for swimming from next week. Stiffness expected for another month or so — not a concern unless it worsens.",
  followUp: "Review in 6 weeks",
};

// ── Questions ───────────────────────────────────────────────────────────────
export const questionsSome: Question[] = apptUpcoming.questions;
export const questionsNone: Question[] = [];
