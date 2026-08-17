// ============================================================
// PATTERN: InsightSentence
//
// C5 / DESIGN_CRITERIA §4: "the sentence outranks the chart." Every chart is
// preceded by a plain-language headline stating the finding, styled as the
// primary element, with the chart supporting it. Data with no interpretation is
// a top-cited reason people quit.
//
// NEVER COLOUR ALONE (N4): the trend is always icon PLUS word — "↓ Decreasing"
// — so the colour is reinforcement and never the carrier.
//
// MARK vs INK, both present here, which is why this component was where the
// distinction broke. The badge FILL and BORDER are `mark`: decorative tints of
// the category hue. The WORD is `ink`: it conveys the meaning and must be
// readable. It used to be mark, which on light gave 1.40-1.80:1 against the very
// tint sitting behind it — and no declared pair covered "text on a 13% tint of
// its own mark", so nothing caught it.
// ============================================================

import { c as s, D, scale, type Mode } from "../tokens";
import { cat, type Category } from "./category";

export default function InsightSentence({ text, trend, category, mode }: {
  text: string;
  trend: "up" | "down" | "stable";
  category: Category;
  mode: Mode;
}) {
  const trendIcon = trend === "down" ? "↓" : trend === "up" ? "↑" : "→";
  const trendWord = trend === "down" ? "Decreasing" : trend === "up" ? "Increasing" : "Stable";
  const k = cat(mode, category);
  return (
    <div className="flex items-start gap-2 mb-2">
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0 mt-0.5"
        style={{ background: `${k.mark}22`, border: `1px solid ${k.mark}44` }}>
        <span style={{ fontSize: scale.font.size["2xs"], fontWeight: 700, color: k.ink }}>{trendIcon} {trendWord}</span>
      </div>
      <div style={{ fontSize: scale.font.size.base, fontWeight: 600, color: s(D.text, D.lText, mode), lineHeight: 1.35 }}>{text}</div>
    </div>
  );
}
