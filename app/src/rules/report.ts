// ============================================================
// FILE: rules/report.ts — how the doctor report degrades (§4.7, P6, N6).
//
// The report is the flagship, and the interesting engineering in it is not the
// happy path — it is what it says when it has almost nothing to say. A lesser
// design draws "improving" from two data points and a confident chart from a
// week of noise. This module is where the refusal to do that lives.
//
// NOTHING HERE KNOWS ABOUT ENTITLEMENT, and that absence is the point. There is
// no `isPremium` parameter, no gate, no locked depth. N6 makes the report free
// forever including its export, so a premium input would have nothing to do
// except be wrong. `restricted.mjs` fails the build if a gating symbol appears
// in a report surface; this file is one.
// ============================================================

import type { CheckIn, TimelineEntry, Trend } from "../types/recovery.ts";

/** How many pain scores it takes before a trend is a trend rather than a mood. */
export const MIN_FOR_TREND = 4;

/** Below this, a difference in average pain is noise. */
export const MEANINGFUL_DELTA = 0.5;

export type ReportDepth = "empty" | "sparse" | "first" | "ready";
export type ChangeState = "noAnchor" | "insufficient" | "noChange" | "changes";

export type ReportModel = {
  depth: ReportDepth;
  change: ChangeState;
  trend: Trend;
  /** Empty unless `change` is `noChange` or `changes`. */
  changeText: string;
  painScores: number[];
};

/** Pain scores from newest to oldest. */
export function painScoresOf(entries: TimelineEntry[]): number[] {
  return entries
    .filter((e) => e.type === "checkin" && typeof (e.data as CheckIn | undefined)?.pain === "number")
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => (e.data as CheckIn).pain as number);
}

const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Derive the whole report shape from the data and an optional anchor.
 *
 * `anchorMs` is the previous appointment — the thing "since last visit"
 * actually means. It is passed in rather than found here so that the range
 * picker can move it without this module knowing what a range picker is.
 *
 * DEPTH:
 *   empty   nothing logged at all. REACHABLE ON DAY ONE, because the report is
 *           two taps from Home and a curious new user will tap it. It has to
 *           say what it becomes without shaming the gap (P2).
 *   sparse  logged, but under MIN_FOR_TREND. Degrades rather than guesses.
 *   first   enough data, no prior visit. The DATA is fine; the ANCHOR is
 *           missing, so the framing changes and nothing else does.
 *   ready   data and a prior visit.
 *
 * CHANGE — the visually dominant block, so its degradation IS the design:
 *   noAnchor      no previous visit to compare against
 *   insufficient  a previous visit, but too little either side of it to be fair
 *   noChange      data on both sides and nothing moved. THE GUILT-RISK CASE:
 *                 steady is a finding, and this must never read as a failure to
 *                 improve (P2).
 *   changes       the intended case
 *
 * The split is around the ANCHOR, not around "now". "Since last visit" has to
 * mean since the visit, or the block is a different claim wearing that label.
 */
export function deriveReport(entries: TimelineEntry[], anchorMs: number | undefined): ReportModel {
  const painScores = painScoresOf(entries);

  const depth: ReportDepth =
    entries.length === 0 ? "empty"
      : painScores.length < MIN_FOR_TREND ? "sparse"
        : anchorMs === undefined ? "first"
          : "ready";

  if (anchorMs === undefined) {
    return { depth, change: "noAnchor", trend: "steady", changeText: "", painScores };
  }

  const since: number[] = [];
  const before: number[] = [];
  for (const e of entries) {
    if (e.type !== "checkin") continue;
    const pain = (e.data as CheckIn | undefined)?.pain;
    if (typeof pain !== "number") continue;
    (new Date(e.date).getTime() >= anchorMs ? since : before).push(pain);
  }

  if (since.length < 2 || before.length < 2) {
    return { depth, change: "insufficient", trend: "steady", changeText: "", painScores };
  }

  const delta = average(since) - average(before);

  if (Math.abs(delta) < MEANINGFUL_DELTA) {
    return {
      depth,
      change: "noChange",
      trend: "steady",
      changeText: "Pain has held steady since the last visit.",
      painScores,
    };
  }

  // Falling pain is IMPROVING. Direction alone has no valence — "pain up" and
  // "sleep up" mean opposite things — which is why the vocabulary is
  // improving / worsening / steady everywhere: screen, paper and report. The
  // icon carries direction, the word carries valence.
  return {
    depth,
    change: "changes",
    trend: delta < 0 ? "improving" : "worsening",
    changeText:
      delta < 0
        ? "Pain has been lower on average since the last visit."
        : "Pain has been higher on average since the last visit.",
    painScores,
  };
}
