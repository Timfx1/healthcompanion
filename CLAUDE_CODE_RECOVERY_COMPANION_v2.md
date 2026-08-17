# RECOVERY COMPANION — Master Development Documentation (v2, research-integrated)
### The single source of truth for building this app. Upload this file to Claude Code. Replaces v1.

---

## 0. HOW TO USE THIS FILE (instructions to Claude Code)

You are a senior React Native / Expo engineer working autonomously. This document contains the complete product vision, binding product principles, feature specification, screen map, data models, design criteria, and development rules for **Recovery Companion**.

**Standing orders:**

1. **FRONTEND FIRST.** Phase 1 is UI only. Build every screen, flow, animation, and component using **local mock data** (`src/data/`) and local state. Do NOT wire up Firebase writes, RevenueCat, or any backend logic beyond what already exists in the backbone. Backend integration is Phase 2 and requires my explicit approval.
2. **Work on the `Health-companion` branch.** `master` is the shipped AnklePath app — read-only reference. Confirm with `git rev-parse --abbrev-ref HEAD` before any commit.
3. **Read `RESEARCH_FINDINGS.md`** (in the repo root: "Recovery Companion: What Users Actually Want From a Health-Tracking Companion — And How to Earn Daily-Companion Status Without Manipulation"). It is the evidence base behind Section 2 of this file. When a design decision is ambiguous, resolve it in favor of what that research supports.
4. **Maintain the README** as the living memory of the project: vision summary, build status, screen inventory, data models, mocked-vs-real table, open decisions, run instructions. Update it at every slice of work.
5. **Create `DESIGN_CRITERIA.md`** from Section 8 and follow it on every screen. Figma exports with written annotations (transitions, durations, easings, button states, effects) override default visuals and must be implemented 1:1 in `react-native-reanimated`.
6. Run `npm run typecheck` after every slice. Keep guest/offline mode fully working at all times.
7. Work autonomously in large slices. Only stop for genuinely irreversible decisions (bundle IDs, new Firebase project, payments); log them in README → "Open decisions" and continue everything else.

---

## 1. PRODUCT VISION

**One-liner:** Recovery Companion is a personal recovery operating system that helps people document, understand, and communicate their healing journey — from the first day of recovery to full rehabilitation.

**Positioning (sharpened by research):** We own the **finish line**. The funded tracker market (Bearable, Visible, Guava) is built for *chronic, endless* illness management. Recovery Companion is built for *finite* recovery — injuries, surgeries, rehab — where the defining user question is **"Am I on track?"** Injury/surgery patients today cobble together the Notes app, spreadsheets, paper PT printouts, and Reddit comparison threads. That's our market.

**Core promise:** "This app remembers my recovery so I don't have to." Second promise: "It tells me whether this is normal."

**Who it's for:** People recovering from orthopedic injuries (ankle, knee, hip, shoulder, wrist), surgeries, illness, concussion, postpartum, and rehabilitation programs — plus chronic-condition users as a secondary audience. The user chooses their recovery journey; new recovery types are data, not code.

**The two differentiators:**
1. **The Doctor Report** — the industry-wide failure is the output layer; no competitor produces a consultation-ready "what changed since last visit" summary a clinician can scan in 60 seconds.
2. **The "Notes-app feeling" + guilt-free companionship** — zero-resistance capture and an architecture that is structurally incapable of producing guilt. Research shows guilt and effort are the top two abandonment drivers (~70% of health-app users churn within 100 days; half of lapsed tracker users report guilt). Gentleness is the growth strategy, not a garnish.

**Compliance posture:** Non-medical-device health app. No diagnose/treat/cure claims, permanent medical disclaimer, red-flag "when to contact a doctor" content, benchmarks framed as "common experiences/ranges," never pass/fail. Preserve AnklePath's legal scaffolding.

---

## 2. PRODUCT PRINCIPLES (BINDING — derived from RESEARCH_FINDINGS.md)

