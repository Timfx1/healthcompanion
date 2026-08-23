// ============================================================
// FILE: harness/main.tsx — one screen, addressed directly.
//
// `?screen=<id>&mode=dark|light` mounts a single Recovery Companion screen with
// stub providers around it. The same discipline as the web prototype's
// `?screen=` routes, for the same reason recorded in §11: a baseline reached by
// clicking through encodes interaction timing into the image, so any later
// change to a transition registers as a regression on every screen downstream.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE STUBS ARE FIXTURES, NOT MOCKS, AND THE DIFFERENCE MATTERS
//
// `RecoveryDataProvider` reads AsyncStorage and decides the welcome-back state
// from a persisted timestamp — neither of which a browser has, and neither of
// which a SCREENSHOT should depend on. So the harness supplies the same context
// SHAPE filled from the real `mockJourney` fixture, and the screens cannot tell
// the difference because they only ever read the context.
//
// What that does NOT cover is the provider itself: hydration, seeding, the
// welcome-back decision, the optimistic write. Those are behaviour, they are
// tested as pure functions in `tests/store.test.ts`, and this harness is
// deliberately not pretending to cover them. Saying so here is the point —
// §11's whole complaint is about checks that look like they cover something.
// ============================================================

import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { AppThemeProvider } from "../src/state/AppThemeContext";
import type { Mode } from "../src/theme/tokens.generated";
import { RENDERERS } from "./screens";
import { HarnessData } from "./stubs";

const params = new URLSearchParams(window.location.search);
const id = params.get("screen") ?? "home";
const mode: Mode = params.get("mode") === "light" ? "light" : "dark";
const premium = params.get("premium") === "1";
const welcomeBack = params.get("welcomeBack") === "1";
const empty = params.get("empty") === "1";

const render = RENDERERS[id];

function Harness() {
  if (!render) {
    // A missing id is a harness bug and says so. Rendering blank here would
    // produce a passing screenshot of nothing at all.
    return <pre style={{ padding: 16, fontFamily: "monospace" }}>Unknown screen: {id}</pre>;
  }
  return (
    <AppThemeProvider initialMode={mode}>
      <HarnessData premium={premium} welcomeBack={welcomeBack} empty={empty}>
        {render()}
      </HarnessData>
    </AppThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
