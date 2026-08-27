// ============================================================
// FILE: state/recoveryContext.ts — the context, separated from the provider.
//
// The context object and its type live here; `RecoveryDataContext.tsx` holds
// the PROVIDER, which is the half that talks to AsyncStorage.
//
// WHY THEY ARE SPLIT. Anything importing the context used to import the
// provider's whole dependency tree with it, AsyncStorage included — and
// AsyncStorage reaches for native modules that a browser cannot supply. The
// render harness needs the context and emphatically does not need storage, and
// before this split it could not have one without the other.
//
// It is also just the right shape: a context is a declaration, a provider is an
// implementation, and only one of them should require a device.
// ============================================================

import { createContext, useContext } from "react";

import type {
  Appointment, CheckIn, Medication, Milestone, PhotoEntry, QuickAnswer,
  RecoveryJourney, TimelineEntry, WeeklyReflection,
} from "../types/recovery";

export type RecoveryDataValue = {
  /**
   * ALWAYS TRUE FOR ANYTHING THAT CAN READ IT, and that is the point.
   *
   * It used to be a flag every screen was free to ignore, and every screen did:
   * it had no consumers anywhere in the Recovery Companion tree, so Home's
   * first paint said "0 check-ins" over a forty-five-day recovery and the
   * timeline said "Nothing here yet." before it had looked. Both are factual
   * claims about somebody's own recovery, made before the data existed.
   *
   * `RecoveryDataProvider` now withholds its children until it is true, so a
   * consumer cannot read `timeline` before `hydrated` — there is no consumer
   * yet. It stays on the type because the provider still has the state and
   * because removing it would make the guarantee harder to find, not because a
   * screen should branch on it.
   */
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
   * exists to make unbuildable.
   */
  isWelcomeBack: boolean;

  /**
   * ENTITLEMENT LIVES HERE, not in AnklePath's AppDataContext.
   *
   * PhotoCompare and EducationArticle used to read `useAppData()` for this,
   * which coupled two Recovery Companion screens to the inherited exercise
   * store for one boolean. The provider still sources it from there — nothing
   * changes at runtime — but the screens now depend on their own context, so
   * they can be rendered without dragging AnklePath's whole tree in behind
   * them. Which is also what made them unrenderable.
   */
  isPremium: boolean;
  savedArticles: string[];
  toggleArticleSaved: (articleTitle: string) => void;

  /** P1. Returns immediately; the write catches up. Never rejects. */
  addCapture: (text: string, viaVoice?: boolean) => void;
  /** P3. `quick` alone is a complete check-in. */
  addCheckIn: (quick: QuickAnswer, detail?: Omit<CheckIn, "quick">) => void;
  addJournal: (title: string, detail: string) => void;
  /** P10: the uri is a LOCAL path and is never sent anywhere. */
  addPhoto: (uri: string, caption: string) => void;
  promoteToMilestone: (entryId: string) => void;
  addMilestone: (title: string, emoji?: string) => void;
  logMedication: (medicationId: string, status: "taken" | "skipped") => void;
  addQuestion: (appointmentId: string, question: string) => void;
  saveReflectionReply: (weekStart: string, reply: string) => void;
};

/**
 * App code uses the `useRecoveryData` hook, not this. The hook carries the
 * "used outside its provider" guard, and reaching past it skips the one thing
 * that turns a missing provider into a clear error rather than a blank screen.
 *
 * The harness is the exception, and supplies this directly.
 */
export const RecoveryDataContext = createContext<RecoveryDataValue | undefined>(undefined);

/**
 * The hook every screen uses.
 *
 * It lives here rather than beside the provider because it needs nothing the
 * provider needs. While it sat in `RecoveryDataContext.tsx`, importing it
 * pulled AsyncStorage — and therefore a native module — into anything that
 * merely wanted to READ the context. That is what made twenty-one screens
 * impossible to render outside a device.
 */
export function useRecoveryData(): RecoveryDataValue {
  const ctx = useContext(RecoveryDataContext);
  if (!ctx) throw new Error("useRecoveryData must be used inside <RecoveryDataProvider>");
  return ctx;
}
