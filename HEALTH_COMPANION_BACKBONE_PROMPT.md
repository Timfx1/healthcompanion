# Prompt: Build a New Health App on the AnklePath Backbone (`Health-companion` branch)

Paste everything below the line into Claude (Claude Code, ideally, since it can read the repo). Fill in the **YOUR NEW APP** section before running.

---

You are a senior React Native / Expo engineer. You are extending an existing, production-shipped app called **AnklePath** into a new (related) health app. AnklePath is being used as the **structural backbone** — its architecture, navigation shell, auth, data sync, analytics/monitoring/billing plumbing, design system, and content-as-data patterns are all reusable. Your job is to reskin and re-domain that backbone into the new app described at the bottom.

## Branch convention (important)
- **`master`** = the shipped **AnklePath** app. Treat it as the read-only reference implementation of the structure.
- **`Health-companion`** = a branch forked from AnklePath for building the new app. **All development for the new/related app happens on `Health-companion`.** Do not commit new-app changes to `master`.
- Before coding, confirm you are on `Health-companion` (`git rev-parse --abbrev-ref HEAD`). Use AnklePath's structure as the scaffold and adapt it in place on this branch.

---

## THE BACKBONE — AnklePath, in full

### Tech stack
- **Expo SDK ~54**, **React Native 0.81.5**, **React 19.1**, **TypeScript ~5.9** (typecheck via `npm run typecheck` → `tsc --noEmit`).
- **Navigation:** `@react-navigation/native` v6 — a native-stack root, a nested onboarding stack, a bottom-tab main navigator, and a main stack for detail/modal screens. Param lists are fully typed in `src/navigation/types.ts`.
- **State:** React Context + hooks only (no Redux/Zustand). Local persistence via `@react-native-async-storage/async-storage`.
- **Backend:** **Firebase** (Auth + Firestore) via the `firebase` JS SDK v12, with a REST/`fetch` fallback for Firestore writes using the user's ID token (for flaky-network resilience).
- **Auth:** Apple (`expo-apple-authentication`), Google (`@react-native-google-signin/google-signin`), Email/password, and **Anonymous/guest** (`signInAnonymously`). Guests are upgraded to real accounts in place via `linkWithCredential` so their uid/records carry over. Users are classified with `userType` (`guest`|`registered`) + `authMethod`.
- **Analytics:** **PostHog** (`posthog-react-native`) with a central typed event catalog and thin `trackEvent` / `trackScreen` / `identifyUser` wrappers that also drop Sentry breadcrumbs.
- **Monitoring:** **Sentry** (`@sentry/react-native`) — `Sentry.wrap` + `ErrorBoundary`, user/context/breadcrumbs, sanitized error context, and the required Expo Metro wrapper (`getSentryExpoConfig`).
- **Billing:** **RevenueCat** (`react-native-purchases`) — 14-day trial + monthly, entitlement-gated, feature-flagged via env.
- **UI:** custom theme tokens (colors/spacing/typography), light/dark via `AppThemeContext`, `expo-linear-gradient`, `@expo/vector-icons` (Ionicons), `react-native-reanimated` + `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`.
- **Other Expo modules:** `expo-image-picker` (profile photo), `expo-web-browser`, `expo-crypto` (Apple nonce), `expo-constants`, `expo-font`, `expo-status-bar`.
- **Build/release:** **EAS Build + Submit** (`eas.json`, production profile, `appVersionSource: remote` + `autoIncrement` for build numbers). Marketing version is bumped by `scripts/bump-version.js` (odometer scheme, e.g. 1.0.9→1.1.0) wired into `npm run release` (bump → commit → build both platforms → auto-submit).
- **Config:** everything is driven by `EXPO_PUBLIC_*` env vars and **degrades gracefully** when unset — each integration is gated by an `isFirebaseConfigured` / `isPostHogConfigured` / `isSentryConfigured` / `PAYWALL_ENABLED` / `BILLING_ENABLED` boolean, so the app runs fully in guest/offline mode with no keys.

### App entry & provider tree (`App.tsx`)
```
Sentry.ErrorBoundary
  └ SafeAreaProvider
     └ AppThemeProvider            (light/dark palette)
        └ AnalyticsProvider        (PostHog, no-op if unconfigured)
           └ AppDataProvider       (local user data + profile + onboardingCompleted)
              └ OnboardingProvider (in-progress onboarding answers)
                 └ NavigationContainer  (screen-view tracking on route change)
                    └ RootNavigator
```
`initSentry()` runs at module load; `default export` is `Sentry.wrap(App)`.

