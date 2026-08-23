// ============================================================
// FILE: data/safetyContent.ts — red-flag content for the Safety screen.
//
// PORTED VERBATIM from the web prototype, deliberately. This is the one body
// of copy in the product where a divergence between the two consumers would be
// a clinical-safety problem rather than a design inconsistency: two platforms
// disagreeing about which symptoms mean "call an ambulance" is not a variant,
// it is a defect. Same tiers, same items, same citations, same flag.
//
// PLACEHOLDER, CITED, AND FLAGGED FOR CLINICAL REVIEW. NEEDS_CLINICAL_REVIEW is
// exported so the screen can say so out loud rather than implying sign-off.
//
// THE TIERS ARE THE DESIGN. A flat list makes "call an ambulance" and "mention
// it next time" look identical, so the reader has to triage for themselves at
// exactly the moment they are least able to.
//
// N3 IS APPLIED WITHIN THE SCREEN, not just to it: the reserved hue goes on
// tiers 1 and 2 and NOT on tier 3, which is routine. A screen that owns the
// alert colour is the easiest place in the product to start crying wolf.
//
// No item names a condition. "Calf pain with swelling" is an observation the
// reader can make; "this could be a DVT" is a diagnosis, which this app does
// not make and is not licensed to (§10).
// ============================================================

export const NEEDS_CLINICAL_REVIEW = true;

export type Urgency = "emergency" | "sameDay" | "routine";

export type SafetyItem = {
  text: string;
  source: string;
};

export type SafetyTier = {
  urgency: Urgency;
  heading: string;
  action: string;
  items: SafetyItem[];
};

export const TIERS: SafetyTier[] = [
  {
    urgency: "emergency",
    heading: "Get emergency help now",
    action: "Call your local emergency number, or go to an emergency department.",
    items: [
      { text: "Chest pain, or sudden shortness of breath.", source: "NHS — When to call 999" },
      { text: "Pain, swelling or warmth in the calf that came on suddenly.", source: "NHS — Blood clots" },
      { text: "The limb looks pale, blue or cold, or you cannot feel it.", source: "OrthoInfo (AAOS)" },
      { text: "A bone looks out of shape, or the injury broke the skin.", source: "OrthoInfo (AAOS)" },
    ],
  },
  {
    urgency: "sameDay",
    heading: "Contact your doctor today",
    action: "Call your GP, surgery or physio — do not wait for your next appointment.",
    items: [
      { text: "A fever, or heat and redness spreading around the area.", source: "NHS — Infection after surgery" },
      { text: "Fluid or pus coming from a wound, or a wound opening up.", source: "NHS — Infection after surgery" },
      { text: "Pain that is getting worse day on day rather than easing.", source: "NHS — Sprains and strains" },
      { text: "New numbness or pins and needles that does not settle.", source: "OrthoInfo (AAOS)" },
      { text: "You cannot put any weight on it when you could before.", source: "NHS — Sprains and strains" },
    ],
  },
  {
    urgency: "routine",
    heading: "Worth mentioning at your next appointment",
    action: "Not urgent. Add it to your questions so it does not get forgotten.",
    items: [
      { text: "Swelling that comes back after a busy day.", source: "Cleveland Clinic" },
      { text: "Stiffness first thing in the morning.", source: "Cleveland Clinic" },
      { text: "Sleep that is still broken weeks in.", source: "Cleveland Clinic" },
      { text: "Progress that feels slower than you expected.", source: "APTA — Recovery expectations" },
    ],
  },
];
