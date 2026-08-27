// ============================================================
// THE PROVIDER-TO-SCREEN VERTICAL SLICE.
//
// The one seam nothing checked, and both existing suites said so out loud:
//
//   • `tests/store.test.ts` proves the pure transitions with no React.
//   • `behaviour.spec.ts` + `render.spec.ts` prove the screens with a STUBBED
//     context — `harness/stubs.tsx` supplies the shape, filled from the fixture.
//   • So hydration, seeding, the AsyncStorage round trip, the optimistic write
//     and the welcome-back decision were each proven in isolation and NEVER
//     TOGETHER.
//
// Every test here mounts the REAL `RecoveryDataProvider` over a fake-but-real
// AsyncStorage (`shims/async-storage.ts` — a declared fidelity substitution,
// its header states exactly what is and is not real), renders a REAL screen
// from the same registry the render suite draws, interacts with it, and then
// asks storage what actually landed. Several of them REMOUNT from that storage
// and ask whether it came back.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THESE TESTS FOUND, so the file is read as evidence rather than ceremony:
//
//   1. `hydrated` had NO CONSUMERS. Not one Recovery Companion screen read it,
//      so every screen read `timeline` before it was loaded and Home's first
//      paint said "0 check-ins" over a 45-day recovery. Masked in the shipped
//      app by an unrelated two-second splash timer, which is a coincidence and
//      not a guarantee. Fixed structurally: the provider does not mount its
//      children until it has hydrated.
//   2. `RecoveryDataProvider` cannot be mounted without Healthcompanion's
//      `AppDataProvider`. Asserted below rather than only described.
//
// ─────────────────────────────────────────────────────────────────────────────
// LATENCY IS CONFIGURED BEFORE THE APP MOUNTS.
//
// Hydration starts on the first effect, so a control installed after `goto` is
// a control that arrives too late to affect the thing being measured. Every
// test that cares uses `page.addInitScript`.
// ============================================================

import { expect, test, type Page } from "@playwright/test";

const NS = "recovery-companion:";
const HEALTHCOMPANION_KEY = "@healthcompanion/appData/v1";
const ONBOARDING_KEY = "@healthcompanion/onboarding/v1";

/** The control surface `shims/async-storage.ts` publishes on `window`. */
declare global {
  interface Window {
    __STORAGE_CONFIG__?: { readLatency?: number; writeLatency?: number; writesFail?: boolean };
    __storage: {
      dump(): Record<string, string>;
      ops(): { op: string; key: string; at: number }[];
      pending(): number;
      setLatency(next: { read?: number; write?: number }): void;
      failWrites(on: boolean): void;
      backingKey: string;
    };
  }
}

const slice = (screen: string, mode: "light" | "dark" = "dark") =>
  `/slice.html?screen=${screen}&mode=${mode}`;

async function withStorage(
  page: Page,
  config: { readLatency?: number; writeLatency?: number; writesFail?: boolean },
) {
  await page.addInitScript((c) => {
    window.__STORAGE_CONFIG__ = c;
  }, config);
}

/**
 * Plant a whole previous launch. One localStorage key holds the entire map,
 * which is what makes "the second launch" expressible as a precondition.
 *
 * IT PLANTS EXACTLY ONCE, on the next navigation, and never again.
 * `addInitScript` runs on every navigation, reloads included, so an
 * unconditional write re-plants the precondition on top of whatever the launch
 * under test had just written. That made the welcome-back test fail for a
 * reason that had nothing to do with the product: the greeting reappeared
 * because the harness had put the twelve-day-old timestamp back.
 *
 * A separate marker rather than "plant if absent", because one test plants
 * AFTER a first launch has already filled storage and needs to replace it.
 */
async function plantStorage(page: Page, entries: Record<string, string>) {
  await page.addInitScript(
    ([key, value]) => {
      if (window.localStorage.getItem("harness:planted")) return;
      window.localStorage.setItem("harness:planted", "1");
      window.localStorage.setItem(key as string, value as string);
    },
    ["harness:async-storage", JSON.stringify(entries)] as const,
  );
}

