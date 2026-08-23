// ============================================================
// FILE: data/captureTags.ts — silent keyword tagging for Quick Capture (§4.2).
//
// "Light auto-structuring in Phase 1: simple keyword tagging applied SILENTLY
// and editable later; NEVER blocks saving." So this is pure, total, and cannot
// fail: it returns what it recognised and says nothing about what it did not.
// No confidence score, no "did you mean", no prompt to confirm. A capture with
// no recognised words is not a lesser capture — it is the NORMAL case, which is
// why the tag row renders nothing at all rather than "no tags".
//
// ─────────────────────────────────────────────────────────────────────────────
// A DELIBERATE DEPARTURE FROM §6, AND WHY
//
// §6 types `autoTags` as `'pain' | 'sleep' | 'mood' | 'medication' | 'mobility'`.
// The design system's category families are `pain | sleep | energy | mood |
// meds`. Two of the five names disagree, and it is not cosmetic: `mobility` has
// no category family at all.
//
// A tag has to RENDER, and N4 forbids meaning by colour alone — every category
// family therefore carries an icon and a label alongside its colours, and
// `restricted.mjs` fails the build if one does not. A `mobility` tag could only
// be drawn as a colourless chip or by inventing a sixth family for one word in
// one spec sentence.
//
// So the vocabulary follows the CATEGORY FAMILIES, which is also what the web
// prototype already does — the alternative was two consumers of one token
// source disagreeing about what a tag is. Recorded in DESIGN_CRITERIA §11.
// ============================================================

/** The five category families. A tag is always renderable as a chip. */
export type CaptureTag = "pain" | "sleep" | "energy" | "mood" | "meds";

// Deliberately small and boring. A keyword matcher, not a classifier — Phase 1
// rules only per §4.12. Anything cleverer belongs in Phase 3 and would have to
// justify itself against "never blocks saving" first.
const KEYWORDS: Record<CaptureTag, string[]> = {
  pain: ["pain", "hurt", "hurts", "sore", "ache", "aching", "throb", "sting", "stiff", "swollen", "swelling"],
  sleep: ["sleep", "slept", "woke", "waking", "awake", "insomnia", "tired", "rest", "nap"],
  energy: ["energy", "exhausted", "fatigue", "drained", "strong", "walk", "walked", "walking", "stairs", "run"],
  mood: ["mood", "happy", "low", "anxious", "frustrated", "calm", "hopeful", "down", "good day", "bad day"],
  meds: ["med", "meds", "medication", "ibuprofen", "paracetamol", "painkiller", "dose", "tablet", "pill"],
};

const ORDER: CaptureTag[] = ["pain", "sleep", "energy", "mood", "meds"];

/**
 * Categories recognised in a capture, in a STABLE order so the same text always
 * produces the same chips. A tag row that reshuffled between renders would be
 * noise pretending to be information.
 *
 * Matching is on whole words, so "restless" does not become a `rest` tag and
 * "medical" does not become `meds`. Substring matching was the first attempt
 * and it tagged half of everything.
 */
export function detectTags(text: string): CaptureTag[] {
  const haystack = ` ${text.toLowerCase()} `;
  return ORDER.filter((cat) =>
    KEYWORDS[cat].some(
      (word) =>
        haystack.includes(` ${word} `) ||
        haystack.includes(` ${word},`) ||
        haystack.includes(` ${word}.`),
    ),
  );
}

/** The word a chip shows. Never a bare hue — N4. */
export const TAG_LABEL: Record<CaptureTag, string> = {
  pain: "Pain",
  sleep: "Sleep",
  energy: "Energy",
  mood: "Mood",
  meds: "Meds",
};
