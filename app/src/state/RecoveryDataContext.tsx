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
//
// ─────────────────────────────────────────────────────────────────────────────
// NOTHING BELOW THIS PROVIDER EXISTS BEFORE IT HAS HYDRATED
//
// `hydrated` was on the context from the start and NOTHING read it. Not one
// Recovery Companion screen. So every screen read `timeline` before it was
// loaded, and the first paint of Home said "0 check-ins" — a factual claim
// about somebody's recovery, made before the data existed — before swapping to
// 24. `harness/slice.spec.ts` caught it on its first run: the pill went
// `["0 check-ins", "24 check-ins"]` under a 120ms read.
//
// In the shipped app that was MASKED, not prevented: `RootNavigator` holds a
// splash for a minimum of two seconds, so eight sequential `getItem`s almost
// always land first. That is a coincidence of an unrelated timer, not a
// guarantee — `AppDataContext`'s hydrate is ONE read and this one is eight, so
// a cold or contended device can lose that race with nothing on screen to say
// it did.
//
// So the guard is structural rather than per-screen: children do not mount
// until the store is ready, and a consumer that cannot exist cannot read a
// half-loaded timeline. `fallback` keeps the UI decision with the caller —
// `App.tsx` passes the splash the app already shows, so the wait looks exactly
// as it did before. Same shape as Suspense, for the same reason.
// ============================================================

import { PropsWithChildren, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  Appointment, CheckIn, Medication, Milestone, PhotoEntry, QuickAnswer,
  RecoveryJourney, TimelineEntry, WeeklyReflection,
} from "../types/recovery";
import { RecoveryDataContext, type RecoveryDataValue } from "./recoveryContext";
// Entitlement is still OWNED by AppDataContext; this provider only forwards it,
// so the Recovery Companion screens depend on one context instead of two.
import { useAppData } from "./AppDataContext";
import { useOnboarding } from "./OnboardingContext";
import { DEMO_RECOVERY_SEED, recoverySeedFromOnboarding } from "../data/recoverySeed";
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

// ── One persisted slice: state, and the write that goes with it ─────────────
//
// THE WRITE USED TO LIVE INSIDE THE `setState` UPDATER:
//
//   setTimeline((prev) => { const next = [entry, ...prev]; writeJson(k, next); return next; });
//
// which typechecks, reads well and is wrong. React updaters must be PURE — the
// runtime is free to call one more than once for a single update, and does:
// under StrictMode it double-invokes deliberately to surface exactly this, and
// in concurrent rendering it re-invokes when a render is discarded and rebased.
// `harness/slice.spec.ts` measured it: one capture, `pending()` of 2, two
// `set recovery-companion:timeline` operations back to back.
//
// Two identical writes are only wasteful. The failure mode that is NOT
// harmless is a rebase: the updater is replayed against a different `prev`, so
// two DIFFERENT values are written for one key with no ordering guarantee
// between them, and the older one can land last. That loses an entry silently,
// on the capture path, which is the one place P1 says must not lose anything.
//
// So the updater is gone. A ref holds what has been committed, `commit`
// computes the next value from it, sets state and writes — once, outside React,
// in a plain function call. Rapid successive commits are safe because the ref
// is updated synchronously before `setValue`.
//
// PERSISTENCE IS STILL AT THE CALL SITE rather than in an effect on the value,
// which is the other obvious shape and is deliberately not used here. An effect
// re-persists after HYDRATION too, so a transient read failure would fall back
// to `[]` and then write that empty fallback over good data — turning a
// recoverable read error into permanent loss. Writing only what the user did
// cannot do that.
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const committed = useRef<T>(initial);

  /** Set and persist. Takes a value or a function of the committed one. */
  const commit = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(committed.current) : next;
      // An unchanged value is never written. This is what `addQuestion` and
      // `saveReflectionReply` already meant by returning `prev` untouched.
      if (Object.is(resolved, committed.current)) return;
      committed.current = resolved;
      setValue(resolved);
      writeJson(key, resolved);
    },
    [key],
  );

  /** Adopt a value from storage WITHOUT writing it back. Hydration is a read. */
  const adopt = useCallback((next: T) => {
    committed.current = next;
    setValue(next);
  }, []);

  return [value, commit, adopt] as const;
}

// ── Context ─────────────────────────────────────────────────────────────────



// The context and its type moved to `state/recoveryContext`, so anything that
// needs the SHAPE does not import this file's AsyncStorage dependency with it.
// Re-exported here because every existing call site imports from this module.
export { RecoveryDataContext, useRecoveryData, type RecoveryDataValue } from "./recoveryContext";

