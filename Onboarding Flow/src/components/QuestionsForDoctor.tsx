// ============================================================
// SCREEN: QuestionsForDoctor (§4.10, N7)
//
// PURPOSE. Catch the question at 2am, so it is still there at 10:15 on Thursday.
// This is the least glamorous screen in the product and one of the most useful:
// the thing people actually regret is walking out having forgotten to ask.
//
// It is also where the report's closing block comes from, which is why the
// entries are plain text with a single answered flag and nothing more.
//
// STATES, derived from the list:
//   empty  nothing added yet. It explains what it is FOR — this screen is
//          reached before anyone has used it, so the empty state is the one most
//          people see first.
//   list   questions exist. Answered ones stay visible and struck through rather
//          than disappearing: at an appointment, "already covered" is useful
//          information, and a list that shrinks as you work makes it hard to see
//          what you came in with.
//
// NOT states: saving, error, loading — local and optimistic like every capture
// path here. Not premium either: appointments are core loop (N7).
// ============================================================

import { useState } from "react";
import { theme, scale, type Mode } from "./tokens";
import DetailScreen from "./patterns/DetailScreen";
import CaptureField from "./patterns/CaptureField";
import type { Question } from "./timelineFixtures";

export type QuestionsState = "empty" | "list";
export function questionsStateOf(qs: Question[]): QuestionsState {
  return qs.length === 0 ? "empty" : "list";
}

export default function QuestionsForDoctor({ mode, questions, onClose }: {
  mode: Mode;
  questions: Question[];
  onClose: () => void;
}) {
  const t = theme(mode);
  const [draft, setDraft] = useState("");
  const state = questionsStateOf(questions);

  return (
    <DetailScreen mode={mode} title="Questions for my doctor" onClose={onClose}>
      {/* The field is FIRST. The whole value of this screen is the gap between
          thinking of something and losing it, so adding is never below a list. */}
      <CaptureField
        mode={mode} value={draft} onChange={setDraft} onSave={() => setDraft("")}
        placeholder="Something to ask…"
      />

      {state === "empty" ? (
        <div className="flex flex-col gap-2 rounded-2xl px-4 py-4"
          style={{ background: t.color.accent.surface, border: `1px solid ${t.color.accent.edge}` }}>
          <div style={{ fontSize: scale.font.size.base, fontWeight: 600, color: t.color.text.primary }}>
            Nothing here yet
          </div>
          <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.55 }}>
            Add anything you want to ask, whenever it occurs to you. It will be
            waiting on your appointment, and it goes into your doctor report.
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start gap-3 py-3"
              style={{ borderTop: i ? `1px solid ${t.color.surface.border}` : "none" }}>
              {/* Icon AND state word carry "answered", never the strike alone —
                  a line through text is not a channel everyone can read (N4). */}
              <span style={{ fontSize: scale.font.size.sm, color: q.answered ? t.color.accent.strong : t.color.text.muted }}>
                {q.answered ? "✓" : "○"}
              </span>
              <span className="flex-1">
                <span className="block" style={{
                  fontSize: scale.font.size.sm, lineHeight: 1.5,
                  color: q.answered ? t.color.text.secondary : t.color.text.primary,
                  textDecoration: q.answered ? "line-through" : "none",
                }}>
                  {q.text}
                </span>
                {q.answered && (
                  <span className="block" style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, marginTop: 2 }}>
                    Answered
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, lineHeight: 1.5 }}>
        These appear at the end of your doctor report, so you can hand the whole
        thing over rather than trying to remember.
      </div>
    </DetailScreen>
  );
}
