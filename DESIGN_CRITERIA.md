# Recovery Companion — Design Criteria

> Mandated by `CLAUDE_CODE_RECOVERY_COMPANION_v2.md` §8. This is the standard every screen is checked against, on web now and on React Native later.

## How to use this document

This document holds **rules and intent**. It deliberately holds almost no hex values, pixel sizes or millisecond counts — those live in `design-system/tokens/` and are published as generated tables in the appendix. A rule that names a raw value in prose is a rule that goes stale the first time the value changes.

Three things follow from that:

1. **If you are about to type a colour, radius, duration or size into a component, stop.** Either a token exists (use it) or one should (add it). The coverage ratchet in `design-system/checks/coverage.mjs` enforces this and its allowlist may only shrink.
2. **If a rule here and a Figma frame disagree, the rule wins for accessibility and principle; Figma wins for appearance.** The reconciliation policy is in `design-system/RECONCILIATION.md`.
3. **If something in here cannot be satisfied, say so in `RECONCILIATION.md` with the reason.** Known, recorded deviations are fine. Silent ones are not — that is how a design system stops describing the product.

Provenance note: Figma is canonical for **dark mode only**, because the design file contains no light-mode frames. The prototype code is canonical for **light mode**. See §11.

---

## 1. The non-negotiables

These come from the product principles (P1–P10) in the master spec. They are requirements, not aspirations, and most of them are enforceable in the token layer rather than by review.

| # | Rule | Why | How it's enforced |
|---|---|---|---|
| N1 | **Nothing that can visually "break."** No streaks, no chains, no broken links. Consistency is shown as accumulation — a count, or softly filled dots. | Guilt is a top-two abandonment driver; broken streaks manufacture it. | No `streak`/`chain`/`broken` token exists. Lint fails if one is added. |
| N2 | **Gaps are rest, never failure.** Empty days render in muted neutral. Never red, never alert-coloured, never labelled "missed." | Missed days must read as rest, not as a scolding. | `rest.*` tokens resolve only to neutral surface/text roles; they cannot reference `safety.*`. |
| N3 | **Warm alert colour is reserved.** The safety hue appears only on genuine red-flag content ("when to contact a doctor"). Never decorative, never for emphasis, never for a "bad" data point. | A health app that cries wolf in decoration cannot be trusted when it means it. | `restricted.mjs` fails if the safety value resolves outside the `safety.*` family. |
| N4 | **Never meaning by colour alone.** Every colour-carried meaning is paired with an icon or a text label. | WCAG 1.4.1; also required for the 8% of users who cannot use the distinction at all. | Every `category.*` family must define `mark` + `ink` + `icon` + `label`. A missing sibling is a build error. |
| N5 | **Ranges, never targets.** The recovery corridor is always a band with a range label. There is no target line, no goal marker, no pass/fail. | The corridor answers "am I on track?" without letting the user fail a benchmark nobody told them about. | No `corridor.target` token exists, so a target line is unbuildable. |
| N6 | **The doctor report is never gated.** No lock badge, no paywall, no premium treatment anywhere on the report or its export. | P6. It is the category's emotional peak and the primary word-of-mouth trigger. | Lock tokens are forbidden in report surfaces; checked in review, and the report has no locked variant to apply. |
| N7 | **The core loop is never gated.** Daily check-in, quick capture, timeline, journal, basic pain chart, medications and reminders, appointments, safety content. | P9. The Medisafe core-feature paywall is the cautionary tale. | Same as N6 — no locked variants exist for these surfaces. |
| N8 | **Both colour modes, every screen.** No screen ships in one mode only. | Half the palette going unverified is how the light-mode contrast failures in §11 happened. | Semantic tokens are mode-paired; a missing light value is a schema failure at build time. |

---

## 2. Colour

**Structure.** Three layers: primitives (raw palette, no meaning) → semantic (roles, mode-paired) → patterns (product concepts). Screens may reference **patterns and semantics only**. Reaching past them into a primitive is a lint failure, because a primitive has no mode pairing and no accessibility contract.

**Balance.** 60 / 30 / 10 — neutral surfaces, secondary tint, accent. One accent, for primary actions and active state. Surfaces are never pure black; the dark base is indigo-tinted and elevated surfaces get lighter and slightly warmer as they rise.

**Category hues** colour-code the five data types (pain, sleep, energy, mood, medication). They are muted, never neon, and they carry two distinct roles that must not be conflated:

- **`mark`** — fills, chart lines, chips, dots. Decorative or graphical.
- **`ink`** — text, icons and strokes that carry meaning, and must therefore meet contrast.

These are separate tokens because the same pastel that reads comfortably on a dark surface fails badly on white. Using a `mark` value as text is the single most likely accessibility regression in this system; that is why they have different names.

**Elevation** is carried by surface colour first and shadow second. Shadows are soft and low; they suggest lift, they do not draw outlines.

---

## 3. Accessibility

Binding, not aspirational.

