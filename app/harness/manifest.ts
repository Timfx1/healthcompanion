// ============================================================
// FILE: harness/manifest.ts — the coverage claim, as plain data.
//
// Split from `screens.tsx` because the Playwright spec runs in NODE and the
// screen registry imports React Native, which Node cannot resolve. So the LIST
// lives here — no JSX, no imports, readable from either side — and `screens.tsx`
// attaches a renderer to each id.
//
// THE TWO CANNOT DRIFT SILENTLY. An id here with no renderer in `screens.tsx`
// falls through to the harness's "Unknown screen" page, and `render.spec.ts`
// fails on exactly that string. A renderer with no id here is simply never
// reached, which is why `screens.tsx` is built by mapping over THIS list rather
// than by keeping its own.
//
// This list is the coverage claim. If a screen is not here, nothing draws it.
// ============================================================

export type ScreenId = string;

export const SCREEN_MANIFEST: { id: ScreenId; note: string }[] = [
  // ── The five tabs ───────────────────────────────────────────────────────────
  { id: "home", note: "capture field above everything, report free and unbadged (P1, N6)" },
  { id: "timeline", note: "the heart — gaps render as neutral rest (P2)" },
  { id: "checkin", note: "fast path largest and first, detail layer collapsed (P3)" },
  { id: "progress", note: "a sentence above every chart, corridor as a range (P4, P5, N5)" },
  { id: "profile", note: "reports row says free, premium row never names the report (N6)" },

  // ── The capture lane ────────────────────────────────────────────────────────
  { id: "capture", note: "empty — the save action is idle and pressing it is a no-op (P1)" },
  { id: "add-entry", note: "capture sits ABOVE the categorised list, not in it (P1)" },
  { id: "journal-new", note: "composing — save inert until there is text" },
  { id: "journal-reading", note: "an existing entry, promote offered" },

  // ── The timeline detail set ─────────────────────────────────────────────────
  { id: "milestone", note: "share offered, never pushed; no count and no next target (P8, N1)" },
  { id: "share-card", note: "mode-invariant by contract — the recipient never sees the sender's theme" },
  { id: "medication", note: "taken accrues, skipped is quiet and never counted (P2)" },
  { id: "appointment-upcoming", note: "questions and the report nudge lead" },
  { id: "appointment-past", note: "notes-after leads; questions become a record" },
  { id: "questions", note: "answered questions stay visible, struck through (N4)" },
  { id: "questions-empty", note: "the state most people meet first — it explains what it is for" },

  // ── The photo lane ──────────────────────────────────────────────────────────
  { id: "compare", note: "locked — BOTH photos visible, only the tooling withheld (§9)" },

  // ── The report lane ─────────────────────────────────────────────────────────
  { id: "report", note: "the flagship — no badge, no gate, and it says free (P6, N6)" },
  { id: "report-range", note: "every preset states its yield BEFORE the tap" },

  // ── Content ─────────────────────────────────────────────────────────────────
  { id: "article", note: "free — everything answering what-is-normal (§9)" },
  { id: "article-deep", note: "deep dive — real first paragraph, then a soft pill (§9)" },
  { id: "safety", note: "three tiers; the reserved hue on 1 and 2 only (N3)" },
  { id: "weekly", note: "the give-back, with an optional reply (P7)" },
];
