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

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  Appointment,
  AutoTag,
  CheckIn,
  Medication,
  Milestone,
  PhotoEntry,
  QuickAnswer,
  RecoveryJourney,
  TimelineEntry,
  TimelineEntryType,
  WeeklyReflection,
} from "../types/recovery";
import { APPOINTMENTS, JOURNEY, MEDICATIONS, MILESTONES, PHOTOS, REFLECTIONS, TIMELINE } from "../data/mockJourney";

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

/**
 * How long a gap has to be before returning is worth remarking on. Three days,
 * so an ordinary weekend never triggers it — the same rule and the same reason
 * as the web prototype's `absence.ts`.
 */
export const ABSENCE_DAYS = 3;
const DAY_MS = 86_400_000;

// ── Storage primitives. None of these can throw. ────────────────────────────

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    // A corrupt value is treated as absent. Losing one malformed entry beats
    // refusing to open the screen it belongs to.
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  // Not awaited anywhere. See the header note on optimistic writes.
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

// ── Silent auto-tagging (P1) ────────────────────────────────────────────────
//
// "Light auto-structuring in Phase 1: simple keyword tagging applied SILENTLY
// and editable later; never blocks saving." So this runs after the text is
// already saved, and its result is decoration on an entry that exists either
// way. It is not a classifier and is not trying to be one — a wrong tag costs
// nothing, and asking the user to confirm one would cost the whole principle.
const TAG_WORDS: Record<AutoTag, string[]> = {
  pain: ["pain", "hurt", "ache", "aching", "sore", "throb", "sharp", "stiff"],
  sleep: ["sleep", "slept", "awake", "insomnia", "tired", "night", "rest"],
  mood: ["mood", "low", "anxious", "frustrated", "happy", "down", "fed up"],
  medication: ["med", "meds", "medication", "tablet", "pill", "dose", "naproxen", "paracetamol", "ibuprofen"],
  mobility: ["walk", "walked", "walking", "stairs", "steps", "crutch", "crutches", "bend", "knee gave"],
};

export function autoTag(text: string): AutoTag[] {
  const lower = text.toLowerCase();
  return (Object.keys(TAG_WORDS) as AutoTag[]).filter((tag) =>
    TAG_WORDS[tag].some((word) => lower.includes(word)),
  );
}

// ── Context ─────────────────────────────────────────────────────────────────

type RecoveryDataValue = {
  hydrated: boolean;
  journey: RecoveryJourney;
  timeline: TimelineEntry[];
  medications: Medication[];
  appointments: Appointment[];
  photos: PhotoEntry[];
  milestones: Milestone[];
  reflections: WeeklyReflection[];
  /**
   * True on the first render after an absence of ABSENCE_DAYS or more, and
   * false for the rest of the launch. There is deliberately NO `daysAway`
   * anywhere in this type: a duration in scope is a duration somebody
   * eventually renders, and "you've been away 12 days" is the guilt mechanic P2
   * exists to make unbuildable. The safest place to stop a count reaching a
   * screen is before it leaves the module that computes it.
   */
  isWelcomeBack: boolean;

  /** P1. Returns immediately; the write catches up. Never rejects. */
  addCapture: (text: string, viaVoice?: boolean) => void;
  /** P3. `quick` alone is a complete check-in. */
  addCheckIn: (quick: QuickAnswer, detail?: Omit<CheckIn, "quick">) => void;
  addJournal: (title: string, detail: string) => void;
  promoteToMilestone: (entryId: string) => void;
  addMilestone: (title: string, emoji?: string) => void;
  logMedication: (medicationId: string, status: "taken" | "skipped") => void;
  addQuestion: (appointmentId: string, question: string) => void;
  saveReflectionReply: (weekStart: string, reply: string) => void;
};

const RecoveryDataContext = createContext<RecoveryDataValue | undefined>(undefined);

const uid = () => `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function RecoveryDataProvider({ children }: PropsWithChildren) {
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
      setIsWelcomeBack(last !== null && now - last >= ABSENCE_DAYS * DAY_MS);
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
      const trimmed = text.trim();
      // An empty save is a NO-OP, not a refusal. There is nothing to apologise
      // for, which is the same reason the confirmation toast has no failure
      // branch — and the same behaviour the prototype's spec pins down.
      if (!trimmed) return;
      pushEntry({
        id: uid(),
        journeyId: journey.id,
        type: "capture",
        date: new Date().toISOString(),
        title: trimmed,
        isAutoGenerated: false,
        data: { text: trimmed, viaVoice, autoTags: autoTag(trimmed) },
      });
    },
    [journey.id, pushEntry],
  );

  const addCheckIn = useCallback(
    (quick: QuickAnswer, detail?: Omit<CheckIn, "quick">) => {
      const label = quick === "better" ? "Better" : quick === "same" ? "Same" : "Worse";
      pushEntry({
        id: uid(),
        journeyId: journey.id,
        type: "checkin",
        date: new Date().toISOString(),
        title: label,
        isAutoGenerated: false,
        data: { quick, ...detail },
      });
    },
    [journey.id, pushEntry],
  );

  const addJournal = useCallback(
    (title: string, detail: string) => {
      if (!title.trim() && !detail.trim()) return;
      pushEntry({
        id: uid(),
        journeyId: journey.id,
        type: "journal",
        date: new Date().toISOString(),
        title: title.trim() || "Journal entry",
        detail: detail.trim(),
        isAutoGenerated: false,
      });
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
      const milestone: Milestone = {
        id: uid(),
        journeyId: journey.id,
        date: entry.date,
        title: entry.title,
        fromJournalEntryId: entry.id,
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
    if (!question.trim()) return;
    setAppointments((prev) => {
      const next = prev.map((a) =>
        a.id === appointmentId ? { ...a, questions: [...a.questions, question.trim()] } : a,
      );
      writeJson(KEYS.appointments, next);
      return next;
    });
  }, []);

  const saveReflectionReply = useCallback((weekStart: string, reply: string) => {
    if (!reply.trim()) return;
    setReflections((prev) => {
      const next = prev.map((r) => (r.weekStart === weekStart ? { ...r, reply: reply.trim() } : r));
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
      addCapture,
      addCheckIn,
      addJournal,
      promoteToMilestone,
      addMilestone,
      logMedication,
      addQuestion,
      saveReflectionReply,
    }),
    [
      hydrated, journey, timeline, medications, appointments, photos, milestones, reflections,
      isWelcomeBack, addCapture, addCheckIn, addJournal, promoteToMilestone, addMilestone,
      logMedication, addQuestion, saveReflectionReply,
    ],
  );

  return <RecoveryDataContext.Provider value={value}>{children}</RecoveryDataContext.Provider>;
}

export function useRecoveryData(): RecoveryDataValue {
  const ctx = useContext(RecoveryDataContext);
  if (!ctx) throw new Error("useRecoveryData must be used inside <RecoveryDataProvider>");
  return ctx;
}

/** Exported for tests and for screens that need to reason about day keys. */
export const STORAGE_KEYS = KEYS;