- **Contrast:** 4.5:1 body text, 3:1 large text (≥18.66px bold or ≥24px regular) and meaningful non-text (WCAG 1.4.11). Verified per mode by `design-system/checks/contrast.mjs`.
  - Translucent foregrounds are **composited over their declared backdrop before measuring**. Measuring a 27%-alpha border as though it were opaque reports a contrast nobody sees.
  - A pair not listed in `checks/pairs.manifest.json` is not an approved combination.
  - **Weight does not buy the large-text exemption on its own.** 16px at weight 600 is body text. This is exactly how the primary button's failure went unnoticed (§11).
- **Targets:** minimum 44×44pt. Daily actions sit in the thumb zone; the check-in fast path is the largest, first-rendered element on its screen.
- **Never colour alone** (N4): icon or label always accompanies a colour-carried meaning.
- **Charts need a text equivalent.** Every chart carries a plain-language sentence stating what it shows — which is also a product requirement (§4), not only an accessibility one.
- **Large text must survive.** Layouts reflow rather than clip or truncate when the system text size increases.
- **Motion must be optional.** Honour `prefers-reduced-motion`: entrances become instant, looping animation stops. Nothing in the product may depend on animation to be understood.

---

## 4. Content and data presentation

- **The sentence outranks the chart.** Every chart is preceded by a plain-language headline that states the finding ("Pain trending down over the last 30 days"). The sentence is styled as the primary element and the chart supports it. Data with no interpretation is a top-cited reason people quit.
- **Trends are icon + word**, never a bare colour or a bare arrow.
- **Corridor language is "common"/"typical", never a deadline or a target**, and an "everyone heals differently" affordance is always within reach (N5).
- **Benchmarks are framed as common experiences, never as diagnosis** — a compliance requirement, not a stylistic one.
- **Numbers that matter are large and expressive**: the Day-N counter, the pain score. These are the emotional anchors of the product.

---

## 5. Typography

One humanist sans, at most three weights. The scale is defined in tokens; the rules are:

- One clear type hierarchy per screen; one primary action per screen.
- Body copy never below the small step of the scale — this audience includes people who are medicated, fatigued or in pain.
- Line length stays comfortable at the phone width; long copy blocks get generous line height.
- Numerals used as display elements (Day N, pain score) are a deliberate display step, not merely large body text.

---

## 6. Layout and spacing

- 8pt grid. Spacing comes from tokens, not from typed numbers.
- Cards with soft radii and low shadows; content grouped into calm blocks rather than dense forms.
- **Fewer elements per screen than a clinical tracker.** The competitor failure mode this product is positioned against is feature overload; whitespace is a feature.
- One primary action per screen, in the thumb zone.
- Elevation order is fixed and tokenised (`z.*`): tab bar → floating action → full-screen overlay → sheet → transient toast → developer/mode controls. Overlays must never be authored with an ad-hoc z-index.

---

## 7. Motion

**Intent: calm.** Motion confirms an action or orients the user between states. Nothing flashes, nothing loops for attention, nothing bounces for personality.

**Bands** (from the design brief):

| Band | Duration | Use |
|---|---|---|
| Micro | 100–150ms | press feedback, toggles, hover/active |
| Component | 200–300ms | cards, chips, expand/collapse, sheets |
| Screen | 300–350ms | screen and tab transitions |
| Chart draw | 400–600ms | **first view only**, never on re-render |

**Rules.**

- Entrances ease out and rise slightly; they never overshoot except where a celebration is explicitly warranted, and celebrations resolve in under a second.
- Staggered lists use a short, fixed delay step. Total choreography — last item's delay plus its duration — must stay under roughly 650ms or the screen feels slow to arrive.
- Loading uses **skeletons, not spinners**, wherever the shape of the incoming content is known.
- Optimistic UI on the capture path: the entry appears immediately; the write is never something the user waits on. **The capture path must never fail** and must never block on the network.
- Infinite loops are permitted only as ambient life (a slow breathing pulse), never as an attention-getter.
- Easing is stored as curve values, not as the keyword `ease-out` — the keyword resolves to different curves in different engines, and this system targets two.

**Known deviations, to resolve during token authoring** (measured in the current prototype, not invented):

- The onboarding **progress bar animates over 500ms**, which exceeds every band above. It reads as a screen-level transition but is a component. Recommend bringing it into the component band unless the slower fill is a deliberate calming choice — in which case it becomes a named exception with a reason.
- The **mode-toggle background transitions over 400ms**, above the screen band. Defensible as a theme change rather than a navigation, but it should be named as such rather than left as an outlier.
- `150ms` is by far the most common inline duration (13 uses) and sits at the boundary of the micro band. It should become the canonical micro token rather than a coincidence.

---

## 8. Pattern glossary

These are product concepts with fixed visual contracts. Each has a token family so it is defined **once** and cannot drift between screens. Several exist as reserved slots for screens that are not designed yet (§10) — that is deliberate, so building those screens does not reopen the token layer.