Every screen, feature, and copy decision must pass these. They are requirements, not aspirations.

**P1 — The Notes-app feeling: zero-decision capture.**
There must always be a path where the user can capture something in ≤10 seconds without making a single categorization decision: open → type or speak one line → done. The app files it on the timeline itself. No mandatory fields, ever, on the capture path. The capture path must never fail (offline-safe, optimistic UI).

**P2 — Guilt-free by architecture, not slogans.**
- No streaks that can "break." Consistency is shown as gentle accumulation ("you've checked in 12 times"), never as a chain with a breakable link.
- No red missed days, no empty-day shaming. Gaps on the timeline render as neutral rest ("a few quiet days"), not failure.
- Returning after absence triggers "welcome back" warmth, never a recap of what was missed.
- Reminders never escalate, never scold, and back off automatically when ignored; cadence is user-controlled.
- Setbacks get honest, kind copy ("Recovery isn't always linear"), never toxic positivity.

**P3 — Effort scales down to the worst day.**
Users are in pain, medicated, or foggy. The core check-in fast path is ≤10 seconds and typing-free: one tap on "Better / Same / Worse" logs a valid check-in; the fuller sliders/toggles are an optional second layer. Everything important is reachable one-handed in the thumb zone.

**P4 — Data must become meaning.**
Never show a chart without a plain-language sentence above it ("Pain trending down over the last 14 days"). "Data with no payoff" is a top churn cause. Rule-based insights in Phase 1.

**P5 — "Am I on track?" — the recovery corridor.**
For each supported recovery type, show a gentle expected-range band ("Most people with an ankle sprain can bear weight around weeks 2–4") on the timeline/progress views. Always a range, never a deadline; always "common experiences," never diagnosis; always with an easy path to "everyone heals differently." Mock the corridor data per condition in `src/data/recoveryCorridors.ts` with source attribution fields (evidence-based content only, e.g., clinical guidance sources — populate with placeholder-cited mock data in Phase 1, flag for review).

**P6 — The doctor report is the hero and is free forever.**
The report (and the "what changed since last visit" block) is the category's emotional peak and #1 word-of-mouth trigger. It is never paywalled.

**P7 — The app gives back weekly.**
Once a week, unprompted, the app hands the user meaning: "Three weeks ago stairs were hard. This week you did them twice." The reward for logging is being *noticed*, not points.

**P8 — Milestones are share-worthy artifacts.**
Every milestone can generate a beautiful, tasteful share card ("Day 30 — walked without crutches 🎉") the user can save/send. This is our honest growth loop. Sharing is always user-initiated; no share nags.

**P9 — Monetization guardrails (structural, Phase 2 but design now).**
Free forever: daily check-in, quick capture, timeline, journal, basic pain chart, medications + reminders, appointments, safety content, and the doctor report. Premium = depth only: advanced insights/correlations, full history beyond 30 days (soft gradient fade + "unlock full history" pill, never a hard wall), photo compare, multiple simultaneous recoveries, education deep-dives. Paywall is a dismissible bottom sheet; dismissing always leaves the free experience intact. (The Medisafe core-feature-paywall backlash is the cautionary tale.)

**P10 — Radical privacy as positioning.**
Local-first in Phase 1; "Stays on your device" cues wherever photos/health data are handled. No dark patterns, no cross-app tracking, ever.

---

## 3. TECHNICAL BACKBONE (inherited from AnklePath — reuse, do not rebuild)

