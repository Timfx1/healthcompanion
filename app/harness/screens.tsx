// ============================================================
// FILE: harness/screens.tsx — every addressable screen, in one list.
//
// This list IS the coverage claim, so it is written to be read: if a screen is
// not here, nothing draws it, and §11 is a record of what that produces.
//
// Screens take plain props and know nothing about the navigator, which is what
// makes this possible at all — `onClose`, `onShare` and friends are wired to
// no-ops here because navigation is `detail/routes.tsx`'s job and is not what a
// baseline is evidence about.
//
// STATES ARE ADDRESSED, NOT CLICKED THROUGH. `?premium=1`, `?empty=1`,
// `?welcomeBack=1` reach the variants directly. A baseline arrived at by
// interaction encodes that interaction's timing into the image, so a later
// change to any transition would register as a regression on every screen
// downstream — the lesson the prototype's harness already paid for.
// ============================================================

import type { ReactNode } from "react";

import { RecoveryHomeScreen } from "../src/screens/recovery/HomeScreen";
import { RecoveryTimelineScreen } from "../src/screens/recovery/TimelineScreen";
import { RecoveryCheckInScreen } from "../src/screens/recovery/CheckInScreen";
import { RecoveryProgressScreen } from "../src/screens/recovery/ProgressScreen";
import { RecoveryProfileScreen } from "../src/screens/recovery/ProfileScreen";

import { QuickCaptureSheet } from "../src/screens/recovery/detail/QuickCaptureSheet";
import { AddTimelineEntry } from "../src/screens/recovery/detail/AddTimelineEntry";
import { JournalEntryScreen } from "../src/screens/recovery/detail/JournalEntryScreen";
import { MilestoneDetail } from "../src/screens/recovery/detail/MilestoneDetail";
import { ShareCardPreview } from "../src/screens/recovery/detail/ShareCardPreview";
import { MedicationDetail } from "../src/screens/recovery/detail/MedicationDetail";
import { AppointmentDetail } from "../src/screens/recovery/detail/AppointmentDetail";
import { QuestionsForDoctor } from "../src/screens/recovery/detail/QuestionsForDoctor";
import { PhotoCompare } from "../src/screens/recovery/detail/PhotoCompare";
import { ReportPreview } from "../src/screens/recovery/detail/ReportPreview";
import { ReportDateRange } from "../src/screens/recovery/detail/ReportDateRange";
import { EducationArticle } from "../src/screens/recovery/detail/EducationArticle";
import { SafetyScreen } from "../src/screens/recovery/detail/SafetyScreen";
import { WeeklyReflectionScreen } from "../src/screens/recovery/detail/WeeklyReflection";

import { useRecoveryData } from "../src/state/recoveryContext";
import { lastVisit, nextAppointment } from "../src/rules";

const noop = () => {};

// ─────────────────────────────────────────────────────────────────────────────
// ENTITIES COME FROM THE CONTEXT, NOT FROM THE FIXTURE MODULE.
//
// These first read `mockJourney` directly, which made the harness LESS faithful
// than the app: `detail/routes.tsx` resolves an id against the store on every
// render, so a screen there sees its own writes. A static fixture object never
// changes, and "add a question, watch it appear" failed in the harness while
// working in the app.
//
// A harness that is easier to satisfy than the real adapter is a harness that
// certifies the wrong thing. These wrappers do what the adapters do.
function WithUpcomingAppointment({ render }: { render: (a: NonNullable<ReturnType<typeof nextAppointment>>) => ReactNode }) {
  const { appointments } = useRecoveryData();
  const appointment = nextAppointment(appointments, Date.now());
  return appointment ? <>{render(appointment)}</> : null;
}

function WithPastAppointment({ render }: { render: (a: NonNullable<ReturnType<typeof lastVisit>>) => ReactNode }) {
  const { appointments } = useRecoveryData();
  const appointment = lastVisit(appointments, Date.now()) ?? appointments[0];
  return appointment ? <>{render(appointment)}</> : null;
}