| Pattern | Intent | Contract | Forbidden |
|---|---|---|---|
| **`corridor.*`** | Answer "am I on track?" gently | Soft translucent band behind the chart; label reads "common range for …"; phase chips describe what typically happens; an "everyone heals differently" affordance is present | A target line. A goal marker. Pass/fail colouring. |
| **`rest.*`** | Render gaps as rest | Muted neutral surface and label, visually quieter than a logged day | Red, alert colour, "missed", exclamation, any count of what was skipped |
| **`accumulation.*`** | Show consistency without a breakable chain | A count, or filled dots that only ever accrue | Anything sequential that can visibly reset |
| **`lock.*`** | Mark premium depth | One badge, one desaturation level, identical everywhere; tapping opens the paywall sheet | Appearing on any core-loop or doctor-report surface (N6, N7) |
| **`historyFade.*`** | Gate history depth softly | Gradient fade at the free-history boundary plus an inline unlock pill | A hard wall. A modal interrupt. Hiding the fact that data exists. |
| **`insight.*`** | Make data mean something | Headline sentence styled as primary, trend as icon + word, chart secondary | A chart with no sentence above it |
| **`safety.*`** | Red-flag guidance | Calm but unmistakable; the only place warm alert colour appears | Any decorative or emphatic use (N3) |
| **`share.*`** | Milestone artifacts worth sending | Dignified, story-friendly ratio, light brandmark, beautiful in both modes, user-initiated only | Share prompts, nags, or any share surface the user did not ask for |
| **`fastPath.*`** | The ≤10-second check-in | Largest, first-rendered element on its screen; each option is icon + word; one tap is a complete, valid check-in | Requiring scroll, typing, or a second decision to log |
| **`category.*`** | Colour-code the five data types | `mark` for fills and lines, `ink` for text and meaningful strokes, always with `icon` and `label` | Using `mark` as text. Defining a partial family. |

---

## 9. Premium surfaces

- **Free forever:** daily check-in, quick capture, timeline, journal, basic pain chart, medications and reminders, appointments, safety content, and the entire doctor report including export.
- **Premium is depth only:** advanced insights and correlations, history beyond the free window, photo compare, multiple simultaneous recoveries, education deep-dives.
- The paywall is a **dismissible bottom sheet**, reachable from every gate. Dismissing always returns to a fully intact free experience.
- **No countdown timers, no fake urgency, no guilt copy, no dark patterns.** The skip path is always one obvious tap; the premium CTA may be more prominent, but the escape is never hidden or delayed.
- Value is shown before the gate: the report preview is fully visible, locked insight cards show a real card with a one-line value hook rather than a blank.

---

## 10. Compliance and safety

- Non-medical-device health app. **No diagnose, treat, cure or guarantee claims.**
- The medical disclaimer is permanently reachable.
- Red-flag content ("when to contact a doctor") is present for each supported recovery type and routes people to professional care.
- Benchmarks are always "common experiences" or "typical ranges" — never a personalised clinical judgement.
- Corridor content carries source attribution.
- **Privacy is positioning**: local-first, "stays on your device" cues wherever photos and health data are handled, no cross-app tracking, ever.

---

## 11. Known deviations

Recorded rather than hidden, per the rule at the top of this document. All figures are measured by `design-system/checks/contrast.mjs`, with alpha composited over the declared backdrop.

**Resolved in v1 (the two severe failures):**

| Issue | Measured | Why it's severe |
|---|---|---|
| White label on the primary CTA gradient | **4.19:1** at the dark stop, **2.84:1** at the light stop | The label is 16px/600 — body text, so 4.5:1 applies. This is the primary action on every screen, in both modes, and the lighter half of the gradient fails even the 3:1 floor. |
| Safety colour on light surfaces | **3.78:1** on card, **3.54:1** on base | This is the red-flag surface. It is the one thing in a health app that must be legible. |

**The 25 pairs originally accepted as debt are all closed.** `contrast.mjs` now measures **0 regressions and 0 debt across 90 pair-mode combinations.** The per-group resolutions are in `RECONCILIATION.md`; two of the six groups closed by reclassifying the usage class rather than by changing a value, and both carry a standing premise recorded at the pair in `pairs.manifest.json`.

**What the zero does not cover.** The audit measures declared pairs, not rendered ones. A combination that was never written into the manifest is not failing — it is unmeasured, and it is indistinguishable from a passing one in the summary line. So the number is a claim about the manifest's coverage as much as about the palette, and "add the pair when you add the colour" is the whole mechanism rather than a formality.

That is not hypothetical. A read-through of the screens found **six rendered combinations that had never been declared, five of which failed** — including white on a category fill at **1.58:1**, in both modes, on a button label in the free experience: worse than anything the original audit had tracked as debt. All six are now declared and fixed; the count is 110 pair-mode combinations, 0 regressions, 0 debt. The full table and the three structural lessons are in `RECONCILIATION.md`.

**The pain numeral — resolved.** The 80px score (and the 22px/700 one in the check-in sheet) took its colour from an 11-step ramp that was hardcoded and *duplicated verbatim* across both screen files, with no light-mode counterpart. Both numerals are large text, so the floor is 3:1, and on the light page:

| Score | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Was | 1.48 | 1.48 | 1.41 | 1.37 | 1.38 | 1.56 | 1.85 | 1.91 | 2.80 | 3.41 | 4.54 |
| Now | 3.23 | 3.23 | 3.20 | 3.20 | 3.24 | 3.23 | 3.22 | 3.22 | 3.21 | 3.41 | 4.54 |

Nine of eleven steps failed; dark mode carried the design at 3.77–12.46, which is why it read as fine. It was the mark/ink split unapplied — a set of fills reused as text — and it is now `color.painScale`, split per step, consumed through `painStep(mode, score)`.

