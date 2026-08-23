// ============================================================
// FILE: rules/access.ts — where the gates are, and where they are not.
//
// P9's guardrails are structural, so these three functions are the places the
// structure actually lives. Each one was previously a few lines inside a
// component that imported `react-native`, which meant the monetisation boundary
// of the entire product was untestable.
// ============================================================

import type { Milestone, TimelineEntry } from "../types/recovery.ts";

// ── Photo comparison (§4.11, P9) ────────────────────────────────────────────

export type CompareState = "locked" | "insufficient" | "ready";

/**
 * Taking photos is free and the timeline is free (N7); only COMPARING them is
 * premium (P9). This gate therefore belongs to the comparison screen and never
 * to photo capture — putting it on the act of adding a photo would gate the
 * core loop, which is the failure P9 was written about.
 *
 * ENTITLEMENT IS CHECKED FIRST, and the order is the design. A non-subscriber
 * with one photo must see `locked`, not `insufficient`: telling somebody to
 * come back with more photos and THEN gating them is two disappointments in a
 * row, and the second one arrives after they have done what was asked.
 *
 * The `insufficient` state is the one worth having. Without it a subscriber
 * with one photo sees either a broken screen or — far worse — an upsell for
 * something they have already paid for.
 */
export function compareStateOf(photoCount: number, isPremium: boolean): CompareState {
  if (!isPremium) return "locked";
  return photoCount < 2 ? "insufficient" : "ready";
}

// ── Education (§4.8, P9) ────────────────────────────────────────────────────

export type ArticleTier = "free" | "deepDive";
export type ArticleAccess = "free" | "deepDiveLocked" | "deepDiveOpen";

/**
 * Everything answering "what is normal" is free forever — that is the half of
 * §9 that matters at 2am. Only deep dives are premium.
 *
 * A free article is free REGARDLESS of entitlement, which is why `tier` is
 * tested before `isPremium` and why there is no fourth state: a subscriber
 * reading a free article is reading a free article, and the screen has nothing
 * different to say to them.
 */
export function accessOf(tier: ArticleTier, isPremium: boolean): ArticleAccess {
  if (tier === "free") return "free";
  return isPremium ? "deepDiveOpen" : "deepDiveLocked";
}

// ── Journal (§4.5, N7) ──────────────────────────────────────────────────────

export type JournalState = "composing" | "reading" | "promoted";

/**
 * Promotion to a milestone is ONE-WAY and ADDITIVE — the journal entry stays
 * exactly where it is. `promoted` therefore describes an entry that has a
 * milestone pointing back at it, not an entry that has been consumed.
 *
 * There is no premium state here at any point: journal is core loop.
 */
export function journalStateOf(
  entry: TimelineEntry | undefined,
  milestones: Pick<Milestone, "fromJournalEntryId">[],
): JournalState {
  if (!entry || !entry.detail?.trim()) return "composing";
  return milestones.some((m) => m.fromJournalEntryId === entry.id) ? "promoted" : "reading";
}
