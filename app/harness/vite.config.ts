// ============================================================
// FILE: harness/vite.config.ts — the RN screens, rendered.
//
// WHY THIS EXISTS. Twenty-one Recovery Companion screens shipped into `app/`
// and not one had ever been drawn. §11 is a list of what that produces: a dead
// `Toast` branch, a save button with no handler, `share.*` carrying a 1.58:1
// for the life of a family. All of them typechecked.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS IS AFFORDABLE, WHICH WAS NOT OBVIOUS
//
// The assumption was that a web render path meant fighting a dozen native
// modules. It does not, because the Recovery Companion tree barely touches
// them: of the twenty-one screens, exactly ONE imports a native module
// (`PhotoCapture` → expo-image-picker), and everything else is React Native
// primitives plus vector icons. AnklePath's inherited screens are where the
// Sentry, PostHog, expo-print and auth surface lives, and none of that is
// imported here.
//
// So the harness renders SCREENS, not the app. No navigator, no analytics, no
// AsyncStorage — the screens were built to take plain props and to know nothing
// about routing (see `detail/routes.tsx`), and this is the payoff for that.
// Mounting the whole app would drag in every dependency the app has and would
// test the wiring rather than the screens.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE FIDELITY LIMIT, STATED HERE RATHER THAN DISCOVERED LATER
//
// `react-native` aliases to `react-native-web`. This proves a screen mounts,
// lays out, and responds to a tap. It does NOT prove it looks identical on a
// device: shadows, font metrics and safe-area insets all differ. A baseline
// here is evidence about structure, hierarchy and colour — which is exactly
// what the token system makes claims about — and is not evidence about iOS.
//
// That is worth being precise about, because a harness that overstates its
// reach is the same failure as a check that cannot fail.
// ============================================================

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const dep = (name: string) => resolve(HERE, "..", "node_modules", name);

export default defineConfig({
  root: HERE,
  resolve: {
    alias: [
      // EXACT matches, not prefixes. Vite's object form does prefix
      // replacement, which rewrites "react-native-web" into
      // "react-native-web-web" and leaves real react-native to be bundled
      // beside its own replacement — two renderers in one page, surfacing as a
      // React version mismatch that has nothing to do with React.
      { find: /^react-native$/, replacement: dep("react-native-web") },

      // A declared FIDELITY SUBSTITUTION, not a mock: expo-linear-gradient has
      // no web build react-native-web can consume, and importing it rendered a
      // blank page. The shim draws the same two stops at the same angle in CSS.
      { find: /^expo-linear-gradient$/, replacement: resolve(HERE, "shims/expo-linear-gradient.tsx") },

      // ONE COPY OF EACH, resolved from this package. pnpm's store legitimately
      // holds several react-dom versions at once, and the optimizer will
      // happily pick one that differs from the app's react. That produced
      // "Incompatible React versions: react 19.1.0, react-dom 19.2.8" on every
      // screen — which reads like a code defect and is a resolution defect.
      { find: /^react$/, replacement: dep("react") },
      { find: /^react-dom$/, replacement: dep("react-dom") },
      { find: new RegExp("^react-dom/client$"), replacement: dep("react-dom/client") },
    ],
    dedupe: ["react", "react-dom", "react-native-web"],
    extensions: [".web.tsx", ".web.ts", ".tsx", ".ts", ".jsx", ".js"],
  },
  define: {
    // react-native-web reads these. Without them the bundle throws at import
    // time on `__DEV__`, which looks like a screen defect and is not one.
    __DEV__: JSON.stringify(true),
    global: "globalThis",
  },
  optimizeDeps: {
    // AsyncStorage reaches for native modules a browser has no answer for. The
    // harness renders screens, and no screen touches storage — only
    // `RecoveryDataContext` does, and the harness supplies that context itself.
    exclude: ["@react-native-async-storage/async-storage"],
  },
  server: { host: "127.0.0.1", port: 5199 },
  plugins: [react()],
});
