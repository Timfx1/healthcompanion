// ============================================================
// FILE: rules/trend.ts — the sentence above the chart (§4.6, P4).
//
// P4: "Never show a chart without a plain-language sentence above it. 'Data
// with no payoff' is a top churn cause."
//
// So this module is the payoff, and it has one job the chart cannot do: refuse.
// A chart will happily draw two points and let the eye invent a slope; a
// sentence has to commit to a claim, which means it also has to be able to
// decline to make one.
//
// THE VOCABULARY IS improving / worsening / steady, everywhere — screen, paper
// and report. The icon carries DIRECTION and the word carries VALENCE, because
// direction alone has none: "pain up" and "sleep up" mean opposite things and
// would otherwise render identically.
// ============================================================

import type { Trend } from "../types/recovery.ts";
import { MEANINGFUL_DELTA, MIN_FOR_TREND } from "./report.ts";

export type TrendClaim = { trend: Trend; text: string };

const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Compare two windows of pain scores.
 *
 * Returns `steady` with a "not enough yet" sentence when either window is too
 * short. That refusal is the point: it is the difference between a companion
 * and a horoscope, and the copy for it must not read as the user's fault for
 * not logging enough — "that is fine, it builds up" rather than "log more".
 *
 * FALLING PAIN IS IMPROVING. The only place in this product where a decreasing
 * number is good news, and the reason the return type carries a word rather
 * than a sign.
 */
export function painTrend(recent: number[], earlier: number[]): TrendClaim {
  if (recent.length < 2 || earlier.length < 2) {
    return {
      trend: "steady",
      text: "Not enough logged yet to describe a trend. That is fine — it builds up.",
    };
  }

  const delta = average(recent) - average(earlier);
  if (delta <= -MEANINGFUL_DELTA) {
    return { trend: "improving", text: "Pain has been lower over the last two weeks than the two before." };
  }
  if (delta >= MEANINGFUL_DELTA) {
    return { trend: "worsening", text: "Pain has been higher over the last two weeks than the two before." };
  }
  return { trend: "steady", text: "Pain has held about the same over the last two weeks." };
}

/** Whether there is enough to say anything at all. Shared with the report. */
export function canClaimTrend(scoreCount: number): boolean {
  return scoreCount >= MIN_FOR_TREND;
}
