// ============================================================
// Red-flag content for the Safety screen (§4.8, §10, N3).
//
// ⚠ PLACEHOLDER, CITED, AND FLAGGED FOR CLINICAL REVIEW. Every item carries a
// `source`, and `NEEDS_CLINICAL_REVIEW` below is deliberately exported so the
// screen can say so out loud rather than implying this text has been signed off.
// §10 requires source attribution and forbids anything that reads as diagnosis;
// the corridor data is held to the same standard and the README says so.
//
// THE TIERS ARE THE DESIGN. A flat list of warnings — which is what the
// AnklePath screen this replaces rendered — makes "call an ambulance" and
// "mention it next time" look identical, so a reader has to triage for
// themselves at exactly the moment they are least able to. Three tiers, in
// descending urgency, each stating what to DO rather than what it might be.
//
// N3 IS APPLIED WITHIN THIS SCREEN, not just to it. The reserved hue is on
// tiers 1 and 2 — genuine red flags — and NOT on tier 3, which is routine.
// A screen that owns the alert colour is the easiest place in the product to
// start crying wolf with it.
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
