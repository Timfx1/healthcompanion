// ============================================================
// PATTERN: PainSparklineWithCorridor
//
// C4 / N5: the corridor is a RANGE, never a target. It answers "am I on track?"
// without letting anyone fail a benchmark nobody told them about. There is no
// target line, no goal marker, no pass/fail colouring — and no `corridor.target`
// token exists, so one cannot be built by accident.
//
// MARK vs INK:
//   area fill  -> mark. A decorative wash under the line, carrying nothing.
//   data line  -> ink.  This IS the data. The token docs name a chart line as
//                       the canonical thing that must not use mark, and it was
//                       using mark: 1.47-1.96:1 on light against a 3:1 non-text
//                       threshold. Now 4.80-4.84.
//
// KNOWN DIVERGENCE — the corridor colours below are still inline rather than
// drawn from the `corridor.*` pattern family, which exists and is unused. They
// are not the same values: corridor.band resolves to accent.default at 13%
// (#7C6FCD22) while this paints #9B8FE021 on dark and #7C6FCD1A on light.
// Adopting the tokens would therefore MOVE PIXELS on app-progress, so it is a
// deliberate design change rather than part of this extraction. Recorded rather
// than quietly reconciled.
// ============================================================

import { scale } from "../tokens";
import { cat, type Category } from "./category";
import type { Mode } from "../tokens";

export default function PainSparklineWithCorridor({
  data, category, mode, height = 64, showCorridor = false, corridorLabel = "",
}: {
  data: number[];
  category: Category;
  mode: Mode;
  height?: number;
  showCorridor?: boolean;
  corridorLabel?: string;
}) {
  const k = cat(mode, category);
  const max = Math.max(...data) + 1;
  const w = 300;
  const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  // C4: corridor = the common range for knee rehab at weeks 4-6 = pain 2-5.
  const corridorTop = h - (5 / max) * h;
  const corridorBot = h - (2 / max) * h;
  const bandColor = mode === "dark" ? "#9B8FE021" : "#7C6FCD1A";
  const bandBorder = mode === "dark" ? "#9B8FE04D" : "#7C6FCD40";
  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {showCorridor && (
          <>
            {/* The band sits UNDER the line and is bounded by dashes on BOTH
                edges — a range has two sides, and that is what stops it reading
                as a threshold. */}
            <rect x="0" y={corridorTop} width={w} height={corridorBot - corridorTop} fill={bandColor} />
            <line x1="0" y1={corridorTop} x2={w} y2={corridorTop} stroke={bandBorder} strokeWidth="1" strokeDasharray="4 3" />
            <line x1="0" y1={corridorBot} x2={w} y2={corridorBot} stroke={bandBorder} strokeWidth="1" strokeDasharray="4 3" />
          </>
        )}
        {/* Area fill: MARK — decorative. */}
        <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`${k.mark}22`} stroke="none" />
        {/* Line: INK — the data. */}
        <polyline points={pts} fill="none" stroke={k.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* "Common range for …" plus the everyone-heals-differently affordance,
          deliberately quiet: the band is context, not a verdict. */}
      {showCorridor && corridorLabel && (
        <div style={{ fontSize: scale.font.size["3xs"], color: mode === "dark" ? "#9B8FE0B3" : "#7C6FCDCC", marginTop: 2, fontStyle: "italic" }}>
          {corridorLabel}
        </div>
      )}
    </div>
  );
}
