// ============================================================
// FILE: tests/visual.spec.ts
// PURPOSE: Capture and verify one baseline per screen per colour mode.
//
// These baselines are the proof obligation for the design-system extraction:
// swapping ~200 hardcoded literals for generated tokens must not move a single
// pixel. Captured before the swap, re-run after it.
//
// DETERMINISM — four separate sources of nondeterminism are pinned:
//
//   1. CSS animation/transition  -> ?motion=off adds .no-motion, collapsing all
//      durations to 0s. Necessary because CSS animation runs on the compositor
//      and is NOT affected by freezing the JS clock.
//   2. JS timers                 -> page.clock.install() then runFor(), so
//      setInterval/setTimeout-driven states (plan-loading progress, toast
//      auto-dismiss, check-in step advance) reach a settled state on command
//      rather than whenever the machine gets round to it.
//   3. Wall-clock reads          -> the same installed clock pins Date.now().
//      MainApp renders `new Date().toLocaleDateString(...)` in the check-in
//      confirmation, and Onboarding derives "Day N" from Date.now(); without
//      pinning, those baselines would rot after one day.
//   4. Webfont loading           -> Inter is now SELF-HOSTED (src/fonts/), which
//      took the network off the critical path but did NOT make the font
//      synchronous: a face the layout has not demanded yet is still never
//      requested. So every weight is loaded explicitly below, then asserted —
//      a silent fallback to system sans would produce a plausible-looking but
//      wrong baseline that locks in the wrong text metrics.
// ============================================================

import { test, expect, type Page } from "@playwright/test";

// A fixed instant, chosen to match the "9:41" status bar the design uses.
const FROZEN_CLOCK = new Date("2026-06-15T09:41:00.000Z");

// Long enough for every timer chain in the app to settle:
// plan-loading runs a setInterval every 80ms for 25 ticks (~2s) then a 300ms
// setTimeout; the toast dismisses at 2400ms; the check-in step advances at
// 500ms. 6s clears all of them with margin.
const SETTLE_MS = 6_000;

type Screen = { id: string; route: string; note: string };

// Every screen the dev route can address.
//
// KNOWN COVERAGE GAP: the six Timeline filter states and the onboarding
// default-vs-selected states are internal component state with no dev-route
// hook, so they are not baselined. They reuse the same chip, card and border
// tokens as the screens below, so token coverage is unaffected — but a change
// scoped only to a filter state would not be caught. Recorded here rather than
// papered over.
const ONBOARDING: Screen[] = [
  { id: "ob-00-welcome", route: "ob:0", note: "brand moment" },
  { id: "ob-01-recovery-type", route: "ob:1", note: "option cards; disabled CTA" },
  { id: "ob-02-condition", route: "ob:2", note: "body-area + condition chips" },
  { id: "ob-03-start-date", route: "ob:3", note: "date field, empty state" },
  { id: "ob-04-symptoms", route: "ob:4", note: "4 category groups — category hues" },
  { id: "ob-05-pain-baseline", route: "ob:5", note: "slider track gradient + thumb" },
  { id: "ob-06-goal", route: "ob:6", note: "goal rows" },
  { id: "ob-07-notifications", route: "ob:7", note: "consent, both paths equal" },
  { id: "ob-08-plan-loading", route: "ob:8", note: "loading -> ready, settled via clock" },
  { id: "ob-09-free-plan", route: "ob:9", note: "celebration" },
  { id: "ob-10-premium-teaser", route: "ob:10", note: "locked-row treatment" },
  { id: "ob-11-trial-paywall", route: "ob:11", note: "plan cards, SAVE badge" },
];

const APP: Screen[] = [
  { id: "app-home", route: "app:home", note: "quick capture, Day-N card, weekly card" },
  { id: "app-timeline", route: "app:timeline", note: "entries, rest-day gap, FAB" },
  { id: "app-progress", route: "app:progress", note: "corridor band, insight sentence, history fade" },
  { id: "app-profile", route: "app:profile", note: "rows incl. safety entry point" },
  { id: "app-checkin", route: "app:checkin", note: "fast-path overlay (C1)" },
  { id: "app-paywall", route: "app:paywall", note: "dismissible bottom sheet (P9)" },
];

const SCREENS = [...ONBOARDING, ...APP];
const MODES = ["dark", "light"] as const;

async function gotoScreen(page: Page, route: string, mode: string) {
  // Clock must be installed before any app script runs, or the app will have
  // already captured the real Date.
  await page.clock.install({ time: FROZEN_CLOCK });

  await page.goto(`/?screen=${encodeURIComponent(route)}&mode=${mode}&motion=off`);

  // Drive every pending timer to completion deterministically.
  await page.clock.runFor(SETTLE_MS);

  // Fonts: actively LOAD each weight, then verify.
  //
  // `document.fonts.ready` alone is not sufficient and was intermittently
  // failing this assertion. It resolves once font loading is idle, but a face
  // the layout has not demanded yet is never requested at all — so "idle" can
  // mean "never started". document.fonts.load() requests the face and resolves
  // when it is actually usable.
  //
  // Every weight the app renders is loaded explicitly, because checking only
  // 400 would pass while 600 was still missing and the headings silently fell
  // back.
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load("400 16px Inter"),
      document.fonts.load("500 16px Inter"),
      document.fonts.load("600 16px Inter"),
    ]);
    await document.fonts.ready;
  });

  const missing = await page.evaluate(() =>
    ["400", "500", "600"].filter((w) => !document.fonts.check(`${w} 16px Inter`))
  );
  expect(missing, `Inter weight(s) ${missing.join(", ")} failed to load — capturing with a system-font fallback would bake wrong text metrics into the baseline`).toEqual([]);

  // Confirm motion suppression actually applied, rather than trusting the URL.
  await expect(page.locator("html")).toHaveClass(/no-motion/);
}

for (const mode of MODES) {
  test.describe(`${mode} mode`, () => {
    for (const screen of SCREENS) {
      test(`${screen.id} — ${screen.note}`, async ({ page }) => {
        await gotoScreen(page, screen.route, mode);
        await expect(page).toHaveScreenshot(`${screen.id}-${mode}.png`, { fullPage: true });
      });
    }
  });
}
