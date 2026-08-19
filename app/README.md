# AnklePath

Expo React Native frontend for AnklePath, a free-first ankle injury recovery app.

## Must do before the next store submission

Compliance work that lands outside the codebase. Tick these off before submitting
the premium release — several are rejection or fine risks, not nice-to-haves.

### Store declarations (changed since 1.0.2 — must be updated)

- [ ] **Play Console → App content → Data safety.** Analytics is now **optional
      and off by default**, and account deletion happens **in-app**. Both differ
      from what was declared for 1.0.2, and Google treats a stale Data safety
      form as a policy violation.
- [ ] **Play Console → App content → Health apps declaration.** Required for
      health apps, and required to link the privacy policy.
- [ ] **App Store Connect → App Privacy.** Same two changes: analytics is
      consent-gated, and account deletion is available in-app (Guideline
      5.1.1(v)). Declare health data as collected and linked to the user.
- [ ] Confirm the **account deletion URL** is set in Play Console:
      <https://timfx1.github.io/anklepath/delete-account.html>

### Legal pages (staged, not yet live)

- [ ] Merge the **`premium-policies`** branch of
      <https://github.com/Timfx1/anklepath> into `main`. GitHub Pages only serves
      `main`, so nothing is live until that merge. Do it **before** submitting —
      reviewers open the privacy policy URL during review.
- [ ] Add a **USt-IdNr** to `impressum.html` if you are VAT-registered.

### Data processing agreements

- [ ] **PostHog** — sign in-app at <https://app.posthog.com/legal> (self-serve;
      only the countersigned copy generated there is binding).
- [ ] **Sentry** — must be actively accepted, see
      <https://www.sentry.help/en/articles/13965008-how-do-i-sign-your-data-processing-addendum>.
- [ ] **RevenueCat** — dashboard → Settings → Legal.
- [ ] **Firebase / Google** — incorporated automatically via the Cloud terms; keep
      a copy of the Cloud Data Processing Addendum for your records.

### Firestore

- [ ] Deploy [`firestore.rules`](firestore.rules) — `npx firebase-tools deploy
      --only firestore:rules`. The previously deployed rules blocked client
      deletes, which silently defeats in-app account deletion and leaves health
      data behind after the auth record is gone.

### Before charging money

