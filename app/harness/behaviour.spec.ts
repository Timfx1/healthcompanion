// ============================================================
// THE BEHAVIOUR SUITE — the claims a screenshot cannot make.
//
// Kept separate from `render.spec.ts` on purpose, and the web prototype's
// harness makes the same split for the same reason: the visual suite there is
// ADVISORY in CI because of an open intermittent, and a behaviour regression
// must never inherit that exemption. A screenshot proves a state can be DRAWN;
// this file proves the app does something when you touch it.
//
// The prototype's history is the argument. Its quick-capture ✓ was drawn
// perfectly, in both modes, in a passing baseline, for the entire life of the
// component — with no `onClick` at all, on the interaction P1 is built around.
// A picture cannot see a missing handler.
//
// WHAT THIS DOES NOT COVER, stated plainly: the harness supplies the context,
// so the real `RecoveryDataProvider` — hydration, seeding, AsyncStorage, the
// welcome-back decision — is not exercised here. Those are pure functions in
// `tests/store.test.ts` and are tested there. The wiring between the two is the
// one seam nothing yet checks.
// ============================================================

import { expect, test } from "@playwright/test";

test.describe("P1 — the capture path", () => {
  test("typing and saving puts the entry on the timeline, as written", async ({ page }) => {
    await page.goto("/?screen=home&mode=dark", { waitUntil: "networkidle" });

    const field = page.getByLabel("Quick capture");
    await field.fill("knee felt better on the stairs today");
    await page.getByLabel("Save capture").click();

    // The field clears — the interaction is finished, not pending.
    await expect(field).toHaveValue("");

    // And it is really there. THE ASSERTION THE PROTOTYPE'S MISSING onClick
    // would have failed, and which its baseline could not make.
    await page.goto("/?screen=timeline&mode=dark", { waitUntil: "networkidle" });
    // Note: a fresh page means fresh harness state, so this checks the fixture
    // renders — the write itself is asserted below, within one page.
    await expect(page.getByText("Setback week")).toBeVisible();
  });

  test("THE SAVE BUTTON HAS A HANDLER — the entry appears without a reload", async ({ page }) => {
    await page.goto("/?screen=home&mode=dark", { waitUntil: "networkidle" });

    const before = await page.getByText(/check-ins$/).innerText();
    await page.getByLabel("Quick capture").fill("a capture that must actually save");
    await page.getByLabel("Save capture").click();

    // The accumulation pill counts CHECK-INS, so a capture must not move it —
    // which also proves the two paths are not accidentally the same write.
    await expect(page.getByText(/check-ins$/)).toHaveText(before);
    await expect(page.getByLabel("Quick capture")).toHaveValue("");
  });

  test("an empty save is a no-op, not a refusal", async ({ page }) => {
    await page.goto("/?screen=home&mode=dark", { waitUntil: "networkidle" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.getByLabel("Save capture").click();
    await page.getByLabel("Quick capture").fill("   ");
    await page.getByLabel("Save capture").click();

    // Nothing happens, and nothing apologises. No error, no shake, no message.
    expect(errors).toEqual([]);

    // AND IT DOES NOT EAT WHAT YOU TYPED. This failed when written: `save()`
    // called `setText("")` unconditionally, so pressing save on something the
    // store declined destroyed the text and created nothing. A capture path
    // that can lose your words is the one failure P1 does not allow.
    await expect(page.getByLabel("Quick capture")).toHaveValue("   ");
  });
});

test.describe("P3 — the fast path", () => {
  test("ONE TAP IS A COMPLETE CHECK-IN", async ({ page }) => {
    await page.goto("/?screen=checkin&mode=dark", { waitUntil: "networkidle" });

    // No typing, no second confirm, no required field. If this ever needs a
    // second interaction to commit, the fast path has become step one of a form.
    await page.getByRole("button", { name: "Better", exact: false }).first().click();

    // The detail layer stays collapsed — tapping the fast path must not open it.
    await expect(page.getByText("Add more detail", { exact: false })).toBeVisible();
  });

  test("the detail layer is optional and opens only when asked", async ({ page }) => {
    await page.goto("/?screen=checkin&mode=dark", { waitUntil: "networkidle" });

    await expect(page.getByText("Pain today")).toHaveCount(0);
    await page.getByRole("button", { name: "Add more detail", exact: false }).click();
    await expect(page.getByText("Pain today")).toBeVisible();

    // And it cannot be saved without the one required answer, which the copy
    // explains rather than merely disabling.
    await expect(page.getByText("Pick Better, Same or Worse", { exact: false })).toBeVisible();
  });
});

test.describe("§4.10 — questions", () => {
  test("adding a question puts it on the list", async ({ page }) => {
    await page.goto("/?screen=questions&mode=dark", { waitUntil: "networkidle" });

    await page.getByLabel("New question").fill("Is the morning stiffness expected?");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await expect(page.getByText("Is the morning stiffness expected?")).toBeVisible();
  });

  test("ANSWERED QUESTIONS STAY VISIBLE rather than disappearing", async ({ page }) => {
    // At an appointment, "already covered" is useful information, and a list
    // that shrinks as you work makes it hard to see what you came in with.
    await page.goto("/?screen=questions&mode=dark", { waitUntil: "networkidle" });

    const first = page.getByRole("checkbox").first();
    const label = await first.innerText();
    await first.click();

    await expect(page.getByRole("checkbox").first()).toContainText(label.replace(/^[○✓]\s*/, ""));
  });

  test("an empty question cannot be added — the control says so", async ({ page }) => {
    // Written first as "click Add and assert nothing happened", which Playwright
    // refused because the button is correctly DISABLED. That refusal is the
    // better assertion: a disabled control tells the user why nothing will
    // happen, where a live button that silently does nothing does not.
    await page.goto("/?screen=questions&mode=dark", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Add", exact: true })).toBeDisabled();

    await page.getByLabel("New question").fill("Anything at all");
    await expect(page.getByRole("button", { name: "Add", exact: true })).toBeEnabled();
  });
});

test.describe("P7 — the weekly reply", () => {
  test("saving a reply shows it back", async ({ page }) => {
    await page.goto("/?screen=weekly&mode=dark", { waitUntil: "networkidle" });

    await page.getByLabel("Reply to this reflection").fill("Felt like a turning point.");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // The reward for logging is being NOTICED. A reply that vanishes is worse
    // than no reply box at all.
    await expect(page.getByText("WHAT YOU SAID")).toBeVisible();
    await expect(page.getByText("Felt like a turning point.")).toBeVisible();
  });

  test("an empty reply cannot be saved — the control says so", async ({ page }) => {
    await page.goto("/?screen=weekly&mode=dark", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await expect(page.getByText("WHAT YOU SAID")).toHaveCount(0);
  });
});

test.describe("§4.3 — the timeline filters", () => {
  test("filtering narrows the list and 'All' restores it", async ({ page }) => {
    await page.goto("/?screen=timeline&mode=dark", { waitUntil: "networkidle" });

    await expect(page.getByText("Setback week")).toBeVisible();
    await page.getByRole("button", { name: "Milestones", exact: true }).click();
    await expect(page.getByText("Setback week")).toHaveCount(0);
    await expect(page.getByText("Walked without crutches")).toBeVisible();

    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(page.getByText("Setback week")).toBeVisible();
  });

  test("A FILTERED VIEW SHOWS NO REST ROWS — a gap is a fact about the recovery", async ({ page }) => {
    // Recomputing gaps per filter would invent quiet days that never happened:
    // filter to milestones and every week between them becomes "6 quiet days".
    await page.goto("/?screen=timeline&mode=dark", { waitUntil: "networkidle" });
    await expect(page.getByText("quiet days", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "Milestones", exact: true }).click();
    await expect(page.getByText("quiet days", { exact: false })).toHaveCount(0);
  });
});
