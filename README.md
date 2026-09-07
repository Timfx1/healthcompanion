# Recovery Health Companion

A calm, guilt-free recovery companion for anyone recovering from an injury, surgery,
illness or chronic flare. It remembers your recovery so you don't have to, and
it hands you something useful to show your doctor.

Non-medical-device health app. No diagnose, treat, cure or guarantee claims.

---

## What is actually in this repository

Being precise about this, because the gap matters:

| | Status |
|---|---|
| **Design system** (`design-system/`) | Real. One token source, two platforms **plus paper**, ten gates. |
| **Web prototype** (`Onboarding Flow/`) | Real, and the reference implementation — 12 onboarding screens + 5 tabs, both colour modes. A Figma Make export, since evolved. |
| **React Native app** (`app/`) | **Feature-complete for Phase 1 §5, and now tested.** The public app name is **Recovery Health Companion**. Five Recovery Companion tabs and all seventeen detail screens run over `types/recovery.ts`, a cited corridor and an AsyncStorage store. Fresh users now start from their onboarding answers rather than the 45-day demo journey; that demo remains explicit harness-only fixture data. 93 pure-rule tests, 66 render and behaviour tests over 50 baselines, and 27 vertical-slice tests run the REAL provider over storage into a real screen. The obsolete AnklePath tab navigator has been removed; older Plan / Track / Learn screens remain only as unreferenced legacy code. |
| **§5 detail/modal screens** | **All 17 exist** in the prototype, each with a dev route and a baseline. Includes the Doctor Report, the flagship, which is free forever and enforced as such by `restricted.mjs`. |

`tokens.native.ts` is now consumed by `app/`, vendored as
`app/src/theme/tokens.generated.ts`.

**How the port was driven.** The generated palette maps only the structural
neutrals and deliberately omits every AnklePath key that carried *meaning* —
`blue`, `teal`, `red`, `green`, `amber`, `purple` and the `*Soft` tints. 290 of
439 references swapped mechanically; the other 172 failed to compile until a
person decided what each meant. That count is now **0**, with a documented
reason per mapping in `DESIGN_CRITERIA.md` §11.

The two that were genuine design questions were treated as such rather than
mapped away. **Sign out** is neutral — there is no destructive role here, and the
one red this system owns is reserved for red-flag guidance. The **splash and
plan-loading gradients** still run AnklePath blue and are waiting on a deliberate
brand treatment; replacing them is a new decision, not a mapping.

`checks/redomain.mjs` holds palette sites at 0 and budgets the **32 hardcoded hex
literals** the compiler cannot see — a raw `#2F7DE1` in a gradient is just a
string to it. It was 89 until the doctor-report template moved to its own print
palette; what remains is the deferred brand gradients. That budget is now
actually enforced — it had been silently floored against its own count.

---

---

## Screen inventory against spec §5

Counted from the code, not from memory — an earlier version of this file claimed
"16 of 17 designed nowhere", which was wrong in both directions.

**Onboarding (13 in spec).** 12 exist and are baselined in the prototype;
`SignUp` exists only in the RN app and has no prototype route or baseline. The RN
stack has 13 screens but they are AnklePath's decomposition — `InjuryType` /
`InjuryTiming` / `PainWalking` plus a `Consent` step, and **no `ConditionDetail`**.

**Main tabs (5).** All five exist and are baselined in the prototype. The RN app
now uses the Recovery Companion shell: `Home · Timeline · Check-in action ·
Progress · Profile`.

**Detail/modal (17).**

| Class | Count | Screens |
|---|---|---|
| **Exists** | 17 | **`ReportPreview`** (7 states), **`QuickCaptureSheet`** (3 states), **`AddTimelineEntry`**, **`Safety`**, **`EducationArticle`** (3 access states × saved), **`JournalEntry`** (3), **`MilestoneDetail`**, **`MedicationDetail`** (2), **`AppointmentDetail`** (2), **`QuestionsForDoctor`** (2), **`PhotoCapture`** (2), **`PhotoCompare`** (3), **`ReportDateRange`** (3), **`WeeklyReflection`** (3, persisted), `ShareCardPreview` (built as `ShareCardScreen`), `PremiumTeaser`, `TrialPaywall` |
| **Partial** | 0 | — none. |
| **Precedent to re-domain** | 0 | — both done. |
| **Greenfield** | 0 | — every §5 detail/modal screen now exists. |

Two things this count surfaced.

**Every surface now has an address.** The visual suite covers **59 screens × 2
modes**. The last two to get one were `ShareCardScreen` — reachable only by
tapping Share on a milestone — and the welcome-back state of Home, which is not
a §5 screen at all but a *state* nothing could route to.