### Navigation graph
- **RootNavigator** shows a branded `SplashScreen` until AsyncStorage has hydrated **and** a 2s minimum elapses, then routes to `Onboarding` or `Main` based on `onboardingCompleted`.
- **OnboardingStack:** `Welcome → SignUp → InjuryType → InjuryTiming → Symptoms → PainWalking → RecoveryGoal → Notifications → PlanLoading → FreePlanUnlocked / PremiumTeaser / TrialPaywall`.
- **MainStack:** `MainTabs` + detail/modal screens: `ExerciseDetail`, `ArticleDetail`, `TrackerCheckIn`, `Reports`, `PainCheckIn`, `Safety`, `PremiumTeaser`, `NextRecoveryArea`.
- **MainTabs (bottom tabs):** `Home · Plan · Track · Learn · Profile`.

### Directory map (`src/`)
- `navigation/` — `RootNavigator`, `OnboardingStack`, `MainStack`, `MainTabs`, `types.ts` (typed param lists).
- `screens/onboarding/` — `WelcomeScreen`, `SignUpScreen`, `InjuryTypeScreen`, `InjuryTimingScreen`, `SymptomsScreen`, `PainWalkingScreen`, `RecoveryGoalScreen`, `NotificationPromptScreen`, `PlanLoadingScreen`, `FreePlanUnlockedScreen`, `PremiumTeaserScreen`, `TrialPaywallScreen`.
- `screens/main/` — `HomeDashboardScreen`, `PlanScreen`, `TrackScreen`, `LearnScreen`, `ProfileScreen`, `ExerciseDetailScreen`, `ArticleDetailScreen`, `PainCheckInScreen`, `TrackerCheckInScreen`, `ReportsScreen`, `SafetyScreen`, `NextRecoveryAreaScreen`.
- `screens/SplashScreen.tsx`.
- `state/` — `AppThemeContext` (palette + isDark), `AppDataContext` (completed exercises, pain entries, saved articles, tracker check-ins, local profile w/ `authMethod`, `onboardingCompleted`, hydrate/persist), `OnboardingContext` (typed onboarding answers, persisted).
- `services/firebase/` — `firebase.ts` (init + `isFirebaseConfigured`), `auth.ts` (all sign-in methods, guest linking, `identifyFirebaseUser`, `classifyUser`), `firestore.ts` (`upsertUserProfile`, `saveOnboardingAnswers`, pain logs, feature requests, waitlist, REST fallback).
- `services/analytics/` — `posthog.ts` (client + `trackEvent`/`trackScreen`/`identifyUser`), `events.ts` (event-name catalog), `AnalyticsProvider.tsx`.
- `services/monitoring/` — `sentry.ts` (init, user/context/breadcrumbs), `errorReporting.ts` (`captureAppError`, `captureUserMessage`).
- `services/billing/` — `revenueCat.ts`.
- `components/` — `AppButton`, `ScreenContainer`, `InfoCard`, `SafetyAlert`, `PhaseBadge`, `StatCard`, `BottomTabs`, `OptionCard`, `ProgressHeader`, `NextRecoveryAreaCard`.
- `data/` — `onboardingOptions.ts`, `mockRecoveryPlan.ts` (exercises, phases, articles, learn categories), `recoveryAreaOptions.ts`, `trackerCheckIns.ts`.
- `config/` — `paywall.ts` (RevenueCat config + `PAYWALL_COPY` + flags), `legal.ts` (privacy/terms/support URLs).
- `types/` — `onboarding.ts`, `analytics.ts`.
- `theme/` — `colors.ts`, `spacing.ts`, `typography.ts`, `index.ts`.
- `hooks/` — `useAnalytics.ts`. `utils/` — `errorUtils.ts` (`normalizeError`, `sanitizeErrorContext`).

### State & data flow
1. **Local-first.** `AppDataContext` and `OnboardingContext` hydrate from AsyncStorage on launch and persist on every change; the app is fully usable offline and as a guest.
2. **Onboarding wizard** writes each answer into `OnboardingContext` (persisted). `PlanLoadingScreen` then ensures a Firebase user (guest if needed), writes answers to Firestore (`saveOnboardingAnswers`), and marks `onboardingCompleted`.
3. **Cloud mirror when configured.** Firestore `users/{uid}` holds profile + classification + onboarding summary; subcollections hold onboarding answers, pain logs, etc. All writes are wrapped so Firestore being offline/misconfigured never blocks the UX.
4. **Screen tracking** is automatic via `NavigationContainer.onStateChange` → `trackScreen`.

