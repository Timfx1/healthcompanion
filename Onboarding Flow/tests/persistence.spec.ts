// ============================================================
// BEHAVIOURAL tests — not visual ones.
//
// Every other spec in this directory photographs a screen. That proves a state
// can be DRAWN, which is exactly what it proves and no more: the report's export
// button was drawn correctly for months while its handler was missing, and the
// quick-capture save button was drawn correctly for the entire life of the
// component while having no onClick at all. Both were caught by reading code,
// because a baseline cannot see behaviour.
//
// This file exists for the claims a screenshot cannot make. The weekly
// reflection's whole value is that it is still there tomorrow, so the test
// RELOADS THE PAGE and re-reads it. A success state that photographs beautifully
// and evaporates on reload is worse than no feature, because the user spent
// something to write it.
//
//   open → write → save → persist → confirm → reopen → it is still there
//
// Each test gets a fresh browser context, so localStorage starts empty and these
// cannot pass on residue from each other.
// ============================================================

import { test, expect, type Page } from "@playwright/test";

const ROUTE = "/?screen=app:detail-weekly&mode=dark&motion=off";
const REFLECTION = "Stairs twice this week. Did not think about the ankle once on Thursday.";

async function open(page: Page) {
  await page.goto(ROUTE);
  await expect(page.getByText("What we noticed")).toBeVisible({ timeout: 15_000 });
}

test.describe("weekly reflection persistence", () => {
  test("survives a full page reload", async ({ page }) => {
    await open(page);

    // Nothing saved yet: the saved block must be absent rather than empty.
    await expect(page.getByTestId("saved-reflection")).toHaveCount(0);

    await page.getByPlaceholder("Optional — how did the week feel?").fill(REFLECTION);
    await page.getByTestId("save-reflection").click();

    // Confirm — the same document, before any reload has happened.
    await expect(page.getByTestId("saved-reflection")).toHaveText(REFLECTION);

    // THE ACTUAL CLAIM. A reload discards every scrap of React state; anything
    // that comes back came from storage.
    await page.reload();
    await expect(page.getByText("What we noticed")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("saved-reflection")).toHaveText(REFLECTION);
  });

  test("survives navigating away and back", async ({ page }) => {
    await open(page);
    await page.getByPlaceholder("Optional — how did the week feel?").fill(REFLECTION);
    await page.getByTestId("save-reflection").click();
    await expect(page.getByTestId("saved-reflection")).toHaveText(REFLECTION);

    // Leave the screen entirely, land somewhere unrelated, and come back. This
    // is what a user does; a reload is not.
    await page.goto("/?screen=app:home&mode=dark&motion=off");
    await expect(page.getByText("Day 46")).toBeVisible({ timeout: 15_000 });

    await open(page);
    await expect(page.getByTestId("saved-reflection")).toHaveText(REFLECTION);
  });

  test("an empty save is a no-op, not a refusal", async ({ page }) => {
    await open(page);

    // P1's contract, applied to a save button: pressing it with nothing to save
    // does nothing at all. No error, no shake, no message — there is nothing to
    // apologise for, which is the same reason the confirmation Toast has no
    // failure branch.
    await page.getByTestId("save-reflection").click();
    await expect(page.getByTestId("saved-reflection")).toHaveCount(0);

    await page.reload();
    await expect(page.getByText("What we noticed")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("saved-reflection")).toHaveCount(0);
  });

  test("storage is namespaced, so it cannot collide with anything else on the origin", async ({ page }) => {
    await open(page);
    await page.getByPlaceholder("Optional — how did the week feel?").fill(REFLECTION);
    await page.getByTestId("save-reflection").click();
    await expect(page.getByTestId("saved-reflection")).toHaveText(REFLECTION);

    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(keys).toContain("recovery-companion:weekly-reflection");
    // Nothing unnamespaced was written. The dev server origin is shared with
    // whatever else a developer has open on 127.0.0.1.
    expect(keys.filter((k) => !k.startsWith("recovery-companion:"))).toEqual([]);
  });
});

// ============================================================
// WELCOME-BACK — §10's "welcome-back flow works after simulated absence".
//
// That line of the Definition of Done had nothing behind it. `HomeScreen` has
// carried an `isWelcomeBack` prop since it was written, defaulted to false, and
// no caller ever passed it — so the state was unreachable, the copy inside it
// was unreviewable, and `welcomeBack.*` was the last dormant token family in the
// system. Dormancy has meant a real defect four times out of four, and it did
// again: `surface` was the product's only use of the alpha step named "Hairline
// fill", where every other tinted container uses the standard one.
//
// The absence is SIMULATED HONESTLY. These tests never set a flag — they write
// a timestamp into the same key the app reads and then load the app normally,
// so what is exercised is the rule, not a test hook. `?screen=app:welcome-back`
// exists for the BASELINE and is deliberately not used here: it forces the
// rendered state and writes no storage, which is the right thing for a
// photograph and the wrong thing for a proof.
// ============================================================