const uid = () => `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function RecoveryDataProvider({
  children,
  /**
   * Rendered instead of `children` until the store has hydrated. Defaults to
   * nothing, so a caller that does not care gets a blank frame rather than a
   * screen making claims about data it has not read. `App.tsx` passes the
   * splash, which is what the app was already showing at that moment anyway.
   */
  fallback = null,
  useDemoSeed = false,
}: PropsWithChildren<{ fallback?: ReactNode; useDemoSeed?: boolean }>) {
  const { isPremium, savedArticles, toggleArticleSaved } = useAppData();
  const { state: onboarding, hydrated: onboardingHydrated } = useOnboarding();
  const [hydrated, setHydrated] = useState(false);
  // `journey` and `medications` are read at hydration and never written back by
  // any screen, so they stay plain state — a `commit` they never call would be
  // a persistence path nothing exercises.
  const [journey, setJourney] = useState<RecoveryJourney>(DEMO_RECOVERY_SEED.journey);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [timeline, commitTimeline, adoptTimeline] = usePersisted<TimelineEntry[]>(KEYS.timeline, []);
  const [appointments, commitAppointments, adoptAppointments] = usePersisted<Appointment[]>(KEYS.appointments, []);
  const [photos, commitPhotos, adoptPhotos] = usePersisted<PhotoEntry[]>(KEYS.photos, []);
  const [milestones, commitMilestones, adoptMilestones] = usePersisted<Milestone[]>(KEYS.milestones, []);
  const [reflections, commitReflections, adoptReflections] = usePersisted<WeeklyReflection[]>(KEYS.reflections, []);
  const [isWelcomeBack, setIsWelcomeBack] = useState(false);

  // Guards the hydrate effect against React's double-invoke in development. The
  // welcome-back decision in particular must be taken once per launch: reading
  // the previous open also SPENDS it, so a second pass would read back the
  // timestamp it had just written and conclude the absence never happened.
  const hydrating = useRef(false);

  useEffect(() => {
    if (!onboardingHydrated) return;
    if (hydrating.current) return;
    hydrating.current = true;

    (async () => {
      const initialSeed = useDemoSeed ? DEMO_RECOVERY_SEED : recoverySeedFromOnboarding(onboarding);
      const seeded = await readJson<boolean>(KEYS.seeded, false);
      if (!seeded) {
        writeJson(KEYS.seeded, true);
        writeJson(KEYS.journey, initialSeed.journey);
        writeJson(KEYS.timeline, initialSeed.timeline);
        writeJson(KEYS.medications, initialSeed.medications);
        writeJson(KEYS.appointments, initialSeed.appointments);
        writeJson(KEYS.photos, initialSeed.photos);
        writeJson(KEYS.milestones, initialSeed.milestones);
        writeJson(KEYS.reflections, initialSeed.reflections);
        setJourney(initialSeed.journey);
        setMedications(initialSeed.medications);
        // `adopt`, not `commit`: the eight lines above have already written the
        // fixture, and committing it again would be the seed happening twice.
        adoptTimeline(initialSeed.timeline);
        adoptAppointments(initialSeed.appointments);
        adoptPhotos(initialSeed.photos);
        adoptMilestones(initialSeed.milestones);
        adoptReflections(initialSeed.reflections);
      } else {
        setJourney(await readJson(KEYS.journey, initialSeed.journey));
        setMedications(await readJson(KEYS.medications, [] as Medication[]));
        // Hydration is a READ. Adopting rather than committing is what keeps a
        // transient read failure from persisting its own fallback over good
        // data — see the note on `usePersisted`.
        adoptTimeline(await readJson(KEYS.timeline, [] as TimelineEntry[]));
        adoptAppointments(await readJson(KEYS.appointments, [] as Appointment[]));
        adoptPhotos(await readJson(KEYS.photos, [] as PhotoEntry[]));
        adoptMilestones(await readJson(KEYS.milestones, [] as Milestone[]));
        adoptReflections(await readJson(KEYS.reflections, [] as WeeklyReflection[]));
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
  }, [onboarding, onboardingHydrated, useDemoSeed]);

  /** Prepend and persist. The state update is what the UI waits on. */
  const pushEntry = useCallback(
    (entry: TimelineEntry) => commitTimeline((prev) => [entry, ...prev]),
    [commitTimeline],
  );

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
      commitPhotos((prev) => [made.photo, ...prev]);
      pushEntry(made.entry);
    },
    [journey.id, commitPhotos, pushEntry],
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
      commitMilestones((prev) => [milestone, ...prev]);
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
    [journey.id, commitMilestones, pushEntry],
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
      commitMilestones((prev) => [milestone, ...prev]);
      pushEntry({
        id: uid(),
        journeyId: journey.id,
        type: "milestone",
        date: new Date().toISOString(),
        title: entry.title,
        isAutoGenerated: false,
      });
    },
    [journey.id, commitMilestones, pushEntry, timeline],
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

  // `withQuestion` returns the SAME array when there is nothing to add, and
  // `commit` writes nothing for an unchanged value. The no-op stays a no-op —
  // no state update, no write, no re-render.
  const addQuestion = useCallback(
    (appointmentId: string, question: string) =>
      commitAppointments((prev) => withQuestion(prev, appointmentId, question)),
    [commitAppointments],
  );

  const saveReflectionReply = useCallback(
    (weekStart: string, reply: string) =>
      commitReflections((prev) => withReflectionReply(prev, weekStart, reply)),
    [commitReflections],
  );

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

  // The provider is mounted either way, so the hydrate effect above runs and
  // `value` stays referentially stable across the switch. Only the SUBTREE
  // waits. Returning early before the hooks would be a different bug.
  return (
    <RecoveryDataContext.Provider value={value}>
      {hydrated ? children : fallback}
    </RecoveryDataContext.Provider>
  );
}



/** Exported for tests and for screens that need to reason about day keys. */
export const STORAGE_KEYS = KEYS;
