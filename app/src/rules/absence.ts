// ============================================================
// FILE: rules/absence.ts — has this person been away, and does it mean anything?
//
// P2: "Returning after absence triggers 'welcome back' warmth, never a recap of
// what was missed."
//
// THE GAP IS COMPUTED AND THEN DELIBERATELY THROWN AWAY. This module exports a
// BOOLEAN and never a duration, and that is a structural choice rather than a
// squeamish one: a `daysAway` value in scope is a number somebody eventually
// renders, and "you've been away 12 days" is exactly the guilt mechanic P2
// exists to make unbuildable. The safest place to stop a count reaching a
// screen is before it leaves the module that computes it.
//
// The web prototype's `absence.ts` states the same rule for the same reason.
// These two are meant to agree, and they are tested against the same cases.
// ============================================================

/**
 * How long a gap has to be before returning is worth remarking on.
 *
 * Three days, chosen so an ordinary weekend never triggers it. §4.4 says
 * "missed days → welcome back, nothing else", and a card that greets somebody
 * who was here on Friday is not warmth — it is a false positive that teaches
 * people to ignore the surface.
 */
export const ABSENCE_DAYS = 3;

const DAY_MS = 86_400_000;

/**
 * Whether `now` is far enough past `lastOpenedAt` to count as a return.
 *
 * Pure, and takes `now` as an argument rather than reading the clock — which is
 * what makes the two edge cases below testable at all.
 *
 * A FIRST-EVER OPEN IS NOT A RETURN. There is nothing to come back from, and
 * greeting a brand-new user with "good to see you again" is a small lie told at
 * the first moment they use the product.
 *
 * A BACKWARDS CLOCK IS NOT A RETURN EITHER. Timezone changes and manual clock
 * sets produce negative gaps, and a negative gap must not be readable as a long
 * absence. Comparing a gap rather than a date is what makes that fall out
 * naturally instead of needing a special case.
 */
export function isReturn(lastOpenedAt: number | null, now: number): boolean {
  if (lastOpenedAt === null) return false;
  return now - lastOpenedAt >= ABSENCE_DAYS * DAY_MS;
}
