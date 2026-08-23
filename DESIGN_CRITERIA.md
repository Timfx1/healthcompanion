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
| N6 | **The doctor report is never gated.** No lock badge, no paywall, no premium treatment anywhere on the report or its export. | P6. It is the category's emotional peak and the primary word-of-mouth trigger. | `restricted.mjs` fails if a declared report surface references a gating symbol, or a declared premium-offer surface names the report. Was "checked in review" until an audit found ten violations — see §11. |
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

**`insight.*` was listed here as defined-and-unused, pointing at category marks.** Both halves stopped being true and the entry did not — see the correction later in this section. It is now consumed, and its roles were repointed at `ink` during the RN port.

### Resolved — building the report found three contrast failures nothing else would have

`ReportPreview` is built: seven states, eight dev routes, sixteen baselines.
Declaring its pairs turned up **three failures in the light mode of a screen
that looked fine**, which is the whole argument for the manifest.

| Pair | Measured | Fix |
|---|---|---|
| red-flag text on `safety.surface` over the report surface | **4.24:1** | the callout lost its FILL for a border; on the plain surface the same ink is 5.01 |
| `report.meta` on the change-block tint | **4.49:1** | secondary text on the tinted block is now heading ink, smaller and lighter in weight |
| the "Steady" word on the same tint | **4.49:1** | same |

Under 4.5 by a hair is still under. The 4.49 pair is the third time this system
has been caught by *text on a tint of its own accent* — after `InsightSentence`
at 1.40:1 and the corridor's `phaseLabel` — and the resolution is the one the
print layer already reached independently: **on a tinted surface, hierarchy
comes from size and weight, not from lightness.** A lighter ink is the obvious
move and the wrong one, twice over.

Losing the red-flag fill is not a downgrade. A bordered callout is the more
restrained form §4.7 asks of this screen, and the reserved hue stays exactly
where N3 puts it — on this content and nowhere else.

**Two things were found by LOOKING at the baseline, not by reading the code.**
Red-flag guidance was rendering last, under key events and medications, which on
a real report means below the fold — guidance that routes someone to care cannot
sit under a medications table, so it now sits directly beneath the dominant
block. And the `exporting` and `failed` routes were riding the long `ready`
fixture, which put the export button they exist to photograph off-screen; they
ride a short fixture now.

**The states are derived from fixture DATA, never set by a flag.** `depthOf()`
reads entry counts and spans, so a baseline named `sparse` is a photograph of
what sparse data actually produces. The sparse report suppresses the chart
entirely rather than drawing a direction through two points.

**`coverage.mjs` and `restricted.mjs` both scan fixed file lists**, so
`ReportPreview.tsx` was invisible to them the moment it was written — the same
shape as every other blind spot in this section. Both lists were extended the
same day. The screen adds **zero** raw literals; the ratchet stayed at 162.

Still open, and unchanged by this work: `ShareCardScreen` remains the one app
surface with no route and no baseline.

### Open — secondary text on a 13% accent tint has now failed four times

`color.text.secondary` on the standard 13% accent tint measures **4.49:1** in
light mode. Under 4.5 by one hundredth, and it is not a one-off:

| Where | Measured | What was done |
|---|---|---|
| `InsightSentence` trend word | 1.40:1 | used `mark` as text; moved to `ink` |
| `corridor.phaseLabel` | 4.15:1 | `lavender.650` re-solved against the tint |
| report change block, meta + "Steady" | 4.49:1 | moved to heading ink, smaller and lighter |
| `AddTimelineEntry` capture-row hint | 4.49:1 | same |

Four sites, one cause. `accent.surface` is a NAMED general-purpose container —
`semantic.json` calls it "informational cards, badges, chips, callouts" and
lists five uses — so secondary-weight text on it is an entirely ordinary thing
to want, and the system currently cannot supply it.

Each site was fixed the way `semantic.json`'s own note on the muted step already
prescribes: *"Differentiate quiet text by WEIGHT and SIZE, not by lowering
contrast — which is the accessible way to build hierarchy regardless."* That is
the right local answer and the print layer reached it independently.

**But the root is still there.** Measured: darkening `text.secondary`'s light
value by 1% (`#6B6890` → `#6A678F`) clears the tint at 4.55 and improves every
other declared backdrop — 5.24→5.32 on white, 4.92→4.99 on base. A 7% step
(`#646186`) clears even the 27% tint at 4.56, which would make this class of
failure unbuildable rather than fixed four times.

Not done here, deliberately: it is a core semantic token and every light-mode
baseline moves with it, which is a bigger decision than the screen that
surfaced it. Recorded with the numbers so it can be taken on its own terms.

### Resolved — the capture lane, and a save button that never worked

`QuickCaptureSheet` and `AddTimelineEntry` are built. The Timeline FAB had
carried `ACTION: Prototype stub (no action wired)` in its own comment since the
prototype was written; it now opens the sheet.

**The Home capture field's save button had no `onClick`.** The comment directly
above it read *"BUTTON PRESS: handleCaptureSave() when captureText is truthy"*
and the handler was never wired, so the visible ✓ did nothing for the whole life
of the component and only the Enter key saved — on the interaction P1 is built
around. Nothing caught it because a baseline photographs appearance, not
behaviour. That is the Toast's dead branch again, one component over, and it is
the second time the fix has come from extracting a component and reading what it
actually did.

