# Healthcompanion Publishing Next Steps

This repo is locally committed and ready to push, but the remote repository
`timfx1/healthcompanion` must exist on GitHub first.

## 1. Create The GitHub Repository

Create a new GitHub repository with:

- Owner: `timfx1`
- Repository name: `healthcompanion`
- Visibility: public, so GitHub Pages can serve the legal pages publicly
- Do not initialize with README, license, or `.gitignore`

Then push from this workspace:

```powershell
git push -u origin main
```

## 2. Enable GitHub Pages

After the first push:

1. Open `https://github.com/timfx1/healthcompanion/settings/pages`
2. Set Source to `GitHub Actions`
3. Open the Actions tab.
4. Run or wait for the `legal-pages` workflow.

Expected public legal URLs:

- `https://timfx1.github.io/healthcompanion/`
- `https://timfx1.github.io/healthcompanion/privacy-policy.html`
- `https://timfx1.github.io/healthcompanion/terms.html`
- `https://timfx1.github.io/healthcompanion/impressum.html`
- `https://timfx1.github.io/healthcompanion/delete-account.html`

These URLs already match `app/src/config/legal.ts`.

## 3. iOS Testing Limitation

iOS Simulator cannot run on this Windows machine. Apple only ships the iOS
Simulator with Xcode on macOS.

To test iOS, use one of these:

- A Mac with Xcode and iOS Simulator.
- EAS iOS build plus TestFlight or a physical iPhone.
- A hosted macOS CI runner that runs iOS simulator tests.

Minimum iOS smoke checks:

- Fresh install onboarding.
- Guest mode.
- Email, Apple sign-in, and logout where configured.
- Home data from onboarding, no demo journey.
- Quick capture text entry and save.
- Check-in fast path.
- Journal/notes with keyboard open.
- PDF report export/share.
- Legal links open.
- Dark mode and safe areas.
- Offline startup.
- Account deletion if Firebase is configured.

## 4. Store Console Tasks

Before submission, complete these outside the repo:

- Play Console Data Safety declaration.
- Play Console Health Apps declaration.
- Play Console account deletion URL:
  `https://timfx1.github.io/healthcompanion/delete-account.html`
- App Store Connect App Privacy, if iOS launch is in scope.
- Firebase project setup, Auth providers, Firestore setup.
- Deploy `app/firestore.rules`.
- Fill EAS/local env values for Firebase, PostHog, and Sentry.
- Accept/retain DPAs for PostHog, Sentry, RevenueCat, and Google/Firebase.
- Add USt-IdNr to `app/legal/impressum.html` only if VAT-registered.

## 5. Final Local Verification Commands

Run before store submission:

```powershell
node verify.mjs --fast
cd app
npm run typecheck
node tests/run.mjs
corepack pnpm@10.34.3 exec playwright test --config harness/playwright.config.ts slice
node device/check.mjs
```

