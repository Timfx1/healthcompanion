// ============================================================
// FILE: AppThemeContext.tsx
// PURPOSE: Light/dark mode state, and the palette every screen reads.
//
// THE PALETTE IS NO LONGER DEFINED HERE. It comes from the Recovery Companion
// token source via `appPalette(mode)` in theme/tokens.generated.ts, which is
// produced by `node design-system/build/build.mjs`. Editing values in this file
// would be pointless — the next build overwrites the generated import, and
// `build.mjs --check` fails the moment the two diverge.
//
// WHY THE SHAPE STAYED FLAT. 439 references across 31 files read
// `palette.text`, `palette.surface` and so on. Keeping that shape is what makes
// the token swap reviewable: the values underneath change, the call sites do
// not. It is a migration shim with a deliberate end date — a flat palette
// cannot express the mark-vs-ink distinction, which is the one thing this
// design system most needs components to make, so new code should reach for
// `theme(mode)` instead.
//
// WHAT DELIBERATELY BROKE. The generated palette omits every key that carries
// MEANING rather than structure — teal, tealDark, blue, blueDark, red, green,
// amber, purple, and the four *Soft status tints. Those are not oversights.
// AnklePath's brand blue has no Recovery Companion equivalent; `red` currently
// colours a Sign out button and a "bad" data point, and pointing it at the
// reserved safety hue would break the rule that hue exists to protect. Each
// site has to be re-domained by a person, and the compiler is what lists them.
// ============================================================

import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { appPalette, theme, type RcPalette, type Theme } from "../theme/tokens.generated";

export type ThemeMode = "light" | "dark";

/** The palette shape, generated from the token source. */
export type AppPalette = RcPalette;

type AppThemeValue = {
  mode: ThemeMode;
  palette: AppPalette;
  /**
   * The real Recovery Companion token tree for this mode.
   *
   * `palette` is the flat migration shim; this is the destination. It is the
   * only one of the two that can express mark-vs-ink, which is the distinction
   * a colour-coded health app most needs its components to make — a category
   * hue used as a fill is fine, the same hue used as a chart line or a label is
   * unreadable on light. Re-domained code reads `tokens.color.…`; nothing new
   * should reach for `palette`.
   */
  tokens: Theme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const AppThemeContext = createContext<AppThemeValue | undefined>(undefined);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const palette = appPalette(mode);
  const tokens = theme(mode);
  const value = useMemo<AppThemeValue>(
    () => ({
      mode,
      palette,
      tokens,
      isDark: mode === "dark",
      setMode,
      toggleMode: () => setMode((current) => (current === "dark" ? "light" : "dark"))
    }),
    [mode, palette, tokens]
  );
  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(AppThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }
  return value;
}
