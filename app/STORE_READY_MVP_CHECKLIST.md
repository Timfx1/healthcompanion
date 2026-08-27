# Store-Ready MVP Checklist

Use this for the free Healthcompanion release. Billing stays dormant for this
milestone: keep `EXPO_PUBLIC_PAYWALL_ENABLED=false` and
`EXPO_PUBLIC_BILLING_ENABLED=false`.

## Code Gates

- [ ] `node ../verify.mjs --fast`
- [ ] `npm run typecheck`
- [ ] `node tests/run.mjs`
- [ ] Browser visual suites for any UI/token/screen change.
- [ ] Native smoke test on Android development build.

## Store And Legal

- [ ] Publish the legal pages from `app/legal/` to GitHub Pages `main`.
- [ ] Confirm these URLs open publicly:
  - `https://timfx1.github.io/healthcompanion/privacy-policy.html`
  - `https://timfx1.github.io/healthcompanion/terms.html`
  - `https://timfx1.github.io/healthcompanion/delete-account.html`
- [ ] Update Google Play Data Safety: analytics optional/off by default, in-app deletion available.
- [ ] Complete Google Play Health Apps declaration.
- [ ] Set the Play Console account deletion URL.
- [ ] Update App Store privacy details if iOS is submitted.
- [ ] Accept/retain DPAs for PostHog, Sentry, RevenueCat, and Firebase/Google.

## Backend And Environment

- [ ] Create/configure Firebase web app, Authentication, Anonymous sign-in, Email/Password, Google, and Apple where needed.
- [ ] Create Cloud Firestore, not Realtime Database.
- [ ] Deploy `firestore.rules`.
- [ ] Fill local/EAS Firebase env values.
- [ ] Fill local/EAS PostHog env values.
- [ ] Fill local/EAS Sentry DSN and source-map upload secrets.
- [ ] Confirm Firestore writes for `users/{uid}`, onboarding answers, pain logs, waitlist, and feature requests.

## Device Smoke Tests

- [ ] Fresh install onboarding.
- [ ] Returning user opens directly to saved recovery data.
- [ ] Guest mode works offline.
- [ ] Consent accept and decline paths.
- [ ] Check-in and journal entries persist after restart.
- [ ] Photo picker saves a recovery photo.
- [ ] PDF report exports and opens the OS share sheet.
- [ ] Email, Google, and Apple auth where configured.
- [ ] Account deletion removes account-owned Firestore data.
- [ ] Legal links open in browser.

## Known MVP Exceptions

- Clinical corridor, safety, and education content still needs review before being treated as clinically approved.
- `SignUp` has RN coverage but no prototype route/baseline.
- Legacy Plan, Track, and Learn screens remain unreferenced after deleting the obsolete tab navigator.
