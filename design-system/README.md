# Recovery Companion — Design System

One token source, two platforms, zero drift.

```
tokens/*.json          ← the only place you edit
   ↓  build.mjs (resolve refs, validate, emit)
dist/                  ← generated, committed, never hand-edited
   ├── tokens.json         resolved, both modes — what the checks audit
   ├── tokens.css          Tailwind @theme + [data-theme="light"]
   ├── tokens.web.ts       legacy D + theme(mode) + scale
   └── tokens.native.ts    React Native shapes
   ↓  vendored into the consumer
Onboarding Flow/src/components/tokens.generated.ts
Onboarding Flow/src/tokens.generated.css
```

## Commands

Nothing here has dependencies — the build and the checks are plain Node, no
install step. Only the prototype needs `pnpm install`.

```bash
node design-system/build/build.mjs           # rebuild all artifacts
node design-system/build/build.mjs --check   # fail if dist/ is stale  (drift gate)
node design-system/checks/contrast.mjs       # WCAG AA audit, both modes
node design-system/checks/contrast.mjs --all # include passing pairs
node design-system/checks/restricted.mjs     # non-negotiables N1-N5 in consumer code
node design-system/checks/coverage.mjs       # the literal ratchet
node design-system/checks/coverage.mjs --list   # ... and what is still hardcoded
node design-system/extraction/harvest.mjs    # re-inventory hardcoded literals

cd "Onboarding Flow"
pnpm install
pnpm exec playwright install chromium        # once, before the first visual run
pnpm typecheck                               # token name typos, via as-const unions
pnpm test:visual                             # 36 baselines
pnpm test:visual:update                      # re-approve after an INTENDED change
```

There is no CI configuration and no single `verify` entry point; the gates above
are run by hand. Recorded as a gap rather than implied — a gate nobody runs is
not a gate.

## The three layers

**`primitives.json`** — raw values with no product meaning: the palette, the alpha ladder, spacing, radii, durations, easing curves, type scale. Screens may **never** reference these; a primitive has no mode pairing and no accessibility contract.

**`semantic.json`** — roles, **mode-paired in a single map**:

```json
"surface.raised": { "$value": { "dark": "{color.indigo.800}", "light": "{color.paper.0}" } }
```

This shape is the point. The system it replaced kept two parallel maps — `text`/`lText` in `tokens.ts`, and a separate `@theme` block in CSS — each with a comment saying they must be kept in sync. They were not: `lTextMut` and `safety` existed in one and were missing from the other. With pairing, a role missing its light value is a build failure.

**`patterns.json`** — product concepts with fixed contracts (corridor, rest, lock, history fade, insight, fast path, share, report…), defined once so they cannot drift between screens. References semantics only.

## Authoring rules

- **Never edit `dist/` or the vendored `*.generated.*` files.** The next build overwrites them and `--check` fails the moment they diverge.
- **No platform strings in the token layer.** No `rgba()`, no `box-shadow`, no `var()`, no `px`. Only numbers, 6-digit hex, `{refs}` and structured objects. Emitters construct the platform strings — that is what lets one source serve both CSS and React Native.
- **Translucency uses the alpha ladder**, never a free float: `{ "base": "{color.accent.default}", "alpha": "{alpha.tint27}" }`. Emitters produce an 8-digit hex, which both CSS and RN parse natively.
- **Easing is bezier control points**, never the keyword `ease-out` — the keyword resolves to different curves in different engines, and this system targets two.
- **Adding a pair to `checks/pairs.manifest.json` is part of adding a colour.** A combination not declared there is not an approved combination.

## What the build enforces

Five validators, each negative-tested:

| | Catches |
|---|---|
| **V1** mode pairing | A colour role missing its light value |
| **V2** category completeness | A `category.*` family without all of `mark` + `ink` + `icon` + `label` — this is how "never meaning by colour alone" becomes mechanical |
| **V3** reserved colour | The safety hue resolving anywhere outside `color.safety.*` |
| **V4** forbidden names | `target`, `streak`, `missed`, `broken`, … |
| **V5** shadow spread | A shadow React Native could not express |

V4 is worth dwelling on. The product principles say a corridor is a range you cannot fail and consistency cannot visibly break. Those are enforced by the **shape of the token set**: there is no `corridor.target` token, so a target line cannot be built; there is no `streak` token, so nothing can break. The rule lives in the system, not in a reviewer's memory.

## `mark` vs `ink`

The single most important distinction here. Every category hue — and the safety hue — splits in two:

- **`mark`** — fills, chart lines, chips, dots. Graphical.
- **`ink`** — text, icons, meaningful strokes. Must meet contrast.

They exist separately because the same pastel that reads comfortably on a dark surface fails badly on white. Using a `mark` value as text is the most likely accessibility regression in this system, which is why the two have different names rather than one shared token.

## Contrast

`checks/contrast.mjs` audits a declared manifest of permitted pairs. Two things it gets right that most checkers do not:

1. **Alpha is composited over its declared backdrop before measuring.** Measuring a 27%-alpha border as though it were opaque reports a contrast nobody sees.
2. **Every pair is evaluated in both modes**, from one declaration. Under the previous shape each pair was hand-written twice, so a pair declared only for dark went silently unchecked on light — exactly the blind spot that let the light palette ship unmeasured.

Failures are split into **regressions** (fail the build) and **debt** (known, tracked in `RECONCILIATION.md` with a fix direction, reported every run). Debt is scoped per mode, because most known failures fail on light only — flagging the whole pair would exempt the dark side too.

Current state: **110 pair-mode combinations, 0 regressions, 0 debt.** The 25 pairs
originally accepted as debt were all resolved in v1; the mechanism is retained
because the next colour added will need it.

**What this number does not mean.** It measures the pairs the manifest declares,
not the pairs the app renders. A combination nobody wrote down is not audited and
does not appear in the count — so "0 debt" is a statement about the manifest's
contents, and it is only as good as the manifest's coverage.

The count went 90 → 110 because a read-through of the screens found six rendered
combinations that had never been declared, and **five of them failed** — one at
1.58:1, in both modes, on a button label. Adding a pair when you add a colour is
not bookkeeping; it is the entire mechanism. `RECONCILIATION.md` has the table.

## Provenance

Figma is canonical for **colour in dark mode** and nothing else. It has no light-mode frames, no Variables, and its geometry is corrupted by the Figma Make paste (1.141px borders, radii in the tens of millions, sizes like 5.988 where 6 is meant). The code is canonical for light mode, geometry, gradients and motion. Full analysis in `RECONCILIATION.md`.

## Layout

```
DESIGN_CRITERIA.md        rules and intent (spec §8 mandate)
design-system/
  RECONCILIATION.md       every Figma-vs-code disagreement + resolution
  tokens/                 THE SOURCE
  build/build.mjs         resolver, validators, emitters
  checks/                 contrast.mjs + pairs.manifest.json
  extraction/             harvest.mjs, ledger.json, screens.json
  dist/                   generated, committed
```
