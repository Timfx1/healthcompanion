import type { ComponentProps, ReactNode } from "react";
import { View } from "react-native";

type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const ZERO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export function useSafeAreaInsets(): Insets {
  return ZERO_INSETS;
}

export function SafeAreaProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function SafeAreaView(props: ComponentProps<typeof View>) {
  return <View {...props} />;
}

export const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: ZERO_INSETS,
};
