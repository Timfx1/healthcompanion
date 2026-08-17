// ============================================================
// FILE: App.tsx
// PURPOSE: Root component. Manages the top-level application phase:
//   "onboarding" or "app" (main app). Also owns the global dark/light
//   mode state so it can be transferred from Onboarding into MainApp.
//
// FLOW:
//   1. App mounts → phase = "onboarding"
//   2. User completes onboarding (taps "Start free trial" OR "Continue free"
//      on the final paywall screen).
//   3. Onboarding calls onComplete(mode) → App sets phase = "app", stores mode.
//   4. MainApp renders with the mode the user had during onboarding.
//
// NAVIGATION:
//   Onboarding  →  MainApp
//   TRANSITION: Not animated at this layer — the transition is handled by
//   the Onboarding PaywallScreen confirmation. App simply unmounts Onboarding
//   and mounts MainApp.
//
// STATE:
//   phase: "onboarding" | "app"  — which top-level view is shown
//   mode: "dark" | "light"       — persisted from Onboarding → MainApp
// ============================================================

import { useState } from "react";
import Onboarding from "./components/Onboarding";
import MainApp, { type Tab } from "./components/MainApp";
import type { Mode } from "./components/tokens";

// ============================================================
// DEV/TEST ROUTE — visual-parity harness support
//
// Reads optional URL query params so the screenshot runner can address any
// screen directly. With no ?screen= param this parser returns null and App
// behaves exactly as it always has: onboarding from step 0, dark mode.
//
//   ?screen=ob:<0-11>                 a specific onboarding wizard step
//   ?screen=app:home|timeline|progress|profile
//   ?screen=app:checkin               MainApp with the check-in overlay open
//   ?screen=app:paywall               MainApp with the paywall sheet open
//   &mode=dark|light                  forces colour mode (default dark)
//   &motion=off                       suppresses animations via .no-motion
//
// WHY ADDRESS SCREENS DIRECTLY rather than clicking through: a baseline
// reached by simulated interaction encodes interaction timing into the image.
// Any later change to a transition duration would then register as a visual
// regression on every downstream screen. Addressing the state directly keeps
// each baseline a statement about one screen only.
// ============================================================
type Route =
  | { kind: "onboarding"; step: number }
  | { kind: "app"; tab: Tab; overlay: "checkin" | "paywall" | null; pinToast?: boolean };

function parseRoute(): { route: Route | null; mode: Mode } {
  const q = new URLSearchParams(window.location.search);
  const mode: Mode = q.get("mode") === "light" ? "light" : "dark";

  // Motion suppression is applied at module scope (before first paint) rather
  // than in an effect, so the very first rendered frame is already settled.
  if (q.get("motion") === "off") document.documentElement.classList.add("no-motion");

  const screen = q.get("screen");
  if (!screen) return { route: null, mode };

  if (screen.startsWith("ob:")) {
    const step = Number.parseInt(screen.slice(3), 10);
    return { route: Number.isFinite(step) ? { kind: "onboarding", step } : null, mode };
  }
  if (screen.startsWith("app:")) {
    const target = screen.slice(4);
    if (target === "checkin") return { route: { kind: "app", tab: "home", overlay: "checkin" }, mode };
    if (target === "paywall") return { route: { kind: "app", tab: "home", overlay: "paywall" }, mode };
    // Home with the confirmation toast pinned visible. A TRANSIENT state needs
    // its own route or it cannot be baselined at all: it lives for 2.4s behind
    // an interaction, and the harness advances the clock past that before it
    // captures. The toast carried a dead code path and an unused token family
    // for exactly as long as nothing could photograph it.
    if (target === "toast") return { route: { kind: "app", tab: "home", overlay: null, pinToast: true }, mode };
    const tabs: Tab[] = ["home", "timeline", "progress", "profile"];
    if ((tabs as string[]).includes(target)) return { route: { kind: "app", tab: target as Tab, overlay: null }, mode };
  }
  return { route: null, mode };
}

const { route: DEV_ROUTE, mode: DEV_MODE } = parseRoute();

export default function App() {
  // phase controls which top-level view is rendered.
  // Starts at "onboarding"; switches to "app" when onboarding completes.
  const [phase, setPhase] = useState<"onboarding" | "app">("onboarding");

  // mode is captured from Onboarding on completion so MainApp launches
  // in the same dark/light state the user left onboarding in.
  const [mode, setMode] = useState<Mode>("dark");

  // DEV/TEST ROUTE short-circuit. Only ever non-null when ?screen= is present.
  if (DEV_ROUTE) {
    return DEV_ROUTE.kind === "onboarding"
      ? <Onboarding initialMode={DEV_MODE} initialScreen={DEV_ROUTE.step} />
      : <MainApp initialMode={DEV_MODE} initialTab={DEV_ROUTE.tab} initialOverlay={DEV_ROUTE.overlay} pinToast={DEV_ROUTE.pinToast} />;
  }

  if (phase === "onboarding") {
    // SCREEN: Onboarding flow (12 screens)
    // CALLBACK: onComplete(m) — called when user exits the last paywall screen.
    //   m = current mode at time of completion.
    // ACTION: Captures mode, transitions to main app.
    return <Onboarding onComplete={(m) => { setMode(m); setPhase("app"); }} />;
  }

  // SCREEN: Main App (5-tab shell)
  // initialMode: carries through the mode selected during onboarding.
  return <MainApp initialMode={mode} />;
}
