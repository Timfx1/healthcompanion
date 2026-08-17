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

## Accepted debt — contrast

25 pairs fail WCAG AA and are **not** being fixed in v1, per decision. Each is tracked with its measured ratio (alpha composited over its declared backdrop, evaluated per mode) and a fix direction.

| Pair group | Ratio | Fix direction |
|---|---|---|
| 5 category hues as `ink` on light | 1.47–1.96 | The `mark`/`ink` split exists for this. `ink` gets darkened variants; `mark` keeps the pastel. |
| 5 category hues as `mark` on light (3:1 non-text) | 1.47–1.96 | Darken, or pair with a stroke. Note the `mark`/`ink` split alone does **not** fix this — the fills fail too. |
| `text.muted` on all 3 dark surfaces | 2.25–2.71 | Lighten. It is documented for placeholders and fine print, which is body-text usage. |
| `text.muted` on light | 2.04–2.18 | Darken. Also the token missing from the `@theme` block — see below. |
| accent / accent-light as text on light | 3.93 / 2.84 | Needs a dedicated on-light accent text value. |
| 27%-alpha tint border, both modes (13 uses) | 1.40 / 1.38 | Either strengthen, or reclassify as decorative — only honest if the border is never the sole affordance. |

**Fixed in v1** (the two severe failures): white on the CTA gradient (4.19 at the dark stop, **2.84** at the light stop, and the label is 16px/600 = body text) and the safety colour on light surfaces (3.78 / 3.54). Both are recorded in `DESIGN_CRITERIA.md` §11.

---

## The drift bug this work closes

`tokens.ts` and `index.css` both declared themselves the source of truth and both carried a "keep in sync" comment. They were already out of sync: `lTextMut` (`#B0ACCF`) and `safety` (`#E05548`) exist in `tokens.ts` and are absent from the `@theme` block.

Both are now generated from one mode-paired source, so a missing light value is a schema failure at build time rather than a comment nobody read.

---

## Not reconciled — no design exists

These are absent from **both** sources, so there is nothing to reconcile. Token slots are reserved; the screens are not designed.

Doctor report preview (the spec flagship, linked from Home and Profile), share-card preview, welcome-back state, safety / red-flags screen, appointment detail, questions-for-doctor, photo compare, journal entry, medication detail, home widget.

`ShareCardScreen` exists in code but not in Figma — the only asset in that direction.
