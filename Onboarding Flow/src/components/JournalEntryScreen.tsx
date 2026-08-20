// ============================================================
// SCREEN: JournalEntry — the Recovery Journal (§4.5, N7)
//
// PURPOSE. Room to write more than one line, when the user wants it. Quick
// capture is the ten-second lane; this is the one for the evening someone
// actually wants to say something.
//
// It is called the Recovery Journal and never a Diary. That is a product
// decision from §4.5, not a synonym: "diary" carries an obligation to keep it up.
//
// STATES, derived from the entry and the draft — nothing sets them:
//   composing  a new entry. Save is inert until there is text, and pressing it
//              empty is a no-op rather than a refusal (same contract as capture).
//   reading    an existing entry. The actions are edit and promote.
//   promoted   an existing entry that has already become a milestone. Promotion
//              is one-way and the control says so instead of vanishing.
//
// NOT states: saving and error. Journal writes are local and optimistic, like
// every other capture path in this product (P1). No spinner, nothing to fail.
//
// N7 — journal is core loop, free forever. No `locked` prop, and this file is
// registered as a core-loop surface in checks/restricted.mjs.
// ============================================================

import { useState } from "react";
import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailButton } from "./patterns/DetailScreen";
import CaptureField from "./patterns/CaptureField";
import type { JournalEntry } from "./timelineFixtures";

export type JournalState = "composing" | "reading" | "promoted";

export function journalStateOf(entry: JournalEntry): JournalState {
  if (!entry.text.trim()) return "composing";
  return entry.promoted ? "promoted" : "reading";
}

export default function JournalEntryScreen({ mode, entry, onClose, onPromote }: {
  mode: Mode;
  entry: JournalEntry;
  onClose: () => void;
  onPromote: () => void;
}) {
  const t = theme(mode);
  const state = journalStateOf(entry);
  const [draft, setDraft] = useState(entry.text);

  return (
    <DetailScreen mode={mode} title="Recovery journal" onClose={onClose}>
      <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>
        Day {entry.dayN} · {entry.date}
      </div>

      {state === "composing" ? (
        <>
          <CaptureField
            mode={mode} value={draft} onChange={setDraft} onSave={onClose}
            autoFocus multiline
            placeholder="How did today go?"
          />
          <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, lineHeight: 1.5 }}>
            No prompts to answer and nothing required. Write as much or as little
            as you feel like — it lands on your timeline either way.
          </div>
        </>
      ) : (
        // Existing entries render as prose rather than in a field. An edit
        // affordance is one tap away; a text box around old writing makes a
        // journal feel like a form.
        <div className="flex flex-col gap-3">
          {entry.text.split("\n\n").map((para) => (
            <div key={para} style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.6 }}>
              {para}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-1">
        {state === "composing" && (
          <button
            className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
            style={{
              height: 48, border: "none", fontSize: scale.font.size.md,
              cursor: draft.trim() ? "pointer" : "default",
              background: draft.trim() ? `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})` : t.color.state.disabled,
              color: draft.trim() ? t.color.cta.label : t.color.state.disabledText,
            }}>
            Save to timeline
          </button>
        )}

        {state === "reading" && <DetailButton mode={mode} label="Edit" />}

        {/* §4.5 — one tap promotes an entry to a milestone. P8 then makes that
            milestone shareable, but only if the user goes looking: nothing here
            offers to post anything. */}
        {state === "reading" && (
          <button onClick={onPromote}
            className="btn-press w-full flex items-center justify-center gap-2 rounded-2xl font-semibold"
            style={{
              height: 48, cursor: "pointer", fontSize: scale.font.size.sm,
              background: t.color.accent.surface,
              border: `1px solid ${t.color.accent.edge}`,
              color: t.color.text.primary,
            }}>
            🎉 Make this a milestone
          </button>
        )}

        {/* Promotion is one-way. The control stays put and explains itself
            rather than disappearing, so the screen does not silently change
            shape between two visits. */}
        {state === "promoted" && (
          <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
            style={{ background: t.color.accent.surface, border: `1px solid ${t.color.accent.edge}` }}>
            <span style={{ fontSize: scale.font.size.lg }}>🎉</span>
            <span style={{ fontSize: scale.font.size.sm, color: t.color.text.primary }}>
              Saved as a milestone
            </span>
          </div>
        )}
      </div>
    </DetailScreen>
  );
}