**`pattern.capture.*` was defined and unused**, like `insight.*` still is. The
screen hardcoded the same values through the legacy `D` object, so the family
described a field nobody was drawing. Adopting it is zero-diff on every value
except `placeholder`, which the field never set at all — the one piece of text
guaranteed to be on screen before a user types was the one piece nothing could
measure. The extraction moved exactly 671 pixels, all of them that placeholder.

**States are derived from the text**, as the report's are from its data: `empty`
/ `ready` / `tagged`. `ready` is the normal case — most captures recognise no
keywords — so the tag row renders nothing at all rather than announcing "no
tags". There is deliberately no saving state and no error state: the capture
path cannot fail, which is the same reason the Toast has no failure branch. The
report's export, which genuinely can fail, has one.

**A spec conflict, reconciled and recorded.** §4.2 says the capture field is
"reachable from the FAB everywhere"; §5 lists the FAB as a chooser
(`capture/note/photo/milestone/medication/appointment`). A chooser inserts
exactly the categorisation decision P1 forbids. Quick capture is therefore the
first and visually dominant row — one tap to a field — while the persistent Home
field remains the true zero-decision path.

**The dark side of the 13% category tints was undeclared.** Those pairs were
`modes: ["light"]` with a note asserting dark clears 6.5–8.1:1. A note is not a
measurement, and the tag chips render in both modes. Now declared; all five pass.

### Resolved — Safety and EducationArticle, and N7 becomes enforceable

Both screens are built, and `safety.*` finally has the consumer it was reserved
for. Profile's "When to contact a doctor" and "Education hub" rows navigate;
they had been stubs with no handler.

**N3 is now applied WITHIN the screen that owns the hue, not just to it.** The
red flags are tiered — emergency, same-day, routine — and only the first two
carry the reserved colour. A screen that owns the alert hue is the easiest place
in the product to start crying wolf with it, and a flat list (which is what the
AnklePath screen rendered) makes "call an ambulance" and "mention it next time"
look identical at exactly the moment a reader is least able to triage.

**N7 is now a check, not a memory.** `restricted.mjs` gained a core-loop rule
beside the N6 report rule: a declared core-loop surface may not reference a
gating symbol. Different reasons, same enforcement — the report may not be gated
because it is the flagship (P6); the core loop may not be gated because gating it
is the Medisafe failure P9 names by hand. Verified by adding a `usePremium`
import to `SafetyScreen` and watching it fire.

`EducationArticle` is deliberately **not** on that list. P9 puts education
deep-dives in premium, so it is the one surface in the product where `lock.*` is
legal — which is precisely why the check names surfaces instead of banning the
tokens outright.

**Two contrast failures, both invented by layout rather than by tokens.**

The unlock pill was nested inside an accent card, which tinted its backdrop
twice: 4.28 dark and **3.95 light**. `historyFade` is contracted as "a gradient
fade plus an INLINE pill" and its colours are solved for sitting on the surface,
so the card was removed rather than the pattern bent. 4.97 / 4.57 after.

Per-item source attribution sat inside the tinted red-flag rows and measured
4.28 dark / **4.10 light** in `text.muted` — and `text.secondary` reached only
4.44 there, so neither ink clears AA on the warm safety tint. Attribution moved
to the page at the foot of each tier, where both are comfortable. §10 requires
sources; it does not require one under every line, and a citation beneath each
row is noise on a screen somebody reads while worried. The per-item `source`
field stays in `safetyContent.ts`, which is what a clinical reviewer needs.

**The content is placeholder, cited, and says so.** `NEEDS_CLINICAL_REVIEW` is
exported and rendered, so the screen states that it is pending review rather
than implying sign-off. No item names a condition — "calf pain with swelling" is
an observation a reader can make, "this could be a DVT" is a diagnosis this app
does not make (§10). Same standard as the corridor data.

**Access is derived, saved is orthogonal.** `accessOf(article, hasPremium)`
returns free / deepDiveLocked / deepDiveOpen, so `app-article-locked` and
`app-article-unlocked` are the SAME fixture under two truths rather than two
flags — the report's depth pattern, reused. Saved is a boolean over any of the
three, exactly as the report's export state is orthogonal to its depth.

### Resolved — `share.*` carried the dayCard bug, unfixed, in a second family

Building `MilestoneDetail` made it the first surface ever to consume `share.*`,
and the family turned out to be broken in light mode at **1.58:1** — the exact
figure §11 already records as the worst contrast in the system.

The mechanism was identical to dayCard's. `cardFrom` referenced
`{color.accent.dim}`, which is mode-invariant, while `title` referenced
`{color.text.primary}`, which flips to near-black in light. So light mode put
`#1A1830` on `#3D3668`. `accent.dim`'s own token note has said *"NOT safe behind
secondary text … use lavender.750 where text sits on top"* the whole time.

**It survived because nothing rendered it.** `ShareCardScreen` hardcodes `#fff`,
so the screen drew a legible card while the tokens described an unreadable one —
the Toast situation exactly: *the screen was right and the family was wrong.*
`share.*` is now the third defined-and-unused family to be found carrying a
defect, after `toast.*` and `capture.*`. `insight.*` is still on that list.

