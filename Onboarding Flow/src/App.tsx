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
import MainApp from "./components/MainApp";
import type { Mode } from "./components/tokens";

export default function App() {
  // phase controls which top-level view is rendered.
  // Starts at "onboarding"; switches to "app" when onboarding completes.
  const [phase, setPhase] = useState<"onboarding" | "app">("onboarding");

  // mode is captured from Onboarding on completion so MainApp launches
  // in the same dark/light state the user left onboarding in.
  const [mode, setMode] = useState<Mode>("dark");

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
