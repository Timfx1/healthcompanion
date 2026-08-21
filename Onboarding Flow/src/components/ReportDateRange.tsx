// ============================================================
// SCREEN: ReportDateRange (§4.7, N6, N7)
//
// PURPOSE. Choose what window the doctor report covers. §4.7 asks for a
// selectable range and names "since last appointment" as the case that matters,
// because that is the question a clinician actually opens with.
//
// EVERY OPTION STATES WHAT IT YIELDS, before it is picked. That is not polish —
// it is a promise ReportPreview already made in its own contract: "changing the
// range re-derives depth, so empty and sparse are reachable from INSIDE a ready
// report. The chip states what the range yielded rather than silently producing
// a blank page." A range picker that hides its consequences hands somebody a
// blank report on the morning of an appointment.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATES, derived — never set:
//   presets  the list. Each option shows its entry count, and an option that
//            would yield nothing says so and cannot be applied. Refusing is
//            honest here in a way it is not on a capture path: this is a
//            choice with a consequence, not something being logged.
//   custom   a start and end being chosen by hand.
//
// CONDITIONAL CONTENT, not states: whether a previous appointment exists at all.
// Without one, "since last visit" has no anchor and is replaced by "since you
// started" — the same reframing ReportPreview does in its `first` state, and it
// has to match, or the two screens disagree about the same fact.
//
// NOT states: loading, error, premium. The report and every part of choosing
// its range are free forever (N6/N7); this file is registered as a report
// surface in checks/restricted.mjs, so a gating symbol here fails the build.
//
// ─────────────────────────────────────────────────────────────────────────────
// TOKENS: this screen introduces NO new family, and that is the finding rather
// than a shortcut. Selection already has a name — `state.selectedFill` and
// `state.selectedEdge` — and semantic.json warns in as many words that reusing
// a named value under a new name "would have been misnaming rather than reuse".
//
// One constraint comes WITH those tokens. `state/selectedEdge on raised` is
// classified decorative in the contrast manifest, and its note is explicit that
// this holds only because "selection here is carried by three simultaneous
// signals — a tinted fill, this border, and a trailing check glyph… if a future
// selected state ever drops the fill or the check, this must revert to
// ui-boundary and the tint must be strengthened." So the selected option here
// carries all three. The manifest is not describing the past; it is a contract
// on anything that adopts the token.
// ============================================================

import { useState } from "react";
import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailCard } from "./patterns/DetailScreen";

export type RangeMode = "presets" | "custom";

export type RangeOption = {
  id: string;
  label: string;
  detail: string;
  /** Entries this window would actually contain. Zero is a real answer. */
  yield: number;
  /** Only meaningful when a previous appointment exists. */
  needsAnchor?: boolean;
};

export const PRESETS: RangeOption[] = [
  { id: "lastVisit", label: "Since my last visit", detail: "12 Mar – today", yield: 38, needsAnchor: true },
  { id: "30d", label: "Last 30 days", detail: "28 Mar – today", yield: 24 },
  { id: "90d", label: "Last 90 days", detail: "27 Jan – today", yield: 38 },
  { id: "all", label: "Whole recovery", detail: "Day 1 – today", yield: 38 },
  { id: "week", label: "Last 7 days", detail: "20 Apr – today", yield: 0 },
];

