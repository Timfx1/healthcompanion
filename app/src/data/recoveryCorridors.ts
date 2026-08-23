// ============================================================
// FILE: data/recoveryCorridors.ts — P5, "am I on track?"
//
// ⚠ PLACEHOLDER, CITED, AND FLAGGED FOR CLINICAL REVIEW.
//
// `needsClinicalReview` is a field on every corridor rather than a comment at
// the top of the file, so the flag travels with the content into whatever
// renders it and the screen can say so out loud. Held to exactly the standard
// `safetyContent.ts` set in the prototype: nothing here has been signed off,
// every phase carries a `sourceNote`, and none of it may ship without review.
//
// ─────────────────────────────────────────────────────────────────────────────
// N5 AND P5 ARE THE SHAPE OF THIS FILE, NOT A COATING ON IT
//
// A corridor is "a soft translucent range band ... labelled 'common range',
// never a target line the user 'fails'". So:
//
//   • Every phase spans days, `fromDay`–`toDay`, and there is deliberately no
//     `targetDay`, no `expectedDay`, no `goalDay`. `restricted.mjs` enforces
//     the absence: N5 fails the build on a corridor field that names a point
//     rather than a range, because the failure mode here is a schema that lets
//     a well-meaning screen draw a deadline.
//   • Every label describes what COMMONLY happens — "most people", "usually",
//     "often" — and never what should have happened by now.
//   • `typicalPainRange` is a range for the same reason, and is the band the
//     chart draws behind the user's own line.
//
// The one thing this data must never support is a screen that can tell someone
// they are behind. Everyone heals differently, and the corridor exists to make
// that reassuring rather than vague.
// ============================================================

import type { RecoveryCorridor } from "../types/recovery";

/** Exported so screens can render the caveat rather than imply sign-off. */
export const NEEDS_CLINICAL_REVIEW = true;

/**
 * The sentence every corridor surface must be able to show, one tap away.
 * P5: "always with an easy path to 'everyone heals differently'".
 */
export const EVERYONE_HEALS_DIFFERENTLY =
  "These are common experiences, not a schedule. Recovery timelines vary a lot between people, and being outside a range is not a problem on its own — it is something to mention to your clinician.";

export const CORRIDORS: RecoveryCorridor[] = [
  {
    condition: "Ankle ligament injury (sprain)",
    needsClinicalReview: true,
    phases: [
      {
        fromDay: 1,
        toDay: 7,
        label: "Swelling and bruising are usually at their most noticeable",
        typicalPainRange: [4, 8],
        sourceNote: "PLACEHOLDER — to be sourced from NHS 'Sprains and strains' and AAOS ankle sprain guidance. Not yet reviewed.",
      },
      {
        fromDay: 8,
        toDay: 28,
        label: "Most people can put weight through the ankle again somewhere in this window",
        typicalPainRange: [2, 6],
        sourceNote: "PLACEHOLDER — to be sourced from NHS and Cleveland Clinic ankle sprain recovery ranges. Not yet reviewed.",
      },
      {
        fromDay: 29,
        toDay: 84,
        label: "Everyday walking usually feels ordinary again; stiffness after rest is common",
        typicalPainRange: [0, 4],
        sourceNote: "PLACEHOLDER — to be sourced from APTA rehabilitation guidance. Not yet reviewed.",
      },
    ],
  },
  {
    condition: "Knee surgery (post-operative rehabilitation)",
    needsClinicalReview: true,
    phases: [
      {
        fromDay: 1,
        toDay: 14,
        label: "Early movement and swelling management are usually the focus",
        typicalPainRange: [4, 8],
        sourceNote: "PLACEHOLDER — to be sourced from NHS post-operative knee guidance. Not yet reviewed.",
      },
      {
        fromDay: 15,
        toDay: 42,
        label: "Bending further and walking further are common goals around this stage",
        typicalPainRange: [2, 6],
        sourceNote: "PLACEHOLDER — to be sourced from Mayo Clinic and APTA post-surgical rehabilitation ranges. Not yet reviewed.",
      },
      {
        fromDay: 43,
        toDay: 120,
        label: "Many people are building strength and returning to more of their usual activity",
        typicalPainRange: [0, 4],
        sourceNote: "PLACEHOLDER — to be sourced from APTA return-to-activity guidance. Not yet reviewed.",
      },
    ],
  },
  {
    condition: "Shoulder rehabilitation",
    needsClinicalReview: true,
    phases: [
      {
        fromDay: 1,
        toDay: 21,
        label: "Reaching overhead is often uncomfortable or limited early on",
        typicalPainRange: [3, 7],
        sourceNote: "PLACEHOLDER — to be sourced from NHS shoulder pain guidance. Not yet reviewed.",
      },
      {
        fromDay: 22,
        toDay: 90,
        label: "Range of movement commonly returns gradually over weeks rather than days",
        typicalPainRange: [1, 5],
        sourceNote: "PLACEHOLDER — to be sourced from Cleveland Clinic and APTA shoulder rehabilitation guidance. Not yet reviewed.",
      },
    ],
  },
];

/** The corridor for a condition, or undefined — a journey with no corridor simply shows none. */
export function corridorFor(condition: string): RecoveryCorridor | undefined {
  return CORRIDORS.find((c) => c.condition === condition);
}

/**
 * The phase a given day falls in, if any.
 *
 * Returns `undefined` past the last phase rather than clamping to it. Clamping
 * would mean somebody on day 200 of a 120-day corridor is shown the final phase
 * indefinitely, which quietly turns a range into an overdue notice — the exact
 * reading N5 exists to prevent.
 */
export function phaseForDay(corridor: RecoveryCorridor, day: number) {
  return corridor.phases.find((p) => day >= p.fromDay && day <= p.toDay);
}
