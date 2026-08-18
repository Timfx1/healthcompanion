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
| **Design system** (`design-system/`) | Real. One token source, two platforms, seven gates. |
| **Web prototype** (`Onboarding Flow/`) | Real, and the reference implementation — 12 onboarding screens + 5 tabs, both colour modes. A Figma Make export, since evolved. |
| **React Native app** (`app/`) | **Started.** The AnklePath `ActivatePayment` tree, copied in with fresh history. Its palette comes from the token source; 169 of 172 colour references are re-domained, 3 deliberately stopped. |
| **16 of 17 detail/modal screens** (§5) | Designed nowhere — not in Figma, not in code. Includes the Doctor Report, the flagship. |

`tokens.native.ts` is now consumed by `app/`, vendored as
`app/src/theme/tokens.generated.ts`.

**The app's typecheck is red on purpose, and now down to three.** The generated palette maps only structural neutrals and omits every AnklePath key that carried *meaning*, so each site failed to compile until a person decided what it meant. 290 of 439 references swapped mechanically and 169 of the remaining 172 have been re-domained with a documented reason each — see `DESIGN_CRITERIA.md` §11 for the table.

**Three were stopped rather than mapped.** `palette.red` and `dangerSoft` on the **Sign out** row mark a destructive action, and this system has no destructive role. Its only red is `safety.*`, which N3 reserves for red-flag guidance. Choosing between a neutral treatment, confirm-on-press, or a deliberate second red is a design decision, so the code is left failing with the options written at the site.

`checks/redomain.mjs` holds the count at 3 and may only shrink.

---

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
| Quick Capture (P1) | **Local, mocked** | In-memory only. Phase 1 target is AsyncStorage; the capture path must never block on the network and must never fail. |
| Corridor data (P5) | **Placeholder mock, cited** | "Common range for knee rehab, weeks 4–6" is illustrative. Real content needs source attribution per §10 before it ships. |
| Weekly reflections (P7) | **Mock generator** | Fixed copy. The real one derives from entries. |
| Share cards (P8) | **Local render** | In-app preview only. No OS share sheet — that is `expo-sharing` in Phase 1. |
| Doctor report (P6) | **Not built** | Linked from Home and Profile; the destination does not exist. Free forever, no lock, ever. |
| Photo timeline / compare | **Not built** | Compare is premium; the timeline is not. |
| Medications, appointments | **Static mock data** | No reminders or notifications. |
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
  app that cries wolf in decoration cannot be trusted when it means it.
- **Never meaning by colour alone.** Every `category.*` family must define
  `mark` + `ink` + `icon` + `label` or the build fails.
- **Ranges, never targets.** No `corridor.target` token exists.
- **The doctor report and the core loop are never gated.** Free forever.
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
- **`insight.*` is defined and unused**, and would reintroduce a fixed bug if
  adopted as written — its trend roles still point at category `mark`.
- **Off-scale font sizes and raw hex values remain** in consumer code, under a
  ratchet that can only tighten.
