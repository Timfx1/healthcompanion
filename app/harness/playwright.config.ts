import { defineConfig } from "@playwright/test";

// No import.meta here: Playwright loads its config through a CJS loader, where
// import.meta is a syntax-level absence rather than an undefined value. Paths
// are relative to this file, which is what testDir already means.

export default defineConfig({
  testDir: ".",
  // Serial. These are cheap, and a parallel run on a contended machine is what
  // the web prototype's open flake investigation spent 111 runs on.
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5199",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    // Deterministic across machines. Font rendering and locale both leak into
    // a screenshot, and a baseline that depends on the runner's locale is a
    // baseline that fails for the next person rather than for the next bug.
    locale: "en-GB",
    timezoneId: "UTC",
  },
  expect: {
    toHaveScreenshot: {
      // A handful of pixels of antialiasing is not a regression. Anything that
      // moves layout or colour moves far more than this.
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
    },
  },
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  webServer: {
    command: "node ../node_modules/vite/bin/vite.js --config vite.config.ts",
    cwd: __dirname,
    url: "http://127.0.0.1:5199",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
