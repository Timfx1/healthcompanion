import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "../state/AppThemeContext";

export const tabIconMap = {
  Home: "home",
  Plan: "calendar",
  Track: "stats-chart",
  Learn: "book",
  Profile: "person"
} as const satisfies Record<string, keyof typeof Ionicons.glyphMap>;

export function getTabIcon(routeName: keyof typeof tabIconMap, focused: boolean, color: string, size: number) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.wrap, focused && { backgroundColor: palette.teal }]}>
      <Ionicons name={tabIconMap[routeName]} size={focused ? size + 1 : size} color={focused ? palette.background : color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
});
