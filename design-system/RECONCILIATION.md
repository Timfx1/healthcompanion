# Reconciliation — Figma vs. code

Every disagreement between the Figma file and the prototype code, with how it was resolved and why. Nothing is resolved silently; that is how a canonical source rots.

**Sources**
- Figma `Healthcompaniondesigns` (`Hnu6aDZKAhTA7NShQemXZW`), 30 content frames, **dark mode only**, **no Variables** (`get_variable_defs` → `{}`).
- `Onboarding Flow/src/` — the React web prototype, dark **and** light.

**Both are exports of the same Figma Make session.** They are not independent sources, so agreement is the expected result and any disagreement is evidence of an export artifact rather than a design decision. That framing turned out to be exactly right.

---

## The headline result

**Across every colour sampled, Figma and the code agree exactly. Zero colour divergences.**

| Role | Value | Figma | Code |
|---|---|---|---|
| surface base | `#15141F` | ✅ | ✅ |
| surface raised | `#1E1D2E` | ✅ | ✅ |
| surface border | `#2E2C45` | ✅ | ✅ |
| accent | `#7C6FCD` | ✅ | ✅ |
| accent light | `#9B8FE0` | ✅ | ✅ |
| accent dim | `#3D3668` | ✅ | ✅ |
| text primary | `#F0EFFE` | ✅ | ✅ |
| text secondary | `#9B97B8` | ✅ | ✅ |
| category pain | `#F2A69E` | ✅ | ✅ |
| category sleep | `#9EC3F5` | ✅ | ✅ |
| category energy | `#F5D08A` | ✅ | ✅ |
| category mood | `#A8D9B8` | ✅ | ✅ |
| category meds | `#C9B8F0` | ✅ | ✅ |

The alpha idiom matches too: Figma renders the category icon tiles as `rgba(<hue>, 0.13)`, which is the same `0.13` tint step the code writes as `${hue}22`. `0x22 / 255 = 0.133`.

---

## The finding that changes the policy

**Figma's geometry is corrupted by the Figma Make paste. Its colours are not.**

Evidence, straight from `get_design_context`:

| What Figma reports | What it should be | Verdict |
|---|---|---|
| `border-[1.141px]` on every bordered element | `1px` | paste artifact |
| `rounded-[38271300px]`, `rounded-[39639880px]` | "fully rounded" (`9999px`) | paste artifact |
| `size-[5.988px]`, `size-[11.994px]`, `w-[15.986px]`, `size-[23.988px]`, `size-[39.991px]` | `6`, `12`, `16`, `24`, `40` | paste artifact |
| `w-[402.622px]`, `h-[874.819px]`, `flex-[806.028_0_0]` | `402`, `874`, `806` | paste artifact |
| `blur 62.146px` on the welcome glow | a round value | paste artifact |

These are not design decisions. No designer specifies a 1.141px border or a 38-million-pixel radius. They are float noise from pasting a rendered Figma Make tree onto a canvas.

**Resolution — the standing rule is amended:**

| Value class | Canonical source | Reason |
|---|---|---|
| **Colour** (incl. alpha) | **Figma** | Exact, verified, no artifacts. Confirmed identical to code anyway. |
| **Geometry** — size, radius, border width, spacing | **Code** | Figma's are demonstrably corrupted. Adopting them would bake float noise into the token layer and make every RN value wrong. |
| **Gradients** | **Code** | See below — Figma reports a transformed angle and an expanded stop list. |
| **Shadows** | **Either** | Equivalent under a unit conversion — see below. |
| **Motion / interaction** | **Code** | Figma is a static paste; it carries no timing at all. |
| **Light mode** | **Code** | Figma has no light frames. |

This narrows "Figma is the visual source of truth" to **colour**, which is the one thing it is actually authoritative about here.

---

## Resolved individually

