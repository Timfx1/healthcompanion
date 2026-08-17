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
// THE CORRIDOR NOW COMES FROM `corridor.*`, and the reconciliation went BOTH
// ways rather than "adopt the tokens":
//
//   band   -> token won. The code painted a different base on dark
//             (accent.strong at 12.9% vs accent.default at 13.3%). The two
//             composite to #2E2C45 and #2B2843 — three RGB units apart, on a
//             decorative wash. Not worth a mode-specific token.
//
//   edge   -> CODE won, and the token was raised to match it. The token had the
//             dashes at 20%, the code at 30/25%. The dashes are what make the
//             band read as a range with two sides instead of a threshold, which
//             is N5 doing actual work; the weaker value would have quietly
//             undermined the rule the token family exists to enforce.
//
//   label  -> token won, and the code was a live accessibility failure: a
//             translucent accent reaching 3.58:1 on dark and 2.99:1 on light,
//             on 10px italic text. text.secondary reaches 5.91 / 5.24.
//             It was never declared as a pair, so nothing measured it.
// ============================================================

import { scale, theme } from "../tokens";
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
  const corridor = theme(mode).pattern.corridor;
  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {showCorridor && (
          <>
            {/* The band sits UNDER the line and is bounded by dashes on BOTH
                edges — a range has two sides, and that is what stops it reading
                as a threshold. */}
            <rect x="0" y={corridorTop} width={w} height={corridorBot - corridorTop} fill={corridor.band} />
            <line x1="0" y1={corridorTop} x2={w} y2={corridorTop} stroke={corridor.edge} strokeWidth="1" strokeDasharray="4 3" />
            <line x1="0" y1={corridorBot} x2={w} y2={corridorBot} stroke={corridor.edge} strokeWidth="1" strokeDasharray="4 3" />
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
        <div style={{ fontSize: scale.font.size["3xs"], color: corridor.label, marginTop: 2, fontStyle: "italic" }}>
          {corridorLabel}
        </div>
      )}
    </div>
  );
}
