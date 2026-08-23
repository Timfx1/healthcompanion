// ============================================================
// FILE: harness/shims/expo-linear-gradient.tsx
//
// `expo-linear-gradient` ships no web build that react-native-web can consume,
// and importing it turned every screen using it into a BLANK PAGE — which the
// smoke probe cheerfully reported as "ok", because a page with no error and no
// content looks fine from the outside.
//
// That is worth recording on its own: the probe was checking the wrong thing.
// A render check that only asks "did anything throw?" passes on a white
// rectangle. `render.spec.ts` asserts on visible CONTENT for exactly this
// reason, and this file is the reason it does.
//
// This is a declared FIDELITY SUBSTITUTION, not a mock. The app keeps the real
// component; the harness draws the same two stops at the same angle in CSS. For
// a two-stop diagonal the two are visually equivalent, and what the baseline is
// evidence about — that BOTH token stops reach the screen, and that the text on
// them is legible — is preserved exactly. That matters here more than usual:
// the Day-N card's 1.58:1 defect was a wrong gradient START, invisible in any
// render that only drew the end.
// ============================================================

import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

export function LinearGradient({
  colors, start, end, style, children,
}: {
  colors: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  // Expo takes unit coordinates; CSS takes an angle measured clockwise from
  // "to top". The default (0,0) → (1,1) is the 135° diagonal the Day-N card
  // asks for, which is what this arithmetic has to reproduce.
  const dx = (end?.x ?? 0) - (start?.x ?? 0);
  const dy = (end?.y ?? 1) - (start?.y ?? 0);
  const angle = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
  return (
    <View
      style={[
        style,
        { backgroundImage: `linear-gradient(${angle}deg, ${colors.join(", ")})` } as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}
