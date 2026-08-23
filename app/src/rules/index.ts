// ============================================================
// FILE: rules/ — the product's decisions, with nothing drawn.
//
// WHY THIS LAYER EXISTS, stated plainly because it is the whole point:
//
// Every rule in this file used to live inside a React Native component. Which
// state a subscriber with one photo sees; whether an article is gated; whether
// the report can claim a trend; where a gap on the timeline becomes "quiet
// days". Those are the decisions this product is JUDGED on — P9's gate has to
// land in the right place, P2's gap must never read as a failure, N6 must hold
// — and not one of them could be reached by anything except a running app,
// because the file that held it imported `react-native` on line one.
//
// So the rules were unreachable by construction. That is the same shape as
// every other blind spot §11 records: the Toast's dead branch, the capture
// button with no handler, `share.*` carrying a 1.58:1 for the life of a family.
// All of them typechecked, and none of them could be checked.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE CONSTRAINT THAT MAKES THIS WORK
//
// NOTHING IN `rules/` MAY IMPORT REACT, REACT NATIVE, OR ANY COMPONENT. It may
// import types and pure data, and that is all. `checks/rules.mjs` enforces it,
// because the value here is entirely in the constraint — a rules module that
// quietly grows a `useState` is a rules module that has stopped being testable
// and has taken the tests down with it.
//
// Every function here is pure and total: same input, same output, no clock, no
// storage, no I/O. Where a rule needs "now", the caller passes it. That is not
// ceremony — a rule that reads `Date.now()` internally cannot be tested for
// what happens on the day the clock goes backwards, and one of these rules
// exists specifically to handle that case.
// ============================================================

export * from "./access.ts";
export * from "./entries.ts";
export * from "./format.ts";
export * from "./select.ts";
export * from "./absence.ts";
export * from "./report.ts";
export * from "./timeline.ts";
export * from "./trend.ts";
