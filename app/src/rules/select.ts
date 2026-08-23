// ============================================================
// FILE: rules/select.ts — the adapter layer's decisions.
//
// `detail/routes.tsx` resolves ids against the store, and most of that is a
// `find` nobody needs to test. These three are not: each has an edge case that
// produces a visibly wrong screen rather than a crash, which is the kind of bug
// a typechecker cannot see and a screenshot would have to be taken at exactly
// the right moment to catch.
// ============================================================

import type { Appointment, PhotoEntry } from "../types/recovery.ts";

/**
 * The appointment the pre-visit nudge and the Profile row point at.
 *
 * The SOONEST UPCOMING one, falling back to the MOST RECENT past one. Both
 * halves matter: "next appointment" pointing at a visit from three months ago
 * while a real one sits two days away is the failure, and an empty Profile row
 * for somebody whose appointments are all in the past is the other.
 *
 * Returns undefined only when there are none at all.
 */
export function nextAppointment(appointments: Appointment[], now: number): Appointment | undefined {
  const upcoming = appointments
    .filter((a) => Date.parse(a.date) > now)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length > 0) return upcoming[0];
  return [...appointments].sort((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * The anchor for "what changed since last visit" — the most recent PAST
 * appointment.
 *
 * Strictly in the past. An appointment happening later today is not something
 * the report can compare against, and treating it as the anchor would produce
 * a "since last visit" block covering a visit that has not happened.
 */
export function lastVisit(appointments: Appointment[], now: number): Appointment | undefined {
  return appointments
    .filter((a) => Date.parse(a.date) < now)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * The two photos a comparison shows: oldest and newest.
 *
 * NOT the two most recent. The whole point of §4.11 is Day 3 against Day 30 —
 * two photos taken a week apart show nothing, and showing the newest pair would
 * make the feature least useful exactly when somebody has been diligent about
 * taking them.
 *
 * Returns undefined when there are fewer than two, which is the `insufficient`
 * state rather than a half-rendered comparison.
 */
export function comparePair(photos: PhotoEntry[]): { first: PhotoEntry; last: PhotoEntry } | undefined {
  if (photos.length < 2) return undefined;
  const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
  return { first: sorted[0], last: sorted[sorted.length - 1] };
}
