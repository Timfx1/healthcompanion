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
      // Zero tolerance — see header.
      maxDiffPixels: 0,
      threshold: 0,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
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

  webServer: {
    command: "corepack pnpm@10.34.3 dev",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PORT: String(PORT) },
  },
});
