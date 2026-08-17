I want you to **document the existing Figma Make project in the CODE ONLY**.

### CRITICAL RULE — DO NOT MODIFY THE DESIGN

Do **not** change, redesign, reposition, resize, restyle, rename, remove, or add anything to the existing Figma Make UI/design.

Do not change any visual elements, layouts, colors, typography, components, images, icons, animations, interactions, navigation, or content.

Do not make any improvements to the design.

Your ONLY task is to add **clear developer comments/documentation inside the generated code** so that I can download the code and use it as a reference when rebuilding the project in VS Code.

The existing Figma Make design must remain visually and functionally identical.

---

## PURPOSE OF THE COMMENTS

I will use the downloaded code as a **visual and interaction reference for a future VS Code/Codex development session**.

The comments should allow another developer or AI coding agent to understand:

* what each screen is supposed to look like
* what each component does
* what each button does
* where each button leads
* what happens when a user taps/clicks something
* what animations are being used
* what transitions are being used
* animation duration/timing where known
* transition duration/timing where known
* delays before reactions occur
* easing curves where known
* whether an interaction is immediate or delayed
* what happens before, during, and after an interaction
* what elements appear/disappear
* what elements move, scale, fade, slide, pulse, rotate, etc.
* what state changes occur
* what navigation transition occurs
* what information is displayed or hidden
* the intended behavior of interactive components

The comments should describe the **implementation/behavior side of the project**, not merely say what something visually looks like.

---

## COMMENT EVERY IMPORTANT INTERACTION

For every important interactive element, add a useful comment explaining its behavior.

For example:

```js
// INTERACTION: Heart icon is tapped by the user.
// ACTION: Starts the heart-pulse animation.
// ANIMATION: Scale increases slightly, then returns to the original scale.
// DURATION: Approximately 300ms.
// PURPOSE: Provides visual feedback that the user's action was registered.
```

For buttons:

```js
// BUTTON: "Continue"
// ACTION: Advances the onboarding flow to the next screen.
// NAVIGATION: Onboarding Step 1 → Onboarding Step 2.
// TRANSITION: Existing screen transition used by the design.
// TIMING: Document the duration/delay if available.
// IMPORTANT: Preserve the exact visual transition when implementing in VS Code.
```

For navigation:

```js
// NAVIGATION: This control takes the user from the current screen to the Recovery Dashboard.
// TRANSITION: Document the exact transition currently implemented.
// DURATION: Document timing if available.
// STATE: Document any state/data that changes during navigation.
```

---

## DOCUMENT ANIMATIONS IN DETAIL

Whenever an animation exists, document it directly in the relevant code section.

For example:

```js
// ANIMATION: Heartbeat / pulse animation.
// TRIGGER: Starts when the onboarding illustration becomes visible.
// MOTION: Heart scales up and down to simulate a heartbeat.
// DURATION: Document actual duration if available.
// LOOP: Document whether it repeats continuously, repeats a fixed number of times, or runs once.
// EASING: Document the easing curve if identifiable.
// DELAY: Document any initial delay.
// PURPOSE: Creates the impression of a living/active heartbeat.
```

Do this for **all animations you can identify**, including:

* pulse
* heartbeat
* fade in
* fade out
* slide
* scale
* bounce
* rotation
* progress animations
* loading animations
* button feedback
* card animations
* modal animations
* screen transitions
* icon animations
* onboarding animations
* success/error states
* expandable/collapsible elements
* scrolling-related animations
* delayed UI reactions

If an exact duration, delay, easing value, or animation setting exists in the code, document the actual value rather than guessing.

For example:

```js
// ANIMATION TIMING:
// duration: 400ms
// delay: 150ms
// easing: ease-out
// repeat: infinite
```

If the exact value cannot be determined, explicitly say:

```js
// TIMING: Exact duration not identifiable from the current implementation.
```

**Do not invent technical values.**

---

## DOCUMENT COMPONENT PURPOSE

For important components, add comments explaining why the component exists and what role it plays.

Example:

```js
// COMPONENT PURPOSE:
// This card represents the user's current recovery progress.
// It displays the current recovery stage and provides access to the detailed progress view.
```

For larger sections:

```js
// SECTION: Recovery Progress
// PURPOSE: Gives the user a quick overview of their current recovery status.
// USER ACTIONS: User can tap the progress card to open detailed recovery information.
// VISUAL BEHAVIOR: Preserve the existing layout and styling exactly.
```

---

## DOCUMENT SCREEN-LEVEL BEHAVIOR

