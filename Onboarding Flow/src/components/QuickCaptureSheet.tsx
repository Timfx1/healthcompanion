// ============================================================
// SCREEN: QuickCaptureSheet — the Notes-app lane as a sheet (§4.2, P1)
//
// PURPOSE. Capture anything in under ten seconds with zero categorisation
// decisions. Open, type, done. The app files it on the timeline itself.
//
// The persistent field on Home is the zero-tap version of this. The sheet is
// the version reachable from anywhere — the FAB, and the reserved
// `recoverycompanion://capture` deep link — plus room for more than one line.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATE vs RENDERING VARIANT
//
// Rendering variants multiply every state and are not states: light/dark (N8),
// dynamic type. Same distinction the report uses.
//
// STATES, all derived from the TEXT — nothing sets them:
//   empty   nothing typed. The save action is idle and pressing it is a no-op,
//           not a refusal. Nothing to save is not an error.
//   ready   text present, no keywords recognised. THE NORMAL CASE — most
//           captures will land here, which is why an empty tag row renders
//           nothing at all rather than saying "no tags".
//   tagged  text present and keywords recognised. Chips appear silently and
//           are editable later; they never gate the save.
//
// EXPLICITLY NOT STATES, and each absence is a decision:
//   saving  — the write is optimistic and local. A spinner would be a lie about
//             what it costs.
//   error   — the capture path CANNOT fail (P1). This is the same reason the
//             confirmation Toast has no failure branch: there is nothing for it
//             to apologise for. Contrast with the doctor report's export, which
//             genuinely can fail and therefore has a state for it.
//   offline — local-first; there is nothing to be offline from.
//   premium — capture is core loop, free forever (N7). No locked variant exists.
// ============================================================

import { useState } from "react";
import { theme, scale, type Mode } from "./tokens";
import CaptureField from "./patterns/CaptureField";
import { detectTags } from "./patterns/captureTags";
import { cat } from "./patterns/category";

export default function QuickCaptureSheet({ mode, initialText = "", onClose, onSave }: {
  mode: Mode;
  initialText?: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const t = theme(mode);
  const tags = detectTags(text);

  function save() {
    // No-op on empty rather than a refusal. The path never scolds.
    if (!text.trim()) return;
    onSave(text.trim());
    setText("");
    onClose();
  }

  return (
    <div className="absolute inset-0 flex flex-col justify-end"
      style={{ zIndex: scale.z.sheet, background: t.color.state.scrim }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="animate-fade-up rounded-t-3xl flex flex-col gap-3 px-5 pt-3 pb-6"
        style={{ background: t.pattern.paywall.sheet }}>

        {/* Grab handle. Dismissing is always one gesture — the sheet never traps. */}
        <div className="self-center rounded-full"
          style={{ width: 36, height: 4, background: t.pattern.paywall.handle }} />

        <div style={{ fontSize: scale.font.size.md, fontWeight: 600, color: t.color.text.primary }}>
          Quick capture
        </div>

        <CaptureField
          mode={mode} value={text} onChange={setText} onSave={save}
          autoFocus multiline
        />

        {/* Tags appear SILENTLY. No confirmation step, no "did you mean", and
            nothing renders at all when nothing was recognised — an empty row
            saying "no tags" would turn the normal case into a shortfall. */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span style={{ fontSize: scale.font.size["2xs"], color: t.color.text.secondary }}>Filed under</span>
            {tags.map((c) => {
              const k = cat(mode, c);
              return (
                // Icon AND label, never colour alone (N4). The chip fill is
                // `mark` and the word is `ink` — the distinction InsightSentence
                // got wrong at 1.40:1 by using mark as text.
                <span key={c} className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: `${k.mark}22`, border: `1px solid ${k.mark}44` }}>
                  <span style={{ fontSize: scale.font.size["2xs"], fontWeight: 700, color: k.ink }}>
                    {k.label}
                  </span>
                </span>
              );
            })}
            <span className="w-full" style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted }}>Tags are a guess — edit them any time. They never hold up a save.</span>
          </div>
        )}

        <button onClick={save}
          className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
          style={{
            height: 48, border: "none", cursor: "pointer", fontSize: scale.font.size.md,
            background: text.trim()
              ? `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`
              : t.color.state.disabled,
            color: text.trim() ? t.color.cta.label : t.color.state.disabledText,
            transition: `background ${scale.duration.quick}ms`,
          }}>
          Save to timeline
        </button>

        {/* P10 — "stays on your device", stated where data is handled. */}
        <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, textAlign: "center" }}>
          Saved instantly, on your device. Works offline.
        </div>
      </div>
    </div>
  );
}
