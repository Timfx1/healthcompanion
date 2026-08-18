import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "./types";
import { WelcomeScreen } from "../screens/onboarding/WelcomeScreen";
import { SignUpScreen } from "../screens/onboarding/SignUpScreen";
import { ConsentScreen } from "../screens/onboarding/ConsentScreen";
import { InjuryTypeScreen } from "../screens/onboarding/InjuryTypeScreen";
import { InjuryTimingScreen } from "../screens/onboarding/InjuryTimingScreen";
import { SymptomsScreen } from "../screens/onboarding/SymptomsScreen";
import { PainWalkingScreen } from "../screens/onboarding/PainWalkingScreen";
import { RecoveryGoalScreen } from "../screens/onboarding/RecoveryGoalScreen";
import { NotificationPromptScreen } from "../screens/onboarding/NotificationPromptScreen";
import { PlanLoadingScreen } from "../screens/onboarding/PlanLoadingScreen";
import { TrialPaywallScreen } from "../screens/onboarding/TrialPaywallScreen";
import { FreePlanUnlockedScreen } from "../screens/onboarding/FreePlanUnlockedScreen";
import { PremiumTeaserScreen } from "../screens/onboarding/PremiumTeaserScreen";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Consent" component={ConsentScreen} />
      <Stack.Screen name="InjuryType" component={InjuryTypeScreen} />
      <Stack.Screen name="InjuryTiming" component={InjuryTimingScreen} />
      <Stack.Screen name="Symptoms" component={SymptomsScreen} />
      <Stack.Screen name="PainWalking" component={PainWalkingScreen} />
      <Stack.Screen name="RecoveryGoal" component={RecoveryGoalScreen} />
      <Stack.Screen name="Notifications" component={NotificationPromptScreen} />
      <Stack.Screen name="PlanLoading" component={PlanLoadingScreen} />
      <Stack.Screen name="TrialPaywall" component={TrialPaywallScreen} />
      <Stack.Screen name="FreePlanUnlocked" component={FreePlanUnlockedScreen} />
      <Stack.Screen name="PremiumTeaser" component={PremiumTeaserScreen} />
    </Stack.Navigator>
  );
}