### R1 — CTA gradient angle: `170.70075831793662deg` (Figma) vs `135deg` (code)
**Resolved: code.** Figma stores gradients as a transform matrix and converts to CSS degrees on export; the conversion is affected by the element's aspect ratio, so the reported angle is not the authored one. The absurd precision (14 decimal places) is the tell. `135deg` is the clean authored value.

### R2 — CTA shadow: `drop-shadow(0 4px 10px …)` (Figma) vs `0 4px 20px` (code)
**Resolved: not a divergence.** Figma's blur parameter is a radius; CSS `blur-radius` is approximately twice that. `10 → 20` is exactly the expected conversion — the same ×2 relationship that governs iOS `shadowRadius`, which the native emitter already has to apply. Both are stored once as `blur: 20` (CSS convention) and converted per platform.

### R3 — Page background radial: 3 stops (Figma) vs 2 stops (code)
**Resolved: not a divergence.** Figma reports `#23204A → rgba(24,22,48) @50% → #0D0C16`. The sRGB midpoint of the code's two stops is `((35+13)/2, (32+12)/2, (74+22)/2) = (24, 22, 48)` — precisely Figma's middle stop. Figma made the implicit interpolation explicit. Keep two stops.

### R4 — PREMIUM badge gradient: 6 stops (Figma) vs 2 stops (code)
**Resolved: not a divergence, same cause as R3.** Figma expands a two-stop gradient carrying an alpha ramp into a multi-stop approximation (`0%, 25%, 50%, 75%, 87.5%, 100%`). The endpoints match the code's `accentD → accent` at 33% alpha. Keep two stops.

### R5 — Locked-row treatment
**Resolved: adopt Figma's measured values into `lock.*`.** Figma gives the precise treatment the code had scattered inline: row `opacity: 0.70`, badge `#2E2C45` at 24px fully-rounded with a 12px glyph, category icon tile at 34px / radius 12 / hue at 0.13 alpha, and the row label demoted to `text.secondary` rather than `text.primary`. This is now defined once as a pattern family.

---

## Contrast — the 25 accepted-debt pairs, and how they closed

All 25 were resolved in v1. `contrast.mjs` now reports **0 regressions and 0 debt
across 90 pair-mode combinations.** Kept here as the record of what each was and
what actually fixed it, because the fix directions are the reason several
primitives exist and would otherwise look arbitrary.

| Pair group | Was | Resolution |
|---|---|---|
| 5 category hues as `ink` on light | 1.47–1.96 | `color.pastelInk.*` added — dedicated darkened values at 4.51–4.54:1. `mark` keeps the pastel. |
| 5 category hues as `mark` on light (3:1 non-text) | 1.47–1.96 | **Reclassified to `decorative`, not darkened.** A mark is a fill that never carries meaning alone — a chip always has a label, an icon tile always has a glyph — so 1.4.11 does not apply. This is the one resolution that changed the question rather than the value, and it is only honest while that premise holds. |
| `text.muted` on all 3 dark surfaces | 2.25–2.71 | `ink.400` (`#8D89A8`) replaced `ink.500`; 4.52–5.45:1. The old value is retained for non-text use only. |
| `text.muted` on light | 2.04–2.18 | `paper.500` (`#716AA9`) replaced `paper.400`; 4.54–4.84:1. |
| accent / accent-light as text on light | 3.93 / 2.84 | `lavender.650` added as the on-light accent text step; 4.55:1. |
| 27%-alpha tint border, both modes (13 uses) | 1.40 / 1.38 | **Reclassified to `decorative`**, on the recorded grounds that selection is carried by three simultaneous signals (tinted fill, border, trailing check — Figma node 1:222). Reverts to `ui-boundary` the moment a selected state drops the fill or the check. |

Two of the six groups closed by reclassification rather than by changing a
value. That is legitimate under WCAG — both 1.4.11 and the decorative exemption
turn on whether the presentation is *essential* to conveying the meaning — but it
means those two carry a standing premise that can silently expire. Both premises
are written into `pairs.manifest.json` at the pair, next to the value they
excuse, rather than only here.