Two things worth keeping from it. **The worst step was in the middle of the range** (score 3, 1.37:1), not at an end, which is why the eleven steps are declared as eleven pairs: a scale audited at one value tells you nothing about the rest. And **the light ink ramp goes olive through its yellow-green middle** — a colour light enough to read as "yellow" cannot also reach 3:1 against near-white. The hue journey survives; its brightness does not. The mark ramp keeps the vivid values wherever it fills rather than writes.

### The visual flake — narrowed, not closed

Three deliberate reproduction attempts, 95 runs, plus 16 earlier in the same session: **111 consecutive clean runs, no failure of any kind.**

| Configuration | Runs | Median | Result |
|---|---|---|---|
| HEAD, warm Vite cache, tracing on | 40 | 35.3s | clean |
| HEAD, Vite cache cleared before every run | 25 | 35.2s | clean |
| **Commit `99939ec` verbatim, tracing off** | 30 | 25.7s | clean |

The third matters most: `99939ec` is the exact commit that claimed to have cleared the flake and where the next eight runs still produced a failure. Same code, same config, no instrumentation. Thirty clean runs.

**Eliminated.** *Screenshot comparison* and *a genuine UI regression* — both are deterministic at a fixed commit, so a content difference cannot come and go, and failing runs reported no pixel-diff count. *Cold start / dependency optimisation* — 25 runs with the Vite cache deleted beforehand, and the median did not move (35.2s vs 35.3s). *Font loading over the network* — Inter has been bundled since `56612ec`, which **precedes** the flake's last sighting, so the network was already off the critical path. *Animation* — suppressed in CSS, asserted before capture, and pinned by `animations: "disabled"`.

**Remaining: timing, most plausibly host load** rather than anything in the harness. The original sightings were during active development, with builds and editors competing for cores — a condition a tight loop on an idle machine reproduces badly.

**The caveat that matters.** `trace: "retain-on-failure"` costs ~37% of runtime (25.7s → 35.3s on the same 36 tests). If the flake is a race, instrumenting for it may be suppressing it. "Clean at HEAD" is therefore weaker evidence than 111 runs suggests — which is exactly why the third experiment removed that variable.

**So it stays open, and CI stays advisory.** A shared runner is slower and more contended than this machine, which appears to be the condition that matters; the workflow uploads a trace on failure. That is where the answer will come from, not from a local loop.

### The React Native re-domain — one colour genuinely has no home

169 of the 172 AnklePath colour references now resolve to Recovery Companion roles. Each mapping has a reason, not a resemblance:

| AnklePath | Becomes | Why |
|---|---|---|
| `teal` (action), `blue` (informational) | `accent.default` / `accent.strong` | AnklePath ran **two** accents. §2 mandates one. The distinction they carried must be re-made by hierarchy — size, weight, placement — not by a second hue. |
| `purple` | `accent.*` | It marked premium everywhere. Recovery Companion has no premium *hue*: premium is the lock badge, the word, and the accent. |
| `infoSoft`, `successSoft` | `accent.surface` | Accent-tinted containers. |
| `amber` + `warningSoft` **in SafetyAlert** | `safety.mark` / `safety.surface` | The one place N3 permits the reserved hue — this *is* the red-flag surface. |
| `green` on completion | `accent.default` | Done/active is the accent's job (cf. `accumulation.dotFilled`). Category hues stay reserved for the five data types. |
| `green`/`amber`/`red` as a tone scale | `insight.trendUp/Down/Flat` | Tone already carries an icon and a word, so colour only supports it. Deliberately **not** a traffic light: "bad" must never reach for the safety hue. |
| `green`/`amber`/`red` by pain score | `painStep(mode, n)` | This *was* the pain scale, hardcoded — and its top step put the reserved hue on a data point. |
| `green` on celebration copy | `category.mood.*` | Direct precedent: the web prototype paints "FREE PLAN UNLOCKED" and "SAVE 40%" the same way. |

**Measuring the port found two failures a review would not have.** The trend badge puts the tone word on an accent-tinted pill, a backdrop no category ink had ever been measured against — `mood.ink` reached 4.39:1 there, so it was re-solved to #35784B (the third time that lesson has been paid for: an ink is only calibrated for the backdrops someone actually measured it on). And the neutral badge put `trendFlat` — deliberately quiet text — on a muted chip fill at 4.09:1; "no notable change" is plain, not quiet, so it takes primary text instead. Nine RN-rendered pairs are now declared, including the SafetyAlert icon on its own tint, which had never been measured against anything but a flat surface.

**The type-driven approach has a blind spot, and it is now measured.** The compiler can only see a palette KEY. A raw `#2F7DE1` in a gradient is invisible to it, which is how the splash and plan-loading screens still carry AnklePath's brand blue with a perfectly clean typecheck. 89 hardcoded hex literals remain in RN consumer code — 57 of them in the HTML report template — and `checks/redomain.mjs` now counts and budgets them alongside the palette sites, may only shrink. Some are genuine brand decisions rather than mappings, so the ratchet holds the line without pretending to make the call.

