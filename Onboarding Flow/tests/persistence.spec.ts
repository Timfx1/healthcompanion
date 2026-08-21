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
