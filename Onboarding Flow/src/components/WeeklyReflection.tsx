// ============================================================
// SCREEN: WeeklyReflection (§4.13, P7, N7)
//
// PURPOSE. Once a week the app hands something back without being asked: what
// changed against last week, one concrete detail it noticed, and one line of
// encouragement. P7's claim is that the reward for logging is being NOTICED,
// not being scored — so this screen states observations and never a grade.
//
// The Home card is the glance. This is the surface it opens into, and the place
// the user can write back.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE BEHAVIOURAL CONTRACT — the reason this screen is not just another view:
//
//   open → write → save → PERSIST → confirm → reopen → it is still there
//
// The persistence is the feature. A reflection that evaporates on reload is
// worse than no reflection, because the user spent something to write it. This
// is the first surface in the prototype backed by real storage
// (components/storage.ts), and it is verified by a BEHAVIOURAL test that reloads
// the page and re-reads — tests/persistence.spec.ts — not by a screenshot of a
// success state, which would prove only that a success state can be drawn.
//
// STATES, derived from stored data and the draft:
//   empty  no saved reflection, nothing typed. Save is inert; pressing it is a
//          no-op, not a refusal.
//   draft  text typed, not yet saved.
//   saved  a reflection exists in storage. It is shown as prose with the date it
//          was written, and editing it returns to `draft`.
//
// NOT states: saving and error. The write is synchronous and local, and
// storage.ts cannot throw — it degrades to memory rather than surfacing a
// failure (P1). A spinner would be a lie about what the write costs, and an
// error state would be a promise this path deliberately does not make.
//
// N7 — the weekly give-back is part of the core loop. No locked variant, and
// this file is registered as a core-loop surface in checks/restricted.mjs.
// ============================================================

import { useState } from "react";
import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailCard } from "./patterns/DetailScreen";
import CaptureField from "./patterns/CaptureField";
import { read, write, KEYS } from "./storage";

export type SavedReflection = { text: string; savedOn: string };
export type ReflectionState = "empty" | "draft" | "saved";

export function reflectionStateOf(saved: SavedReflection | null, draft: string): ReflectionState {
  if (saved) return "saved";
  return draft.trim() ? "draft" : "empty";
}

// The app's half of the give-back. Observations, never a verdict: "you did the
// stairs twice" is a fact the user can recognise; "you're doing well" is a mark
// out of ten wearing a friendly voice.
const NOTICED = [
  "Three weeks ago stairs were hard. This week you did them twice.",
  "You logged on five days — including the two that sounded rough.",
  "Pain averaged 2.8, down from 4.2 the week before.",
];

export default function WeeklyReflection({ mode, onClose }: {
  mode: Mode;
  onClose: () => void;
}) {
  const t = theme(mode);
  const [saved, setSaved] = useState<SavedReflection | null>(
    () => read<SavedReflection | null>(KEYS.weeklyReflection, null)
  );
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const state = reflectionStateOf(editing ? null : saved, draft);

  function save() {
    // No-op on empty rather than a refusal — the same contract every capture
    // path in this product keeps.
    if (!draft.trim()) return;
    const entry: SavedReflection = { text: draft.trim(), savedOn: "27 Apr" };
    write(KEYS.weeklyReflection, entry);
    setSaved(entry);
    setEditing(false);
    setDraft("");
  }

  return (
    <DetailScreen mode={mode} title="Your week" onClose={onClose}>
      {/* What the app noticed. Delivered unprompted — this is the give-back. */}
      <div className="rounded-2xl px-4 py-4 flex flex-col gap-2"
        style={{ background: t.color.accent.surface, border: `1px solid ${t.color.accent.edge}` }}>
        <div style={{ fontSize: scale.font.size.lg, fontWeight: 700, color: t.color.text.primary }}>
          What we noticed
        </div>
        {NOTICED.map((line) => (
          <div key={line} style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.55 }}>
            {line}
          </div>
        ))}
        <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary, lineHeight: 1.5, marginTop: 2 }}>
          Recovery isn't always linear, and a flat week is still a week of healing.
        </div>
      </div>

      {state === "saved" ? (
        <>
          <div style={{ fontSize: scale.font.size["2xs"], fontWeight: 700, letterSpacing: scale.font.tracking.wide, color: t.color.text.secondary, textTransform: "uppercase" }}>
            What you wrote · {saved!.savedOn}
          </div>
          {/* data-testid is here for the persistence test, which reloads the page
              and re-reads this node. The visual baseline proves it renders; only
              a reload proves it survived. */}
          <DetailCard mode={mode}>
            <div data-testid="saved-reflection"
              style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {saved!.text}
            </div>
          </DetailCard>
          <button onClick={() => { setDraft(saved!.text); setEditing(true); }}
            className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
            style={{
              height: 48, cursor: "pointer", fontSize: scale.font.size.sm,
              background: t.color.surface.card,
              border: `1px solid ${t.color.surface.border}`,
              color: t.color.text.primary,
            }}>
            Edit
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: scale.font.size["2xs"], fontWeight: 700, letterSpacing: scale.font.tracking.wide, color: t.color.text.secondary, textTransform: "uppercase" }}>
            Anything to add?
          </div>
          <CaptureField
            mode={mode} value={draft} onChange={setDraft} onSave={save}
            multiline
            placeholder="Optional — how did the week feel?"
          />
          <button onClick={save} data-testid="save-reflection"
            className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
            style={{
              height: 48, border: "none", fontSize: scale.font.size.md,
              cursor: draft.trim() ? "pointer" : "default",
              background: draft.trim()
                ? `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`
                : t.color.state.disabled,
              color: draft.trim() ? t.color.cta.label : t.color.state.disabledText,
            }}>
            Save to timeline
          </button>
        </>
      )}

      <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, textAlign: "center", lineHeight: 1.5 }}>
        Saved on your device. Nothing here is a score, and there is nothing to keep up.
      </div>
    </DetailScreen>
  );
}
