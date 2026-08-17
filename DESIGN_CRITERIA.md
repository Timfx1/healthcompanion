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

### Open — found, measured, not yet fixed

**The manifest is still hand-maintained.** Nothing verifies it covers what the screens render. The sweep above was done by reading code; the next undeclared combination will be exactly as invisible as these six were.

**`Toast` ignores light mode, and its token family is unused.** `patterns/Toast.tsx` reads `s(D.card, "#333", "dark")` — the third argument is the *mode*, hardcoded. The dark branch is always taken and the light value has never rendered. Meanwhile `pattern.toast.{surface,label,dwell}` exists in `patterns.json`, mode-paired, and is referenced by nothing. Not fixed yet for a specific reason: the toast is only visible after a quick-capture save, and no baseline captures it in that state, so the fix is unverifiable by the harness in exactly the place the harness is already blind. It belongs in the same change as the dev-route state hook.

**Three pattern families are defined and unused, and two of them would move pixels.** `corridor.*` resolves to `accent.default` at 13% (`#7C6FCD22`) while `PainSparklineWithCorridor` paints `#9B8FE021` on dark and `#7C6FCD1A` on light; `insight.*` and `toast.*` are likewise unconsumed. Adopting them is a design change requiring re-baselining, not a refactor — which is why the extraction left them inline and said so at each call site rather than quietly reconciling the values.

**Two contrast fixes are unbaselined, and it is the same gap both times.** `app-checkin` captures the fast path with nothing selected *and* the detail panel collapsed, so neither the selected-word fix nor the 22px pain numeral is exercised by any baseline. The pain-ramp change moved exactly one screenshot (`ob-05-pain-baseline`, light) when it should logically have moved two. This is the coverage gap already recorded in `tests/visual.spec.ts` — interactive states have no dev-route hook — and it is now demonstrably hiding real changes rather than only theoretically able to. Adding `&state=` to the dev route is the fix.

**Structural gap:** the design file has no light-mode frames at all, so light mode has never been visually reviewed against a design — only implemented. That is the most likely explanation for why the light-mode failures cluster so heavily, and it is why the code is canonical for light mode by decision rather than by preference.

---

## 12. How this is enforced

| Check | What it catches |
|---|---|
| `checks/contrast.mjs` | Any approved pair falling below its threshold, per mode, alpha-composited |
| `checks/restricted.mjs` | Safety colour escaping its family; incomplete `category.*` families; primitives referenced from screens; forbidden token names (`target`, `streak`, `missed`) |
| `checks/coverage.mjs` | New raw hex, `rgba()`, duration, z-index, radius or font size in consumer code. The budget may only shrink. |
| `build/build.mjs --check` | Generated artifacts diverging from the token source. (This is the drift gate; there is no separate `drift.mjs`.) |
| `tests/visual.spec.ts` | Any rendered pixel changing, across 18 screens × 2 modes, above a measured 12-pixel noise floor |
| `tsc --noEmit` | Token name typos, via `as const` union types |

None of these run automatically. There is no CI configuration in the repository, so every gate above is a gate somebody has to remember.

**Appendix — generated token tables:** produced by `design-system/build/emit-docs.mjs` once the token files are authored, and appended below this line. Do not hand-edit them.
