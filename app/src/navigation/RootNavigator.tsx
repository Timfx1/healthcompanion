import { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { OnboardingStack } from "./OnboardingStack";
import { MainStack } from "./MainStack";
import { SplashScreen } from "../screens/SplashScreen";
import { useAppData } from "../state/AppDataContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { hydrated, onboardingCompleted } = useAppData();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  // Show the branded splash for at least 2 seconds on every launch.
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Keep the splash up until saved data has loaded too, so a returning user is
  // routed straight to Home instead of briefly flashing onboarding.
  if (!hydrated || !minSplashElapsed) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={onboardingCompleted ? "Main" : "Onboarding"}
    >
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      <Stack.Screen name="Main" component={MainStack} />
    </Stack.Navigator>
  );
}