- [ ] RevenueCat products, entitlement and offering created, keys in EAS env, and
      `EXPO_PUBLIC_PAYWALL_ENABLED` / `EXPO_PUBLIC_BILLING_ENABLED` set to `true`
      (see [Dormant Paywall Setup](#dormant-paywall-setup)).
- [ ] Device-test the consent gate, in-app deletion, data export and the purchase
      flow against a sandbox tester account.

## Run

```bash
npm.cmd install
npm.cmd start -- --clear
```

For a friend outside your Wi-Fi:

```bash
npm.cmd run start:tunnel
```

For an installed EAS development build:

```bash
npm.cmd run start:dev-client
```

This uses LAN because it is more reliable for the installed development build. If you specifically need a tunnel:

```bash
npm.cmd run start:dev-client:tunnel
```

Open the installed AnklePath development app after Metro starts. A development build does not include the JavaScript bundle inside the APK, so it shows "Unable to load script" when Metro is not running.

## Firebase Setup

Create a Firebase web app in the Firebase console, enable Authentication, enable Anonymous sign-in, and create a Firestore database.

Important: AnklePath uses **Cloud Firestore**, not Realtime Database. If the waitlist says the client is offline while your internet works, check that Firebase Console has `Build > Firestore Database` created for this project. The Realtime Database screen is a different Firebase product and will not receive AnklePath waitlist writes.

Create a local `.env` file from `.env.example`:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_value
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_value
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value
EXPO_PUBLIC_FIREBASE_APP_ID=your_value
```

Restart Expo after changing `.env`:

```bash
npm.cmd start -- --clear
```

In development, Metro will print a safe connection log when Firebase is available:

```text
[AnklePath/Firebase] Connected
```

### Sign-In Provider Setup

Guest access works when Firebase Authentication > Sign-in method > Anonymous is enabled.

Email sign-in works when Firebase Authentication > Sign-in method > Email/Password is enabled.

Google sign-in uses the native `@react-native-google-signin/google-signin` library in development/production builds. It requires Firebase Authentication > Sign-in method > Google to be enabled, plus OAuth client IDs in `.env`:

```bash
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_expo_or_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
```

Apple sign-in requires Firebase Authentication > Sign-in method > Apple to be enabled. It is available on supported iOS devices and will need Apple developer configuration before production release.

OAuth note: Google and Apple sign-in should be tested in an EAS development build, not Expo Go. Expo Go cannot use AnklePath's own custom URL scheme for OAuth redirects. Email and Guest can still be tested in Expo Go.

After installing or changing native auth packages, rebuild the development app:

```bash
npx eas-cli build -p android --profile development
```

After installing that development build on your phone, start Metro with:

```bash
npm.cmd run start:dev-client
```

For a production Android App Bundle:

```bash
npx eas-cli build -p android --profile production
```

If you want a standalone APK that opens without Metro, build the preview profile instead:

```bash
npx eas-cli build -p android --profile preview
```

### Firestore Writes To Test

Guest sign-in creates/updates:

```text
users/{uid}
```

Completing onboarding writes:

```text
users/{uid}/onboardingAnswers/latest
```

Pain check-ins write:

```text
users/{uid}/painLogs/{autoId}
```

Premium waitlist writes:

```text
premiumWaitlist/{uid}
```

and updates:

```text
users/{uid}.hasJoinedWaitlist
```

### Firestore Rules For Testing

For early testing, use rules that allow a signed-in anonymous Firebase user to write their own profile, logs, onboarding answers, and waitlist document:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    match /users/{userId} {
      allow read, create, update: if signedIn() && request.auth.uid == userId;

      match /onboardingAnswers/{document=**} {
        allow read, create, update: if signedIn() && request.auth.uid == userId;
      }

      match /painLogs/{document=**} {
        allow read, create: if signedIn() && request.auth.uid == userId;
      }
    }

    match /premiumWaitlist/{userId} {
      allow read, create, update: if signedIn() && request.auth.uid == userId;
    }
  }
}
```

## PostHog Setup

Create a PostHog project and add:

```bash
EXPO_PUBLIC_POSTHOG_API_KEY=your_project_api_key
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Use the EU host instead if your PostHog project is hosted in the EU.

Restart Expo after changing `.env`:

```bash
npm.cmd start -- --clear
```

In development, Metro will print a safe connection log when PostHog is available:

```text
[AnklePath/PostHog] Connected
```

## Test Analytics

1. Open the app in Expo Go.
2. Complete onboarding.
3. Start the free plan.
4. Open Home, Plan, Track, Learn, Profile.
5. Join the Premium waitlist.
6. In PostHog, open Activity or Live events and check for:

```text
app_opened
onboarding_started
onboarding_step_viewed
onboarding_completed
free_plan_unlocked_viewed
start_my_plan_clicked
home_viewed
premium_waitlist_clicked
premium_waitlist_joined
pain_log_saved
```

When testing the waitlist, Metro should also show:

```text
[AnklePath/PostHog] Event sent
[AnklePath/Firestore] Waitlist signup saved
```

Events are centralized in:

```text
src/services/analytics/events.ts
src/services/analytics/posthog.ts
```

Add new events there first, then call the helper from screens or service flows.

## Dormant Paywall Setup

AnklePath includes a dormant paywall screen that can be previewed later without changing the app flow today. The app remains free-first by default:

```bash
EXPO_PUBLIC_PAYWALL_ENABLED=false
EXPO_PUBLIC_BILLING_ENABLED=false
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
EXPO_PUBLIC_REVENUECAT_MONTHLY_PACKAGE_ID=$rc_monthly
```

When `EXPO_PUBLIC_PAYWALL_ENABLED=false`, onboarding continues to the free plan as usual.

To preview the paywall UI during development:

```bash
EXPO_PUBLIC_PAYWALL_ENABLED=true
EXPO_PUBLIC_BILLING_ENABLED=false
```

Then restart Expo with a clear cache:

```bash
npm.cmd run start:dev-client -- --clear
```

The preview paywall shows a 14-day trial option and a monthly subscription option for EUR 9.99/month, but it does not charge users while `EXPO_PUBLIC_BILLING_ENABLED=false`.

Important: do not set `EXPO_PUBLIC_BILLING_ENABLED=true` until RevenueCat, store billing, and store products are fully configured. The app includes the RevenueCat service in `src/services/billing/revenueCat.ts`, launch-time entitlement sync (`src/components/PremiumSync.tsx`), purchase/restore buttons, and real feature gating. The code stays inactive until billing is enabled.

### What Premium unlocks

Premium is gated by a single derived flag, `PREMIUM_GATING_ENABLED = PAYWALL_ENABLED && BILLING_ENABLED` (see `src/config/paywall.ts`). Features lock **only** when both flags are live, so before launch every user keeps full access and no existing user loses anything on update. When live, these lock for free users and unlock for entitled users (`usePremium()`):

All five advertised benefits on the paywall (`PAYWALL_COPY.benefits`) are implemented — nothing is
"coming soon" any more. Shipping fewer benefits than the paywall advertises is a subscription-review
rejection risk under Apple Guideline 3.1.2 and Google's subscription policy, so keep this list and
the paywall copy in step whenever either changes.

- **Exportable recovery report** (`ReportsScreen`) — free users see an upsell; entitled users get the full summary **and** a PDF export (`src/services/report/`). The PDF is rendered on device with `expo-print` and handed to the OS share sheet with `expo-sharing`; it is never uploaded anywhere.
- **Advanced progress insights** (`buildProgressInsights`) — 7-day vs previous-7-day rolling averages, check-in streak and consistency, exercise-day vs rest-day pain comparison, most-reported symptom, best/hardest day, and a plateau flag. Shown on `ReportsScreen` and included in the PDF.
- **Smarter rehab progression** (`buildProgression`) — the recovery phase and progress bar are derived from the user's own check-ins instead of the old hardcoded `recoveryPhase` constant. The phase and bar stay **free**; the premium card explains why the plan is holding/advancing, which criteria are still open, and what to add next. Rising pain or swelling returns `ease_back` and routes to the safety screen.
- **Return-to-sport readiness** (`ReadinessScreen`, `buildReadiness`) — checks the four signs from the app's own "When can I return to sport?" article against the user's logs. Never phrased as clearance; always routes back to a clinician.
- **Extended exercise library** (`premiumExercises` in `src/data/mockRecoveryPlan.ts`) — the free daily plan is unchanged; premium adds later-stage progressions shown on the Plan tab.

All of the analysis lives in one pure module, `src/utils/recoveryInsights.ts` (no React, no storage,
no network), so Reports, the Plan tab, Readiness and the PDF can never disagree about the same
numbers. Two things to watch when editing it: `painEntries`/`trackerCheckIns` are stored **newest
first**, and direction differs per signal (`HIGHER_IS_BETTER`) — getting either wrong still
typechecks but silently inverts a trend.

Note on data: `completedExerciseIds` has no timestamps, so a parallel `exerciseCompletions`
(`{ exerciseId, completedAt }`) log was added to `AppDataContext` to support day-level comparisons.
It is additive — data saved before it existed hydrates as an empty list, exactly like `isPremium`.

**Native build required:** `expo-print` and `expo-sharing` contain native code, so the PDF export
cannot be tested in Expo Go and needs a new development/production build.

Entitlement is the store's source of truth via RevenueCat. `PremiumSync` re-checks it on launch and on every auth change, and listens for live changes (purchase, trial conversion, lapse). A cached `isPremium` flag in local storage gives instant UI and is corrected on next online sync.

### RevenueCat and Google Play Billing setup

0. In Google Play Console, set up your **Payments profile / merchant account** (bank account, tax, and identity) under Setup → Payments profile. Subscriptions cannot be sold until this exists.
1. In Google Play Console, create the AnklePath app with package name `com.timfx1.anklepath`.
2. Create a subscription product, for example `anklepath_premium_monthly`.
3. Add an auto-renewing monthly base plan priced at EUR 9.99/month, and set the countries/regions it is available in.
4. Add a free-trial offer for 14 days if you want the trial shown in the native Google purchase sheet.
5. Activate the subscription/base plan/offer in Play Console.
6. In RevenueCat, create a project and add an Android app with package `com.timfx1.anklepath`.
7. Connect RevenueCat to Google Play using a Google Play service account key.
8. Import the Google Play subscription product into RevenueCat.
9. Create an entitlement with identifier `premium`.
10. Attach the monthly subscription product to the `premium` entitlement.
11. Create an offering with identifier `default`.
12. Add the monthly subscription to that offering as the monthly package.
13. Copy the RevenueCat Android public SDK key into `.env` as `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`.

For iOS, repeat the same pattern in App Store Connect and RevenueCat:

0. In App Store Connect, sign the **Paid Applications agreement** and complete banking + tax under Business → Agreements, Tax, and Banking. Auto-renewable subscriptions cannot be sold until this is active.
1. Create the iOS app with bundle ID `com.timfx1.anklepath`.
2. Create a monthly auto-renewable subscription priced to match (EUR 9.99) with a 14-day introductory free trial, and set its availability by country.
3. Add the iOS app in RevenueCat.
4. Import the App Store Connect product.
5. Attach it to the same `premium` entitlement and `default` offering.
6. Copy the RevenueCat iOS public SDK key into `.env` as `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`.

### Localized pricing

The paywall shows the store's own localized, currency-converted price (`priceString` via `getPremiumOffer` in `revenueCat.ts`) — e.g. `$9.99`, `€9,99`, `£8.99` — not a hardcoded EUR string. Set the price once per storefront/region in Play Console / App Store Connect (their price templates auto-convert to other currencies) and the app reflects it. The static `EUR 9.99` copy is only a fallback for when billing is off/offline.

### Store review compliance checklist (avoid subscription rejections)

Apple Guideline 3.1.2 and Google's subscription policy both require, **on the paywall itself**:

- Subscription name, length (monthly), and the price/period — shown, and now localized.
- A clear statement that it **auto-renews** until cancelled, that a **free trial converts to paid** unless cancelled ≥24h before it ends, and that it is **managed/cancelled in the store account** — added to the paywall fine print.
- Functional **Terms of Use (EULA)** and **Privacy Policy** links — added to the paywall and already in Profile. Keep `LEGAL.termsUrl` / `LEGAL.privacyUrl` live and hosting the auto-renew terms.
- A **Restore Purchases** button — present.
- The **same disclosures in the store listing metadata** (App Store Connect subscription "Review information" + the app description; Play Console subscription details).

Also required for the account/data side (already in the app): a **Delete account** flow (Profile) and the medical **non-device disclaimer**.

### Activating later

Native billing SDKs require a new EAS build/AAB the first time they are added. Since `react-native-purchases` is already installed now, future copy/feature-flag changes can be shipped with EAS Update:

```bash
npx eas-cli update --branch production --message "Activate paywall"
```

**This only works from build 33 onwards.** `expo-updates` was not installed before that, so every
earlier change — including one-line copy edits — needed a full build, and the command above would
have done nothing. `app.json` now carries the `updates` URL and a `runtimeVersion` policy of
`appVersion`, which means an update only reaches devices running the **same app version**: bump the
version and you need a new build before you can push updates to it again.

JS-only changes (screens, copy, logic, styling) ship over the air. Anything that adds or changes a
**native module** still requires a build.

To activate billing in a new app-store version:

```bash
EXPO_PUBLIC_PAYWALL_ENABLED=true
EXPO_PUBLIC_BILLING_ENABLED=true
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_revenuecat_android_key
```

Then build and upload a new Android App Bundle:

```bash
npx eas-cli build -p android --profile production
```

Billing cannot be fully tested in Expo Go. Test purchases in a development build or an internal/closed Play testing track using Google Play license testers.

## Notes

- Premium features (advanced insights, full history, photo compare) are fully wired but only lock once `PAYWALL_ENABLED` and `BILLING_ENABLED` are both `true`.
- The doctor report is NOT among them and never can be. It is free forever (N6),
  including its export. `checks/n6.mjs` fails the build if a premium or lock term
  reaches a report surface.
- The paywall keeps a "Continue with Free Plan" option, and the app remains fully usable in guest/offline mode.
- RevenueCat is installed but inactive unless billing is enabled.
- Appfigures is intentionally not installed.
- Backend logic is limited to Firebase Auth and Firestore writes.

## Learn Content & Article Search (Roadmap)

Today the Learn tab ships a small set of **curated, in-app articles** (`src/data/mockRecoveryPlan.ts`),
searchable by title/category and opened in a reader screen (`ArticleDetailScreen`). Expanding this into
"search and read articles available online" is desirable but should be approached carefully because this
is a **health app** (accuracy, liability, copyright, and App Store review all apply).

Phased plan, cheapest/safest first:

1. **Curated external links (easy, MVP-friendly — recommended next step).**
   Add a `url` field to each article and open trusted sources (NHS, Mayo Clinic, vetted physio sites)
   in the in-app browser via `expo-web-browser` (already a dependency). Keep the existing in-app
   search over the curated list. Safe, low-effort, no backend, no copyright issues (we link, not copy).
2. **Remote content via Firestore (medium effort).**
   Move the article list into a Firestore collection (e.g. `learnArticles`) so the library can grow and
   be corrected without shipping an app update. Still fully curated, so quality stays controlled.
3. **Live open-web search (NOT recommended for the MVP).**
   Querying a general search API (Google Custom Search / Bing / a health API) surfaces *uncurated*
   results. For a medical app this is risky: variable accuracy, potential bad advice, API keys that need
   a backend proxy, per-query cost, and copyright limits on reproducing full text. Defer until there is a
   moderation/curation layer.

**Guardrails regardless of approach:** only reputable sources, link out (don't reproduce full article
text), and keep the existing medical disclaimer visible.

Recommendation for now: stay with the curated in-app articles and, when ready, do **step 1** (add `url`
+ open in browser). Steps 2–3 are post-MVP.

## Sentry Crash Monitoring

AnklePath uses Sentry only for crash and error monitoring. Firebase remains the data layer, and PostHog remains the product analytics layer.

### Environment variables

Add the public DSN to your local `.env`:

```bash
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_BUILD_PROFILE=development
```

Do not hardcode private Sentry tokens in app code. `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are for EAS/source map uploads only.

For EAS, add the private values as secrets:

```bash
npx.cmd eas-cli secret:create --name SENTRY_AUTH_TOKEN --value your_sentry_auth_token
npx.cmd eas-cli secret:create --name SENTRY_ORG --value your_sentry_org
npx.cmd eas-cli secret:create --name SENTRY_PROJECT --value your_sentry_project
```

Also add `EXPO_PUBLIC_SENTRY_DSN` to your EAS environment so the app can send events from preview/TestFlight/production builds.

### Create Sentry project

1. Create a Sentry account or open your Sentry organization.
2. Create a React Native project for AnklePath.
3. Copy the DSN from Project Settings > Client Keys.
4. Paste it into `.env` as `EXPO_PUBLIC_SENTRY_DSN`.
5. Create an auth token with source map upload/release permissions.
6. Save that token in EAS as `SENTRY_AUTH_TOKEN`.

### What is configured

- `src/services/monitoring/sentry.ts` initializes Sentry early in app startup.
- `src/services/monitoring/errorReporting.ts` exposes:
  - `captureAppError(error, context)`
  - `captureUserMessage(message, level, context)`
- `src/utils/errorUtils.ts` normalizes errors and removes risky free-text fields from context.
- `App.tsx` wraps the app with Sentry error handling.
- `src/services/analytics/posthog.ts` adds Sentry breadcrumbs for tracked events.
- Firebase auth sets Sentry user context with `uid`, `email`, and `isAnonymous`.
- Firebase/PostHog failures are captured as non-fatal monitoring events where appropriate.
- `app.config.ts` adds the Sentry Expo plugin.
- `metro.config.js` wraps Metro with Sentry source-map support.

Avoid sending detailed health notes, free-text pain notes, or personal medical descriptions to Sentry.

### Test locally

Run the app:

```bash
npm.cmd run start:dev-client
```

Open Profile. In development or preview builds, a dev-only card appears:

```text
Test Sentry Error
```

Tap it, then check Sentry Issues for `AnklePath Sentry test error`.

### Android preview build

Use this for APK testing:

```bash
npx.cmd eas-cli build -p android --profile preview
```

Install the APK, open the app, tap the Profile test card, then confirm the error appears in Sentry.

### Android production AAB

Use this for Google Play closed testing or production:

```bash
npx.cmd eas-cli build -p android --profile production
```

The production profile sets `EXPO_PUBLIC_BUILD_PROFILE=production`, so the dev-only Sentry test card is hidden.

### iOS TestFlight build

Use this after Apple credentials are configured:

```bash
npx.cmd eas-cli build -p ios --profile production
```

Upload to App Store Connect/TestFlight, install the TestFlight build, and confirm real crashes or captured non-fatal errors appear in Sentry.

### Source maps

The Sentry Expo plugin and Metro wrapper are configured for source-map support during EAS builds. Source-map upload needs:

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Confirm source maps are working by opening a Sentry issue from a preview or production build. The stack trace should point to readable TypeScript files such as `src/screens/...` instead of only minified bundle frames.

### Copying errors into Codex

When asking Codex to fix a Sentry issue, copy:

- Error title and message
- Stack trace
- Release/version
- Environment
- Device/platform
- Breadcrumbs
- Any safe tags/context

Do not paste private tokens, user emails, or sensitive health notes.
