// ============================================================
// THE RENDER SUITE — every Recovery Companion screen, drawn.
//
// Twenty-three addressable screens × two colour modes. Before this existed,
// none of them had been drawn even once, and §11 is a list of what that state
// produces: a dead `Toast` branch, a save button with no handler, `share.*`
// carrying a 1.58:1 for the life of a family. All typechecked.
//
// Building this suite found four more of the same species in an afternoon:
//   • the Day-N card rendered FLAT — the comment claimed two gradient stops and
//     the code set one colour, so the manifest's measured "at gradient start"
//     pair described a backdrop that was not on screen
//   • `DetailButton` had no horizontal padding, which only became visible when
//     one was placed somewhere narrow and its label spilled outside its pill
//   • every date rendered through `toLocaleDateString()` as "9.7.2026" — the
//     same day in two orderings depending on the machine, on a document whose
//     entire job is to be scannable in 60 seconds
//   • importing `expo-linear-gradient` produced a silent BLANK PAGE
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS ASSERTS ON CONTENT AND NOT JUST ON ERRORS
//
// The first version of this check asked "did anything throw?" and reported all
// twenty-three screens healthy while several rendered a white rectangle. A
// blank page throws nothing. So every screen must produce visible text, and the
// screenshot is taken second.
//
// That ordering is deliberate: a baseline that is blank is still a baseline,
// and it will happily match the next blank one forever.
// ============================================================

import { expect, test } from "@playwright/test";

import { SCREEN_MANIFEST } from "./manifest";

const MODES = ["dark", "light"] as const;