- **Expo SDK ~54, React Native 0.81.5, React 19.1, TypeScript ~5.9** (`npm run typecheck` → `tsc --noEmit`)
- **Navigation:** `@react-navigation/native` v6 — native-stack root → onboarding stack → bottom-tab main navigator + main stack for detail/modal screens. Typed param lists in `src/navigation/types.ts`.
- **State:** React Context + hooks. AsyncStorage persistence. Local-first: fully usable offline and as guest.
- **Backend (Phase 2 only):** Firebase Auth + Firestore (JS SDK v12, REST fallback); Apple/Google/Email/Anonymous auth with guest→registered `linkWithCredential` upgrade.
- **Analytics:** PostHog typed event catalog (`services/analytics/events.ts`) — extend event names as screens are built (no-ops when unconfigured).
- **Monitoring:** Sentry (`Sentry.wrap`, ErrorBoundary, sanitized contexts).
- **Billing:** RevenueCat, 14-day trial + monthly, feature-flagged (Phase 2, per P9 guardrails).
- **UI:** custom theme tokens (`theme/colors|spacing|typography`), light/dark via `AppThemeContext`, `expo-linear-gradient`, Ionicons, `react-native-reanimated`, `react-native-gesture-handler`, safe-area-context.
- **Voice input (P1):** Phase 1 uses the OS keyboard dictation (design the capture field to invite it: mic affordance, single-line, autofocus). Native speech-to-text / lock-screen & home-screen widgets are flagged Phase 2 (require dev-build/native modules) — but DESIGN the widget in Figma and reserve the deep link route `recoverycompanion://capture` now.
- **Config:** `isXConfigured` booleans / `EXPO_PUBLIC_*` env vars; graceful degradation with no keys.
- **Release:** EAS Build + Submit, `scripts/bump-version.js`, `npm run release` (untouched in Phase 1).

**Provider tree (keep):** `Sentry.ErrorBoundary → SafeAreaProvider → AppThemeProvider → AnalyticsProvider → AppDataProvider → OnboardingProvider → NavigationContainer → RootNavigator`.

**Conventions (non-negotiable):** content-as-data (screens render from typed `src/data/` modules); never block UX on network; typed navigation params and analytics events; design tokens only; light+dark on every screen; match existing code style.

**Reuse map — keep as-is:** provider tree, splash/routing gate, onboarding-wizard framework, auth + guest linking, local+cloud sync pattern, analytics/monitoring/billing plumbing, theme system, component library (`AppButton`, `ScreenContainer`, `InfoCard`, `SafetyAlert`, `StatCard`, `OptionCard`, `ProgressHeader`, …), reports/tracking pattern, disclaimer/legal scaffolding, release pipeline.
**Replace/re-domain:** branding, all `src/data/` content, onboarding screens + `OnboardingState`, Firestore field names (Phase 2), analytics event names, domain copy, paywall copy (per P9).
**Generalize now:** everything built around `recoveryJourney { condition, bodyPart, type, startDate, timeline, milestones, appointments, medications, reports }` — never around a specific injury.

---

## 4. CORE MODULES

### 4.1 Recovery Journey (container)
User creates a Recovery: injury / surgery / illness / chronic / rehabilitation → personalized timeline + live **"Day N"** counter. Multiple recoveries supported in the model (MVP UI exposes one active; extra simultaneous recoveries are premium per P9).

### 4.2 Quick Capture (NEW — P1, the Notes-app lane)
A persistent single-line capture field on Home (and reachable from the FAB everywhere): type or dictate anything — "knee hurt after stairs today" — one tap Done → saved to the timeline as a `capture` entry, timestamped, zero questions asked. Light auto-structuring in Phase 1: simple keyword tagging (pain/sleep/med/mood words) applied silently and editable later; never blocks saving. Reserve deep link `://capture` for the future widget.

### 4.3 Recovery Timeline (the heart)
Chronological scrollable history: captures, check-ins, symptoms, notes, journal entries, medications, appointments, photos, milestones. Auto-generated entries mix with manual ones; filter chips; FAB to add. Gaps render as neutral rest per P2. The corridor band (P5) can be toggled on the timeline. This is what users scroll before a doctor visit.