const HOME = "/?screen=app:home&mode=dark&motion=off";
const LAST_OPENED = "recovery-companion:last-opened";
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Seed the previous-open timestamp before the app boots and reads it.
 *
 * The write is GUARDED on the key being absent, and that guard is the whole
 * point of the reload test below. Playwright re-runs init scripts on every
 * navigation, so an unguarded seed would silently restore the old timestamp
 * after the reload and the "it does not come back" assertion would pass without
 * the app having done anything — a test that cannot fail, which this repository
 * has already shipped once in the literal ratchet.
 */
async function seedLastOpened(page: Page, daysAgo: number) {
  await page.addInitScript(
    ([key, value]) => {
      if (window.localStorage.getItem(key as string) === null) {
        window.localStorage.setItem(key as string, value as string);
      }
    },
    [LAST_OPENED, JSON.stringify(Date.now() - daysAgo * DAY_MS)] as const,
  );
}

async function openHome(page: Page) {
  await page.goto(HOME);
  await expect(page.getByText("Day 46")).toBeVisible({ timeout: 15_000 });
}

test.describe("welcome-back after simulated absence", () => {
  test("a long absence is met with warmth", async ({ page }) => {
    await seedLastOpened(page, 12);
    await openHome(page);

    await expect(page.getByTestId("welcome-back")).toBeVisible();
    // P2: the time-of-day greeting is suppressed, so there is exactly one warm
    // line rather than two competing ones.
    await expect(page.getByText("Good morning 👋")).toHaveCount(0);
  });

  test("it says nothing about what was missed", async ({ page }) => {
    await seedLastOpened(page, 12);
    await openHome(page);

    const copy = (await page.getByTestId("welcome-back").innerText()).toLowerCase();

    // THE ACTUAL PRINCIPLE, as a test. P2: "Returning after absence triggers
    // 'welcome back' warmth, never a recap of what was missed." A count is the
    // specific thing forbidden, so the card must contain no digit at all —
    // there is no benign number to show here, and "12 days away" and "you're on
    // day 46" are the same mechanic with different framing.
    expect(copy).not.toMatch(/[0-9]/);

    // And none of the vocabulary that reintroduces the debt frame without a
    // number. `absence.ts` returns a boolean and destroys the duration, so
    // there is nothing in scope to render — this asserts the copy agrees.
    for (const forbidden of ["missed", "away", "since", "haven't", "havent", "streak", "back on track", "catch up", "sorry"]) {
      expect(copy).not.toContain(forbidden);
    }
  });

  test("a weekend is not an absence", async ({ page }) => {
    // Two days. ABSENCE_DAYS is three precisely so an ordinary weekend never
    // trips this — a card that greets somebody who was here on Friday is a
    // false positive that teaches people to ignore the surface.
    await seedLastOpened(page, 2);
    await openHome(page);

    await expect(page.getByTestId("welcome-back")).toHaveCount(0);
    await expect(page.getByText("Good morning 👋")).toBeVisible();
  });

  test("a first-ever open is not a return", async ({ page }) => {
    // Nothing seeded. There is nothing to come back from, and greeting a brand
    // new user with "good to see you again" is a small lie.
    await openHome(page);
    await expect(page.getByTestId("welcome-back")).toHaveCount(0);
  });

  test("reading the return SPENDS it — the card does not come back on reload", async ({ page }) => {
    await seedLastOpened(page, 12);
    await openHome(page);
    await expect(page.getByTestId("welcome-back")).toBeVisible();

    // THE CLAIM A SCREENSHOT CANNOT MAKE. Deciding that this is a return also
    // records the present, so the same return cannot be greeted twice. A
    // welcome-back that reappears on every reload is a nag, which is the
    // failure mode one principle over from the one it exists to serve.
    //
    // First, prove the app WROTE. Without this the reload assertion below could
    // pass for the wrong reason — an app that never records an open looks
    // identical to one that correctly declines to greet the same return twice.
    await page.evaluate((key) => {
      const written = window.localStorage.getItem(key);
      // Prove the app wrote a FRESH timestamp of its own, not the seeded one.
      if (written === null) throw new Error("the app recorded no open at all");
      const age = Date.now() - (JSON.parse(written) as number);
      if (age > 60_000) throw new Error(`the app did not record this open; the stored timestamp is ${age}ms old`);
    }, LAST_OPENED);

    await page.reload();
    await expect(page.getByText("Day 46")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("welcome-back")).toHaveCount(0);
  });
});
