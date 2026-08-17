// ============================================================
// FILE: tokens.ts
// PURPOSE: The prototype's design-token entry point.
//
// THIS FILE NO LONGER DEFINES VALUES. It re-exports them from
// tokens.generated.ts, which is produced by:
//
//     node design-system/build/build.mjs
//
// from the JSON source in design-system/tokens/. Edit the JSON, rebuild.
// Editing the generated file is pointless — the next build overwrites it, and
// `node design-system/build/build.mjs --check` fails the moment the two
// diverge.
//
// WHY THIS CHANGED
//   Values used to live here AND in the @theme block of index.css, with a
//   comment in each saying the two must be kept in sync. They were already out
//   of sync: `lTextMut` and `safety` existed here and were missing from the CSS.
//
//   The reason nobody noticed is instructive — nothing consumed the CSS
//   variables. No component used a `bg-surface-base` utility or a
//   `var(--color-...)` reference. The second source of truth was pure
//   duplication that could drift indefinitely without any visible symptom.
//
//   Both are now generated from one mode-paired source, so a colour role that
//   is missing its light value is a build failure rather than a comment.
//
// MIGRATION STATUS
//   `D` and `c` below are the LEGACY surface, preserved key-for-key so that
//   adopting the generated tokens changed no rendered pixel. They are
//   deprecated. New code should use `theme(mode)`:
//
//       const t = theme(mode);
//       t.color.surface.raised     // already resolved for this mode
//       t.pattern.corridor.band    // product patterns, defined once
//       scale.radius.lg            // mode-independent scales
//
//   `c(dark, light, mode)` is the thing this system is replacing. Because it
//   takes two RAW VALUES, its ergonomics actively invite a hardcoded hex at the
//   call site — which is how 746 literal occurrences accumulated across the two
//   screen files. `theme(mode)` has no raw-value channel.
// ============================================================

export { D, c, theme, scale } from "./tokens.generated";
export type { Mode, Theme } from "./tokens.generated";