### 4.4 Daily Check-in (retention engine — P2/P3)
Two layers, one screen:
- **Fast path (≤10 s, typing-free):** big "How's today — Better / Same / Worse?" three-button row → tap → done, gentle confirmation (~600 ms) + light haptic. That alone is a complete, valid check-in.
- **Optional detail layer (still ≤30 s):** mood 😊😐😣, pain 0–10 slider, energy/sleep/mobility 3-level taps, medication toggle, one optional note line.
Consistency shown as accumulation, never a breakable streak. Missed days → "welcome back," nothing else.

### 4.5 Recovery Journal
Free-text "Recovery Journal" (never "Diary"). One-tap promote entry → milestone. Appears on timeline.

### 4.6 Progress Dashboard (P4/P5)
Headline plain-language insight on top, then: pain trend with milestone markers and the corridor band, weekly comparison card, sleep/energy/mobility trends, adherence. Free history = 30 days; older history behind soft gradient fade + "Unlock full history" pill (P9).

### 4.7 Doctor Report Generator (flagship — P6, free forever)
One button → consultation-ready summary (Phase 1: polished in-app preview; Phase 2: PDF export — note: export stays free per P6):
overview header (condition, Day N, range) → **"What changed since last visit"** block (prominent) → symptom/pain graphs → key timeline events → medications → photo strip → appointments + questions asked. Selectable date range ("since last appointment"). Scannable by a clinician in 60 seconds; restrained print-friendly styling.

### 4.8 Recovery Education
Evidence-based, condition-specific content (NHS, Mayo Clinic, Cleveland Clinic, AAOS, APTA — reuse Learn-hub pattern). Answers "what is normal," and always **"When should I contact my doctor?"** — red flags via `SafetyAlert`. Framed as common experiences, never diagnosis.

### 4.9 Medication Tracker (free forever per P9)
Meds, dosage, schedule, local-notification reminders (never escalating, per P2), taken/skipped log → feeds dashboard + report.

### 4.10 Appointment Manager
Upcoming/past, **"Questions for my doctor"** list (add anytime, surfaces before visit), notes-after, follow-ups. Pre-appointment nudge: "Appointment in 2 days — review your report?"

### 4.11 Photo Timeline
Wound/swelling/scar photos over time (`expo-image-picker`), attached to timeline + report. "Stays on your device" cue (P10). Side-by-side compare (Day 3 vs Day 30) = premium (P9).

### 4.12 Insights (P4)
Rule-based plain-language statements over local data: trends ("Pain improving"), simple correlations ("Pain tends to rise after poor sleep"), adherence. Advanced correlations = premium. AI later.

### 4.13 Weekly Give-Back (NEW — P7)
Auto-generated weekly reflection card, delivered Sunday evening or on next open: comparison vs last week + one concrete noticed detail pulled from entries + one encouragement line. Dismissible, saveable to timeline.

### 4.14 Encouragement & Milestones (P2/P8)
Celebrates first walk, pain drops, Day 7/30/100 cards, recovery anniversaries — subtle confetti/haptic, dignified, ≤1 s. Every milestone offers **"Create share card"** → beautiful branded card (milestone + Day N + optional photo) → OS share sheet. User-initiated only.

### 4.15 Future AI slots
AI summaries / appointment prep / report generation / progress explanations — leave clearly-marked placeholder cards.

---

## 5. SCREEN MAP

### Onboarding stack (existing wizard framework; Figma designs done — implement per annotations)
`Welcome → SignUp → RecoveryType → ConditionDetail → RecoveryStart → CurrentSymptoms → PainBaseline → RecoveryGoal → Notifications → PlanLoading → FreePlanUnlocked → PremiumTeaser → TrialPaywall`
Output: personalized timeline + Day N + corridor preview ("here's what the coming weeks commonly look like").

### Main tabs
`Home · Timeline · Check-in (center, prominent) · Progress · Profile`
- **Home:** morning encouragement card, Day N counter, **Quick Capture field (P1)**, today's actions, next appointment, latest insight, Generate Report entry, weekly give-back card when fresh.
- **Timeline:** full history + corridor toggle + filter chips + FAB (capture/note/photo/milestone/medication/appointment).
- **Check-in:** fast path + optional detail (4.4).
- **Progress:** insights + charts + corridor + weekly comparison + history fade (P9).
- **Profile:** account, recoveries, meds, appointments, education, reports history, premium status row, settings, disclaimer, theme.

