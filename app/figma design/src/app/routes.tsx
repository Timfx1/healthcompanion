/**
 * ROUTES.TSX - Main routing configuration for AnklePath
 *
 * This file defines all app routes using React Router's createBrowserRouter.
 *
 * USER FLOW OVERVIEW:
 * 1. Splash (/) → Welcome (/welcome) → Sign Up (/signup)
 * 2. Onboarding: injury-type → timeline → symptoms → pain-walking → goal
 * 3. Notifications → Plan Loading → Free Plan Unlocked
 * 4. Main App: Home Dashboard with bottom navigation
 *
 * NAVIGATION STRUCTURE:
 * - Pre-auth: Splash, Welcome, Sign Up
 * - Onboarding: 5-step flow in /onboarding/* routes
 * - Post-onboarding: Notifications, Loading, Free Plan
 * - Main app: Home, Exercises, Progress, Learn, Profile (bottom nav)
 * - Sub-pages: Exercise Detail, Article Detail, Red Flags, Reports, etc.
 */

import { createBrowserRouter } from "react-router";
import SplashScreen from "./screens/SplashScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import SignUpScreen from "./screens/SignUpScreen";
import OnboardingInjuryType from "./screens/onboarding/OnboardingInjuryType";
import OnboardingTimeline from "./screens/onboarding/OnboardingTimeline";
import OnboardingSymptoms from "./screens/onboarding/OnboardingSymptoms";
import OnboardingPainWalking from "./screens/onboarding/OnboardingPainWalking";
import OnboardingGoal from "./screens/onboarding/OnboardingGoal";
import NotificationPermission from "./screens/NotificationPermission";
import PlanLoadingScreen from "./screens/PlanLoadingScreen";
import FreePlanUnlocked from "./screens/FreePlanUnlocked";
import PremiumPreview from "./screens/PremiumPreview";
import HomeDashboard from "./screens/HomeDashboard";
import DailyExercisePlan from "./screens/DailyExercisePlan";
import ExerciseDetail from "./screens/ExerciseDetail";
import PainCheckin from "./screens/PainCheckin";
import ProgressTracking from "./screens/ProgressTracking";
import RecoveryTimeline from "./screens/RecoveryTimeline";
import LearnHub from "./screens/LearnHub";
import ArticleDetail from "./screens/ArticleDetail";
import RedFlags from "./screens/RedFlags";
import DoctorReport from "./screens/DoctorReport";
import LocalHelp from "./screens/LocalHelp";
import Profile from "./screens/Profile";

export const router = createBrowserRouter([
  // ENTRY POINT: Auto-redirects to /welcome after 2 seconds
  {
    path: "/",
    Component: SplashScreen, // App logo, auto-navigates to /welcome
  },
  {
    path: "/welcome",
    Component: WelcomeScreen, // Marketing page with "Start Recovery Plan" CTA
  },
  {
    path: "/signup",
    Component: SignUpScreen, // Apple/Google/Email/Guest sign-in options
  },

  // ONBOARDING FLOW (5 steps with progress indicators)
  {
    path: "/onboarding/injury-type",
    Component: OnboardingInjuryType, // Step 1/5: Select injury type
  },
  {
    path: "/onboarding/timeline",
    Component: OnboardingTimeline, // Step 2/5: When did injury happen
  },
  {
    path: "/onboarding/symptoms",
    Component: OnboardingSymptoms, // Step 3/5: Multi-select symptoms
  },
  {
    path: "/onboarding/pain-walking",
    Component: OnboardingPainWalking, // Step 4/5: Pain slider + walking ability
  },
  {
    path: "/onboarding/goal",
    Component: OnboardingGoal, // Step 5/5: Recovery goal selection
  },

  // POST-ONBOARDING FLOW
  {
    path: "/notifications",
    Component: NotificationPermission, // Ask for notification permission
  },
  {
    path: "/plan-loading",
    Component: PlanLoadingScreen, // Animated loading screen, navigates to /free-plan-unlocked
  },
  {
    path: "/free-plan-unlocked",
    Component: FreePlanUnlocked, // Success screen showing free benefits
  },
  {
    path: "/premium-preview",
    Component: PremiumPreview, // Soft paywall with "Coming soon" waitlist
  },

  // MAIN APP (Bottom navigation: Home, Plan, Track, Learn, Profile)
  {
    path: "/home",
    Component: HomeDashboard, // Main dashboard with recovery phase, daily cards
  },
  {
    path: "/exercises",
    Component: DailyExercisePlan, // List of today's exercises with completion tracking
  },
  {
    path: "/exercise/:id",
    Component: ExerciseDetail, // Individual exercise with video, instructions, timer
  },
  {
    path: "/pain-checkin",
    Component: PainCheckin, // Pain logging form: slider, location, symptoms, notes
  },
  {
    path: "/progress",
    Component: ProgressTracking, // Charts and metrics showing recovery progress
  },
  {
    path: "/timeline",
    Component: RecoveryTimeline, // Vertical timeline of 6 recovery phases
  },
  {
    path: "/learn",
    Component: LearnHub, // Education articles categorized by topic
  },
  {
    path: "/article/:id",
    Component: ArticleDetail, // Full article with related exercises/tracking links
  },
  {
    path: "/red-flags",
    Component: RedFlags, // Warning signs requiring medical attention
  },
  {
    path: "/doctor-report",
    Component: DoctorReport, // Exportable PDF report for healthcare providers
  },
  {
    path: "/local-help",
    Component: LocalHelp, // Find nearby physios, clinics, imaging centers
  },
  {
    path: "/profile",
    Component: Profile, // User settings, recovery status, subscription info
  },
]);
