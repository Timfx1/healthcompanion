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
import MainApp, { type Tab, type DetailKey } from "./components/MainApp";
import { fixtures, type FixtureName } from "./components/reportFixtures";
import type { ExportState } from "./components/ReportPreview";
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
//   ?screen=app:checkin-selected      the fast path with "Worse" selected
//   ?screen=app:paywall               MainApp with the paywall sheet open
//   ?screen=app:add                   the FAB sheet (AddTimelineEntry)
//   ?screen=app:capture               the quick-capture sheet, empty
//   ?screen=app:capture-ready         typed, nothing recognised — the normal case
//   ?screen=app:capture-tagged        typed, keywords recognised silently
//   ?screen=app:detail-<key>          one timeline detail state. Keys are the
//                                     DetailKey union in MainApp — journalNew,
//                                     journalReading, journalPromoted,
//                                     milestone, milestoneAuto, medication,
//                                     medicationNew, appointmentUpcoming,
//                                     appointmentPast, questions,
//                                     questionsEmpty, photoEmpty,
//                                     photoChosen, compareLocked,
//                                     compareReady, compareInsufficient,
//                                     range, rangeCustom, rangeNoAnchor,
//                                     weekly.
//   ?screen=app:safety                when to contact a doctor (N3, N7)
//   ?screen=app:article               a free article, unsaved
//   ?screen=app:article-saved         the same article, saved
//   ?screen=app:article-locked        a premium deep dive, gated softly (P9)
//   ?screen=app:article-unlocked      the same deep dive, with premium
//   ?screen=app:report                the doctor report, ready state
//   ?screen=app:report-<fixture>      one report state: empty | sparse | first
//                                     | noChange | readyWithRedFlags
//   ?screen=app:report-exporting      the report with an export in flight
//   ?screen=app:report-failed         the report after an export failed
//   ?screen=app:welcome-back         Home on the first open after an absence (P2)
//   ?screen=app:share                 the milestone share card preview (P8)
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
  | { kind: "app"; tab: Tab; overlay: "checkin" | "paywall" | "add" | "capture" | null; pinToast?: boolean; welcomeBack?: boolean; share?: boolean;
      captureText?: string; safety?: boolean; article?: string | null; fastChoice?: number | null;
      saved?: boolean; premium?: boolean; detail?: DetailKey | null;
      report?: FixtureName | null; exportState?: ExportState };

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
    // The selected fast-path option, addressed directly. It exists for 500ms
    // behind a tap, so nothing could photograph it before this route.
    if (target === "checkin-selected") return { route: { kind: "app", tab: "home", overlay: "checkin", fastChoice: 2 }, mode };
    if (target === "paywall") return { route: { kind: "app", tab: "home", overlay: "paywall" }, mode };

    // The report's states are DATA, not flags — the screen derives depth from
    // the numbers. So a route names a fixture and the screen decides what that
    // is, which means a baseline is a photograph of what the data produces
    // rather than of a boolean somebody set.
    // The capture sheet's states are derived from its TEXT, exactly as the
    // report's are derived from its data. So a route supplies text and the
    // screen decides what that means — the baseline photographs a consequence,
    // never a flag. "capture-ready" deliberately contains no keyword, because
    // the normal case is a capture nothing is recognised in.
    // Access is derived from the article's tier and the entitlement, so a route
    // supplies BOTH and the screen decides. "article-unlocked" is the same deep
    // dive as "article-locked" with premium held — one fixture, two truths.
    // Every detail state gets a route. Their states are derived from fixture
    // data — a date decides whether an appointment is upcoming or past, a log
    // length decides whether a medication has history — so these are addresses
    // for consequences, not switches.
    if (target.startsWith("detail-")) {
      const key = target.slice(7) as DetailKey;
      return { route: { kind: "app", tab: "timeline", overlay: null, detail: key }, mode };
    }

    if (target === "safety") return { route: { kind: "app", tab: "profile", overlay: null, safety: true }, mode };
    if (target === "article") return { route: { kind: "app", tab: "profile", overlay: null, article: "is-this-normal-week-6" }, mode };
    if (target === "article-saved") return { route: { kind: "app", tab: "profile", overlay: null, article: "is-this-normal-week-6", saved: true }, mode };
    if (target === "article-locked") return { route: { kind: "app", tab: "profile", overlay: null, article: "loading-and-tissue-adaptation" }, mode };
    if (target === "article-unlocked") return { route: { kind: "app", tab: "profile", overlay: null, article: "loading-and-tissue-adaptation", premium: true }, mode };

    if (target === "add") return { route: { kind: "app", tab: "timeline", overlay: "add" }, mode };
    if (target === "capture") return { route: { kind: "app", tab: "timeline", overlay: "capture" }, mode };
    if (target === "capture-ready") return { route: { kind: "app", tab: "timeline", overlay: "capture", captureText: "took the long way round the block today" }, mode };
    if (target === "capture-tagged") return { route: { kind: "app", tab: "timeline", overlay: "capture", captureText: "knee pain after stairs, slept badly and skipped my meds" }, mode };

    if (target === "report") return { route: { kind: "app", tab: "home", overlay: null, report: "ready" }, mode };
    if (target === "report-exporting") return { route: { kind: "app", tab: "home", overlay: null, report: "noChange", exportState: "working" }, mode };
    if (target === "report-failed")    return { route: { kind: "app", tab: "home", overlay: null, report: "noChange", exportState: "failed" }, mode };
    if (target.startsWith("report-")) {
      const name = target.slice(7) as FixtureName;
      if (name in fixtures) return { route: { kind: "app", tab: "home", overlay: null, report: name }, mode };
    }
    // Home with the confirmation toast pinned visible. A TRANSIENT state needs
    // its own route or it cannot be baselined at all: it lives for 2.4s behind
    // an interaction, and the harness advances the clock past that before it
    // captures. The toast carried a dead code path and an unused token family
    // for exactly as long as nothing could photograph it.
    // The welcome-back state is DERIVED from a persisted timestamp, which makes
    // it unphotographable by the harness: a baseline cannot wait three days.
    // This route forces the rendered state WITHOUT touching storage, so the
    // image proves the surface can be drawn while the behaviour spec - which
    // seeds a real absence and reloads - proves the rule that reaches it. Those
    // are two different claims and neither substitutes for the other.
    if (target === "welcome-back") return { route: { kind: "app", tab: "home", overlay: null, welcomeBack: true }, mode };
    // ShareCardScreen was the last surface in the product with no route and no
    // baseline. share.* was found carrying dayCard's 1.58:1 bug for precisely
    // that reason - nothing rendered the tokens, so nothing could disagree.
    if (target === "share") return { route: { kind: "app", tab: "timeline", overlay: null, share: true }, mode };
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
      : <MainApp initialMode={DEV_MODE} initialTab={DEV_ROUTE.tab} initialOverlay={DEV_ROUTE.overlay} pinToast={DEV_ROUTE.pinToast} initialReport={DEV_ROUTE.report ?? null} initialExport={DEV_ROUTE.exportState ?? "idle"} initialCaptureText={DEV_ROUTE.captureText ?? ""} initialSafety={DEV_ROUTE.safety ?? false} initialArticle={DEV_ROUTE.article ?? null} initialSaved={DEV_ROUTE.saved ?? false} initialPremium={DEV_ROUTE.premium ?? false} initialDetail={DEV_ROUTE.detail ?? null} initialFastChoice={DEV_ROUTE.fastChoice ?? null} forceWelcomeBack={DEV_ROUTE.welcomeBack ?? false} initialShare={DEV_ROUTE.share ?? false} />;
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
