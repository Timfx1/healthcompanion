// ============================================================
// FILE: RecoveryDataContext.tsx — the Recovery Companion store, on AsyncStorage.
//
// §7 Phase 1 item 4: "AsyncStorage via `AppDataContext` extension is fine."
// This is that extension, kept as its own provider rather than grafted onto
// `AppDataContext`, because the two describe different products — AppDataContext
// holds AnklePath's exercises, plan and four trackers, and mixing a new domain
// into it would make the eventual removal of the old one impossible to review.
//
// ─────────────────────────────────────────────────────────────────────────────
// IT CANNOT THROW. This is P1, not defensive habit.
//
// The web prototype's `components/storage.ts` was written with the same
// contract and the same reasoning, deliberately, so that the port would be a
// swap rather than a rewrite: a namespaced key, a JSON value, read and write,
// and every access wrapped. "The capture path must never fail (offline-safe,
// optimistic UI)" is a promise about the moment somebody has just written down
// something that mattered to them, and a storage exception is exactly the wrong
// thing to hand them at that moment.
//
// So writes are FIRE-AND-FORGET and state updates happen first. The entry
// appears on the timeline immediately and the persistence catches up; if it
// fails, the user keeps what they wrote for as long as the app is open and
// nothing on screen apologises. That is the same reasoning that gives the
// confirmation toast no failure branch.
//
// ─────────────────────────────────────────────────────────────────────────────
// SEEDING, AND WHY IT ONLY HAPPENS ONCE
//
// The mock journey is written to storage on first run and never again — not
// merged on every launch. A fixture that re-seeds would silently resurrect
// entries the user deleted, and would make "does this persist?" unanswerable,
// because the fixture would keep supplying the right answer for the wrong
// reason. `seeded` is its own key so the seed can be absent AND the store can
// be legitimately empty.
// ============================================================

import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  Appointment, CheckIn, Medication, Milestone, PhotoEntry, QuickAnswer,
  RecoveryJourney, TimelineEntry, WeeklyReflection,
} from "../types/recovery";
import { RecoveryDataContext, type RecoveryDataValue } from "./recoveryContext";
// Entitlement is still OWNED by AppDataContext; this provider only forwards it,
// so the Recovery Companion screens depend on one context instead of two.
import { useAppData } from "./AppDataContext";
import { APPOINTMENTS, JOURNEY, MEDICATIONS, MILESTONES, PHOTOS, REFLECTIONS, TIMELINE } from "../data/mockJourney";
// One tagging vocabulary, shared with the chip that renders it. This file
// briefly carried a SECOND keyword list with a different set of categories
// and substring matching, which tagged half of everything.
import { detectTags } from "../data/captureTags";
// The provider owns STATE and PERSISTENCE. What a write actually produces is
// in `rules/entries` — data in, data out — so "what happens when somebody
// saves an empty capture?" can be asked without React or a mocked AsyncStorage.
import {
  captureEntry, checkInEntry, isReturn, journalEntry, milestoneFromEntry,
  parseStored, photoEntry, withQuestion, withReflectionReply,
} from "../rules";

const NS = "recovery-companion:";
const KEYS = {
  seeded: NS + "seeded",
  journey: NS + "journey",
  timeline: NS + "timeline",
  medications: NS + "medications",
  appointments: NS + "appointments",
  photos: NS + "photos",
  milestones: NS + "milestones",
  reflections: NS + "reflections",
  /** Epoch ms of the previous open. Read once per launch, then overwritten. */
  lastOpened: NS + "last-opened",
} as const;

// The absence rule lives in `rules/absence`, pure and without a clock, so the
// first-open and backwards-clock cases can be tested at all.
export { ABSENCE_DAYS } from "../rules";