`meta` was failing too, and worse than it looked: `text.secondary` measured
**3.90:1 at the gradient start in DARK**, so this was never a light-mode-only
problem. Neither stop had ever been declared.

**The fix is NOT dayCard's, and the difference matters.** dayCard is a screen
element, so its light mode was made pale-to-white with dark text. A share card is
an ARTIFACT that leaves the app — the recipient never sees the sender's colour
mode, so a card that changes with it is inventing a variable the medium does not
have. `share.*` is now mode-invariant, which is what `ShareCardScreen` always
drew and the same reasoning that made the Toast mode-invariant. Both gradient
stops are declared as backdrops, because a gradient needs both endpoints — the
lesson dayCard already paid for once.

One consequence worth recording: the Day-N pill on that card originally used
`accumulation.counterLabel` and measured 2.65:1, because `accumulation.*` is
mode-PAIRED while the card is now mode-INVARIANT. On a mode-invariant artifact,
only mode-invariant tokens are safe. **The card owns its palette** — nothing but
`share.*` renders on it.

### Resolved — the timeline detail set, and the nesting mistake made twice

`JournalEntry`, `MilestoneDetail`, `MedicationDetail`, `AppointmentDetail` and
`QuestionsForDoctor` are built: eleven states across five screens, all derived
from fixture data and all routable. `AddTimelineEntry` now lands somewhere for
every row except photo, and Safety's "Add this to my questions" has a
destination.

**`MedicationDetail` is where P2 was easiest to break, and the token contracts
decided it rather than taste.** Taken doses render as `accumulation.*`, whose
contract is "dots that only ever accrue" — so no streak exists and none can be
built. Skipped doses render as `rest.*`, whose contract is "never red, never
labelled 'missed', NEVER COUNTED" — so the screen shows *"5 logged"* and no
adherence percentage, because a percentage is a count of what did not happen
wearing a different hat. The rows say "Not taken", never "missed". The safety
hue appears nowhere near any of it: a missed painkiller is not a red flag (N3).

**A shared `DetailScreen` shell** now owns the header these screens were all
about to hand-roll. ReportPreview, Safety and EducationArticle each already had
their own copy; three was where drift starts and eight would have guaranteed it.
Those three are not yet migrated — recorded below as an open item rather than
churned at the end of a long session.

**The nested-pill mistake was made twice.** `AppointmentDetail`'s report nudge
put an accent-filled pill inside an accent-filled card, exactly as
`EducationArticle` had: 4.28 dark / 3.95 light, a failure invented by layout
rather than by tokens. Replaced with the CTA gradient — and `accent.strong` was
tried first and rejected, because `text.onAccent` on it measures **2.84:1** in
dark while `cta.label` on the gradient was already solved and declared.

### Open — three screens have not adopted the DetailScreen shell

`ReportPreview`, `SafetyScreen` and `EducationArticle` still carry their own copy
of the header the shell now owns. The duplication is small and identical today,
which is exactly when it is cheapest to remove and hardest to notice. Migrating
them should be zero-diff against the baselines; if it is not, the difference is
itself the finding.

### Resolved — "defined" is not evidence, and it is now a gate

Four token families have shipped a defect while looking perfectly well-defined,
and every one survived for the same reason: nothing rendered them, so nothing
could disagree.

| Family | Defect | Why it survived |
|---|---|---|
| `toast.*` | mode-paired to a WHITE pill | the screen forced the dark value with a hardcoded argument |
| `capture.*` | `placeholder` never set at all | the screen hardcoded the same values through the legacy `D` object |
| `share.*` | **1.58:1** in light — the dayCard bug, unfixed | `ShareCardScreen` hardcodes `#fff` |
| `paywall.savingsLabel` | **1.58:1** — a category MARK used as TEXT | the screen already drew `mood.ink` |

`checks/consumption.mjs` makes the chain mechanical:

    defined → consumed → rendered → measured

**DORMANCY is checked per family.** Role-level dormancy was tried first and
abandoned — screens alias a family once (`const R = theme(mode).pattern.report`)
and then write `R.surface`, which no source scan can follow without a parser. It
reported 38 dormant roles, most of them false. A check that cries wolf gets
ignored, which is the exact failure this file exists to prevent, so it does not
get to commit it.

**MEASUREMENT is checked per role**, and that IS reliable, because it reads the
manifest rather than the source. It is the sharper of the two: `savingsLabel` was
a colour role no pair named, and role-level measurement is what surfaces that
class.

**RENDERED is not mechanised**, and saying so is part of the design. "Has a dev
route and a baseline" lives in the visual harness, not the token layer. This
closes two of the four arrows and leaves the other two visible rather than
implying they are covered.

The first run found `paywall.savingsLabel` at 1.58:1 immediately — a role
referencing `category.mood.mark`, a FILL, and rendering it as TEXT. Repointed at
`mood.ink`: **4.88 / 5.33 light, 6.38 / 10.46 dark**.

It also found the paywall SHEET had never been named by any pair despite
rendering since the prototype was written, and that **16 colour roles were
unmeasured**. All 16 are now declared — 61 of 61 — which surfaced one more gap
worth its own note: a TRANSLUCENT token used as a backdrop cannot appear as a
`bg` spec, because the contrast check requires opacity, so those pairs carry a
pre-composited literal and the link back to the token lived only in prose. The
manifest now takes a `composited` field, and that link is machine-readable.

