// ============================================================
// FILE: data/educationContent.ts — education articles (§4.8, P9).
//
// PORTED VERBATIM from the web prototype, for the same reason safetyContent.ts
// was: clinical-adjacent copy that differs between two consumers of one product
// is a defect, not a variant. Same articles, same sources, same tiers.
//
// PLACEHOLDER, CITED, FLAGGED FOR REVIEW. Every article names a source and
// links out to it; the app summarises, it does not become the authority.
//
// TIERS MAP TO THE MONETISATION BOUNDARY, and ONLY here. P9 makes education
// deep-dives premium while everything answering "what is normal" stays free.
// So `tier` is the one field in this file with a price attached, and the free
// articles are the ones a worried person needs at 2am.
// ============================================================

export const NEEDS_CLINICAL_REVIEW = true;

export type ArticleTier = "free" | "deepDive";

export type Article = {
  id: string;
  title: string;
  category: string;
  readingTime: string;
  tier: ArticleTier;
  summary: string;
  body: string[];
  /** Shown BEFORE the gate on a deep dive. Value first, never a blank wall (§9). */
  deepDiveHook?: string;
  source: string;
  url: string;
};

export const ARTICLES: Article[] = [
  {
    id: "is-this-normal-week-6",
    title: "Is it normal to still have bad days at week 6?",
    category: "What is normal",
    readingTime: "3 min read",
    tier: "free",
    summary: "Why recovery is bumpy rather than linear, and what a setback usually means.",
    body: [
      "Recovery is very rarely a straight line. Most people describe good weeks followed by a day or two that feels like going backwards, and that pattern is common enough that clinicians expect it rather than worry about it.",
      "A flare after a busier day usually reflects load rather than damage — the tissue is being asked to do more than it did last week, and it complains. What matters is the direction over weeks, not the reading on any single day.",
      "Common ranges are wide. Two people with the same injury can be weeks apart and both be recovering normally. If pain is climbing day on day rather than settling, or you have any of the red flags in 'when to contact a doctor', that is worth a call.",
    ],
    source: "NHS — Sprains and strains",
    url: "https://www.nhs.uk/conditions/sprains-and-strains/",
  },
  {
    id: "swelling-after-activity",
    title: "Why swelling comes back after a busy day",
    category: "What is normal",
    readingTime: "2 min read",
    tier: "free",
    summary: "Swelling that returns in the evening is usually load, not injury.",
    body: [
      "Swelling often reappears late in the day after more walking or standing than usual. Fluid moves with gravity and activity, so an ankle or knee that looked settled at breakfast can be puffy by evening.",
      "This is common for weeks or months after an injury or operation, and by itself it is not a sign that something has gone wrong.",
      "Swelling that comes with heat, spreading redness or a fever is different, and belongs in the same-day list on the safety screen.",
    ],
    source: "Cleveland Clinic",
    url: "https://my.clevelandclinic.org/",
  },
  {
    id: "loading-and-tissue-adaptation",
    title: "How tissue actually rebuilds under load",
    category: "Deep dive",
    readingTime: "9 min read",
    tier: "deepDive",
    summary: "The mechanism behind 'load it to heal it', and how clinicians decide when to progress.",
    deepDiveHook: "Why the exercises get harder on a schedule that looks arbitrary — and what your physio is actually watching for.",
    body: [
      "Connective tissue responds to mechanical load by remodelling along the lines of stress it experiences. That is the reason modern rehabilitation loads a healing structure deliberately rather than resting it completely: unloaded tissue heals disorganised and weaker.",
      "Progression is usually decided on response rather than on the calendar. A clinician is watching how the area behaves in the twenty-four hours AFTER a session — settling quickly suggests the load was appropriate, while pain that lingers into the next day suggests it was too much too soon.",
      "This is also why two people with identical injuries progress at different rates without either of them doing anything wrong.",
    ],
    source: "APTA — Clinical guidance",
    url: "https://www.apta.org/",
  },
];
