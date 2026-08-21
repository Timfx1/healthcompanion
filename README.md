# Recovery Companion

A calm, guilt-free companion for anyone recovering from an injury, surgery,
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
| **React Native app** (`app/`) | **Colour re-domain complete.** The AnklePath `ActivatePayment` tree, copied in with fresh history. All 172 colour references resolve to Recovery Companion roles and the app typechecks clean. Screens are still AnklePath's. |
| **§5 detail/modal screens** | **3 of 17 exist, 2 partial, 3 have precedent, 9 greenfield** — counted below. Includes the Doctor Report, the flagship. |

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
still has AnklePath's five (`Home · Plan · Track · Learn · Profile`).

**Detail/modal (17).**

| Class | Count | Screens |
|---|---|---|
| **Exists** | 17 | **`ReportPreview`** (7 states), **`QuickCaptureSheet`** (3 states), **`AddTimelineEntry`**, **`Safety`**, **`EducationArticle`** (3 access states × saved), **`JournalEntry`** (3), **`MilestoneDetail`**, **`MedicationDetail`** (2), **`AppointmentDetail`** (2), **`QuestionsForDoctor`** (2), **`PhotoCapture`** (2), **`PhotoCompare`** (3), **`ReportDateRange`** (3), **`WeeklyReflection`** (3, persisted), `ShareCardPreview` (built as `ShareCardScreen`), `PremiumTeaser`, `TrialPaywall` |
| **Partial** | 0 | — none. |
| **Precedent to re-domain** | 0 | — both done. |
| **Greenfield** | 0 | — every §5 detail/modal screen now exists. |

Two things this count surfaced.

**`ShareCardScreen` is the 20th surface and has no baseline.** The visual suite
covers 57 screens × 2 modes; ShareCard is not among them, and `?screen=app:`
accepts only `home|timeline|progress|profile|checkin|paywall`. It is
unphotographable — the exact condition that hid the dead `Toast` branch for the
whole life of that component. `welcomeBack.*` has the same problem for a
different reason: it is a *state* of Home rather than a §5 screen, so nothing
routes to it either.

**`ReportsScreen` was not a colour re-domain.** It gated the report behind
`usePremium()`, which N6 forbids outright. See `DESIGN_CRITERIA.md` §11.

## Quick start

```bash
node verify.mjs                 # every gate; --fast skips the visual suite

cd "Onboarding Flow"
pnpm install
pnpm exec playwright install chromium   # once
pnpm dev                        # http://127.0.0.1:8443
```

The prototype has a dev route so any screen can be addressed directly:
`/?screen=app:home&mode=light&motion=off`. See `src/App.tsx`.

---

## Mocked vs real

Everything is local. There are no network calls, no accounts, and no writes to
any backend anywhere in this repository.

| Feature | State | Notes |
|---|---|---|
| Quick Capture (P1) | **Built, in-memory** | The Home field, the FAB sheet and silent keyword tagging all work; nothing persists yet. Phase 1 target is AsyncStorage. The path must never block on the network and must never fail — which is why the sheet has no saving state and no error state. |
| Corridor data (P5) | **Placeholder mock, cited** | "Common range for knee rehab, weeks 4–6" is illustrative. Real content needs source attribution per §10 before it ships. |
| Safety + education content | **Placeholder mock, cited** | Every red flag and article names a source, and `NEEDS_CLINICAL_REVIEW` is rendered on the Safety screen so it states that it is pending review rather than implying sign-off. No item names a condition (§10). |
| Weekly reflections (P7) | **Mock copy, REAL persistence** | The app-generated lines are still fixed. What the user writes back is stored via `components/storage.ts` and verified by reloading the page — `tests/persistence.spec.ts`, not a baseline. |
| Share cards (P8) | **Local render** | In-app preview only. No OS share sheet — that is `expo-sharing` in Phase 1. |
| Doctor report (P6) | **Built** | The RN app has AnklePath’s `ReportsScreen` plus a print/PDF template. The template now draws from `tokens/print.json` — its own single-valued print layer, 7:1 body contrast, verified by rendering and by a photocopy approximation. The gate is gone (it was premium). `ReportPreview` is built — seven states, all routable and baselined. Free forever, no lock, ever — enforced by `restricted.mjs`. |
| Photo timeline / compare | **Built, placeholder frames** | Capture is free and registered as a core-loop surface; only compare is gated (P9). No real image handling yet — the prototype does not ship invented photographs of injuries. |
| Medications, appointments | **Built, static mock data** | Detail screens exist for both. No reminders or notifications yet. Adherence is shown as accumulation and rest — a count of doses logged, never a percentage, because a percentage is a count of what did not happen (P2/N1/N2). |
| Widgets, native voice | **Phase 2** | Deep link `recoverycompanion://capture` is reserved. Phase 1 uses OS keyboard dictation. |
| Auth, sync, billing | **Phase 2** | No Firebase, no RevenueCat, no writes. Guest mode is the only mode. |
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
  of which failed; the next one will be just as invisible.
- **Interactive states are unbaselined.** The check-in sheet is captured with
  nothing selected and its detail panel collapsed, so two real contrast fixes
  are not exercised by any baseline. Not theoretical: this gap hid a dead code
  path in `Toast` for the whole life of the component, because nothing could
  photograph a state that exists for 2.4 seconds behind an interaction. That one
  is closed (`?screen=app:toast`); the check-in's states need the same.
- **`insight.*` and `welcomeBack.*` are defined and unused**, and would reintroduce a fixed bug if
  adopted as written — its trend roles still point at category `mark`.
- **Off-scale font sizes and raw hex values remain** in consumer code, under a
  ratchet that can only tighten.