export default function ReportDateRange({ mode, hasAnchor = true, initialMode = "presets", onClose, onApply }: {
  mode: Mode;
  hasAnchor?: boolean;
  initialMode?: RangeMode;
  onClose: () => void;
  onApply: () => void;
}) {
  const t = theme(mode);
  const [rangeMode, setRangeMode] = useState<RangeMode>(initialMode);
  const [selected, setSelected] = useState("lastVisit");

  const options = PRESETS.map((o) =>
    // The same reframing ReportPreview uses when there is no prior visit. If the
    // two screens disagree about this, one of them is lying to the same user.
    o.needsAnchor && !hasAnchor
      ? { ...o, label: "Since you started", detail: "Day 1 – today" }
      : o
  );

  return (
    <DetailScreen mode={mode} title="Report range" onClose={onClose}>
      <div style={{ fontSize: scale.font.size.sm, color: t.color.text.secondary, lineHeight: 1.55 }}>
        {hasAnchor
          ? "What should the report cover? Each option shows what is actually in it."
          : "No previous visit yet, so the report covers everything so far."}
      </div>

      {/* Two ways in, and the current one is obvious. Same three-signal
          selection contract as the options below. */}
      <div className="flex gap-2">
        {(["presets", "custom"] as RangeMode[]).map((m) => {
          const on = rangeMode === m;
          return (
            <button key={m} onClick={() => setRangeMode(m)}
              className="btn-press flex-1 flex items-center justify-center rounded-xl"
              style={{
                height: 40, cursor: "pointer",
                fontSize: scale.font.size.xs, fontWeight: 600,
                background: on ? t.color.state.selectedFill : t.color.surface.card,
                border: `1px solid ${on ? t.color.state.selectedEdge : t.color.surface.border}`,
                color: t.color.text.primary,
              }}>
              {on ? "✓ " : ""}{m === "presets" ? "Suggested" : "Custom dates"}
            </button>
          );
        })}
      </div>

      {rangeMode === "presets" ? (
        <div className="flex flex-col gap-2">
          {options.map((o) => {
            const on = selected === o.id;
            const empty = o.yield === 0;
            return (
              <button key={o.id}
                onClick={() => !empty && setSelected(o.id)}
                disabled={empty}
                className="btn-press w-full flex items-center gap-3 rounded-2xl px-4 text-left"
                style={{
                  minHeight: 60, cursor: empty ? "default" : "pointer",
                  background: on ? t.color.state.selectedFill : t.color.surface.card,
                  border: `1px solid ${on ? t.color.state.selectedEdge : t.color.surface.border}`,
                }}>
                <span className="flex-1">
                  <span className="block" style={{
                    fontSize: scale.font.size.base, fontWeight: 600,
                    color: empty ? t.color.text.secondary : t.color.text.primary,
                  }}>
                    {o.label}
                  </span>
                  <span className="block" style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>
                    {o.detail}
                  </span>
                </span>

                {/* The yield, stated up front. An empty window is described
                    rather than warned about — nothing is wrong, there is simply
                    nothing in it, and the alert hue stays where N3 puts it. */}
                <span className="text-right">
                  <span className="block" style={{
                    fontSize: scale.font.size.xs,
                    color: empty ? t.color.text.muted : t.color.text.secondary,
                  }}>
                    {empty ? "nothing logged yet" : `${o.yield} entries`}
                  </span>
                </span>

                {/* The third signal. selectedEdge is decorative ONLY while this
                    glyph and the fill both exist — see the manifest note. */}
                <span style={{ fontSize: scale.font.size.sm, color: t.color.accent.strong, width: 14 }}>
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <DetailCard mode={mode}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: scale.font.size.sm, color: t.color.text.secondary }}>From</span>
              <span style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: t.color.text.primary }}>12 Mar 2026</span>
            </div>
          </DetailCard>
          <DetailCard mode={mode}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: scale.font.size.sm, color: t.color.text.secondary }}>To</span>
              <span style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: t.color.text.primary }}>27 Apr 2026</span>
            </div>
          </DetailCard>
          <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>
            38 entries in this window.
          </div>
        </div>
      )}

      <button onClick={onApply}
        className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
        style={{
          height: 48, border: "none", cursor: "pointer", fontSize: scale.font.size.md,
          background: `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`,
          color: t.color.cta.label,
        }}>
        Apply to report
      </button>

      <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, textAlign: "center" }}>
        Changing the range never deletes anything — it only changes what this
        report shows.
      </div>
    </DetailScreen>
  );
}