At the beginning of each major screen/page/component, add a concise developer comment describing:

1. Screen name
2. Purpose
3. Entry point
4. Main UI elements
5. Available user actions
6. Navigation destinations
7. Important animations
8. Important transitions
9. Important state changes

Example:

```js
// ============================================================
// SCREEN: Onboarding — Welcome
// PURPOSE: Introduces the user to the application.
// ENTRY: First screen shown during onboarding.
// PRIMARY ACTION: Continue button advances to the next onboarding screen.
// SECONDARY ACTION: Document any skip/back controls if present.
// ANIMATIONS: Heart illustration uses the existing heartbeat/pulse animation.
// TRANSITIONS: Document the existing screen transition and timing.
// IMPLEMENTATION NOTE: This comment describes the existing design only.
// ============================================================
```

---

## DOCUMENT STATES

Where relevant, document different UI states.

For example:

```js
// STATE: DEFAULT
// The component displays its normal resting state.

// STATE: PRESSED
// Document the visual/animation response when the user presses it.

// STATE: LOADING
// Document what changes while the action is processing.

// STATE: SUCCESS
// Document the resulting UI state.

// STATE: ERROR
// Document the resulting UI state and user feedback.
```

If a component has hover, focus, pressed, selected, disabled, loading, success, or error states, document them where they exist.

---

## DOCUMENT TIMING

Timing is particularly important because I will use this code as a reference when recreating the application.

Whenever timing information is available, document:

* animation duration
* transition duration
* delay
* debounce timing
* loading duration
* interaction response timing
* stagger timing
* sequence timing
* auto-dismiss timing
* progress timing

Use real values from the implementation whenever possible.

Example:

```js
// TIMING:
// Interaction begins immediately on press.
// Visual feedback animation: 200ms.
// Screen transition: 300ms.
// Post-transition delay: 100ms.
```

Again: **never invent timings that do not exist.**

---

## DOCUMENT SEQUENCES

If multiple animations/interactions happen sequentially, explain the sequence.

Example:

```js
// INTERACTION SEQUENCE:
// 1. User taps Continue.
// 2. Button provides immediate press feedback.
// 3. Current onboarding content begins exit animation.
// 4. Next onboarding content enters.
// 5. Heart illustration begins its existing pulse animation.
// 6. New screen becomes interactive.
// Document actual timing for each stage if available.
```

---

## DOCUMENT IMPORTANT CODE RELATIONSHIPS

Where useful, explain how components relate to one another.

For example:

```js
// RELATIONSHIP:
// This button controls the onboarding state.
// Changing the onboarding index causes the corresponding onboarding content
// and illustration to change.
// Preserve this relationship when recreating the functionality in VS Code.
```

---

## DO NOT OVER-COMMENT EVERY SINGLE LINE

Do not add meaningless comments such as:

```js
// This is a div
// This is a button
// This imports React
```

Only add comments where they provide useful information for rebuilding the application.

Focus on:

* design intent
* interaction behavior
* animation behavior
* transition behavior
* navigation
* component purpose
* state changes
* timing
* relationships between components
* implementation-relevant details

---

## IMPORTANT: PRESERVE THE EXISTING CODE

Do not rewrite the application unnecessarily.

Do not refactor the architecture.

Do not change variable names unless absolutely necessary for adding documentation.

Do not change functionality.

Do not change styling.

Do not change animations.

Do not optimize anything.

Do not fix anything.

Do not introduce new dependencies.

Do not change the design to make the comments easier to implement.

The goal is simply:

**EXISTING DESIGN + EXISTING CODE + HIGH-QUALITY DEVELOPER COMMENTS**

---

## FINAL VERIFICATION

Before finishing, verify that:

1. The Figma Make design is unchanged.
2. No visual elements were modified.
3. No layout was modified.
4. No colors, fonts, spacing, icons, images, or content were modified.
5. Existing animations were not modified.
6. Existing interactions were not modified.
7. Comments were added only to the code.
8. Important screens have screen-level documentation.
9. Important buttons have action/navigation documentation.
10. Important animations have animation documentation.
11. Important transitions have transition documentation.
12. Timing values are documented where available.
13. Unknown timing values are explicitly marked as unknown rather than invented.
14. The comments are useful to an AI coding agent that will later recreate the application in VS Code.
15. The downloaded code can be used as a technical/visual reference without needing to inspect the Figma design to understand the intended interactions.

**Again: DO NOT TOUCH THE EXISTING FIGMA MAKE DESIGN.**

This is a **CODE DOCUMENTATION ONLY** task.
