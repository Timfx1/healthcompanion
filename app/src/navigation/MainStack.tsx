import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "./types";
// The five Recovery Companion tabs replace AnklePath's. `MainTabs` is kept in
// the tree, unreferenced, until the AnklePath screens it hosts are removed —
// deleting it now would take Plan, Track and Learn with it in the same change,
// and a re-domain and a deletion should not be reviewed as one diff.
import { RecoveryTabs } from "./RecoveryTabs";
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

// The §5 detail set. These are the Recovery Companion screens; the AnklePath
// imports above remain only until their screens are removed.
import { RcQuickCaptureRoute } from "../screens/recovery/detail/routes";
import {
  RcAddEntryRoute, RcJournalRoute, RcMilestoneRoute, RcShareCardRoute,
  RcMedicationRoute, RcAppointmentRoute, RcQuestionsRoute, RcPhotoCaptureRoute,
  RcPhotoCompareRoute, RcReportRoute, RcReportRangeRoute, RcArticleRoute,
  RcSafetyRoute, RcWeeklyRoute,
} from "../screens/recovery/detail/routes";

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
      <Stack.Screen name="MainTabs" component={RecoveryTabs} options={{ headerShown: false }} />
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

      {/* Recovery Companion §5 detail screens.
          headerShown:false throughout — DetailScreen draws its own header, and
          two stacked headers is the drift the shared shell exists to prevent. */}
      <Stack.Screen name="RcQuickCapture" component={RcQuickCaptureRoute} options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="RcAddEntry" component={RcAddEntryRoute} options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="RcJournal" component={RcJournalRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcMilestone" component={RcMilestoneRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcShareCard" component={RcShareCardRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcMedication" component={RcMedicationRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcAppointment" component={RcAppointmentRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcQuestions" component={RcQuestionsRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcPhotoCapture" component={RcPhotoCaptureRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcPhotoCompare" component={RcPhotoCompareRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcReport" component={RcReportRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcReportRange" component={RcReportRangeRoute} options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="RcArticle" component={RcArticleRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcSafety" component={RcSafetyRoute} options={{ headerShown: false }} />
      <Stack.Screen name="RcWeekly" component={RcWeeklyRoute} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
