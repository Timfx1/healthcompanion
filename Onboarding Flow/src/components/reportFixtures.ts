// ============================================================
// FIXTURES: the doctor report's states, as DATA.
//
// Every fixture here is a plausible `ReportInput`, never a state flag. The
// screen derives depth and the change-block sub-state from the numbers, so a
// baseline named "sparse" is a photograph of what sparse data actually produces
// rather than of a boolean somebody set.
//
// This is what makes the states baselineable at all. The lesson is on record:
// the Toast carried a dead code path and an unused token family for the whole
// life of the component because nothing could photograph a state that exists
// for 2.4 seconds behind an interaction — and ShareCardScreen is still
// unphotographed for the same reason. A state with no route is a state nothing
// checks.
// ============================================================

import type { ReportInput } from "./ReportPreview";

const base: ReportInput = {
  condition: "Ankle sprain · right",
  dayN: 46,
  rangeLabel: "12 Mar – 27 Apr",
  entryCount: 38,
  daysSpanned: 46,
  lastVisit: "your 12 Mar visit",
  changes: [
    { direction: "improving", label: "Pain",     detail: "6.2 → 3.1 average" },
    { direction: "improving", label: "Walking",  detail: "10 min → 40 min unaided" },
    { direction: "steady",    label: "Sleep",    detail: "still waking twice most nights" },
    { direction: "worsening", label: "Swelling", detail: "worse after the return to stairs" },
  ],
  pain: [7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 3],
  events: [
    { date: "3 Apr",  text: "First walk without crutches" },
    { date: "14 Apr", text: "Started stair work in physio" },
    { date: "22 Apr", text: "Swelling returned after a long day" },
  ],
  meds: [
    { name: "Ibuprofen 400mg", adherence: "as needed · 6 days in the last 14" },
    { name: "Paracetamol 1g",  adherence: "stopped 2 Apr" },
  ],
  questions: [
    "Is the swelling after stairs something to worry about?",
    "When can I start running again?",
    "Should I keep taping the ankle?",
  ],
  redFlags: [],
};

// READY — the normal case, and the one the whole screen is designed around.
export const ready: ReportInput = base;

// READY + red flags. CONDITIONAL CONTENT, not a state: the same ready report
// with genuine guidance to carry. The one surface allowed the safety hue (N3).
export const readyWithRedFlags: ReportInput = {
  ...base,
  events: [{ date: "22 Apr", text: "Swelling returned after a long day" }],
  meds: [{ name: "Ibuprofen 400mg", adherence: "as needed" }],
  questions: [],
  redFlags: [
    "Sudden severe swelling with heat or redness, or a fever.",
    "Pain that wakes you and does not settle with your usual relief.",
    "Numbness, pins and needles, or the foot going pale or cold.",
  ],
};

// NO CHANGE — the guilt-risk case. There IS an anchor and there IS data, and
// nothing moved. A flat fortnight is a fact about the data, never a verdict on
// the person, so the copy states it and stops (P2).
export const noChange: ReportInput = {
  ...base,
  rangeLabel: "13 Apr – 27 Apr",
  entryCount: 11,
  daysSpanned: 14,
  lastVisit: "your 13 Apr visit",
  changes: [],
  pain: [3, 3, 3, 3, 3, 3, 3],
  events: [],
};

// FIRST — enough data, no prior visit. The data is fine; the ANCHOR is missing.
export const first: ReportInput = {
  ...base,
  lastVisit: null,
  changes: [],
  questions: ["Is this healing at the pace you would expect?"],
  events: [{ date: "3 Apr", text: "First walk without crutches" }],
};

// SPARSE — logged, but not enough to claim a trend. This is the fixture that
// proves the screen refuses to draw a direction from two points.
export const sparse: ReportInput = {
  ...base,
  rangeLabel: "26 Apr – 27 Apr",
  entryCount: 2,
  daysSpanned: 1,
  changes: [],
  pain: [5, 5],
  events: [],
  meds: [{ name: "Ibuprofen 400mg", adherence: "as needed" }],
  questions: [],
};

// EMPTY — day one. Two taps from Home, so a curious new user lands here before
// logging anything. First impression, and it must not read as a scolding.
export const empty: ReportInput = {
  ...base,
  dayN: 1,
  rangeLabel: "Today",
  entryCount: 0,
  daysSpanned: 0,
  lastVisit: null,
  changes: [],
  pain: [],
  events: [],
  meds: [],
  questions: [],
};

export const fixtures = { ready, readyWithRedFlags, noChange, first, sparse, empty } as const;
export type FixtureName = keyof typeof fixtures;
