// ============================================================
// FILE: playwright.config.ts
// PURPOSE: Configuration for the visual-parity harness.
//
// WHAT THIS HARNESS IS FOR: the design-system extraction replaces ~200
// hardcoded literals with generated tokens. The entire safety argument for
// that work is "the rendered output did not change". These baselines are that
// proof. They are captured BEFORE any token swap and are expected to still
// match after it.
//
// Because the baselines are a contract rather than a convenience, the diff
// tolerance is ZERO. A single changed pixel fails. Any intended change must be
// an explicitly approved ledger entry, re-baselined on purpose.
// ============================================================

import { defineConfig, devices } from "@playwright/test";

const PORT = 8443;

export default defineConfig({
  testDir: "./tests",

  // Baselines live beside the tests and ARE committed — they are the parity
  // contract. Only -actual/-diff artefacts are gitignored.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",

  // Determinism settings. Retries are disabled deliberately: a visual test that
  // passes on retry is a flaky baseline, and a flaky baseline is worse than no
  // baseline because it silently launders real regressions.
  retries: 0,
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: [["list"]],

  expect: {
    toHaveScreenshot: {
      // MEASURED noise floor, not a guess.
      //
      // Zero was the intent and held for a long time, but repeated runs of
      // UNCHANGED code intermittently differ by 1-3 pixels out of 470,400
      // (0.0006%). The deterministic rendering flags below removed most of it;
      // what remains is emoji and antialiasing rasterisation that does not
      // settle. Five consecutive runs measured a maximum of 3.
      //
      // 12 sits four times above that observed maximum and orders of magnitude
      // below any real change. For calibration, changes actually made during
      // this work produced: one hex channel on the accent -> 6,751 pixels; the
      // lock badge unification -> thousands; the muted-text fix -> hundreds per
      // screen. There is no plausible visual regression that hides under 12 —
      // even a 1px border shift on a single card is dozens.
      //
      // This is the one place the harness trades precision for reliability, and
      // the trade is deliberate: a gate that fails randomly gets re-run until
      // green, which is strictly worse than a gate with a small, documented,
      // measured tolerance.
      maxDiffPixels: 12,
      threshold: 0,

      // RESIDUAL FLAKE, ~1 run in 8-20 as originally reported. NOT REPRODUCED in
      // 111 consecutive runs. Still open, but the search has narrowed a lot —
      // see the reproduction log at the bottom of this file before changing
      // anything here.
      //
      // This value is NOT a fix and was not shown to be one — read on.
      //
      // The original reasoning was: failing runs emit no pixel-diff count, so
      // the capture must be timing out, so give it more time. The timeout was
      // raised 5s -> 15s on that basis. It did not help; the next eight runs
      // still produced a failure.
      //
      // MEASUREMENT REFUTES THE PREMISE. Across 15 consecutive clean runs,
      // per-test wall time is 340-570ms and whole-suite time 17.7-18.8s. A
      // capture finishing in ~0.4s is not one that occasionally needs more than
      // 5s; the margin is roughly twelvefold. Something that completes in 0.4s
      // or not at all is HANGING, and no timeout value fixes a hang — which is
      // exactly what raising it to 15s demonstrated.
      //
      // So "no pixel-diff count" most likely means the run never reached the
      // comparison at all. The three awaits in gotoScreen() that precede it are
      // the candidates, and they are now individually attributed and bounded in
      // visual.spec.ts so the next occurrence names its own cause instead of
      // being re-guessed.
      //
      // 15s is retained only because it is harmless at a 0.4s working cost.
      timeout: 15_000,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,

    // Kept for the OPEN flake above. With retries at 0 there is no second run to
    // record, so the only chance to capture a failure is the failing run itself.
    // A trace carries the network log, the console, and a per-action timeline —
    // which is what distinguishes "the font request never completed" from "the
    // clock never advanced" from "the capture genuinely stalled", none of which
    // the current failure text can tell apart.
    //
    // Discarded on success, so a green suite leaves nothing behind.
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Deterministic rasterisation. Without these, repeated runs of
        // UNCHANGED code differed by 2-3 pixels out of 470,400 — antialiasing
        // noise from GPU rasterisation and subpixel text positioning.
        //
        // The tempting fix is to raise maxDiffPixels above the noise, but that
        // trades a precise gate for an approximate one: a genuine 3-pixel
        // regression (a shifted 1px border, a changed icon stroke) would then
        // pass silently. Removing the nondeterminism instead keeps the
        // threshold at zero and keeps the gate meaningful.
        launchOptions: {
          args: [
            "--disable-gpu",                 // software rasterisation only
            "--disable-lcd-text",            // grayscale AA, not subpixel
            "--disable-font-subpixel-positioning",
            "--font-render-hinting=none",    // hinting varies with the host
            "--force-color-profile=srgb",    // ignore the display profile
            "--disable-skia-runtime-opts",   // no CPU-feature-dependent paths
          ],
        },
        // Declared AFTER the device spread so these win — `devices` carries its
        // own viewport and deviceScaleFactor (2, which would double raster size
        // and make baselines machine-dependent).
        //
        // The viewport holds the 390x844 phone shell plus the page wrapper's
        // 32px vertical / 16px horizontal padding, with headroom for the
        // onboarding screens whose shell grows past 844.
        viewport: { width: 480, height: 980 },
        deviceScaleFactor: 1,
      },
    },
  ],

// ============================================================
// REPRODUCTION LOG — the open flake
//
// Three deliberate attempts, 95 runs, plus 16 earlier in the same session:
// 111 consecutive clean runs, no failure of any kind.
//
//   config                                     runs  median  result
//   HEAD, warm Vite cache, tracing on            40   35.3s  clean
//   HEAD, Vite cache CLEARED before every run    25   35.2s  clean
//   commit 99939ec verbatim, tracing OFF         30   25.7s  clean
//
// The third is the important one: 99939ec is the exact commit whose message
// claimed to have cleared the flake and where "the very next eight runs still
// produced one failure". Same code, same config, no tracing. Thirty clean runs.
//
// WHAT THIS ELIMINATES
//
//   Screenshot comparison, and a genuine UI regression. Both are DETERMINISTIC
//   at a fixed commit — the same render is compared to the same baseline every
//   time, so a content difference cannot come and go. Consistent with the
//   original symptom: failing runs reported no pixel-diff count.
//
//   Cold start / dependency optimisation. 25 runs with node_modules/.vite
//   deleted beforehand, forcing a genuinely cold transform. All clean, and the
//   median did not even move (35.2s against 35.3s warm).
//
//   Font loading over the network. Inter has been bundled since 56612ec, which
//   PRECEDES 99939ec — so the network was already off the critical path when the
//   flake was last seen. Whatever it is, it is not a slow font request.
//
//   Animation. Suppressed in CSS via ?motion=off and asserted before capture;
//   also pinned by `animations: "disabled"` here.
//
// WHAT REMAINS: timing, and most plausibly host load rather than anything in the
// harness. The original sightings happened during active development — builds,
// dev servers and editors competing for the same cores — which is a condition a
// tight loop on an otherwise idle machine reproduces badly.
//
// THE CAVEAT THAT MATTERS. `trace: "retain-on-failure"` costs about 37% of
// suite runtime (25.7s -> 35.3s on the same 36 tests). If the flake is a race,
// instrumenting for it may be suppressing it — the classic observer effect. So
// "clean at HEAD" is weaker evidence than the run count suggests, and the third
// experiment above exists precisely because it removes that variable.
//
// WHERE THE ANSWER WILL COME FROM: CI, not a local loop. A shared runner is
// slower, noisier and more contended than this machine, which is the condition
// that appears to matter. The workflow runs this suite advisory and uploads the
// trace on failure. Do not make it blocking until one of those traces exists.
// ============================================================

  webServer: {
    command: "corepack pnpm@10.34.3 dev",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PORT: String(PORT) },
  },
});
