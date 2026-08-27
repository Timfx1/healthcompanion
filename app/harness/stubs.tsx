// ============================================================
// FILE: harness/stubs.tsx — the context, filled from the real fixture.
//
// These are FIXTURES, not mocks. Every value below comes from
// `data/mockJourney.ts` — the 45-day journey used by the harness to keep
// screenshots deterministic. Fresh app users are seeded from onboarding answers
// instead, so this fixture is deliberately not the product's first-run data.
//
// WHAT IS SUBSTITUTED, and it is only ever the edges:
//   • AsyncStorage. A browser has no such thing, and a screenshot must not
//     depend on hydration order.
//   • The welcome-back decision, which reads a persisted timestamp. A baseline
//     cannot wait three days, so the harness sets the flag directly — exactly
//     as the web prototype's `?screen=app:welcome-back` does, and for the same
//     reason: the ROUTE proves the surface can be drawn, and the RULE is proved
//     by `tests/store.test.ts` where a clock can be moved.
//   • The entitlement, so both sides of every gate can be photographed.
//
// The writes are real functions that mutate local state. That is what lets the
// behaviour spec tap the fast path and see an entry appear, rather than merely
// photographing a screen that claims it would.
// ============================================================

import { PropsWithChildren, useCallback, useMemo, useState } from "react";

import { RecoveryDataContext, type RecoveryDataValue } from "../src/state/recoveryContext";
import {
  APPOINTMENTS, JOURNEY, MEDICATIONS, MILESTONES, PHOTOS, REFLECTIONS, TIMELINE,
} from "../src/data/mockJourney";
import {
  captureEntry, checkInEntry, journalEntry, milestoneFromEntry, photoEntry,
  withQuestion, withReflectionReply,
} from "../src/rules";
import type { TimelineEntry } from "../src/types/recovery";

/** Deterministic ids. A random id in a screenshot is a diff on every run. */
let seq = 0;
const uid = () => `harness-${++seq}`;

export function HarnessData({
  children, premium, welcomeBack, empty,
}: PropsWithChildren<{ premium: boolean; welcomeBack: boolean; empty: boolean }>) {
  // `empty` photographs the day-one states — the report with nothing in it, a
  // timeline before anything has been written. Those are reachable on the first
  // open and are the ones most likely to be built without ever being looked at.
  const [timeline, setTimeline] = useState<TimelineEntry[]>(empty ? [] : TIMELINE);
  const [appointments, setAppointments] = useState(empty ? [] : APPOINTMENTS);
  const [milestones, setMilestones] = useState(empty ? [] : MILESTONES);
  const [photos, setPhotos] = useState(empty ? [] : PHOTOS);
  const [reflections, setReflections] = useState(empty ? [] : REFLECTIONS);
  const [savedArticles, setSavedArticles] = useState<string[]>([]);

  const push = useCallback((entry: TimelineEntry) => setTimeline((prev) => [entry, ...prev]), []);

  const recovery = useMemo<RecoveryDataValue>(() => ({
    hydrated: true,
    journey: JOURNEY,
    timeline,
    medications: empty ? [] : MEDICATIONS,
    appointments,
    photos,
    milestones,
    reflections,
    isWelcomeBack: welcomeBack,
    isPremium: premium,
    savedArticles,
    toggleArticleSaved: (title: string) =>
      setSavedArticles((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title])),
    addCapture: (text, viaVoice) => {
      const e = captureEntry(JOURNEY.id, text, new Date().toISOString(), uid(), viaVoice);
      if (e) push(e);
    },
    addCheckIn: (quick, detail) => push(checkInEntry(JOURNEY.id, quick, detail, new Date().toISOString(), uid())),
    addJournal: (title, detail) => {
      const e = journalEntry(JOURNEY.id, title, detail, new Date().toISOString(), uid());
      if (e) push(e);
    },
    addPhoto: (uri, caption) => {
      const made = photoEntry(JOURNEY.id, uri, caption, new Date().toISOString(), uid(), uid());
      if (!made) return;
      setPhotos((prev) => [made.photo, ...prev]);
      push(made.entry);
    },
    promoteToMilestone: (entryId) => {
      const entry = timeline.find((e) => e.id === entryId);
      if (!entry) return;
      setMilestones((prev) => [milestoneFromEntry(entry, uid()), ...prev]);
    },
    addMilestone: () => {},
    logMedication: () => {},
    addQuestion: (id, q) => setAppointments((prev) => withQuestion(prev, id, q)),
    saveReflectionReply: (week, reply) => setReflections((prev) => withReflectionReply(prev, week, reply)),
  }), [timeline, appointments, photos, milestones, reflections, welcomeBack, empty, push, premium, savedArticles]);

  // AnklePath's AppDataContext is deliberately NOT provided here. Entitlement
  // moved onto the Recovery Companion context, so these screens no longer
  // depend on the inherited exercise store — which is what let them render.
  return (
    <RecoveryDataContext.Provider value={recovery}>{children}</RecoveryDataContext.Provider>
  );
}
