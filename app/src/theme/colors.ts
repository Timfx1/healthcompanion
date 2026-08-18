// ============================================================
// FILE: theme/colors.ts
// PURPOSE: The static palette the onboarding screens read.
//
// Onboarding runs in the app's default light theme — the dark-mode toggle lives
// in Profile, which is only reachable afterwards — so these are the light
// values. Main-app screens use the theme-aware palette in AppThemeContext.
//
// THESE ARE NO LONGER HAND-WRITTEN. They are the LIGHT half of the same
// generated palette AppThemeContext uses, so the two cannot drift apart.
//
// That mattered more than it looks. This file and AppThemeContext previously
// held two independent copies of the same hex values, with nothing keeping them
// in step — which is precisely the drift bug this design system was built to
// kill, and it would have been re-imported into the new repository on day one.
// Recovery Companion's web prototype had the identical problem (tokens.ts and
// an @theme block, each with a "keep in sync" comment, already out of sync).
// One source, one build, no comment required.
//
// The same keys are missing here as in RcPalette — `blue` and `teal` above all,
// AnklePath's brand identity, which has no Recovery Companion equivalent. Every
// site using one fails to compile and has to be re-domained by a person.
// ============================================================

import { appPalette } from "./tokens.generated";

/**
 * Light-mode palette for onboarding.
 *
 * @deprecated Prefer `useAppTheme().palette`, which is mode-aware. This export
 * exists because the onboarding stack predates the theme context and is pinned
 * to light; it is not a licence to add new light-only screens.
 */
export const colors = appPalette("light");