const dump = (page: Page) => page.evaluate(() => window.__storage.dump());
const ops = (page: Page) => page.evaluate(() => window.__storage.ops().map((o) => `${o.op} ${o.key}`));

// ─────────────────────────────────────────────────────────────────────────────
test.describe("the seed is written once and never merged again", () => {
  test("a first-ever launch writes the fixture and marks itself seeded", async ({ page }) => {
    await page.goto(slice("timeline"), { waitUntil: "networkidle" });
    await expect(page.getByText("Setback week")).toBeVisible();

    const stored = await dump(page);
    expect(stored[NS + "seeded"]).toBe("true");
    // Not "some timeline" — the fixture, through the provider, into storage.
    expect(JSON.parse(stored[NS + "timeline"])).toHaveLength(42);

    // The SEED KEYS ARE WRITTEN EXACTLY ONCE. Counting the writes rather than
    // reading the result is the point: a re-seed produces the same result and a
    // different write log, and only the log can tell them apart. This also
    // exercises the `hydrating` ref guard, since StrictMode double-invokes the
    // effect in development and the harness runs in StrictMode deliberately.
    const log = await ops(page);
    expect(log.filter((o) => o === `set ${NS}seeded`)).toHaveLength(1);
    expect(log.filter((o) => o === `set ${NS}timeline`)).toHaveLength(1);
    expect(log.filter((o) => o === `get ${NS}seeded`)).toHaveLength(1);
  });

  test("A DELETED ENTRY STAYS DELETED — the fixture is never re-merged", async ({ page }) => {
    // The claim seed-once exists for. A fixture that re-merged on every launch
    // would silently resurrect what somebody removed, and would make "does this
    // persist?" unanswerable, because it would keep supplying the right answer
    // for the wrong reason.
    await page.goto(slice("timeline"), { waitUntil: "networkidle" });
    await expect(page.getByText("Setback week")).toBeVisible();

    const stored = await dump(page);
    const timeline = (JSON.parse(stored[NS + "timeline"]) as { title: string }[])
      .filter((e) => e.title !== "Setback week");
    expect(timeline).toHaveLength(41);

    await plantStorage(page, { ...stored, [NS + "timeline"]: JSON.stringify(timeline) });
    await page.goto(slice("timeline"), { waitUntil: "networkidle" });

    // Still forty-one, and the removed entry did not come back.
    await expect(page.getByText("Setback week")).toHaveCount(0);
    expect(JSON.parse((await dump(page))[NS + "timeline"])).toHaveLength(41);
    // And the seed block did not run: no second write of the seed marker.
    expect((await ops(page)).filter((o) => o === `set ${NS}seeded`)).toHaveLength(0);
  });

  test("an empty store and an unseeded store are distinguishable", async ({ page }) => {
    // `seeded` is its own key for exactly this: a store can be legitimately
    // empty, and that must not read as "never seeded" and trigger a re-seed.
    await plantStorage(page, { [NS + "seeded"]: "true", [NS + "timeline"]: "[]" });
    await page.goto(slice("timeline"), { waitUntil: "networkidle" });

    await expect(page.getByText("Nothing here yet.")).toBeVisible();
    expect(JSON.parse((await dump(page))[NS + "timeline"])).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe("the optimistic write — P1, the capture path cannot fail", () => {
  test("THE WRITE IS ON SCREEN BEFORE THE WRITE RESOLVES", async ({ page }) => {
    // The provider's whole design: state first, persistence catches up. Proved
    // by holding the write open and looking at the screen while it is still in
    // flight — there is no other way to ask.
    //
    // THE QUESTIONS SCREEN, because it is the one §5 surface that RENDERS the
    // result of its own write. Written first against Home, where a capture goes
    // to the timeline tab and cannot be seen — so the test asserted the field
    // had cleared, `pending()`, and storage, and NEVER its own headline claim.
    // A mutant that awaited the write before updating state survived it, which
    // is how that was found rather than argued about.
    //
    // THE LATENCY IS APPLIED AFTER HYDRATION, not through `addInitScript`.
    // Written the other way first, and it was a second check that could not
    // fail: the seed writes eight keys fire-and-forget, so `pending() > 0` was
    // already true before anything was typed.
    await page.goto(slice("questions"), { waitUntil: "networkidle" });
    await expect.poll(() => page.evaluate(() => window.__storage.pending())).toBe(0);
    await page.evaluate(() => window.__storage.setLatency({ write: 3000 }));

    await page.getByLabel("New question").fill("Is the morning stiffness expected?");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    // THE CLAIM ITSELF: it is on the screen the user is looking at...
    await expect(page.getByText("Is the morning stiffness expected?")).toBeVisible({ timeout: 1500 });
    // ...while exactly one write, this one, is still in flight...
    expect(await page.evaluate(() => window.__storage.pending())).toBe(1);
    // ...and storage has not got it yet, which is what makes the point sharp.
    expect((await dump(page))[NS + "appointments"]).not.toContain("Is the morning stiffness expected?");
  });

  test("the capture path does not block on storage either", async ({ page }) => {
    // P1's own lane. Home shows the capture field and the timeline shows the
    // entry, so no single screen can watch the round trip — what IS observable
    // here is that the interaction completes while the write is outstanding.
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await expect.poll(() => page.evaluate(() => window.__storage.pending())).toBe(0);
    await page.evaluate(() => window.__storage.setLatency({ write: 3000 }));

    await page.getByLabel("Quick capture").fill("stairs were easier this morning");
    await page.getByLabel("Save capture").click();

    await expect(page.getByLabel("Quick capture")).toHaveValue("");
    expect(await page.evaluate(() => window.__storage.pending())).toBe(1);
    const midFlight = JSON.parse((await dump(page))[NS + "timeline"]) as { title: string }[];
    expect(midFlight.some((e) => e.title === "stairs were easier this morning")).toBe(false);
  });

  test("A REJECTED WRITE SURFACES NOTHING — no error, no apology, nothing lost", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    // Failures are switched on AFTER the seed, so the only write that fails is
    // the one under test. A run where seeding also failed would be a different
    // and much less interesting claim.
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await page.evaluate(() => window.__storage.failWrites(true));

    await page.getByLabel("Quick capture").fill("wrote this while the disk was full");
    await page.getByLabel("Save capture").click();

    // The interaction finishes exactly as it does when the write succeeds.
    await expect(page.getByLabel("Quick capture")).toHaveValue("");
    await page.waitForTimeout(250);
    expect(errors).toEqual([]);
    // Nothing on screen mentions the failure, in any of the words it could use.
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/could ?n[o']t save|failed|try again|error/i);
    // And the write really was declined — otherwise the test proved nothing.
    expect((await dump(page))[NS + "timeline"]).not.toContain("wrote this while the disk was full");

    // THE ENTRY IS STILL THERE, and the proof is the next write. Home shows the
    // capture field but not the timeline — the two live on different tabs — so
    // there is no single §5 screen on which to see it directly. What CAN be
    // shown is that the provider still holds it: `pushEntry` persists the whole
    // array, so once writes recover, the second capture carries the first one
    // into storage with it. If the rejection had dropped it from state, it
    // would be absent here.
    await page.evaluate(() => window.__storage.failWrites(false));
    await page.getByLabel("Quick capture").fill("and the disk came back");
    await page.getByLabel("Save capture").click();

    await expect.poll(async () => (await dump(page))[NS + "timeline"]).toContain("and the disk came back");
    expect((await dump(page))[NS + "timeline"]).toContain("wrote this while the disk was full");
  });

  test("an unhandled rejection is not how a failed write reports itself", async ({ page }) => {
    // `writeJson` never awaits and attaches `.catch(() => {})`. If that catch
    // were ever dropped, the failure would arrive as an unhandled rejection —
    // invisible in the UI and fatal in a release build with a crash reporter
    // attached, which is precisely the moment P1 says must not exist.
    await page.addInitScript(() => {
      (window as unknown as { __unhandled: string[] }).__unhandled = [];
      window.addEventListener("unhandledrejection", (e) => {
        (window as unknown as { __unhandled: string[] }).__unhandled.push(String(e.reason));
      });
    });
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await page.evaluate(() => window.__storage.failWrites(true));

    await page.getByLabel("Quick capture").fill("and this one too");
    await page.getByLabel("Save capture").click();
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => (window as unknown as { __unhandled: string[] }).__unhandled)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe("the round trip — written here, read back on the next launch", () => {
  test("A CAPTURE SURVIVES A REMOUNT, out of storage rather than out of memory", async ({ page }) => {
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await page.getByLabel("Quick capture").fill("managed the whole park loop");
    await page.getByLabel("Save capture").click();

    // Wait for it to actually land, rather than for a timeout to expire.
    await expect
      .poll(async () => (await dump(page))[NS + "timeline"]?.includes("managed the whole park loop"))
      .toBe(true);

    // A REAL SECOND LAUNCH. The shim mirrors into localStorage, so this is a
    // fresh module, a fresh provider and a fresh hydrate reading what the first
    // launch left behind.
    await page.reload({ waitUntil: "networkidle" });
    await page.goto(slice("timeline"), { waitUntil: "networkidle" });
    await expect(page.getByText("managed the whole park loop")).toBeVisible();
  });

  test("a check-in survives a remount, and the accumulation count with it", async ({ page }) => {
    await page.goto(slice("checkin"), { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Better", exact: false }).first().click();

    await expect.poll(async () => {
      const stored = (await dump(page))[NS + "timeline"];
      return stored ? (JSON.parse(stored) as { type: string }[]).filter((e) => e.type === "checkin").length : 0;
    }).toBe(25);

    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await expect(page.getByText("25 check-ins")).toBeVisible();
  });

  test("THE TWO PHOTO RECORDS ROUND-TRIP TOGETHER OR NOT AT ALL", async ({ page }) => {
    // A photo filed as a journal entry with the file path as its body — a uri on
    // the timeline, `photos` left empty, PhotoCompare with nothing to compare —
    // is a defect this port already shipped once. `store.test.ts` proves
    // `photoEntry` RETURNS both records; this proves the provider persists both,
    // under two different keys, and that a second launch reads both back.
    //
    // SCOPE, stated because it is narrower than it looks: the write here is the
    // seed's, not one issued by `PhotoCapture`. That screen goes through
    // `expo-image-picker`, which has no browser equivalent and is deliberately
    // not shimmed — a substitution for a permission dialog would be a test of
    // the substitution. It is named in step 2 as device work.
    await page.goto(slice("home"), { waitUntil: "networkidle" });

    const stored = await dump(page);
    expect(JSON.parse(stored[NS + "photos"])).toHaveLength(3);
    expect((JSON.parse(stored[NS + "timeline"]) as { type: string }[]).filter((e) => e.type === "photo")).toHaveLength(3);

    await page.reload({ waitUntil: "networkidle" });
    const after = await dump(page);
    expect(JSON.parse(after[NS + "photos"])).toHaveLength(3);
    expect((JSON.parse(after[NS + "timeline"]) as { type: string }[]).filter((e) => e.type === "photo")).toHaveLength(3);
    // The pairing, not just the counts. Paired by caption rather than by uri,
    // because the fixture's uris are deliberately EMPTY — the prototype ships
    // no invented photographs of injuries — so a uri match would be three empty
    // strings agreeing with each other and would hold if the pairing broke.
    const captions = (JSON.parse(after[NS + "photos"]) as { caption: string }[]).map((p) => p.caption).sort();
    const titles = (JSON.parse(after[NS + "timeline"]) as { type: string; title: string }[])
      .filter((e) => e.type === "photo").map((e) => e.title).sort();
    expect(titles).toEqual(captions);
  });

  test("corrupt storage hydrates to the fallback instead of a blank app", async ({ page }) => {
    // `parseStored` is pure and tested. What is untested is the WIRING: that a
    // corrupt value reaches it rather than reaching `JSON.parse` unguarded, and
    // that the screen still draws.
    const errors: string[] = [];
    await plantStorage(page, {
      [NS + "seeded"]: "true",
      [NS + "timeline"]: "{ this is not json",
      [NS + "photos"]: "null",
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(slice("timeline"), { waitUntil: "networkidle" });

    await expect(page.getByText("Nothing here yet.")).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const wrong of ["null", "5", "{}"]) {
    test(`A STORED \`${wrong}\` DOES NOT CRASH THE APP TO A WHITE SCREEN`, async ({ page }) => {
      // FOUND HERE, and it is the sharpest thing this suite has turned up.
      // `parseStored` guarded the PARSE, so "corrupt" meant "throws" — and all
      // three of these are valid JSON. Each hydrated `timeline` as a non-array,
      // and the next line to touch it spread it: `TypeError: timeline is not
      // iterable`, an EMPTY BODY, a total crash on launch.
      //
      // A pure test now covers the shape rule (`store.test.ts`). This is the
      // wiring half, and it is the half that showed what the consequence was:
      // on a device, a white screen on a health app holding somebody's recovery
      // record, with no way out but clearing app data.
      const errors: string[] = [];
      await plantStorage(page, { [NS + "seeded"]: "true", [NS + "timeline"]: wrong });
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(slice("timeline"), { waitUntil: "networkidle" });

      await expect(page.getByText("Nothing here yet.")).toBeVisible();
      expect(errors).toEqual([]);
      // Assert on CONTENT, not merely on "nothing threw". The blank page is
      // exactly what the first version of `render.spec.ts` passed on.
      expect(await page.evaluate(() => document.body.innerText.trim())).not.toBe("");
    });
  }

  test("A STORED `journey` OF THE WRONG TYPE DOES NOT CRASH HOME EITHER", async ({ page }) => {
    // The keys that are not arrays need their own case, and this one exists
    // because a mutant said so: with the array check in place but the null and
    // type checks removed, every test above still passed — an array fallback is
    // fully protected by `Array.isArray` alone. `journey` is a RECORD, and Home
    // reads `journey.startDate` on its first line.
    const errors: string[] = [];
    await plantStorage(page, { [NS + "seeded"]: "true", [NS + "journey"]: "null" });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(slice("home"), { waitUntil: "networkidle" });

    await expect(page.getByLabel("Quick capture")).toBeVisible();
    expect(errors).toEqual([]);
    // The fallback is the real journey, so the screen is usable rather than
    // merely non-crashing.
    await expect(page.getByText("Knee rehab", { exact: false })).toBeVisible();
  });

  test("a `seeded` flag of the wrong type is not read as truthy", async ({ page }) => {
    // Same guard, quieter consequence: a non-boolean `seeded` that survived the
    // parse would read as truthy, skip the seed, and open the app on an empty
    // store — a first run that silently loses its own fixture.
    await plantStorage(page, { [NS + "seeded"]: '"yes"' });
    await page.goto(slice("timeline"), { waitUntil: "networkidle" });

    await expect(page.getByText("Setback week")).toBeVisible();
    expect(JSON.parse((await dump(page))[NS + "timeline"])).toHaveLength(42);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe("hydration order — a screen never states a fact it has not read", () => {
  test("HOME NEVER PAINTS '0 check-ins' OVER A 45-DAY RECOVERY", async ({ page }) => {
    // THIS TEST FAILED WHEN IT WAS WRITTEN, and it is the reason the slice
    // exists. `hydrated` was on the context from the first commit and NOTHING
    // read it: the pill sampled `["0 check-ins", "24 check-ins"]` under a 120ms
    // read. In the shipped app a two-second splash timer usually hid it, which
    // is a coincidence of an unrelated timer rather than a guarantee.
    await withStorage(page, { readLatency: 120 });

    const seen: string[] = [];
    await page.goto(slice("home"));
    for (let i = 0; i < 40; i++) {
      const text = await page.evaluate(() => document.body.innerText.match(/\d+ check-ins?/)?.[0] ?? null);
      if (text && seen[seen.length - 1] !== text) seen.push(text);
      if (seen.includes("24 check-ins")) break;
      await page.waitForTimeout(60);
    }

    // One value, and it is the true one. Not "it settles correctly" — it never
    // said anything else.
    expect(seen).toEqual(["24 check-ins"]);
  });

  test("the timeline never claims 'Nothing here yet.' before it has looked", async ({ page }) => {
    await withStorage(page, { readLatency: 120 });

    let sawEmpty = false;
    await page.goto(slice("timeline"));
    for (let i = 0; i < 40; i++) {
      const body = await page.evaluate(() => document.body.innerText);
      if (body.includes("Nothing here yet.")) sawEmpty = true;
      if (body.includes("Setback week")) break;
      await page.waitForTimeout(60);
    }

    await expect(page.getByText("Setback week")).toBeVisible();
    // "Nothing here yet." is a statement about somebody's recovery. It is true
    // on day one and false during a read, and the two are indistinguishable on
    // screen — which is the whole argument for the structural guard.
    expect(sawEmpty).toBe(false);
  });

  test("nothing below the provider mounts before it has hydrated", async ({ page }) => {
    // The mechanism, asserted directly rather than inferred from the two tests
    // above: while the reads are outstanding the subtree does not exist, so a
    // consumer cannot read `timeline` before `hydrated` — there is no consumer.
    await withStorage(page, { readLatency: 400 });
    await page.goto(slice("home"));

    // Wait until hydration is demonstrably UNDER WAY — otherwise "the body is
    // empty" is also true of a page that has not started, and the assertion
    // would hold on a harness that never mounted anything.
    await expect
      .poll(() => page.evaluate(() => window.__storage.ops().some((o) => o.key.startsWith("recovery-companion:"))))
      .toBe(true);
    expect(await page.evaluate(() => document.body.innerText.trim())).toBe("");

    // And then it arrives, so the guard is a wait rather than a wall.
    await expect(page.getByLabel("Quick capture")).toBeVisible({ timeout: 20_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe("the welcome-back decision is SPENT when it is read", () => {
  const daysAgo = (n: number) => String(Date.now() - n * 86_400_000);

  test("a return after an absence is greeted ONCE, and not on the next launch", async ({ page }) => {
    await plantStorage(page, {
      [NS + "seeded"]: "true",
      [NS + "last-opened"]: daysAgo(12),
    });
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await expect(page.getByText("Good to see you again", { exact: false })).toBeVisible();

    // Reading it also OVERWRITES it, so the same return is never greeted twice.
    // Under StrictMode the hydrate effect is double-invoked, and without the
    // provider's `hydrating` ref the second pass would read back the timestamp
    // it had just written and conclude the absence never happened — so this
    // also proves the guard, on the launch where it matters.
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Good to see you again", { exact: false })).toHaveCount(0);
    await expect(page.getByLabel("Quick capture")).toBeVisible();
  });

  test("A FIRST-EVER OPEN IS NOT A RETURN", async ({ page }) => {
    // There is nothing to come back from, and greeting a brand-new user with
    // "good to see you again" is a small lie.
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await expect(page.getByText("Good to see you again", { exact: false })).toHaveCount(0);

    // And the timestamp was still written, so the NEXT launch has something to
    // compare against.
    expect((await dump(page))[NS + "last-opened"]).toBeTruthy();
  });

  test("a short absence is not a return either", async ({ page }) => {
    await plantStorage(page, { [NS + "seeded"]: "true", [NS + "last-opened"]: daysAgo(1) });
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await expect(page.getByText("Good to see you again", { exact: false })).toHaveCount(0);
  });

  test("a clock that moved backwards is not a return", async ({ page }) => {
    // Proved pure in `store.test.ts`; proved through the provider here, because
    // the provider is what supplies `Date.now()` to it.
    await plantStorage(page, { [NS + "seeded"]: "true", [NS + "last-opened"]: String(Date.now() + 5 * 86_400_000) });
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await expect(page.getByText("Good to see you again", { exact: false })).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe("storage is namespaced and collides with nothing", () => {
  test("every key this store writes is under `recovery-companion:`", async ({ page }) => {
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await page.getByLabel("Quick capture").fill("something to force a write");
    await page.getByLabel("Save capture").click();
    await expect.poll(async () => (await ops(page)).length).toBeGreaterThan(10);

    const written = (await ops(page)).filter((o) => o.startsWith("set ")).map((o) => o.slice(4));
    const foreign = written.filter((k) => !k.startsWith(NS) && k !== HEALTHCOMPANION_KEY && k !== ONBOARDING_KEY);
    expect(foreign).toEqual([]);
  });

  test("HEALTHCOMPANION'S OWN KEY IS PRESENT AND UNTOUCHED", async ({ page }) => {
    // The two stores share a device and are deliberately separate, so that
    // removing the legacy domain later is one reviewable deletion. That only
    // holds if neither writes over the other.
    await plantStorage(page, { [HEALTHCOMPANION_KEY]: JSON.stringify({ savedArticles: ["Swelling week 3"], isPremium: false }) });
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await page.getByLabel("Quick capture").fill("a recovery write");
    await page.getByLabel("Save capture").click();
    await expect.poll(async () => (await dump(page))[NS + "timeline"]?.includes("a recovery write")).toBe(true);

    const stored = await dump(page);
    expect(JSON.parse(stored[HEALTHCOMPANION_KEY]).savedArticles).toEqual(["Swelling week 3"]);

    // The two key sets are disjoint, and both are non-empty — the second half
    // matters, because two empty sets are also disjoint and would let this pass
    // on a page where neither store had written anything at all.
    const keys = Object.keys(stored);
    const ours = keys.filter((k) => k.startsWith(NS));
    const theirs = keys.filter((k) => k.startsWith("@healthcompanion"));
    expect(ours.length).toBeGreaterThan(5);
    expect(theirs.length).toBeGreaterThan(0);
    expect(ours.filter((k) => theirs.includes(k))).toEqual([]);
    // Nothing else is on the device from this app, so an unprefixed key would
    // be a key nobody owns.
    expect(keys.filter((k) => !ours.includes(k) && !theirs.includes(k))).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe("the coupling, recorded as a test rather than as a comment", () => {
  test("THE RECOVERY STORE CANNOT MOUNT WITHOUT HEALTHCOMPANION'S APP DATA", async ({ page }) => {
    // `RecoveryDataProvider` calls `useAppData()` to forward one boolean, and
    // that hook throws outside its provider. So this product's store cannot be
    // mounted anywhere — app, harness or test — without also mounting the
    // exercise store it is supposed to be independent of.
    //
    // Asserted here so that if the coupling is ever removed, this test fails
    // and says so, rather than the constraint quietly outliving its reason.
    await page.goto("/slice.html?uncoupled=1", { waitUntil: "networkidle" });

    await expect(page.getByTestId("mount-error")).toHaveText(
      "useAppData must be used inside AppDataProvider",
    );
    await expect(page.getByText("mounted without AppDataProvider")).toHaveCount(0);
  });

  test("and it mounts fine WITH it — so the test above is about the coupling", async ({ page }) => {
    // The other half. Without this, "the provider throws" would also pass if the
    // provider simply threw on every mount for some unrelated reason.
    await page.goto(slice("home"), { waitUntil: "networkidle" });
    await expect(page.getByTestId("mount-error")).toHaveCount(0);
    await expect(page.getByLabel("Quick capture")).toBeVisible();
  });
});