### Detail/modal screens
`QuickCaptureSheet, JournalEntry, PhotoCapture, PhotoCompare (premium), MilestoneDetail, ShareCardPreview (NEW), WeeklyReflection (NEW), ReportPreview, ReportDateRange, AppointmentDetail, QuestionsForDoctor, MedicationDetail, EducationArticle, Safety, AddTimelineEntry, PremiumTeaser, TrialPaywall (bottom sheet)`

---

## 6. DATA MODELS (`src/types/recovery.ts`; mocks in `src/data/`)

```ts
type RecoveryType = 'injury' | 'surgery' | 'illness' | 'chronic' | 'rehabilitation';

interface RecoveryJourney {
  id: string; type: RecoveryType; condition: string; bodyPart?: string;
  label: string; startDate: string; goal?: string; isActive: boolean;
}

type TimelineEntryType =
  | 'capture' | 'checkin' | 'symptom' | 'note' | 'journal' | 'medication'
  | 'appointment' | 'photo' | 'milestone' | 'education' | 'reflection';

interface TimelineEntry {
  id: string; journeyId: string; type: TimelineEntryType; date: string;
  title: string; detail?: string;
  data?: QuickCapture | CheckIn | MedicationEvent | Appointment | PhotoEntry | Milestone | WeeklyReflection;
  isAutoGenerated: boolean;
}

interface QuickCapture {                    // P1
  text: string; viaVoice?: boolean;
  autoTags?: ('pain' | 'sleep' | 'mood' | 'medication' | 'mobility')[];
}

interface CheckIn {
  quick: 'better' | 'same' | 'worse';       // fast path — the only required field
  mood?: 1 | 2 | 3; pain?: number; energy?: 1 | 2 | 3;
  sleep?: 1 | 2 | 3; mobility?: 1 | 2 | 3;
  medicationTaken?: boolean; note?: string;
}

interface RecoveryCorridor {                // P5 — src/data/recoveryCorridors.ts
  condition: string;
  phases: { fromDay: number; toDay: number; label: string;      // "Weight-bearing usually returns"
            typicalPainRange?: [number, number]; sourceNote: string; }[];
}

interface Medication { id: string; journeyId: string; name: string; dosage: string;
  schedule: string[]; startDate: string; endDate?: string; reminders: boolean; }
interface MedicationEvent { medicationId: string; status: 'taken' | 'skipped'; time: string; }

interface Appointment { id: string; journeyId: string; date: string; clinician?: string;
  location?: string; questions: string[]; notesAfter?: string; followUpDate?: string; }

interface PhotoEntry { id: string; journeyId: string; uri: string; date: string;
  caption?: string; bodyArea?: string; }

interface Milestone { id: string; journeyId: string; date: string; title: string;
  emoji?: string; fromJournalEntryId?: string; shareCardGenerated?: boolean; }

interface WeeklyReflection {                // P7
  weekStart: string; comparison: { metric: string; direction: 'up' | 'down' | 'flat'; text: string }[];
  noticedDetail: string; encouragement: string;
}

interface Insight { id: string; journeyId: string; text: string; trend: 'up' | 'down' | 'flat';
  kind: 'pain' | 'sleep' | 'mobility' | 'adherence' | 'correlation'; isPremium?: boolean; }

interface DoctorReportConfig { journeyId: string; from: string; to: string;
  include: TimelineEntryType[]; }
```

`OnboardingState` additions: `recoveryType, condition, bodyPart, startDate, symptoms[], painBaseline, goal, notificationsOptIn`.