for (const mode of MODES) {
  test.describe(`${mode} mode`, () => {
    for (const screen of SCREEN_MANIFEST) {
      test(`${screen.id} — ${screen.note}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => {
          if (m.type() === "error") errors.push(m.text());
        });

        await page.goto(`/?screen=${screen.id}&mode=${mode}`, { waitUntil: "networkidle" });

        // 1. It mounted without complaint.
        expect(errors, `console/page errors on ${screen.id}`).toEqual([]);

        // 2. It is not the harness's own "unknown screen" page. A typo in the
        //    registry would otherwise produce a stable, passing baseline of an
        //    error message.
        const root = page.locator("#root");
        const text = await root.innerText();
        expect(text, `${screen.id} resolved to the unknown-screen page`).not.toContain("Unknown screen");

        // 3. IT DREW SOMETHING. The assertion the blank-page bug got past.
        expect(text.trim().length, `${screen.id} rendered no visible text`).toBeGreaterThan(20);

        // 4. And it looks like it did last time.
        await expect(root).toHaveScreenshot(`${screen.id}-${mode}.png`);
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe("states that are reachable only by data", () => {
  // Each of these is a state the app can genuinely be in and which no amount of
  // clicking around a seeded fixture will reach.

  test("welcome-back — one warm line, and no count of what was missed (P2)", async ({ page }) => {
    await page.goto("/?screen=home&mode=dark&welcomeBack=1", { waitUntil: "networkidle" });
    const card = page.getByText("Good to see you again", { exact: false });
    await expect(card).toBeVisible();

    // The principle, asserted against what is actually on screen rather than
    // against the copy constant. `rules/absence` returns a boolean and destroys
    // the duration, so there is nothing in scope to render — this checks the
    // screen agrees.
    const copy = (await card.innerText()).toLowerCase();
    expect(copy).not.toMatch(/[0-9]/);
    for (const forbidden of ["missed", "away", "since", "haven't", "streak", "catch up"]) {
      expect(copy, `welcome-back copy contains "${forbidden}"`).not.toContain(forbidden);
    }
    await expect(page.locator("#root")).toHaveScreenshot("home-welcome-back-dark.png");
  });

  test("report on day one — empty, and it does not shame the gap (P2)", async ({ page }) => {
    await page.goto("/?screen=report&mode=dark&empty=1", { waitUntil: "networkidle" });
    const text = await page.locator("#root").innerText();
    expect(text).toContain("Nothing to report yet");
    // Reachable on the first open, because the report is two taps from Home and
    // a curious new user will tap it.
    expect(text.toLowerCase()).not.toMatch(/should|need to|missed|behind/);
    await expect(page.locator("#root")).toHaveScreenshot("report-empty-dark.png");
  });

  test("photo compare, premium held, one photo — never an upsell (§9)", async ({ page }) => {
    // The state the three-way gate exists for: somebody who has already paid
    // must not be sold the thing they bought.
    await page.goto("/?screen=compare&mode=dark&premium=1&empty=1", { waitUntil: "networkidle" });
    const text = await page.locator("#root").innerText();
    expect(text.toLowerCase()).not.toContain("premium");
    expect(text.toLowerCase()).not.toContain("unlock");
  });

  test("photo compare, no premium — both photos visible, only the tooling withheld (§9)", async ({ page }) => {
    await page.goto("/?screen=compare&mode=dark", { waitUntil: "networkidle" });
    // Value before the gate: a blank wall here would teach people the app is a
    // billboard.
    await expect(page.getByText("part of premium", { exact: false })).toBeVisible();
    await expect(page.locator("#root")).toHaveScreenshot("compare-locked-dark.png");
  });

  test("a deep dive with premium held shows the whole article", async ({ page }) => {
    await page.goto("/?screen=article-deep&mode=dark&premium=1", { waitUntil: "networkidle" });
    const text = await page.locator("#root").innerText();
    expect(text).not.toContain("Read the full deep dive");
    await expect(page.locator("#root")).toHaveScreenshot("article-deep-unlocked-dark.png");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe("N6 — the report is free, and every surface says so", () => {
  // `restricted.mjs` polices the SOURCE for gating symbols. This polices what
  // reaches the screen, which is a different claim: a lock badge drawn from a
  // literal, or copy that merely implies a price, would pass the source check.
  // WHOLE WORDS. Written first as substrings, which flagged "pro" inside
  // "post-operative rehabilitation" — the condition name — and reported the
  // doctor report as gated. A check that cries wolf gets switched off.
  const GATE_WORDS = ["unlock", "upgrade", "premium", "trial", "subscribe"];

  // TOKENISED RATHER THAN A REGEX, deliberately. The word-boundary version of
  // this was written twice and was wrong both times: the escape collapsed to a
  // literal backspace, so the pattern became "\bpremium\b" with a control
  // character instead of a boundary and matched nothing at all. It passed on
  // every screen, including screens that do contain these words.
  //
  // That is the failure this repository keeps paying for — a check that cannot
  // fail — so this splits on non-letters and compares whole tokens. There is
  // nothing to escape, so there is nothing to get wrong.
  const words = (text: string) => new Set(text.split(/[^a-z]+/).filter(Boolean));

  for (const mode of MODES) {
    test(`report shows no gate language (${mode})`, async ({ page }) => {
      await page.goto(`/?screen=report&mode=${mode}`, { waitUntil: "networkidle" });
      const text = (await page.locator("#root").innerText()).toLowerCase();
      const present = words(text);
      for (const word of GATE_WORDS) {
        expect(present.has(word), `the doctor report contains "${word}"`).toBe(false);
      }
      expect(text).toContain("always free");
    });
  }

  test("the premium surface never names the report", async ({ page }) => {
    // N6 rule B, at the pixel level. Profile is where a reports row and a
    // premium row sit on one list, and it is the easiest place in the product
    // to imply the report is part of what you pay for.
    await page.goto("/?screen=profile&mode=dark", { waitUntil: "networkidle" });
    const premiumCard = page.getByText("Deeper insight", { exact: false });
    await expect(premiumCard).toBeVisible();
    expect((await premiumCard.innerText()).toLowerCase()).not.toContain("report");
  });
});