**The last three were a design decision, and it was taken: neutral.** `palette.red` and `dangerSoft` on the **Sign out** row marked a *destructive action*, and this system has no destructive role — the only red it owns is `safety.*`, reserved by N3 for red-flag guidance. Rather than spend the alert hue on a button and make it mean less where it matters, or invent a second red, the row is neutral: `text.secondary` on the muted fill, 4.81/4.09:1 for the glyph against a 3:1 floor.

That is also the honest reading of the action. Signing out is reversible in one tap; it is not dangerous, and colouring it as though it were is the kind of small dishonesty that makes real warnings cheap.

**The re-domain is complete: 172 → 0, and the RN app typechecks clean.** The mechanism — a generated palette that omits every key carrying meaning, so each site fails to compile until a person decides — has done its job. The budget stays at 0 so no new `palette.blue` can appear.

Two token changes fell out of the port, both closing older gaps: `accent.surface`/`accent.edge` name a value the system already used five times without a general name, and `insight.trendUp`/`trendDown` were repointed from `mark` to `ink` — they colour a *word*, and consuming them as written would have reintroduced the mark-as-text defect §11 already records.

### Deferred by decision — the brand treatment

**The splash and plan-loading gradients still run AnklePath's blue**, and they are staying that way for now. Replacing them is a *new brand treatment*, not a mapping: there is no Recovery Companion gradient to collapse them onto, and inventing one to clear a counter would be deciding the product's first impression by accident.

They are among the **89 hardcoded hex literals** the compiler cannot see — a raw `#2F7DE1` in a `LinearGradient` is just a string to it — so `checks/redomain.mjs` counts and budgets them. 57 of the 89 are in `services/report/reportHtml.ts`, a standalone HTML template for the doctor report, which wants its own **print** palette rather than the app's screen tokens; that is a separate piece of work with different constraints (print contrast, no dark mode, no device gamut).

Both groups are held by a ratchet that can only shrink, so nothing new joins them while the decisions wait.

### Open — found, measured, not yet fixed

**The manifest is still hand-maintained.** Nothing verifies it covers what the screens render. The sweep above was done by reading code; the next undeclared combination will be exactly as invisible as these six were.

**Correction — the `Toast` was never an accessibility defect.** An earlier entry here listed it alongside real contrast failures and described it as "ignores light mode", which invited the reading that it was one. Measured: the pill renders **15.13:1** as shipped, 12.63:1 for the dead value it documented, and 13.32/17.25:1 for the tokens it did not use. Every configuration passed comfortably.

What was actually wrong was dead code and a token family describing a design nobody had built: the mode argument was hardcoded so `"#333"` never rendered, and `pattern.toast.*` was mode-paired to a **white** pill that no screen had ever drawn. The screen's intent — a dark pill in both modes, the platform snackbar convention — was right, so the tokens moved to match via `surface.notification` / `text.onNotification`. Now resolved, and captured by a baseline (`app-toast`).

**`insight.*` is still defined and unused.** `insight.trendUp`/`trendDown` resolve to category **marks** while the component now correctly renders the trend word in `ink` — so adopting the family as written would reintroduce the failure that was just fixed. The family needs its trend roles repointed at `ink` before anything consumes it.

### Resolved — the `corridor.*` reconciliation

The corridor family diverged from what the chart painted, and the answer was not "the tokens are right" or "the code is right". It was one of each, plus two things neither had:

| Element | Token said | Code painted | Verdict |
|---|---|---|---|
| `band` | accent @13%, mode-invariant | accent-strong @12.9% dark, accent @10.2% light | **Token.** The two composite three RGB units apart on a decorative wash — not worth a mode-specific token. |
| `edge` | accent @20% → 1.27:1 | accent-strong @30% dark, accent @25% light | **Code.** The two dashes are what make the band read as a range *with two sides* rather than a threshold — N5 doing real work. The token was raised to 27% to match. |
| `label` | `text.secondary` → 5.91 / 5.24 | translucent accent → **3.58 / 2.99** | **Token.** A live failure on 10px italic text. |
| `phaseChip` + `phaseLabel` | tint + accent-strong → 4.97 dark, 4.15 light | opaque `accent.dim` + accent-strong → **3.84 both modes** | **Neither.** And `accent.dim`'s own token note already reads *"NOT safe behind secondary text … use lavender.750 where text sits on top"* — the code did exactly what the token source warned against. |

Two lessons worth keeping. **Three of the five corridor tokens — `edge`, `phaseChip`, `phaseLabel` — were never declared as pairs**, so nothing measured them; that is the manifest-coverage gap again, in a family whose whole purpose is enforcing a product principle. And **`label` *was* declared and still failed**, because the pair named the token while the screen painted something else. Declaring a pair proves nothing if the screen does not consume it.

`lavender.650` was re-solved from `#7163C9` to `#6B5DBE` as part of this — same error as the category inks, calibrated against white when accent text usually sits inside an accent tint. Better on every backdrop, so nothing was traded for it.

**Two contrast fixes are still unbaselined, and it is the same gap both times.** `app-checkin` captures the fast path with nothing selected *and* the detail panel collapsed, so neither the selected-word fix nor the 22px pain numeral is exercised by any baseline. The pain-ramp change moved exactly one screenshot (`ob-05-pain-baseline`, light) when it should logically have moved two.

