// ============================================================
// FILE: absence.ts — "has this person been away, and does that mean anything?"
//
// §10's Definition of Done asks for a welcome-back flow that WORKS AFTER
// SIMULATED ABSENCE. That is a behavioural claim, not a visual one, and until
// now there was nothing behind it: `HomeScreen` has carried an `isWelcomeBack`
// prop since it was written, defaulted to false, and NOBODY HAS EVER PASSED IT.
// The state was unreachable, so the copy inside it was unreviewable and the
// `welcomeBack.*` token family stayed dormant — the same shape as the Toast's
// dead branch and the capture button with no onClick.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT P2 FORBIDS, AND WHY THAT SHAPES THIS FILE
//
// "Returning after absence triggers 'welcome back' warmth, never a recap of
// what was missed."
//
// The gap is therefore computed and then DELIBERATELY THROWN AWAY. This module
// exports a boolean, never a duration. That is not squeamishness about a number:
// a `daysAway` value in scope is a number somebody will eventually render, and
// "You've been away 12 days" is precisely the guilt mechanic P2 exists to make
// structurally impossible. The safest place to stop a count reaching the screen
// is before it leaves the module that computes it.
//
// ─────────────────────────────────────────────────────────────────────────────
// ONCE PER OPEN, NOT ONCE PER RENDER
//
// Reading the timestamp also SPENDS it: the moment the app decides this is a
// return, it records the present, so a second look at Home in the same afternoon
// gets an ordinary morning greeting. A welcome-back that reappears on every
// navigation is a nag, which is the failure mode one principle over.
//
// The decision is memoised at module scope rather than in component state
// because `main.tsx` mounts under `React.StrictMode`, which double-invokes
// mounts in development. Without the memo the second invocation would read the
// timestamp it had just written, conclude "no absence", and flip the card off
// again — a bug that would appear only in dev and only sometimes. A full page
// reload re-imports the module and clears it, which is exactly the boundary the
// behaviour test reloads across.
// ============================================================

import { read, write, KEYS } from "./storage";

/**
 * How long a gap has to be before returning is worth remarking on.
 *
 * Three days, chosen so an ordinary weekend never triggers it. §4.4 says
 * "missed days → welcome back, nothing else", and a card that greets somebody
 * who was here on Friday is not warmth, it is a false positive that teaches
 * people to ignore the surface.
 */
export const ABSENCE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether `now` is far enough past `lastOpenedAt` to count as a return.
 *
 * Exported for the test, and pure: no clock, no storage. A first-ever open
 * (`null`) is NOT a return — there is nothing to come back from, and greeting a
 * brand-new user with "good to see you again" is a small lie.
 */
export function isReturn(lastOpenedAt: number | null, now: number): boolean {
  if (lastOpenedAt === null) return false;
  // A clock that moved backwards (timezone change, manual set) must not be
  // readable as a long absence. Negative gaps are simply not returns.
  const gap = now - lastOpenedAt;
  return gap >= ABSENCE_DAYS * DAY_MS;
}

/** Memoised for the life of the document. See the header note on StrictMode. */
let decided: boolean | null = null;

/**
 * Decide whether THIS open is a return, and record that the app was opened.
 *
 * Returns a boolean and nothing else — see the header note on why no duration
 * escapes this module.
 */
export function openedNow(now: number = Date.now()): boolean {
  if (decided !== null) return decided;
  const last = read<number | null>(KEYS.lastOpened, null);
  decided = isReturn(last, now);
  write(KEYS.lastOpened, now);
  return decided;
}

/** Test seam: forget the memo so a fresh decision can be taken in-page. */
export function resetForTest(): void {
  decided = null;
}