Mocks to create: `recoveryCatalog.ts`, `recoveryCorridors.ts` (2–3 conditions with placeholder-cited phases), `mockJourney.ts` (~45-day ankle-surgery journey incl. captures, check-ins with fast-path-only days, photos placeholders, milestones, 2 appointments, 2 meds, 6 weekly reflections), `educationContent.ts`, `encouragementCopy.ts` (incl. welcome-back + setback copy), `onboardingOptions.ts`.

---

## 7. DEVELOPMENT PHASES

**Phase 1 — Frontend (NOW):**
1. Re-domain `src/data/` + copy with models above.
2. Implement onboarding per the finished Figma designs + annotations.
3. Build 5 tabs + all detail screens with mock data, full light/dark, motion per `DESIGN_CRITERIA.md` and Figma annotations. Priority order: **Check-in fast path → Quick Capture → Home → Timeline → Progress → Doctor Report preview → the rest.**
4. Timeline, corridor band, weekly give-back, share-card generation (render → OS share sheet via `expo-sharing`/view-shot), report preview, photo compare — all local. AsyncStorage via `AppDataContext` extension is fine.
5. Extend analytics catalog (incl. events: `quick_capture_saved`, `checkin_fastpath`, `report_generated`, `share_card_created`, `weekly_reflection_viewed`) + navigation types.
6. README current at every slice.

**Phase 1 acceptance benchmarks (from research):** first-time user completes first log within 60 s of open; returning user's fast-path check-in ≤15 s; capture path works offline and never errors.

**Phase 2 — Backend (needs approval):** Firestore schema, PDF export (free), notifications, widgets + native voice, RevenueCat per P9 guardrails, branding/bundle IDs.
**Phase 3 — AI features.**

---

## 8. DESIGN CRITERIA → save as `DESIGN_CRITERIA.md`

Unchanged in substance from v1 (emotional design, ≤10s/30s friction rules, output-layer priority, Bearable-inspired indigo/lavender palette + pastel category hues per final Figma tokens, 60-30-10, WCAG AA, no meaning-by-color-alone, ≥44 pt targets, thumb zone, typography/layout rules, motion timings: micro 100–150 ms, components 200–300 ms, screens 300–350 ms, ease-out entrances, gentle springs, charts draw once, skeletons not spinners, trust & safety surface, and the binding annotation rule). Plus these v2 additions:
- **No breakable-streak visuals anywhere** (P2). Consistency = accumulation counters or filled dots without chain metaphors.
- **Gap styling:** empty days on timeline = soft neutral "rest" treatment, never red/alert.
- **Fast-path check-in** is the largest, first-rendered element of the Check-in tab.
- **Corridor band:** soft translucent range band behind charts/timeline, labeled "common range," never a target line the user "fails."
- **History fade gate:** gradient fade + pill, never a hard-lock modal interrupt.
- **Share cards:** dignified, brandmarked lightly, photo-optional, beautiful in both modes.
- **Figma annotations from the completed Make sessions are binding** for all visuals they cover.

---

## 9. README TEMPLATE (repo root — keep current)

As v1, plus rows in "Mocked vs real" for: Quick Capture (local), Corridor data (placeholder-cited mock), Weekly reflections (mock generator), Share cards (local render), Widgets/native voice (Phase 2 flagged), and a "Research alignment" line linking `RESEARCH_FINDINGS.md`.

---

## 10. DEFINITION OF DONE (Phase 1)

- All Section 5 screens exist, render mock data, pass `npm run typecheck`, light+dark.
- Check-in fast path completable in ≤10 s one-handed; full detail ≤30 s.
- Quick Capture saves offline in ≤10 s with zero required decisions.
- No breakable streaks, no red gaps, welcome-back flow works after simulated absence.
- Corridor band, weekly reflection card, share-card flow, report preview polished per annotations.
- Doctor report reachable in ≤2 taps from Home and never behind any premium surface.
- README + DESIGN_CRITERIA.md current; zero Firebase/RevenueCat writes; guest mode intact.