This gap is no longer theoretical: it hid the Toast's dead code path and unused token family for the entire life of the component, because nothing could photograph a state that exists for 2.4 seconds behind an interaction. That one is now closed by the `app:toast` dev route — the same treatment the check-in's selected and expanded states still need.

**Structural gap:** the design file has no light-mode frames at all, so light mode has never been visually reviewed against a design — only implemented. That is the most likely explanation for why the light-mode failures cluster so heavily, and it is why the code is canonical for light mode by decision rather than by preference.

---

## 12. How this is enforced

| Check | What it catches |
|---|---|
| `checks/contrast.mjs` | Any approved pair falling below its threshold, per mode, alpha-composited |
| `checks/restricted.mjs` | Safety colour escaping its family; incomplete `category.*` families; primitives referenced from screens; forbidden token names (`target`, `streak`, `missed`) |
| `checks/coverage.mjs` | New raw hex, `rgba()`, duration, z-index, radius or font size in consumer code. The budget may only shrink. |
| `build/build.mjs --check` | Generated artifacts diverging from the token source. (This is the drift gate; there is no separate `drift.mjs`.) |
| `build/emit-docs.mjs --check` | The appendix below diverging from the tokens — so this document cannot quietly start describing a palette that no longer exists |
| `tests/visual.spec.ts` | Any rendered pixel changing, across 18 screens × 2 modes, above a measured 12-pixel noise floor |
| `tsc --noEmit` | Token name typos, via `as const` union types |

None of these run automatically. There is no CI configuration in the repository, so every gate above is a gate somebody has to remember.

**Appendix — generated token tables:** generated by `design-system/build/emit-docs.mjs` from `design-system/dist/tokens.json`.
**Everything below this line is written by that program. Do not hand-edit it** — the next run overwrites it, and `--check` fails the moment the two diverge. To change a value, edit `design-system/tokens/` and rebuild.

---

### Colour roles

Every semantic colour, both modes, as the emitters hand them to the app. A role whose two values are identical is mode-invariant **by decision** — see the token's note in `semantic.json`.

| Role | Dark | Light |
|---|---|---|
| `surface.base` | `#15141F` | `#F8F7FC` |
| `surface.raised` | `#1E1D2E` | `#FFFFFF` |
| `surface.card` | `#252438` | `#FFFFFF` |
| `surface.border` | `#2E2C45` | `#E4E1F5` |
| `surface.inverse` | `#FFFFFF` | `#1A1830` |
| `surface.notification` | `#252438` | `#252438` |
| `text.primary` | `#F0EFFE` | `#1A1830` |
| `text.secondary` | `#9B97B8` | `#6B6890` |
| `text.muted` | `#8D89A8` | `#716AA9` |
| `text.onAccent` | `#FFFFFF` | `#FFFFFF` |
| `text.onNotification` | `#FFFFFF` | `#FFFFFF` |
| `accent.default` | `#7C6FCD` | `#7C6FCD` |
| `accent.strong` | `#9B8FE0` | `#6B5DBE` |
| `accent.dim` | `#3D3668` | `#3D3668` |
| `accent.surface` | `#7C6FCD22` | `#7C6FCD22` |
| `accent.edge` | `#7C6FCD44` | `#7C6FCD44` |
| `category.pain.mark` | `#F2A69E` | `#F2A69E` |
| `category.pain.ink` | `#F2A69E` | `#AE4571` |
| `category.pain.onMark` | `#1A1830` | `#1A1830` |
| `category.sleep.mark` | `#9EC3F5` | `#9EC3F5` |
| `category.sleep.ink` | `#9EC3F5` | `#406CA9` |
| `category.sleep.onMark` | `#1A1830` | `#1A1830` |
| `category.energy.mark` | `#F5D08A` | `#F5D08A` |
| `category.energy.ink` | `#F5D08A` | `#876A34` |
| `category.energy.onMark` | `#1A1830` | `#1A1830` |
| `category.mood.mark` | `#A8D9B8` | `#A8D9B8` |
| `category.mood.ink` | `#A8D9B8` | `#35784B` |
| `category.mood.onMark` | `#1A1830` | `#1A1830` |
| `category.meds.mark` | `#C9B8F0` | `#C9B8F0` |
| `category.meds.ink` | `#C9B8F0` | `#775BB9` |
| `category.meds.onMark` | `#1A1830` | `#1A1830` |
| `painScale.0.mark` | `#A8D9B8` | `#A8D9B8` |
| `painScale.0.ink` | `#A8D9B8` | `#71927C` |
| `painScale.1.mark` | `#A8D9B8` | `#A8D9B8` |
| `painScale.1.ink` | `#A8D9B8` | `#71927C` |
| `painScale.2.mark` | `#B8DDA8` | `#B8DDA8` |
| `painScale.2.ink` | `#B8DDA8` | `#79926F` |
| `painScale.3.mark` | `#D9DA8A` | `#D9DA8A` |
| `painScale.3.ink` | `#D9DA8A` | `#8D8E5A` |
| `painScale.4.mark` | `#F5D08A` | `#F5D08A` |
| `painScale.4.ink` | `#F5D08A` | `#9F875A` |
| `painScale.5.mark` | `#F5C070` | `#F5C070` |
| `painScale.5.ink` | `#F5C070` | `#A9844D` |
| `painScale.6.mark` | `#F5A860` | `#F5A860` |
| `painScale.6.ink` | `#F5A860` | `#B87E48` |
| `painScale.7.mark` | `#F2A09E` | `#F2A09E` |
| `painScale.7.ink` | `#F2A09E` | `#B97A79` |
| `painScale.8.mark` | `#E0748A` | `#E0748A` |
| `painScale.8.ink` | `#E0748A` | `#D06C80` |
| `painScale.9.mark` | `#D4607F` | `#D4607F` |
| `painScale.9.ink` | `#D4607F` | `#D4607F` |
| `painScale.10.mark` | `#BA4A79` | `#BA4A79` |
| `painScale.10.ink` | `#BA4A79` | `#BA4A79` |
| `cta.from` | `#6A5CB5` | `#6A5CB5` |
| `cta.to` | `#7365C6` | `#7365C6` |
| `cta.label` | `#FFFFFF` | `#FFFFFF` |
| `safety.ink` | `#E86A5C` | `#C93D30` |
| `safety.mark` | `#E05548` | `#E05548` |
| `safety.surface` | `#E0554822` | `#E0554822` |
| `state.disabled` | `#2E2C45` | `#E4E1F5` |
| `state.disabledText` | `#5C5878` | `#6B6890` |
| `state.selectedFill` | `#7C6FCD22` | `#7C6FCD22` |
| `state.selectedEdge` | `#7C6FCD44` | `#7C6FCD44` |
| `state.scrim` | `#0000008C` | `#0000008C` |