**Also fixed in v1** (the two severe failures): white on the CTA gradient (4.19 at the dark stop, **2.84** at the light stop, and the label is 16px/600 = body text) and the safety colour on light surfaces (3.78 / 3.54). Both are recorded in `DESIGN_CRITERIA.md` §11.

---

## The blind spot behind the zero

Reaching 0 debt did not mean the palette was clean. It meant every **declared**
pair passed. A sweep of what the screens actually render found six combinations
that were never declared, so the audit had never looked at them — and five of the
six failed, two of them worse than anything that had ever been tracked as debt.

| Site | Combination | Was | Now |
|---|---|---|---|
| "View", pre-appointment nudge | white on the sleep **mark** fill | **1.81** both modes | 9.51 via `onMark` |
| "Save to timeline", weekly card | white on the mood **mark** fill | **1.58** both modes | 10.91 via `onMark` |
| Trend badge word, every chart | **mark** as text on a 13% tint of itself | 1.40–1.80 light | 4.83–4.96 via `ink` |
| Fast-path selected word (C1) | **mark** as text on a 27% tint of itself | 1.41–1.65 light | 4.55–4.59 via `ink` |
| Milestone title, Timeline | **mark** as text on the card | 1.81 light | 4.51–4.54 via `ink` |
| Sparkline data line | **mark** as a data stroke | 1.47–1.96 light | 4.80–4.84 via `ink` |

Three things this says, none of them about the palette:

**1. The two worst were mode-invariant, which is why mode-pairing did not catch
them.** Every mechanism in this system is built around the dark/light split. A
pastel fill is the same colour in both modes, so white on it fails identically in
both — and a failure that does not differ between modes is invisible to a system
whose whole shape is "compare the modes". `onMark` exists because there was no
approved answer to "what colour is a label on a category fill", so two call sites
invented `#fff`.

**2. The ink values were solved against the wrong backdrop.** They were
calibrated on plain white and cleared 4.51–4.54 there, but category ink almost
never sits on plain white — it sits inside a chip or a selected card filled with
a tint of its own mark, which lifts the backdrop toward the text. On the real
backdrops the original values gave 4.44–4.61 at 13% and 4.08–4.36 at 27%. This is
the same error as the dayCard gradient: a pair measured against a surface the
text does not actually sit on. Both the 13% and 27% backdrops are now declared.

**3. Every one of them arrived through a `color: string` prop or field.** Not one
came from a direct token reference. A call site that knows "this row is about
sleep" cannot correctly choose mark-vs-ink, because that depends on whether the
value will be painted as a fill or a stroke — which only the component knows. The
components now take a category NAME and resolve the role themselves, so the call
site has nothing left to get wrong. That is the durable fix; recalibrating the
values was only the arithmetic.

**Still open.** The manifest is still hand-maintained, and nothing verifies that
it covers what the screens render — this sweep was done by reading the code, and
the next undeclared combination will be just as invisible. See the open items in
`DESIGN_CRITERIA.md` §11.

---

## The drift bug this work closes

`tokens.ts` and `index.css` both declared themselves the source of truth and both carried a "keep in sync" comment. They were already out of sync: `lTextMut` (`#B0ACCF`) and `safety` (`#E05548`) exist in `tokens.ts` and are absent from the `@theme` block.

Both are now generated from one mode-paired source, so a missing light value is a schema failure at build time rather than a comment nobody read.

---

## Not reconciled — no design exists

These are absent from **both** sources, so there is nothing to reconcile. Token slots are reserved; the screens are not designed.

Doctor report preview (the spec flagship, linked from Home and Profile), share-card preview, welcome-back state, safety / red-flags screen, appointment detail, questions-for-doctor, photo compare, journal entry, medication detail, home widget.

`ShareCardScreen` exists in code but not in Figma — the only asset in that direction.