**Three families remain dormant: `insight`, `fastPath`, `welcomeBack`.**
`fastPath` is the surprise — P3 makes it "the largest, first-rendered element of
the Check-in tab", and the check-in screen hardcodes instead. On the record above,
a dormant family is not a neutral fact.

### Resolved — the shared header, migrated with zero diff

`ReportPreview`, `SafetyScreen` and `EducationArticle` now use the same
`DetailScreen` shell as the five timeline details. **All 26 affected baselines
passed unchanged** — the migration is genuinely zero-diff, which is the only
evidence worth having that an extraction changed nothing.

Migrating found one thing designing had not: three of the four screens wanted a
different body rhythm (`gap-3`, `gap-4`, `gap-5`), so the shell asks rather than
assumes. The gap classes are written as literals in a lookup, not built with a
template string — Tailwind scans source for whole class names, so `gap-${n}` is
invisible to it and the rule may simply not exist in the output, a failure that
looks like a layout bug and reads like nothing at all.

### Resolved — the photo lane, and the last dead row in the FAB sheet

`PhotoCapture` and `PhotoCompare` are built. `AddTimelineEntry` now lands
somewhere for **every** row; the photo row was the last stub in it.

**The gate sits on the comparison, never on the photo.** §9 keeps the timeline
and the core loop free and names only photo COMPARE as premium, so
`PhotoCapture` is registered as a core-loop surface in `restricted.mjs` and
`PhotoCompare` deliberately is not. Gating the act of adding a photo would gate
the core loop, which is the Medisafe failure P9 exists to prevent.

**P10 is placed before the controls, not after them.** Photographs of a healing
body are the most private thing this product will ever hold, so "stays on your
device" leads the screen. A reassurance that arrives after the decision is not a
reassurance.

**`PhotoCompare` has three states, and the middle one is the point.** `locked` /
`insufficient` / `ready`, derived from the entitlement AND the photo count.
Without `insufficient`, a subscriber holding one photo sees either a broken
screen or — far worse — an upsell for something they have already bought. That
state has deliberately nothing to buy on it: the answer is "add another in a
week or two", and the gap is what makes the comparison worth looking at.

In the locked state **both photos stay visible** and only the comparison tooling
is withheld (§9, value before the gate). The privacy line is stated in every
state, premium or not.

The frames are neutral placeholders. This prototype does not ship invented
photographs of injuries, and a mock wound is not a detail worth faking for a
baseline.

### Resolved — ReportDateRange, and the chain extended past the pattern layer

The last §5 greenfield screen is built. `ReportPreview`'s range chip had
`onRange={() => {}}` since the report shipped; it goes somewhere now.