Neither gap was cosmetic. `share.*` carried the Day-N card's 1.58:1 bug for the
whole life of the family because ShareCardScreen hardcoded `#fff` and never
rendered the tokens it was declared for. `welcomeBack.*` was the last dormant
family and shipped a wrong value for the same reason: nothing drew it. Five
families have been dormant in this repository and all five were carrying a
defect. That is why the dormancy ratchet is now **closed at zero**.

**`ReportsScreen` was not a colour re-domain.** It gated the report behind
`usePremium()`, which N6 forbids outright. See `DESIGN_CRITERIA.md` §11.

## Quick start

```bash
node verify.mjs                 # all fourteen gates; --fast skips the browser suites
cd app && node harness/mutants.mjs   # plant 13 defects, watch each test fail

cd "Onboarding Flow"
pnpm install
pnpm exec playwright install chromium   # once
pnpm dev                        # http://127.0.0.1:8443
```

The prototype has a dev route so any screen can be addressed directly:
`/?screen=app:home&mode=light&motion=off`. See `src/App.tsx`.

---

## Mocked vs real

The prototype is local-only. The Expo app is store-oriented: it remains fully
usable in guest/offline mode, but it now includes optional Firebase Auth /
Firestore, consent-gated PostHog analytics, Sentry monitoring and dormant
RevenueCat billing. Those services no-op when their environment variables or
feature flags are absent.

| Feature | State | Notes |
|---|---|---|
| Quick Capture (P1) | **Built, AsyncStorage** | The Home field, the FAB sheet and silent keyword tagging all work. Recovery Companion entries persist locally through `RecoveryDataContext`; writes are optimistic and never block on the network. |
| Corridor data (P5) | **Placeholder mock, cited** | "Common range for knee rehab, weeks 4–6" is illustrative. Real content needs source attribution per §10 before it ships. |
| Safety + education content | **Placeholder mock, cited** | Every red flag and article names a source, and `NEEDS_CLINICAL_REVIEW` is rendered on the Safety screen so it states that it is pending review rather than implying sign-off. No item names a condition (§10). |
| Weekly reflections (P7) | **Mock copy, REAL persistence** | The app-generated lines are still fixed. What the user writes back is stored in the Recovery Companion store and verified through the vertical-slice harness. |
| Share cards (P8) | **Local render** | In-app preview exists. OS-level report PDF sharing exists in the RN report flow; milestone card sharing is still preview-only. |
| Doctor report (P6) | **Built** | The RN app has the free Recovery Companion report plus a print/PDF template. The template draws from `tokens/print.json` — its own single-valued print layer, 7:1 body contrast, verified by rendering and by a photocopy approximation. `ReportPreview` is built — seven states, all routable and baselined. Free forever, no lock, ever — enforced by `restricted.mjs`. |
| Photo timeline / compare | **Built, native picker path** | Capture is free and registered as a core-loop surface; only compare is gated (P9). The app uses `expo-image-picker`; the browser harness does not cover that native path. |
| Medications, appointments | **Built, static mock data** | Detail screens exist for both. No reminders or notifications yet. Adherence is shown as accumulation and rest — a count of doses logged, never a percentage, because a percentage is a count of what did not happen (P2/N1/N2). |
| Widgets, native voice | **Phase 2** | Deep link `recoverycompanion://capture` is reserved. Phase 1 uses OS keyboard dictation. |
| Auth, sync, billing | **Present, guarded** | Firebase Auth/Firestore are implemented and safely no-op when unconfigured. RevenueCat is installed but dormant unless `EXPO_PUBLIC_PAYWALL_ENABLED` and `EXPO_PUBLIC_BILLING_ENABLED` are both true. |
| Insights / correlations | **Rule-based mock** | Advanced correlations are premium; AI is Phase 3. |

**Research alignment:** every product principle traces to a finding in
[`RESEARCH_FINDINGS.md`](RESEARCH_FINDINGS.md) — no breakable streaks, gaps as
rest, the ≤10s check-in, the sentence above the chart, the free doctor report.
The binding versions are P1–P10 in the master spec.

---

## The rules that are not negotiable

Enforced by the shape of the token set, not by review. From
[`DESIGN_CRITERIA.md`](DESIGN_CRITERIA.md) §1:

- **Nothing can visually break.** No streaks, no chains. There is no `streak`
  token, so a breakable chain cannot be built.
