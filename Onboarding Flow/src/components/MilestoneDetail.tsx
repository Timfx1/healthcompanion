// ============================================================
// SCREEN: MilestoneDetail (§4.14, P8, N7)
//
// PURPOSE. Give a milestone somewhere to live, and offer — never push — the
// share card. P8 is explicit that sharing is the honest growth loop precisely
// because it is user-initiated: "no share nags".
//
// STATE. This screen has ONE, and that is deliberate rather than unexamined.
//
// What LOOKS like a second state is not. A milestone is either auto-generated
// (Day 7/30/100) or promoted from a journal entry, and it either carries a note
// or does not — but both are CONDITIONAL CONTENT inside the same state, the same
// way red flags are inside the report's `ready`. The screen does not change
// shape, only what it has to show.
//
// There is no loading state, no error state and no entitlement state: milestones
// are core loop and free forever (N7), and this file is registered as a
// core-loop surface in checks/restricted.mjs.
//
// WHAT IS NOT HERE, on purpose: any count of milestones, any "next milestone"
// target, any progress bar toward one. N1 and N5 both forbid it — a milestone is
// something that happened, never a goal somebody can fall behind.
// ============================================================

import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailButton } from "./patterns/DetailScreen";
import type { Milestone } from "./timelineFixtures";

export default function MilestoneDetail({ mode, milestone, onClose, onShare }: {
  mode: Mode;
  milestone: Milestone;
  onClose: () => void;
  onShare: () => void;
}) {
  const t = theme(mode);

  return (
    <DetailScreen mode={mode} title="Milestone" onClose={onClose}>
      {/* The card mirrors the share artifact's palette so the preview is not a
          surprise — share.* is the family that owns this look. */}
      <div className="rounded-2xl px-5 py-6 flex flex-col items-center gap-2"
        style={{ background: `linear-gradient(135deg, ${t.pattern.share.cardFrom}, ${t.pattern.share.cardTo})` }}>
        <div style={{ fontSize: scale.font.size["2xl"] }}>🎉</div>
        <div style={{ fontSize: scale.font.size.xl, fontWeight: 700, color: t.pattern.share.title, textAlign: "center", lineHeight: 1.25 }}>
          {milestone.title}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: scale.font.size.xs, fontWeight: 700, color: t.pattern.share.title }}>
            Day {milestone.dayN}
          </span>
          <span style={{ fontSize: scale.font.size.xs, color: t.pattern.share.meta }}>· {milestone.date}</span>
        </div>
      </div>

      {/* Conditional content, not a state. */}
      {milestone.note && (
        <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.6 }}>
          {milestone.note}
        </div>
      )}

      <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, lineHeight: 1.5 }}>
        {milestone.origin === "auto"
          ? "Added automatically when you reached this day."
          : "You promoted this from a journal entry."}
      </div>

      {/* P8 — offered once, plainly, and only here. The user came looking. */}
      <DetailButton mode={mode} label="Create share card" onClick={onShare} />

      <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, textAlign: "center", lineHeight: 1.5 }}>
        Nothing is shared unless you send it yourself.
      </div>
    </DetailScreen>
  );
}
