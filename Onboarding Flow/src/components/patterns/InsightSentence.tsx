// ============================================================
// PATTERN: InsightSentence
//
// C5 / DESIGN_CRITERIA §4: "the sentence outranks the chart." Every chart is
// preceded by a plain-language headline stating the finding, styled as the
// primary element, with the chart supporting it. Data with no interpretation is
// a top-cited reason people quit.
//
// NOW CONSUMES pattern.insight. The family was dormant while this component
// hardcoded equivalents from `cat()` — the fifth time that shape has appeared,
// after toast.*, capture.*, share.* and paywall.savingsLabel. Nothing was
// visibly broken here, which is the point: dormancy is not evidence of health,
// it is absence of evidence either way.
//
// TWO THINGS CHANGED, both deliberate.
//
// 1. VOCABULARY. The trend is now improving / worsening / steady, not up / down
//    / flat. The family was named for raw direction while being coloured with
//    valence-loaded hues, so a pain chart trending down — good news — got the
//    pain colour. The print layer, ReportPreview and MedicationDetail already
//    said improving/worsening/steady; this is the screen layer catching up to
//    one vocabulary.
//
//    The ICON still carries raw direction, so a falling pain line reads
//    "↓ Improving". Icon plus word, as the contract requires, and the two
//    together say something neither says alone.
//
// 2. THE CHIP IS GONE. The badge used to fill with a 13% tint of its own
//    category mark and print the word on top of it. That is text on a tint of
//    its own accent — the single failure this system has hit FOUR separate
//    times (InsightSentence itself at 1.40:1, corridor.phaseLabel at 4.15,
//    the report's change block at 4.49, AddTimelineEntry's hint at 4.49).
//    Removing the fill removes the class, and the contract never asked for a
//    chip: it asked for icon plus word.
// ============================================================

import { theme, scale, type Mode } from "../tokens";

export type Direction = "up" | "down" | "flat";
export type Benefit = "improving" | "worsening" | "steady";

const ARROW: Record<Direction, string> = { up: "↑", down: "↓", flat: "→" };
const WORD: Record<Benefit, string> = { improving: "Improving", worsening: "Worsening", steady: "Steady" };

export default function InsightSentence({ text, direction, benefit, mode }: {
  text: string;
  /** Raw direction of the line. Carried by the icon. */
  direction: Direction;
  /** Whether that direction is good for THIS metric. Carried by the word and
   *  the colour. Neither can be derived from the other without the metric's
   *  polarity — the RN app models that as HIGHER_IS_BETTER. */
  benefit: Benefit;
  mode: Mode;
}) {
  const t = theme(mode);
  const ins = t.pattern.insight;

  return (
    <div className="flex items-start gap-2 mb-2">
      <span className="shrink-0 mt-0.5" style={{
        fontSize: scale.font.size["2xs"], fontWeight: 700, color: ins[benefit],
        whiteSpace: "nowrap",
      }}>
        {ARROW[direction]} {WORD[benefit]}
      </span>
      <div style={{
        fontSize: ins.headlineType.size, fontWeight: ins.headlineType.weight,
        lineHeight: `${ins.headlineType.lineHeight}px`, color: ins.headline,
      }}>
        {text}
      </div>
    </div>
  );
}