### Pattern families

Product concepts with fixed contracts, defined once so they cannot drift between screens. Families with no colour rows (numbers, strings, reserved slots) are omitted here; see `tokens/patterns.json`.

| Pattern token | Dark | Light |
|---|---|---|
| `corridor.band` | `#7C6FCD22` | `#7C6FCD22` |
| `corridor.edge` | `#7C6FCD44` | `#7C6FCD44` |
| `corridor.label` | `#9B97B8` | `#6B6890` |
| `corridor.phaseChip` | `#7C6FCD22` | `#7C6FCD22` |
| `corridor.phaseLabel` | `#9B8FE0` | `#6B5DBE` |
| `rest.surface` | `#15141F` | `#F8F7FC` |
| `rest.mark` | `#2E2C45` | `#E4E1F5` |
| `rest.label` | `#8D89A8` | `#716AA9` |
| `accumulation.counterFill` | `#7C6FCD22` | `#7C6FCD22` |
| `accumulation.counterEdge` | `#7C6FCD44` | `#7C6FCD44` |
| `accumulation.counterLabel` | `#9B8FE0` | `#6B5DBE` |
| `accumulation.dotFilled` | `#7C6FCD` | `#7C6FCD` |
| `accumulation.dotEmpty` | `#2E2C45` | `#E4E1F5` |
| `lock.badgeFill` | `#2E2C45` | `#E4E1F5` |
| `lock.badgeGlyph` | `#9B97B8` | `#6B6890` |
| `lock.label` | `#9B97B8` | `#6B6890` |
| `historyFade.fadeFrom` | `#1E1D2E0D` | `#FFFFFF0D` |
| `historyFade.fadeTo` | `#1E1D2E` | `#FFFFFF` |
| `historyFade.pillFill` | `#7C6FCD22` | `#7C6FCD22` |
| `historyFade.pillEdge` | `#7C6FCD44` | `#7C6FCD44` |
| `historyFade.pillLabel` | `#9B8FE0` | `#6B5DBE` |
| `insight.headline` | `#F0EFFE` | `#1A1830` |
| `insight.trendUp` | `#A8D9B8` | `#35784B` |
| `insight.trendDown` | `#F2A69E` | `#AE4571` |
| `insight.trendFlat` | `#9B97B8` | `#6B6890` |
| `insight.chartLine` | `#7C6FCD` | `#7C6FCD` |
| `insight.chartGrid` | `#2E2C4588` | `#E4E1F588` |
| `fastPath.optionFill` | `#252438` | `#FFFFFF` |
| `fastPath.optionEdge` | `#2E2C45` | `#E4E1F5` |
| `fastPath.optionSelected` | `#7C6FCD44` | `#7C6FCD44` |
| `fastPath.better.mark` | `#A8D9B8` | `#A8D9B8` |
| `fastPath.same.mark` | `#9EC3F5` | `#9EC3F5` |
| `fastPath.worse.mark` | `#F2A69E` | `#F2A69E` |
| `share.cardFrom` | `#3D3668` | `#3D3668` |
| `share.cardTo` | `#1E1D2E` | `#FFFFFF` |
| `share.title` | `#F0EFFE` | `#1A1830` |
| `share.meta` | `#9B97B8` | `#6B6890` |
| `share.brandmark` | `#F0EFFE55` | `#1A183055` |
| `report.surface` | `#1E1D2E` | `#FFFFFF` |
| `report.heading` | `#F0EFFE` | `#1A1830` |
| `report.meta` | `#9B97B8` | `#6B6890` |
| `report.changeBlock` | `#7C6FCD22` | `#7C6FCD22` |
| `report.divider` | `#2E2C45` | `#E4E1F5` |
| `welcomeBack.surface` | `#7C6FCD14` | `#7C6FCD14` |
| `welcomeBack.message` | `#F0EFFE` | `#1A1830` |
| `paywall.sheet` | `#1E1D2E` | `#FFFFFF` |
| `paywall.scrim` | `#0000008C` | `#0000008C` |
| `paywall.handle` | `#2E2C45` | `#E4E1F5` |
| `paywall.savingsFill` | `#A8D9B833` | `#A8D9B833` |
| `paywall.savingsLabel` | `#A8D9B8` | `#A8D9B8` |
| `capture.field` | `#1E1D2E` | `#FFFFFF` |
| `capture.edge` | `#2E2C45` | `#E4E1F5` |
| `capture.placeholder` | `#8D89A8` | `#716AA9` |
| `capture.actionIdle` | `#2E2C45` | `#E4E1F5` |
| `capture.actionReady` | `#7C6FCD` | `#7C6FCD` |
| `dayCard.from` | `#332C55` | `#F0EDFB` |
| `dayCard.to` | `#1E1D2E` | `#FFFFFF` |
| `dayCard.primary` | `#F0EFFE` | `#1A1830` |
| `dayCard.secondary` | `#9B97B8` | `#6B6890` |
| `toast.surface` | `#252438` | `#252438` |
| `toast.label` | `#FFFFFF` | `#FFFFFF` |

