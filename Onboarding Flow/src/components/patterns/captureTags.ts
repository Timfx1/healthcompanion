// ============================================================
// Silent keyword tagging for Quick Capture (§4.2).
//
// "Light auto-structuring in Phase 1: simple keyword tagging (pain/sleep/med/
// mood words) applied silently and editable later; never blocks saving."
//
// The three words that matter in that sentence are SILENTLY, EDITABLE and
// NEVER BLOCKS. So this function is pure, total, and cannot fail: it returns
// whatever it recognised and says nothing about what it did not. There is no
// confidence score, no "did you mean", no prompt to confirm a tag. A capture
// with no recognised words is not a lesser capture — it is the normal case, and
// the reason the tag row simply does not render rather than saying "no tags".
//
// The tags map onto the five `category.*` families, which is what lets a tag
// carry an icon and a label alongside its colour (N4). A tag family that could
// only be told apart by hue would not be allowed to exist here.
// ============================================================

import type { Category } from "./category";

// Deliberately small and boring. This is a keyword matcher, not a classifier —
// Phase 1 rules only, per §4.12. Anything cleverer belongs in Phase 3 and would
// need to justify itself against the "never blocks saving" contract first.
const KEYWORDS: Record<Category, string[]> = {
  pain:   ["pain", "hurt", "hurts", "sore", "ache", "aching", "throb", "sting", "stiff", "swollen", "swelling"],
  sleep:  ["sleep", "slept", "woke", "waking", "awake", "insomnia", "tired", "rest", "nap"],
  energy: ["energy", "exhausted", "fatigue", "drained", "strong", "walk", "walked", "walking", "stairs", "run"],
  mood:   ["mood", "happy", "low", "anxious", "frustrated", "calm", "hopeful", "down", "good day", "bad day"],
  meds:   ["med", "meds", "medication", "ibuprofen", "paracetamol", "painkiller", "dose", "tablet", "pill"],
};

/**
 * Categories recognised in a capture, in a stable order so the same text always
 * produces the same chips — a tag row that reshuffled between renders would be
 * noise pretending to be information.
 */
export function detectTags(text: string): Category[] {
  const haystack = ` ${text.toLowerCase()} `;
  const order: Category[] = ["pain", "sleep", "energy", "mood", "meds"];
  return order.filter((cat) =>
    KEYWORDS[cat].some((word) => haystack.includes(` ${word} `) || haystack.includes(` ${word},`) || haystack.includes(` ${word}.`))
  );
}
