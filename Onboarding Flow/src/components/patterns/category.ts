// ============================================================
// CATEGORY ACCESS — shared by every pattern that is "about" a data type.
//
// Components take a category NAME and resolve mark/ink/onMark themselves.
// This is not a style preference; it is the fix for a class of defect the
// contrast sweep found six times.
//
// When a component takes `color: string`, the CALL SITE has to decide
// mark-vs-ink — and the call site is exactly where that knowledge is absent. It
// knows "this row is about sleep". It does not know whether the value will be
// painted as a background wash or stroked as a 2px data line, and that is what
// decides the answer. Every mark-as-text and mark-as-stroke failure found came
// through a `color` prop or a `color` field on a data object; not one came from
// a direct token reference.
//
// Moving the decision inside the component that does the painting leaves the
// call site with nothing to get wrong.
// ============================================================

import { theme, type Mode } from "../tokens";

export type Category = "pain" | "sleep" | "energy" | "mood" | "meds";

/** Resolve a category's full role set for the current mode. */
export const cat = (mode: Mode, c: Category) => theme(mode).color.category[c];