### Type

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| `display` | 44px | 600 | 48 | -0.2 |
| `heading` | 28px | 600 | 33.6 | 0 |
| `title` | 24px | 600 | 36 | 0 |
| `body` | 15px | 400 | 24 | 0 |
| `rowLabel` | 14px | 500 | 21 | 0 |
| `caption` | 12px | 600 | 18 | 0 |
| `eyebrow` | 11px | 600 | 16.5 | 1.32 |
| `buttonPrimary` | 16px | 600 | 24 | 0.16 |
| `buttonSecondary` | 14px | 500 | 20 | 0 |
| `insight` | 15px | 600 | 22 | 0 |

**Scale steps:** `3xs` 10px · `2xs` 11px · `xs` 12px · `sm` 13px · `base` 14px · `md` 15px · `lg` 16px · `xl` 18px · `2xl` 24px · `3xl` 28px · `display` 44px

**Weights:** `regular` 400 · `medium` 500 · `semibold` 600 · `bold` 700. Only 700 qualifies text for the WCAG large-text exemption.

### Motion

Stored as bezier control points, never as the keyword `ease-out` — the keyword resolves to different curves in different engines, and this system targets two.

| Role | Duration | Easing |
|---|---|---|
| `press` | 120ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `toggle` | 150ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `control` | 200ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `indicator` | 250ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `screen` | 300ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `entrance` | 350ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `themeChange` | 400ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `draw` | 500ms | `cubic-bezier(0, 0, 0.58, 1)` |
| `celebrate` | 600ms | `cubic-bezier(0.34, 1.2, 0.64, 1)` |
| `ambient` | 2400ms | `cubic-bezier(0.42, 0, 0.58, 1)` |
| `spinner` | 1800ms | `cubic-bezier(0, 0, 1, 1)` |

### Geometry and elevation

| Scale | Steps |
|---|---|
| space | `0` 0px · `1` 4px · `2` 8px · `3` 12px · `4` 16px · `5` 20px · `6` 24px · `8` 32px · `10` 40px · `12` 48px |
| radius | `xxs` 2px · `xs` 3px · `sm` 8px · `md` 12px · `lg` 16px · `xl` 20px · `2xl` 24px · `shell` 44px · `full` 9999px |
| size | `tap` 44px · `control` 40px · `iconTile` 34px · `badge` 24px · `glyph` 12px · `dot` 6px · `dotActive` 16px · `sliderThumb` 24px · `buttonPrimary` 56px · `buttonSecondary` 48px · `rowStandard` 52px · `hairline` 1px · `hairlineThick` 2px · `shellWidth` 390px · `shellHeight` 844px |
| z | `base` 0 · `raised` 10 · `overlay` 40 · `feature` 45 · `sheet` 50 · `toast` 60 · `dev` 100 |
| duration | `instant` 0ms · `micro` 120ms · `quick` 150ms · `compact` 200ms · `medium` 250ms · `screen` 300ms · `entrance` 350ms · `theme` 400ms · `draw` 500ms · `celebrate` 600ms · `dwell` 2400ms · `breathe` 2400ms · `spin` 1800ms |

The `z` order is fixed: an overlay must never be authored with an ad-hoc z-index.

### Contrast manifest

**84 declared pairs, 152 pair-mode combinations.** Audited by `checks/contrast.mjs`, with translucent foregrounds composited over their declared backdrop before measurement.

| Usage class | Pairs |
|---|---|
| `body-text` | 52 |
| `ui-boundary` | 6 |
| `decorative` | 12 |
| `large-text` | 14 |

This measures the pairs the manifest DECLARES, not the pairs the app renders. An undeclared combination is unmeasured, not passing — see §11.