function WithFirstMedication({ render }: { render: (m: { id: string }) => ReactNode }) {
  const { medications } = useRecoveryData();
  return medications[0] ? <>{render(medications[0])}</> : null;
}

function WithMilestone({ render }: { render: (m: { id: string }) => ReactNode }) {
  const { milestones } = useRecoveryData();
  return milestones[0] ? <>{render(milestones[0])}</> : null;
}

function WithJournalEntry({ render }: { render: (e: { id: string } | undefined) => ReactNode }) {
  const { timeline } = useRecoveryData();
  return <>{render(timeline.find((e) => e.type === "journal"))}</>;
}

// The RENDERERS. The ids and their notes live in `manifest.ts`, which is plain
// data so the Playwright spec — which runs in Node and cannot resolve
// react-native — can read the coverage list without importing any of this.
export const RENDERERS: Record<string, () => ReactNode> = {
  // ── The five tabs ─────────────────────────────────────────────────────────
    "home": () => <RecoveryHomeScreen onOpenCheckIn={noop} onOpenReport={noop} onOpenWeekly={noop} onOpenAppointment={noop} />,
    "timeline": () => <RecoveryTimelineScreen onAdd={noop} onOpenEntry={noop} />,
    "checkin": () => <RecoveryCheckInScreen onDone={noop} />,
    "progress": () => <RecoveryProgressScreen onUnlock={noop} />,
    "profile": () => <RecoveryProfileScreen onOpenMedications={noop} onOpenAppointments={noop} onOpenEducation={noop} onOpenSafety={noop} onOpenReport={noop} onOpenPremium={noop} />,

  // ── The capture lane ──────────────────────────────────────────────────────
    "capture": () => <QuickCaptureSheet onClose={noop} />,
    "add-entry": () => <AddTimelineEntry onClose={noop} onPick={noop} />,
    "journal-new": () => <JournalEntryScreen onClose={noop} />,
    "journal-reading": () => <WithJournalEntry render={(e) => <JournalEntryScreen entry={e as never} onClose={noop} />} />,

  // ── The timeline detail set ───────────────────────────────────────────────
    "milestone": () => <WithMilestone render={(m) => <MilestoneDetail milestone={m as never} dayN={6} onClose={noop} onShare={noop} />} />,
    "share-card": () => <ShareCardPreview title="Walked without crutches" dayN={44} date="25 Apr" onClose={noop} />,
    "medication": () => <WithFirstMedication render={(m) => <MedicationDetail medication={m as never} onClose={noop} />} />,
    "appointment-upcoming": () => <WithUpcomingAppointment render={(a) => <AppointmentDetail appointment={a} onClose={noop} onOpenReport={noop} onOpenQuestions={noop} />} />,
    "appointment-past": () => <WithPastAppointment render={(a) => <AppointmentDetail appointment={a} onClose={noop} onOpenReport={noop} onOpenQuestions={noop} />} />,
    "questions": () => <WithPastAppointment render={(a) => <QuestionsForDoctor appointment={a} onClose={noop} />} />,
    "questions-empty": () => <WithPastAppointment render={(a) => <QuestionsForDoctor appointment={{ ...a, questions: [] }} onClose={noop} />} />,

  // ── The photo lane ────────────────────────────────────────────────────────
    "compare": () => <PhotoCompare onClose={noop} onUnlock={noop} />,

  // ── The report lane ───────────────────────────────────────────────────────
    "report": () => <ReportPreview onClose={noop} onOpenRange={noop} />,
    "report-range": () => <ReportDateRange selected="sinceVisit" onSelect={noop} onClose={noop} />,

  // ── Content ───────────────────────────────────────────────────────────────
    "article": () => <EducationArticle articleId="is-this-normal-week-6" onClose={noop} onUnlock={noop} />,
    "article-deep": () => <EducationArticle articleId="loading-and-tissue-adaptation" onClose={noop} onUnlock={noop} />,
    "safety": () => <SafetyScreen onClose={noop} />,
    "weekly": () => <WeeklyReflectionScreen onClose={noop} />,
};
