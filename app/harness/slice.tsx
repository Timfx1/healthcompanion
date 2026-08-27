// ============================================================
// FILE: harness/slice.tsx — the provider-to-screen vertical slice.
//
// `main.tsx` mounts a screen over a STUBBED context, on purpose: a baseline
// must not depend on hydration order. This file is its opposite and exists for
// the seam that split leaves behind, which README and both suites have named
// out loud as the one thing nothing checks:
//
//   • `tests/store.test.ts` proves the pure transitions with no React.
//   • `main.tsx` + `render.spec.ts` prove the screens with no provider.
//   • So hydration, seeding, the AsyncStorage round trip, the optimistic write
//     and the welcome-back decision were each proven in isolation and NEVER
//     TOGETHER.
//
// Here the REAL `RecoveryDataProvider` runs over a fake-but-real AsyncStorage
// (`shims/async-storage.ts`, a declared fidelity substitution), rendering the
// REAL screens from the same `RENDERERS` registry the render suite draws — not
// a second one. A second registry would be a second thing to keep in step, and
// the point of this file is that the screen under test is the shipped screen.
//
// ─────────────────────────────────────────────────────────────────────────────
// `AppDataProvider` IS MOUNTED, AND THAT IS A FINDING RATHER THAN A CHOICE
//
// `RecoveryDataProvider` calls `useAppData()` to forward the entitlement, and
// that hook throws outside its provider. So the Recovery Companion store cannot
// be mounted anywhere without also mounting AnklePath's exercise store — which
// has its own AsyncStorage hydration, its own `hydrated` flag and its own
// persist-on-every-change effect, none of which this product has any use for.
//
// It is mounted rather than stubbed because stubbing it would hide exactly the
// coupling worth knowing about, and because the shipped `App.tsx` nests them in
// this order. `slice.spec.ts` asserts the coupling directly — mounting the
// provider alone and catching the error — so the constraint is recorded as a
// test rather than only as this comment. §11 has the full note.
//
// StrictMode is deliberate. The provider's `hydrating` ref guard exists for
// React's development double-invoke, and the welcome-back decision is SPENT
// when read: a second pass would read back the timestamp it had just written
// and conclude the absence never happened. Dropping StrictMode here would
// remove the only place that guard is exercised.
// ============================================================

import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { AppThemeProvider } from "../src/state/AppThemeContext";
import { AppDataProvider } from "../src/state/AppDataContext";
import { RecoveryDataProvider } from "../src/state/RecoveryDataContext";
import { OnboardingProvider } from "../src/state/OnboardingContext";
import type { Mode } from "../src/theme/tokens.generated";
import { RENDERERS } from "./screens";

const params = new URLSearchParams(window.location.search);
const id = params.get("screen") ?? "home";
const mode: Mode = params.get("mode") === "light" ? "light" : "dark";

const render = RENDERERS[id];
/** `?uncoupled=1` mounts the Recovery store with NO `AppDataProvider` above it.
 *  See `Uncoupled` below — this is an assertion with an address, not a mode. */
const uncoupled = params.get("uncoupled") === "1";

/**
 * Catches the mount error and puts it in the DOM where a spec can read it.
 *
 * A thrown render error is not observable from Playwright as anything but a
 * console line, and asserting on console noise is how a test starts passing for
 * the wrong reason. This states the message as visible content instead.
 */
class Boundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }
  render() {
    if (this.state.message) return <pre data-testid="mount-error">{this.state.message}</pre>;
    return this.props.children;
  }
}

/**
 * THE COUPLING, GIVEN AN ADDRESS.
 *
 * `RecoveryDataProvider` calls `useAppData()` to forward one boolean, and that
 * hook throws outside its provider — so this product's store cannot be mounted
 * anywhere, app or harness or test, without also mounting AnklePath's exercise
 * store. `slice.spec.ts` asserts the message here, so that if the coupling is
 * ever removed the test fails and says so, rather than the constraint quietly
 * outliving the reason for it.
 */
function Uncoupled() {
  return (
    <Boundary>
      <RecoveryDataProvider>
        <span>mounted without AppDataProvider</span>
      </RecoveryDataProvider>
    </Boundary>
  );
}

function Slice() {
  if (uncoupled) return <Uncoupled />;
  if (!render) {
    // Same rule as `main.tsx`: an unknown id says so rather than rendering
    // nothing, because a blank page is a passing screenshot of nothing at all.
    return <pre style={{ padding: 16, fontFamily: "monospace" }}>Unknown screen: {id}</pre>;
  }
  return (
    <AppThemeProvider initialMode={mode}>
      <AppDataProvider>
        <OnboardingProvider>
          <RecoveryDataProvider useDemoSeed>{render()}</RecoveryDataProvider>
        </OnboardingProvider>
      </AppDataProvider>
    </AppThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Slice />
  </StrictMode>,
);