**Every option states its YIELD before it is chosen.** That is not polish — it
is a promise `ReportPreview` already made in its own header: *"changing the range
re-derives depth, so empty and sparse are reachable from INSIDE a ready report."*
A picker that hides its consequences hands somebody a blank report on the morning
of an appointment. A window containing nothing is described (*"nothing logged
yet"*) and cannot be applied; it is not warned about, and the alert hue stays
where N3 puts it.

**The screen introduces NO new token family, and that is the finding.**
Selection already has a name — `state.selectedFill` / `state.selectedEdge` — and
`semantic.json` warns in as many words that reusing a named value under a new
name "would have been misnaming rather than reuse".

One constraint arrived WITH those tokens, and it is worth recording as a pattern
in its own right. `state/selectedEdge on raised` is classified decorative, and
its manifest note is explicit that this holds only because *"selection here is
carried by three simultaneous signals — a tinted fill, this border, and a
trailing check glyph… if a future selected state ever drops the fill or the
check, this must revert to ui-boundary."* So the selected option here carries all
three. **The manifest is not describing the past; it is a contract on anything
that adopts the token**, and this is the first screen to inherit one.

### Resolved — the chain now covers the whole colour surface

`consumption.mjs` only knew about `pattern.*`. Extending it to semantic roles
found **19 undeclared**, including `color.accent.surface` and `color.accent.edge`
— which are used on nearly every screen built in this project and were named by
no pair at all. They are translucent, so they reach the manifest only as
pre-composited literals: exactly the gap the `composited` field was added to
close for patterns, reappearing one layer down.

Also undeclared: all eleven `painScale.*.mark` steps (the sparkline's area wash),
`state.scrim` (every bottom sheet dims through it), `safety.surface`,
`surface.notification` and `text.onNotification` (the Toast at the semantic level
— `pattern.toast.*` refs them and was declared, the underlying roles were not, so
a change to either could have moved the pill with no pair naming what moved).

All 19 are now declared. **61 of 61 pattern roles and 64 of 64 semantic roles**,
with both ratchets at zero.

Deliberately NOT added: semantic *dormancy*. Semantic roles are reached through
the legacy `D` alias as often as by their full path, so source scanning would be
even less reliable there than it was for patterns — and the file already
abandoned role-level dormancy once for that reason. Measure what can be measured
honestly; leave the rest visible.

**Three families remain dormant: `insight`, `fastPath`, `welcomeBack`.** Nothing
in this pass changed that, and on the record of four families now found broken
while dormant, `fastPath` is the highest-risk thing left in the token layer — P3
makes it the largest element on the check-in tab, and the screen hardcodes.

### Resolved — WeeklyReflection, and the first behavioural test

The §5 gap here was one line wide: the Home card shipped, its "Save to timeline"
button was a documented stub, and §4.13's "saveable to timeline" was therefore a
label on nothing. It opens `WeeklyReflection` now.

**This is the first surface in the prototype backed by real storage.** Everything
before it lived in React and died on reload, which is fine for photographing a
screen and useless for the one thing a reflection has to do.

`components/storage.ts` is the web prototype's stand-in for AsyncStorage (§7),
deliberately the same shape so the port is a swap of two functions rather than a
rewrite of the callers. **It cannot throw.** That is P1, not defensive habit:
`localStorage` throws in more situations than people expect — Safari private
browsing, quota, blocked third-party storage — and a reflection somebody just
wrote is the wrong moment to surface an exception. Every access is wrapped and
degrades to an in-memory map for the session; nothing on screen apologises. Same
reasoning that gives the confirmation Toast no failure branch.

**The verification is the point, and it is not a screenshot.** A baseline proves
a state can be DRAWN — which is exactly what it proves and no more. This project
has already shipped a report export button that drew perfectly while its handler
was missing, and a quick-capture save button that drew perfectly with no
`onClick` at all. Both were caught by reading code.

`tests/persistence.spec.ts` reloads the page and re-reads:

    open → write → save → persist → confirm → reopen → still there

Four cases: a full reload, navigating away to Home and back, an empty save being
a no-op rather than a refusal, and the storage key being namespaced so it cannot
collide with anything else on a shared dev origin.

**Verified by sabotage.** Making `write()` a no-op — which is exactly what
"in-memory only" looked like everywhere else in this prototype — fails three of
the four, and the one that survives is correctly the empty-save test, which does
not depend on writing.

**The saved state is deliberately NOT baselined.** A screenshot of it would prove
the state can be drawn, which is the claim a baseline cannot be trusted to make
about this feature. The behaviour spec makes the claim that matters.

**Behaviour is now its own gate, separate from visual, in `verify.mjs` and in
CI.** They were about to share one, and CI runs visual **advisory** because of
the open harness flake. A persistence regression is not flaky and must not
inherit an exemption written for something else.

### Resolved — fastPath, and the token contract was NOT simply right either

The check-in screen has been brought into `pattern.fastPath`. The family is no
longer dormant, and the ratchet is down to two.

The instruction was to treat the token contract as the source of truth rather
than the hardcoded screen. Doing that carefully turned up something better than
either: **the family was internally contradictory, and the half that survives is
the half the measurement layer corroborates.**

**The contradiction.** `fastPath` defined BOTH a single `optionSelected` (accent
at 27%) AND per-option marks for `better`/`same`/`worse`. Those cannot both
describe the selected state. The contrast manifest settles it: five
`category ink on 27% tint` pairs exist *because the fast path fills its selected
option with a tint of that option's own mark*, and five `pastelInk` values were
re-solved against exactly those backdrops. A uniform accent fill would strand
that calibration and duplicate `state.selectedFill` at a different alpha — which
`semantic.json` warns against by name. `optionSelected` was vestigial and is
gone.

**What the family was missing.** There was no `ink`. The screen renders the
selected word in the category ink — correctly — and the family had no role that
could say so. A family stays dormant precisely while a screen does the right
thing by hand.

**Where the screen was wrong.** It painted options on `surface.raised`; the
contract says `surface.card`, which lifts further from `surface.base` and suits
"the one control that should be unmissable on a bad day". It also hardcoded
`height: 100` where the contract sets a *floor* of 88 — and a fixed height cannot
honour a floor when text grows.

**And adopting that fill exposed a live failure the light-only pairs had hidden.**
`category.pain.ink` on a 27% pain tint over `surface.card` measures **4.32:1 in
dark**. `pastelInk`'s own note exempts dark on the grounds that "the pastels
there already clear 7.7–12.4:1" — true on plain surfaces, false on the worst one.
**The exemption was reasoned, not measured**, which is the same mistake that
note itself describes, one mode over. Only pain fails (sleep 4.54, mood 4.94), so
only pain diverges: `pastelInkDark.pain` at `#F9ABA3`, 4.59 on that backdrop and
better on every other, so nothing is traded for it. All six selected-state pairs
are now declared in **both** modes.

**A fifth mark-as-ink.** The selected border used `mark` and measured
**1.58–1.96:1** on white against a 3:1 floor. §8 assigns data strokes to `ink`;
a selected border is a meaningful stroke. Fixed, and now passing.

**The selected state finally has a route.** §11 has recorded for a long time
that `app-checkin` photographs the fast path with nothing selected, so the
contrast fixes there were unexercised. Six pairs now depend on that state, and it
lives for 500ms behind a tap — unphotographable through interaction. It has a
dev route and a baseline now, the same treatment the Toast needed.

The ripple from `pastel.pain` → `pastelInkDark.pain` moved four dark baselines by
91 pixels each: the "Pain" tag chip, the report's "Worsening" word, and the
progress screen. Verified as exactly that and nothing else.

### Resolved — insight, and a dormancy check that was only looking at one consumer

`insight.*` is consumed. Dormancy is down to one family.

**First, a correction.** The entry below claimed `insight.trendUp`/`trendDown`
"resolve to category **marks**" and would reintroduce a fixed defect. That has
been false for some time: the roles were repointed at `ink` during the RN port,
and the token's own `$description` records it. The open item outlived the
problem, which is its own kind of drift — a stale warning teaches people to skim
the section it lives in.

**The vocabulary was incoherent, and that was the real defect.** The roles were
named for raw DIRECTION (`trendUp`/`trendDown`) while being coloured with
valence-loaded hues — mood green for up, pain plum for down. So a pain chart
trending down, which is good news, got the pain colour. The family's own note
admitted the tension ("direction is not valence: falling pain is good") without
resolving it.

The rest of the product had already resolved it: the print layer, `ReportPreview`
and `MedicationDetail` all say improving / worsening / steady. The roles now say
the same, and **the ICON carries raw direction while the WORD carries valence**,
so a falling pain line reads **"↓ Improving"** — icon plus word, as the contract
requires, and the two together say something neither says alone. The caller
supplies both because neither derives from the other without the metric's
polarity; the RN app already models that as `HIGHER_IS_BETTER`.

**The chip is gone.** The badge used to fill with a 13% tint of its own category
mark and print the word on top — text on a tint of its own accent, the single
failure this system has hit **four** separate times (`InsightSentence` itself at
1.40:1, `corridor.phaseLabel` at 4.15, the report's change block at 4.49,
`AddTimelineEntry`'s hint at 4.49). Removing the fill removes the class, and the
contract never asked for a chip — it asked for icon plus word.

**THE CHECK WAS ONLY LOOKING AT ONE OF TWO CONSUMERS.** `consumption.mjs`
scanned the web prototype and nothing else, so it reported `insight.*` as DORMANT
while four screens in `app/src` were consuming it. That is a half-truth, which is
worse than an unknown because it reads like an answer — and it is exactly the
failure mode the file was written to prevent, committed by the file itself.

It surfaced the hard way: renaming the roles broke the RN app's typecheck. The
token source has two consumers by design (§7 — one source, two platforms), so
dormancy has to mean "nothing anywhere renders it". `app/src` is now scanned on
the same terms. Verified by removing the web consumer and confirming `insight`
still reports consumed via the RN app alone.

### Correction — §11 was corrupted THREE times by the same replacement bug, and now has a gate

The mechanism, recorded once and now recorded for the last time: a `$` followed
by a backtick inside a `String.replace` *replacement* means "insert everything
before the match". Every attempt to write this very entry contained that
sequence as prose, and so spliced the document into itself.

The damage compounded silently. Three separate splices had each pasted a
byte-identical 758-line copy of the document's prefix into the middle of §11,
leaving **four** copies of every heading from the title through §11, and three
sentences broken mid-word — including the sentence explaining the bug. The file
had grown to 3,500 lines, of which 2,277 were duplicate. The copies were not
identical to the live text: the oldest still claimed `insight.*` was dormant and
warned against adopting it, an entry the head had already retracted. A reader
landing in a stale copy would have been told the opposite of the truth by the
document that governs the work.

Nothing caught it. The `docs` gate compares the generated appendix against the
tokens, and the appendix lives *below* the marker; every byte of duplication was
above it. The prose half of a binding document had no test at all.

It has one now. `emit-docs.mjs --check` fails if any `#`/`##` heading appears
more than once above the appendix marker. A spliced prefix necessarily
duplicates the title and every heading before the splice point, so heading
uniqueness detects this exactly, on the first bad commit rather than the fourth
copy. Verified the way the literal ratchet should have been: the check was run
against the corrupted file and observed to fail, reporting `4x` for twelve
headings, before being run against the repair.

Repaired: the three pasted blocks removed, the three broken sentences restored,
the code spans rewritten in double-backtick form so the sequence can be named
without being armed.

The lesson is not "be careful with `` $` ``". It is that prose asserting things
about a repository is exactly as prone to silent corruption as code, and is the
only half of this repository that had nothing checking it. Anything written into
a binding document should be written with a replacer function or the `Write`
tool, never a bare string replacement — and the document should be able to tell
you when it has stopped making sense.

### Open — the doctor report has no brandmark

The report masthead used to carry AnklePath's app icon, inline as SVG: a teal
ring on a dark rounded square. It held the last two of the file's 57 hardcoded
hex literals.

Recovery Companion has no mark. Drawing one here would be a brand decision
smuggled in as a colour migration — the same thing the splash and plan-loading
gradients were deferred to avoid. So the mark was **removed** rather than
replaced, and the masthead is now typographic: the wordmark in `print.accent.ink`
over the tagline in `print.ink.secondary`.

This is deliberately a gap, not a solution. It sits with the deferred brand
treatment below and should be resolved with it, not separately.

### Resolved — the print layer, and a ratchet that was never ratcheting

The 57 literals in `services/report/reportHtml.ts` are gone; the report draws
from `tokens/print.json`. What the migration turned up on the way is worth more
than the count.

**The template failed plain screen-level AA on sixteen text pairs**, before any
print-specific bar was applied. It built its type hierarchy from four greys, and
three of them were doing body-copy work they could not carry:

| Colour | Used for | On its actual backdrop |
|---|---|---|
| `#7C8CA0` | dates, meta, labels, table cells, ring labels — nine sites | **3.43:1** |
| `#93A3B4` | chart axis labels, section headers, "of" suffixes | **2.58:1** |
| `#93A3B4` | the "of" on the pain stat card | **2.36:1** |
| `#8B9AAB` | the footer disclaimer | **2.87:1** |

Print now has **two** inks, both cleared on every backdrop they touch, and lets
size and weight carry the hierarchy the greys were carrying badly. That is not a
compromise forced by contrast — it is how print typography works anyway.

**The literal ratchet had never once been able to fail.** `redomain.mjs` read
`budget.literals ?? literals`, and the budget file carried its count only in
`"$literals"` — a prose note, whose `$` prefix meant the lookup always missed.
The fallback then set the budget to whatever the current scan found. It printed
"89 hardcoded hex literals (budget 89)" on every run and enforced nothing. A
missing key is now fatal, and the floor is a real `literals` key at 32.

Separately, the scan excluded generated files by matching the literal string
`tokens.generated`, so the new `tokens.print.generated.ts` was counted as
hardcoded debt. The filter now matches `.generated.`.

**Two product-shaped decisions** were taken in the token source rather than in
the template, so they cannot drift back:

- Trend roles are `improving` / `worsening` / `steady`, never good/bad. The
  report states what changed; it does not grade the person who lived it. The
  shared `Tone` type still says good/bad/neutral and is mapped at the CSS
  boundary — renaming it touches `ReportsScreen`, so it is a separate change.
- The pain dots lost their hue entirely. The old ramp darkened toward an
  orange-red as the score rose, which is meaning-by-colour on a bad data point —
  what N3 forbids, and what the same rule had already removed from the pain ramp
  in `ReportsScreen`. Severity is read by counting the filled dots, a numeral
  sits beside them, and the fill is now plain ink.

**Verified by rendering, not only by measuring.** The template was transpiled and
driven with mock data, screenshotted, and screenshotted again through
`grayscale(1) contrast(1.15)` as a photocopy approximation. Everything stays
legible. The three trend spines do become indistinguishable from each other in
greyscale — which is the point of N4, and why each callout states its direction
in words ("Pain is trending down", "Balance has not moved", "Swelling is
steady"). Colour is reinforcement there, never the only channel.

### Resolved — N6 was enforced "in review", and review failed ten times

The doctor report is free forever (P6/N6): no lock badge, no paywall, no premium
treatment anywhere on it or its export. A repo-wide audit found **ten sites**
saying otherwise, across three categories.

| Where | Site | What it did |
|---|---|---|
| Live gating | `ReportsScreen.tsx` | `usePremium().locked` → early-return a `PremiumLockCard` **instead of the report** |
| Live gating | `HomeDashboardScreen.tsx` | upsell card titled "Unlock your recovery report" |
| Live gating | `ProfileScreen.tsx` | premium row reading "Unlock exportable reports…" |
| Sold as premium | `config/paywall.ts` | `PAYWALL_COPY.benefits` included "Exportable recovery reports" |
| Sold as premium | RN `PremiumTeaserScreen.tsx` | same string in the teaser list |
| Sold as premium | prototype `PremiumTeaserScreen` | **a lock badge rendered on a "Doctor report PDF" row** |
| Sold as premium | prototype `PaywallScreen` | "Doctor report PDF" ticked in the paid benefits list |
| Wrong policy | `app/README.md`, `FACELESS_ADS_PROMPT.md`, and the comment above the gate | stated the report was premium |

Three things are worth recording beyond the fix.

**It was latent, not visible, and that is worse.** `PREMIUM_GATING_ENABLED` is
`PAYWALL_ENABLED && BILLING_ENABLED`, both env-defaulted false, so `locked` was
always false and nobody could see the gate. It would have activated on the day
billing was switched on — the day nobody is re-reading the non-negotiables.

**Two of the ten were photographed and still passed.** The lock badge on the
report row sat inside `ob-10-premium-teaser-{light,dark}` for as long as those
baselines have existed. A visual baseline proves a screen has not *changed*; it
cannot notice that what it has been faithfully reproducing is wrong. This is the
same class of blind spot as the hand-maintained contrast manifest, and it is now
the second time it has been the answer.

**The correction already existed in the repo and stopped halfway.**
`FIGMA_PROMPT_2_HOME_MAIN` asked for *"EXPORT button carries the lock badge
(value first, gate at output)"*. `FIGMA_DESIGN_ADJUSTMENTS` later corrected it to
*"the ENTIRE doctor report (incl. its export button) show NO lock badges
anywhere"*. The correction reached Home — `MainApp.tsx` still carries the
"NO lock badge" comment — and reached nothing else. Notably the AnklePath Figma
design for the report has **no lock anywhere**: the gate was added in
implementation, not inherited from a design.

N6 is now a rule in `restricted.mjs` beside N1–N5. A declared **report surface**
may not reference a gating symbol (`usePremium`, `PremiumLockCard`, `isPremium`,
`lock.*`…); a declared **premium-offer surface** may not name the report. Both
run on comment-stripped source, so code may document N6 as loudly as it likes
without tripping it — verified by reintroducing each violation and confirming it
fires, and by confirming a comment that correctly states N6 does not.

**Known limitation, stated rather than hidden:** both file lists are
hand-maintained, exactly like `pairs.manifest.json`. A report surface nobody adds
to the list is a report surface nobody checks. The prototype's Home report row
is deliberately *not* covered, because `MainApp.tsx` legitimately uses
`LockedCard` for premium insights on the same screen — file-level granularity is
too coarse there, and pretending otherwise would produce a check that had to be
suppressed.

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

The fast path's SELECTED state is now closed too (`app:checkin-selected`); the expanded detail panel still is not. This gap is no longer theoretical: it hid the Toast's dead code path and unused token family for the entire life of the component, because nothing could photograph a state that exists for 2.4 seconds behind an interaction. That one is now closed by the `app:toast` dev route — the same treatment the check-in's selected and expanded states still need.

**Structural gap:** the design file has no light-mode frames at all, so light mode has never been visually reviewed against a design — only implemented. That is the most likely explanation for why the light-mode failures cluster so heavily, and it is why the code is canonical for light mode by decision rather than by preference.

---

## 12. How this is enforced

| Check | What it catches |
|---|---|
| `checks/contrast.mjs` | Any approved pair falling below its threshold, per mode, alpha-composited |
| `checks/restricted.mjs` | Safety colour escaping its family; incomplete `category.*` families; primitives referenced from screens; forbidden token names (`target`, `streak`, `missed`); N6 — a gating symbol on a report surface, or the report named on a premium-offer surface |
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
| `category.pain.ink` | `#F9ABA3` | `#AE4571` |
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
| `insight.improving` | `#A8D9B8` | `#35784B` |
| `insight.worsening` | `#F9ABA3` | `#AE4571` |
| `insight.steady` | `#9B97B8` | `#6B6890` |
| `insight.chartLine` | `#7C6FCD` | `#7C6FCD` |
| `insight.chartGrid` | `#2E2C4588` | `#E4E1F588` |
| `fastPath.optionFill` | `#252438` | `#FFFFFF` |
| `fastPath.optionEdge` | `#2E2C45` | `#E4E1F5` |
| `fastPath.better.mark` | `#A8D9B8` | `#A8D9B8` |
| `fastPath.better.ink` | `#A8D9B8` | `#35784B` |
| `fastPath.better.selectedFill` | `#A8D9B844` | `#A8D9B844` |
| `fastPath.same.mark` | `#9EC3F5` | `#9EC3F5` |
| `fastPath.same.ink` | `#9EC3F5` | `#406CA9` |
| `fastPath.same.selectedFill` | `#9EC3F544` | `#9EC3F544` |
| `fastPath.worse.mark` | `#F2A69E` | `#F2A69E` |
| `fastPath.worse.ink` | `#F9ABA3` | `#AE4571` |
| `fastPath.worse.selectedFill` | `#F2A69E44` | `#F2A69E44` |
| `share.cardFrom` | `#3D3668` | `#3D3668` |
| `share.cardTo` | `#1E1D2E` | `#1E1D2E` |
| `share.title` | `#F0EFFE` | `#F0EFFE` |
| `share.meta` | `#B0ACCF` | `#B0ACCF` |
| `share.brandmark` | `#F0EFFE55` | `#F0EFFE55` |
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
| `paywall.savingsLabel` | `#A8D9B8` | `#35784B` |
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

### Print (paper)

A SEPARATE domain, not a third colour mode — single-valued, because paper has no dark counterpart. Body copy is held to **7:1**, not 4.5:1: paper offers no brightness control, no zoom and no theme fallback, and a clinical report gets photocopied. WCAG relative luminance is greyscale luminance, so a pair meeting its ratio here also survives a black-and-white copy.

| Role | Value | On paper |
|---|---|---|
| `paper.sheet` | `#FFFFFF` |  |
| `paper.tint` | `#F7F6FB` |  |
| `paper.band` | `#EFEDF7` |  |
| `ink.primary` | `#1A1830` |  |
| `ink.secondary` | `#4E4C69` | Replaces four greys whose worst case was 2.36:1 |
| `accent.ink` | `#4F4783` |  |
| `accent.stroke` | `#7C6FCD` | Data stroke, not text — 3:1 floor applies |
| `accent.tint` | `#F0EDFB` |  |
| `rule.strong` | `#6B6890` |  |
| `rule.hairline` | `#E4E1F5` | Exempt; the layout separates without it |
| `trend.improving.ink` | `#285B39` |  |
| `trend.improving.band` | `#EAF3ED` |  |
| `trend.worsening.ink` | `#843456` |  |
| `trend.worsening.band` | `#F7EDF1` |  |
| `trend.steady.ink` | `#4E4C69` |  |
| `trend.steady.band` | `#EFEDF7` |  |
| `painDots.filled` | `#1A1830` | No hue: severity is read by counting |
| `painDots.track` | `#DEDBEE` |  |

Emitted to `dist/tokens.print.ts`. Validated by V6 (single-value) and V6b (the reserved alert hue is off limits on paper too).

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

**208 declared pairs, 369 pair-mode combinations.** Audited by `checks/contrast.mjs`, with translucent foregrounds composited over their declared backdrop before measurement.

| Usage class | Pairs |
|---|---|
| `body-text` | 114 |
| `ui-boundary` | 17 |
| `decorative` | 43 |
| `large-text` | 14 |
| `print-body` | 13 |
| `print-rule` | 3 |
| `print-decorative` | 4 |

This measures the pairs the manifest DECLARES, not the pairs the app renders. An undeclared combination is unmeasured, not passing — see §11.
