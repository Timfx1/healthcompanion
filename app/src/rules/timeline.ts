// ============================================================
// FILE: rules/timeline.ts — where a gap becomes "quiet days" (§4.3, P2).
//
// "Gaps on the timeline render as neutral rest ('a few quiet days'), not
// failure." This module decides where those rows go, and it is worth having as
// a rule rather than a loop inside a screen for one reason: the failure mode is
// not visual, it is arithmetic. A run of seven empty days rendered as SEVEN
// rows is a list of reproaches however gently each one is worded, and no
// contrast check or token contract can see that.
// ============================================================

import type { TimelineEntry } from "../types/recovery.ts";

const DAY_MS = 86_400_000;

export type TimelineRow =
  | { kind: "entry"; entry: TimelineEntry }
  | { kind: "rest"; days: number };

/**
 * Interleave rest rows between entries, newest first.
 *
 * A RUN OF EMPTY DAYS BECOMES ONE ROW, never one row per day. That is the whole
 * reason this is a rule: "3 quiet days" is a description, and three separate
 * "a quiet day" rows is an accusation repeated three times. The principle is
 * honoured in the tokens and lost in the layout otherwise.
 *
 * MULTIPLE ENTRIES ON ONE DAY PRODUCE NO REST ROW. The gap is measured between
 * DAY KEYS, not between timestamps, so two captures an hour apart are not
 * separated by a rest row claiming zero quiet days.
 *
 * Entries are sorted here rather than trusted, because a caller that forgets is
 * a caller that silently produces negative gaps.
 */
export function withRestRows(entries: TimelineEntry[]): TimelineRow[] {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const rows: TimelineRow[] = [];

  for (let i = 0; i < sorted.length; i++) {
    rows.push({ kind: "entry", entry: sorted[i] });
    const next = sorted[i + 1];
    if (!next) continue;

    const newer = Date.parse(sorted[i].date.slice(0, 10));
    const older = Date.parse(next.date.slice(0, 10));
    const gap = Math.round((newer - older) / DAY_MS) - 1;
    if (gap > 0) rows.push({ kind: "rest", days: gap });
  }

  return rows;
}

/**
 * The copy for a run of quiet days.
 *
 * Descriptive, never evaluative — `rest.label`'s own contract. There is no
 * threshold above which this becomes a warning, and no wording that implies
 * catching up. It says what happened and stops.
 */
export function restLabel(days: number): string {
  return days === 1 ? "A quiet day" : `${days} quiet days`;
}
