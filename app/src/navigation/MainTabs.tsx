import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabsParamList } from "./types";
import { typography } from "../theme";
import { getTabIcon } from "../components/BottomTabs";
import { useAppTheme } from "../state/AppThemeContext";
import { HomeDashboardScreen } from "../screens/main/HomeDashboardScreen";
import { PlanScreen } from "../screens/main/PlanScreen";
import { TrackScreen } from "../screens/main/TrackScreen";
import { LearnScreen } from "../screens/main/LearnScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const { palette, tokens } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.borderSoft,
          minHeight: 76,
          paddingTop: 9,
          paddingBottom: 12
        },
        tabBarActiveTintColor: tokens.color.accent.default,
        tabBarInactiveTintColor: palette.textSubtle,
        tabBarLabelStyle: {
          ...typography.tiny,
          marginTop: 2
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 2
        },
        tabBarIcon: ({ focused, color, size }) =>
          getTabIcon(route.name as keyof MainTabsParamList, focused, color, size)
      })}
    >
      <Tab.Screen name="Home" component={HomeDashboardScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Track" component={TrackScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
