// ============================================================
// FILE: rules/format.ts — how dates read.
//
// Every screen was calling `new Date(x).toLocaleDateString()`, which renders
// "9.7.2026" on a European locale and "7/9/2026" on an American one — the same
// day, two orderings, no way to tell which you are looking at.
//
// That is a real problem on the doctor report specifically. §4.7 asks for
// something "scannable by a clinician in 60 seconds", and a column of
// ambiguous numeric dates is the opposite: it makes the reader stop and work
// out the convention before they can read the first row.
//
// Found by rendering the screens, not by reading them. Every call site
// typechecked and every one produced a plausible-looking string.
// ============================================================

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "9 Jul" — unambiguous in every locale, because the month is a word.
 *
 * The year is omitted deliberately: a recovery is measured in days and weeks,
 * and a year on every row is noise that pushes the useful part further right.
 * `longDate` exists for the places that genuinely need it.
 */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "9 Jul 2026" — for a start date, and for anything that may be a year back. */
export function longDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "9 Jul, 11:30" — appointments, where the time is the point. */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${shortDate(iso)}, ${hh}:${mm}`;
}

/**
 * A malformed date renders as an empty string rather than "Invalid Date".
 *
 * The same reasoning as `parseStored`: one missing date beats a screen full of
 * the word "Invalid", which tells the user nothing and looks like the app is
 * broken rather than like one record is.
 */