### Capabilities (what the shipped app does)
- Personalized, multi-step onboarding → a **phased recovery plan** with a live "Day N" counter.
- **Home dashboard** of daily actions; **video-guided exercises** (sets/reps, cues, safety caveats) sourced from real physio providers.
- **Pain check-in** (score/symptoms/location/notes) and **trackers** (swelling, walking, range of motion, balance) charted over time.
- **Learn hub** of short, evidence-based articles (NHS, Mayo, Cleveland Clinic, AAOS, APTA); **Safety/red-flags**; **exportable recovery reports** to show a clinician.
- **Auth** (Apple/Google/Email/Guest) with guest→registered upgrade; **Premium** (trial + monthly) via RevenueCat, feature-flagged.
- Full **analytics + crash/error monitoring**, medical-disclaimer scaffolding, and an **EAS release pipeline**.

### Conventions & guardrails to follow
- **Content-as-data.** Screens render from typed modules in `src/data/`. To re-domain the app, you mostly swap data + copy, not screen logic.
- **Graceful degradation.** Never assume a service is configured — gate on the `isXConfigured` booleans; keep guest/offline working.
- **Never block UX on network.** Wrap Firestore/analytics calls; failures go to Sentry as warnings, not user errors.
- **Typed everything.** Extend the param lists in `navigation/types.ts` and the event catalog in `services/analytics/events.ts` rather than using string literals ad hoc.
- **Design tokens only.** Use `colors`/`spacing`/`typography`; support light + dark.
- **Compliance.** This is a **non-medical-device** health app: no diagnose/treat/cure claims, no guaranteed outcomes, keep the medical disclaimer, and route severe symptoms to professional care. Preserve this posture for any new health domain.
- Match the existing code style (comment density, naming, functional components, small pure helpers).

---

## REUSE MAP — keep vs. replace

**Keep as-is (the true backbone):** provider tree, splash/routing gate, onboarding-wizard framework, `auth.ts` + guest linking + classification, local+cloud data sync pattern, analytics/monitoring/billing plumbing, theme system, component library, reports/tracking pattern, disclaimer/legal scaffolding, EAS release pipeline + version bump script, env-based config gating.

**Replace / re-domain for the new app:**
- **Branding:** app name (`AnklePath`), slug, bundle IDs, icons/splash, `app.json`, colors if desired.
- **Content data (`src/data/`):** `onboardingOptions`, `mockRecoveryPlan` (exercises/phases/articles), `recoveryAreaOptions`, `trackerCheckIns` — swap for the new domain's questions, plan, library, and trackers.
- **Onboarding screens/steps** and `OnboardingState` fields (`injuryType`, `symptoms`, `pain`, …) → the new domain's inputs.
- **Firestore field names** in `firestore.ts` (e.g. `injuryType`, `painLogs`) and the **analytics event names** in `events.ts` tied to the injury flow.
- **Domain copy** across screens, plus `legal.ts` URLs and store listings.
- **Premium benefits** copy in `paywall.ts`.

---

## YOUR NEW APP — fill this in
> Replace the brackets, then let the AI proceed.

- **New app name / one-liner:** [e.g. "MigraineTrack — a guided migraine-management companion"]
- **Domain & who it's for:** [what condition/goal; target users]
- **Core job-to-be-done:** [the "panic → clear plan" equivalent for this domain]
- **Onboarding inputs (replaces injury type/timing/symptoms/pain/walking/goal):** [list the questions + options]
- **The "plan" concept (replaces phased ankle recovery):** [what a personalized plan looks like here — phases? daily protocol? triggers?]
- **Daily actions (replaces exercises/pain check-in/trackers):** [what users log/do each day; which trackers]
- **Knowledge/Learn content:** [article topics + trustworthy sources]
- **Safety/red-flags for this domain:** [when to tell users to seek care]
- **What to KEEP vs CHANGE from the reuse map above:** [anything domain-specific to preserve or drop]
- **Branding:** [name, colors, tone; keep AnklePath's palette or new?]
- **Premium features (if any):** [benefits list]

---

## HOW TO PROCEED (do this in order — this is the test)
1. **Confirm the branch** is `Health-companion` and that you will not touch `master`.
2. **Read the real code** for the areas you'll change (start with `src/data/`, `src/state/OnboardingContext.tsx`, `src/navigation/`, `src/services/firebase/firestore.ts`, `src/services/analytics/events.ts`, `App.tsx`) so your plan matches the actual structure, not this summary alone.
3. **Produce a migration/mapping plan first** — a table mapping each AnklePath concept to its new-app equivalent (keep / rename / replace / remove), the files touched, and the new `OnboardingState` + Firestore schema + event catalog. **Do not write code yet.**
4. **Wait for my approval** of the plan.
5. Then implement incrementally on `Health-companion`: data & copy first (re-domain via `src/data/`), then onboarding fields/screens, then services (schema/events), then branding/config. Run `npm run typecheck` after each slice and keep guest/offline working at every step.
6. Flag anything that needs my decision (new Firebase project? new bundle IDs? new RevenueCat entitlement? domain-specific compliance?).

Begin with steps 1–3 and show me the mapping plan.
