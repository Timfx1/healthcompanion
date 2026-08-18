import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { ExerciseDetailScreen } from "../screens/main/ExerciseDetailScreen";
import { ArticleDetailScreen } from "../screens/main/ArticleDetailScreen";
import { TrackerCheckInScreen } from "../screens/main/TrackerCheckInScreen";
import { ReportsScreen } from "../screens/main/ReportsScreen";
import { ReadinessScreen } from "../screens/main/ReadinessScreen";
import { SignUpScreen } from "../screens/onboarding/SignUpScreen";
import { PainCheckInScreen } from "../screens/main/PainCheckInScreen";
import { SafetyScreen } from "../screens/main/SafetyScreen";
import { NextRecoveryAreaScreen } from "../screens/main/NextRecoveryAreaScreen";
import { PremiumTeaserScreen } from "../screens/onboarding/PremiumTeaserScreen";
import { TrialPaywallScreen } from "../screens/onboarding/TrialPaywallScreen";
import { useAppTheme } from "../state/AppThemeContext";

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  const { palette } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background }
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: "Exercise" }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: "Article" }} />
      <Stack.Screen name="TrackerCheckIn" component={TrackerCheckInScreen} options={{ title: "Check-in" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Recovery report" }} />
      <Stack.Screen name="Readiness" component={ReadinessScreen} options={{ title: "Return to sport" }} />
      {/* Reachable from the paywall so a guest can create an account without
          being thrown back through onboarding. */}
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Create your account" }} />
      <Stack.Screen name="PainCheckIn" component={PainCheckInScreen} options={{ title: "Pain check-in" }} />
      <Stack.Screen name="Safety" component={SafetyScreen} options={{ title: "Safety" }} />
      <Stack.Screen name="PremiumTeaser" component={PremiumTeaserScreen} options={{ title: "Premium features" }} />
      <Stack.Screen name="TrialPaywall" component={TrialPaywallScreen} options={{ title: "Premium" }} />
      <Stack.Screen name="NextRecoveryArea" component={NextRecoveryAreaScreen} options={{ title: "Request next area" }} />
    </Stack.Navigator>
  );
}