// ── Storage primitives. None of these can throw. ────────────────────────────

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    return parseStored(await AsyncStorage.getItem(key), fallback);
  } catch {
    // Storage itself was unavailable. `parseStored` handles the corrupt-value
    // case and is tested separately; this catch is for the device saying no.
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  // Not awaited anywhere. See the header note on optimistic writes.
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

// ── Context ─────────────────────────────────────────────────────────────────



// The context and its type moved to `state/recoveryContext`, so anything that
// needs the SHAPE does not import this file's AsyncStorage dependency with it.
// Re-exported here because every existing call site imports from this module.
export { RecoveryDataContext, useRecoveryData, type RecoveryDataValue } from "./recoveryContext";

const uid = () => `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function RecoveryDataProvider({ children }: PropsWithChildren) {
  const { isPremium, savedArticles, toggleArticleSaved } = useAppData();
  const [hydrated, setHydrated] = useState(false);
  const [journey, setJourney] = useState<RecoveryJourney>(JOURNEY);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [reflections, setReflections] = useState<WeeklyReflection[]>([]);
  const [isWelcomeBack, setIsWelcomeBack] = useState(false);

  // Guards the hydrate effect against React's double-invoke in development. The
  // welcome-back decision in particular must be taken once per launch: reading
  // the previous open also SPENDS it, so a second pass would read back the
  // timestamp it had just written and conclude the absence never happened.
  const hydrating = useRef(false);

  useEffect(() => {
    if (hydrating.current) return;
    hydrating.current = true;

    (async () => {
      const seeded = await readJson<boolean>(KEYS.seeded, false);
      if (!seeded) {
        writeJson(KEYS.seeded, true);
        writeJson(KEYS.journey, JOURNEY);
        writeJson(KEYS.timeline, TIMELINE);
        writeJson(KEYS.medications, MEDICATIONS);
        writeJson(KEYS.appointments, APPOINTMENTS);
        writeJson(KEYS.photos, PHOTOS);
        writeJson(KEYS.milestones, MILESTONES);
        writeJson(KEYS.reflections, REFLECTIONS);
        setJourney(JOURNEY);
        setTimeline(TIMELINE);
        setMedications(MEDICATIONS);
        setAppointments(APPOINTMENTS);
        setPhotos(PHOTOS);
        setMilestones(MILESTONES);
        setReflections(REFLECTIONS);
      } else {
        setJourney(await readJson(KEYS.journey, JOURNEY));
        setTimeline(await readJson(KEYS.timeline, [] as TimelineEntry[]));
        setMedications(await readJson(KEYS.medications, [] as Medication[]));
        setAppointments(await readJson(KEYS.appointments, [] as Appointment[]));
        setPhotos(await readJson(KEYS.photos, [] as PhotoEntry[]));
        setMilestones(await readJson(KEYS.milestones, [] as Milestone[]));
        setReflections(await readJson(KEYS.reflections, [] as WeeklyReflection[]));
      }

      // P2 welcome-back. A first-ever open is NOT a return: there is nothing to
      // come back from, and greeting a brand-new user with "good to see you
      // again" is a small lie. A clock that moved backwards is not a return
      // either, which is why this compares a gap rather than a date.
      const last = await readJson<number | null>(KEYS.lastOpened, null);
      const now = Date.now();
      setIsWelcomeBack(isReturn(last, now));
      writeJson(KEYS.lastOpened, now);

      setHydrated(true);
    })();
  }, []);

  /** Prepend and persist. The state update is what the UI waits on. */
  const pushEntry = useCallback((entry: TimelineEntry) => {
    setTimeline((prev) => {
      const next = [entry, ...prev];
      writeJson(KEYS.timeline, next);
      return next;
    });
  }, []);

  const addCapture = useCallback(
    (text: string, viaVoice?: boolean) => {
      // null means no-op. An empty save is not a refusal and has nothing to
      // apologise for — the same reason the confirmation toast has no failure
      // branch.
      const entry = captureEntry(journey.id, text, new Date().toISOString(), uid(), viaVoice);
      if (entry) pushEntry(entry);
    },
    [journey.id, pushEntry],
  );

  const addCheckIn = useCallback(
    (quick: QuickAnswer, detail?: Omit<CheckIn, "quick">) => {
      pushEntry(checkInEntry(journey.id, quick, detail, new Date().toISOString(), uid()));
    },
    [journey.id, pushEntry],
  );

  const addJournal = useCallback(
    (title: string, detail: string) => {
      const entry = journalEntry(journey.id, title, detail, new Date().toISOString(), uid());
      if (entry) pushEntry(entry);
    },
    [journey.id, pushEntry],
  );

  const addPhoto = useCallback(
    (uri: string, caption: string) => {
      // BOTH records or neither. A photo that reaches the timeline but not
      // `photos` is the defect this port already shipped once, leaving
      // PhotoCompare with nothing to compare.
      const made = photoEntry(journey.id, uri, caption, new Date().toISOString(), uid(), uid());
      if (!made) return;
      setPhotos((prev) => {
        const next = [made.photo, ...prev];
        writeJson(KEYS.photos, next);
        return next;
      });
      pushEntry(made.entry);
    },
    [journey.id, pushEntry],
  );

  const addMilestone = useCallback(
    (title: string, emoji?: string) => {
      if (!title.trim()) return;
      const milestone: Milestone = {
        id: uid(),
        journeyId: journey.id,
        date: new Date().toISOString(),
        title: title.trim(),
        emoji,
      };
      setMilestones((prev) => {
        const next = [milestone, ...prev];
        writeJson(KEYS.milestones, next);
        return next;
      });
      pushEntry({
        id: uid(),
        journeyId: journey.id,
        type: "milestone",
        date: milestone.date,
        title: milestone.title,
        detail: emoji,
        isAutoGenerated: false,
      });
    },
    [journey.id, pushEntry],
  );

  /**
   * §4.5's one-tap promote. Promotion is ONE-WAY and additive: the journal
   * entry stays exactly where it is. Moving it would mean a person tapping
   * "promote" loses the thing they wrote, which is a punishing outcome for a
   * button whose whole purpose is to celebrate.
   */
  const promoteToMilestone = useCallback(
    (entryId: string) => {
      const entry = timeline.find((e) => e.id === entryId);
      if (!entry) return;
      const milestone = milestoneFromEntry(entry, uid());
      setMilestones((prev) => {
        const next = [milestone, ...prev];
        writeJson(KEYS.milestones, next);
        return next;
      });
      pushEntry({
        id: uid(),
        journeyId: journey.id,
        type: "milestone",
        date: new Date().toISOString(),
        title: entry.title,
        isAutoGenerated: false,
      });
    },
    [journey.id, pushEntry, timeline],
  );

  const logMedication = useCallback(
    (medicationId: string, status: "taken" | "skipped") => {
      const med = medications.find((m) => m.id === medicationId);
      pushEntry({
        id: uid(),
        journeyId: journey.id,
        type: "medication",
        date: new Date().toISOString(),
        // "Skipped" is recorded and never scored. A skipped dose is information
        // for the clinician, not a mark against the user (P2).
        title: `${med?.name ?? "Medication"} — ${status}`,
        isAutoGenerated: false,
        data: { medicationId, status, time: new Date().toISOString() },
      });
    },
    [journey.id, medications, pushEntry],
  );

  const addQuestion = useCallback((appointmentId: string, question: string) => {
    setAppointments((prev) => {
      const next = withQuestion(prev, appointmentId, question);
      if (next === prev) return prev;
      writeJson(KEYS.appointments, next);
      return next;
    });
  }, []);

  const saveReflectionReply = useCallback((weekStart: string, reply: string) => {
    setReflections((prev) => {
      const next = withReflectionReply(prev, weekStart, reply);
      if (next === prev) return prev;
      writeJson(KEYS.reflections, next);
      return next;
    });
  }, []);

  const value = useMemo<RecoveryDataValue>(
    () => ({
      hydrated,
      journey,
      timeline,
      medications,
      appointments,
      photos,
      milestones,
      reflections,
      isWelcomeBack,
      isPremium,
      savedArticles,
      toggleArticleSaved,
      addCapture,
      addCheckIn,
      addJournal,
      addPhoto,
      promoteToMilestone,
      addMilestone,
      logMedication,
      addQuestion,
      saveReflectionReply,
    }),
    [
      hydrated, journey, timeline, medications, appointments, photos, milestones, reflections,
      isWelcomeBack, isPremium, savedArticles, toggleArticleSaved,
      addCapture, addCheckIn, addJournal, addPhoto, promoteToMilestone, addMilestone,
      logMedication, addQuestion, saveReflectionReply,
    ],
  );

  return <RecoveryDataContext.Provider value={value}>{children}</RecoveryDataContext.Provider>;
}



/** Exported for tests and for screens that need to reason about day keys. */
export const STORAGE_KEYS = KEYS;