- **Gaps are rest, never failure.** Never red, never "missed".
- **The warm alert colour is reserved** for genuine red-flag content. A health
  app that cries wolf in decoration cannot be trusted when it means it. Applied
  within the Safety screen too: only the emergency and same-day tiers carry it.
- **Never meaning by colour alone.** Every `category.*` family must define
  `mark` + `ink` + `icon` + `label` or the build fails.
- **Ranges, never targets.** No `corridor.target` token exists.
- **The doctor report and the core loop are never gated.** Free forever — and
  N6 is now a check, after an audit found ten places that gated or sold it.
- **Both colour modes, every screen.** A role missing its light value is a build
  failure.

---

## Layout

```
DESIGN_CRITERIA.md      rules and intent + a generated token appendix
verify.mjs              every gate, one command
design-system/
  tokens/               THE SOURCE — edit here, nowhere else
  build/                resolver, validators, emitters, doc generator
  checks/               contrast, restricted-use, literal ratchet
  dist/                 generated, committed, never hand-edited
  RECONCILIATION.md     every Figma-vs-code disagreement and its resolution
Onboarding Flow/        the web prototype + visual-parity harness
CLAUDE_CODE_RECOVERY_COMPANION_v2.md   the master spec
```

Start with [`design-system/README.md`](design-system/README.md).

---

## Known open items

Kept here rather than only in commit messages, because a reader deserves to know
what is not finished. Full detail in `DESIGN_CRITERIA.md` §11.

- **The visual harness has an open intermittent failure**, originally ~1 in 8–20,
  **not reproduced in 111 consecutive runs** across three configurations —
  including 30 at the exact commit where it was last seen, with instrumentation
  removed. Screenshot comparison, a real UI regression, cold start, font
  loading and animation are all eliminated; timing under host load is what
  remains. CI runs it **advisory, not blocking** and uploads a trace on failure,
  because a shared runner is the contended environment a local loop cannot
  imitate. Full log in `DESIGN_CRITERIA.md` §11 and `playwright.config.ts`.
- **The contrast manifest is hand-maintained.** Nothing verifies it covers what
  the screens actually render. A sweep found six undeclared combinations, five
  of which failed; the next one will be just as invisible. It is at least no
  longer hand-COMPUTED: `composited` used to be a prose field the checker never
  read, with the tinted backdrops pasted in as literals somebody had worked out
  by hand. It now resolves and composites, and stacks layers where a translucent
  border sits on a translucent fill.
- **Interactive states are unbaselined.** The check-in sheet is captured with
  nothing selected and its detail panel collapsed, so two real contrast fixes
  are not exercised by any baseline. Not theoretical: this gap hid a dead code
  path in `Toast` for the whole life of the component, because nothing could
  photograph a state that exists for 2.4 seconds behind an interaction. That one
  is closed (`?screen=app:toast`); the check-in's states need the same.
- **The provider-to-screen seam is closed.** `harness/slice.spec.ts` mounts the
  REAL `RecoveryDataProvider` over a fake-but-real AsyncStorage, renders a real
  screen, interacts, and asks storage what landed — then remounts from that
  storage and asks whether it came back. 27 tests, blocking, 13 mutants planted
  and 13 caught. It found four defects in the seam, including a `hydrated` flag
  with **no consumers anywhere** (so Home painted "0 check-ins" over a 45-day
  recovery), a storage write inside a `setState` updater, and a `parseStored`
  that guarded the parse but not the shape — a stored `null` crashed the app to
  an empty page. Full detail in `DESIGN_CRITERIA.md` §11.
  What it still does NOT cover: `addPhoto`, because `PhotoCapture` goes through
  `expo-image-picker` and cannot mount in a browser.
- **The render harness is web, not iOS.** `react-native` aliases to
  `react-native-web`, so a baseline is evidence about structure, hierarchy and
  colour — what the token system makes claims about — and not about how a
  shadow, a font metric or a safe-area inset lands on a device.
  `expo-linear-gradient` is a declared fidelity substitution.
- **Legacy Plan, Track and Learn screens are still in the tree**, now
  unreferenced by the stack. The obsolete `MainTabs` navigator has been deleted;
  the remaining legacy screens should be removed in a separate deletion-only
  cleanup after the store-ready app has been smoke-tested.
- **The onboarding `SignUp` screen still has no prototype route or baseline.**
  It exists only in the RN app.
- **Store readiness still has external steps.** Play/App Store declarations,
  legal-page publication, DPAs, Firebase provider setup, Firestore rules
  deployment and native-device smoke tests must be completed outside the repo.
- **Off-scale font sizes and raw hex values remain** in consumer code, under a
  ratchet that can only tighten.
