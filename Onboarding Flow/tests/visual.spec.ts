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
  { id: "app-toast", route: "app:toast", note: "quick-capture confirmation, pinned visible" },

  // The doctor report. SEVEN states, and every one of them is here on purpose.
  //
  // Two of this repo's known gaps are the same gap: the Toast hid a dead code
  // path because nothing could photograph a 2.4s state, and ShareCardScreen is
  // still unbaselined because no route reaches it. The report has more states
  // than any other screen, so it got routes for all of them before it got a
  // single baseline. Depth is derived from fixture DATA, never from a flag, so
  // each of these is a photograph of what that data actually produces.
  { id: "app-report", route: "app:report", note: "ready — change block dominant (P6, no lock)" },
  { id: "app-report-redflags", route: "app:report-readyWithRedFlags", note: "ready + red-flag content (N3, conditional not a state)" },
  { id: "app-report-nochange", route: "app:report-noChange", note: "anchor and data, nothing moved — the guilt-risk case (P2)" },
  { id: "app-report-first", route: "app:report-first", note: "data but no prior visit — reframed to since-you-started" },
  { id: "app-report-sparse", route: "app:report-sparse", note: "too little to claim a trend — degrades, never invents one" },
  { id: "app-report-empty", route: "app:report-empty", note: "day one, two taps from Home — no shaming (P2/N2)" },
  { id: "app-report-exporting", route: "app:report-exporting", note: "export in flight" },
  { id: "app-report-failed", route: "app:report-failed", note: "export failed — the one place the report may fail" },
];

const SCREENS = [...ONBOARDING, ...APP];
const MODES = ["dark", "light"] as const;

// ── Flake attribution ────────────────────────────────────────────────────────
// There is an OPEN intermittent failure, roughly 1 run in 8-20, whose only
// symptom is that it reports no pixel-diff count. That absence is the whole
// clue: it means the run very likely never reached the comparison. Everything
// before the comparison is in gotoScreen(), and on a bare `await` a hang
// surfaces only as "Test timeout of 30000ms exceeded" — which names the test,
// not the step, so each occurrence has had to be re-guessed from scratch. One
// such guess (raise the screenshot timeout) was committed as a fix and was not
// one.
//
// So every await that can hang is bounded and named. The budgets are ~20x the
// measured cost of each step across 15 clean runs, which makes them useless as
// gates and decisive as diagnostics: nothing legitimate approaches them, and
// whichever one trips identifies the stalled step by name.
async function step<T>(label: string, budgetMs: number, work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const bail = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(
        `HARNESS STALL: "${label}" did not settle within ${budgetMs}ms.\n` +
        `This is the open intermittent failure, and this message is the diagnosis it was missing.\n` +
        `A trace was retained (playwright.config.ts sets trace: retain-on-failure) — open it with\n` +
        `  pnpm exec playwright show-trace test-results/**/trace.zip\n` +
        `and check, in this order: did the font request complete; did the page clock advance past\n` +
        `runFor(); did the dev server answer the navigation at all.`
      )),
      budgetMs,
    );
  });
  try {
    return await Promise.race([work, bail]);
  } finally {
    clearTimeout(timer!);
  }
}

async function gotoScreen(page: Page, route: string, mode: string) {
  // Clock must be installed before any app script runs, or the app will have
  // already captured the real Date.
  await step("clock.install", 10_000, page.clock.install({ time: FROZEN_CLOCK }));

  await step(
    "page.goto",
    15_000,
    page.goto(`/?screen=${encodeURIComponent(route)}&mode=${mode}&motion=off`).then(() => undefined),
  );

  // Drive every pending timer to completion deterministically.
  //
  // NOTE for the flake hunt: this PAUSES the page clock at T+SETTLE_MS. Any
  // in-page promise that resolves off a setTimeout AFTER this line therefore
  // never settles — which is one of the few mechanisms that would produce a
  // silent hang rather than a slow pass, and it is why the font work below is
  // bounded separately.
  await step("clock.runFor", 15_000, page.clock.runFor(SETTLE_MS));

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
  await step("fonts.load + fonts.ready", 15_000, page.evaluate(async () => {
    await Promise.all([
      document.fonts.load("400 16px Inter"),
      document.fonts.load("500 16px Inter"),
      document.fonts.load("600 16px Inter"),
    ]);
    await document.fonts.ready;
  }));

  const missing = await step("fonts.check", 10_000, page.evaluate(() =>
    ["400", "500", "600"].filter((w) => !document.fonts.check(`${w} 16px Inter`))
  ));
  expect(missing, `Inter weight(s) ${missing.join(", ")} failed to load — capturing with a system-font fallback would bake wrong text metrics into the baseline`).toEqual([]);

  // Confirm motion suppression actually applied, rather than trusting the URL.
  await expect(page.locator("html")).toHaveClass(/no-motion/, { timeout: 10_000 });
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
