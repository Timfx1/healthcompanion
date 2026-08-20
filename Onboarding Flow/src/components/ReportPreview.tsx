// ============================================================
// SCREEN: ReportPreview — the doctor report (spec §4.7, P6, N6)
//
// PURPOSE. One artifact, two readers.
//   For the CLINICIAN: what changed since last visit, absorbable in 60 seconds.
//   For the PATIENT:   I have something worth showing, and I control what is in it.
//
// The in-app preview is NOT the print artifact. It is the patient's view of what
// the clinician will see, plus the controls — range and export. That split is
// what generates the states below. The printed/PDF form is a different medium
// with its own palette (design-system/tokens/print.json, 7:1 body contrast).
//
// N6 — FREE FOREVER. There is no lock badge, no paywall, no premium treatment
// on this surface or its export, and there is no `locked` prop to add one with.
// This file is listed in checks/restricted.mjs as a report surface, so importing
// a gating symbol here fails the build. That is deliberate: an audit found the
// report gated or sold in ten places, including a lock badge that had been
// sitting in the visual baselines. See DESIGN_CRITERIA §11.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATE vs RENDERING VARIANT
//
// Rendering variants are NOT states. They multiply every state rather than
// being one: light/dark (N8), screen/paper, dynamic type. A state is something
// the product can BE; a variant is how that state is drawn.
//
// DEPTH — derived from the data, never set by hand:
//   empty   nothing logged. Reachable on day one, because the report is two
//           taps from Home and a curious new user will tap it. Must say what it
//           becomes without shaming the gap (P2).
//   sparse  logged, but too little to claim a trend. This is where a lesser
//           design draws "improving" from two points. It degrades instead.
//   first   enough data, no prior visit. The data is fine; the ANCHOR is
//           missing, so the range reframes to "since you started".
//   ready   data and a prior visit. The normal case.
//
// CHANGE BLOCK — the visually dominant element, so its degradation IS the
// design. Four sub-states, derived in the same way:
//   noAnchor      no previous visit to compare against
//   insufficient  a previous visit, but not enough between to say anything
//   noChange      a previous visit, data, and nothing moved. The guilt-risk
//                 case: this must read as information, never as failure (P2).
//   changes       the intended case
//
// EXPORT — orthogonal to depth, because it can be in flight over any of them:
//   idle | working | failed
//   This is the one place the report may legitimately fail. Unlike the capture
//   path, which must not.
//
// RANGE — changing it re-derives depth, so empty/sparse are reachable from
// INSIDE a ready report. The chip therefore states what the range yielded
// rather than silently producing a blank page.
//
// EXPLICITLY NOT STATES:
//   free/premium   — one entitlement state, by design (N6)
//   online/offline — local-first, nothing is fetched
//   guest/signed-in— guest is the only mode in Phase 1
//   stale          — this recomputes live rather than caching an artifact
//   red flags      — CONDITIONAL CONTENT within ready, not a state of its own.
//                    It is the one surface allowed the reserved safety hue (N3).
// ============================================================

import { D, c as s, theme, scale, type Mode } from "./tokens";
import DetailScreen from "./patterns/DetailScreen";
import { cat } from "./patterns/category";

export type Depth = "empty" | "sparse" | "first" | "ready";
export type ExportState = "idle" | "working" | "failed";
export type ChangeDirection = "improving" | "worsening" | "steady";

export type ReportChange = { label: string; direction: ChangeDirection; detail: string };

export type ReportInput = {
  condition: string;
  dayN: number;
  rangeLabel: string;
  entryCount: number;
  daysSpanned: number;
  lastVisit: string | null;
  changes: ReportChange[];
  pain: number[];
  events: { date: string; text: string }[];
  meds: { name: string; adherence: string }[];
  questions: string[];
  redFlags: string[];
};

// Depth is DERIVED. Nothing hand-sets it, so a screenshot of "sparse" is a
// screenshot of what sparse data actually produces rather than of a flag.
export function depthOf(d: ReportInput): Depth {
  if (d.entryCount === 0) return "empty";
  if (d.entryCount < 3 || d.daysSpanned < 2) return "sparse";
  if (!d.lastVisit) return "first";
  return "ready";
}

type ChangeState = "noAnchor" | "insufficient" | "noChange" | "changes";
function changeStateOf(d: ReportInput, depth: Depth): ChangeState {
  if (depth === "sparse") return "insufficient";
  if (!d.lastVisit) return "noAnchor";
  return d.changes.length ? "changes" : "noChange";
}

// N4 — never meaning by colour alone. Every direction carries a glyph AND a
// word, so the ink is reinforcement. The words are improving/worsening/steady,
// never good/bad: the report states what changed, it does not grade the person
// who lived it. Same vocabulary as the print layer, deliberately.
function dirParts(dir: ChangeDirection, mode: Mode) {
  if (dir === "improving") return { glyph: "↓", word: "Improving", ink: cat(mode, "mood").ink };
  if (dir === "worsening") return { glyph: "↑", word: "Worsening", ink: cat(mode, "pain").ink };
  return { glyph: "→", word: "Steady", ink: theme(mode).pattern.report.heading };
}

export default function ReportPreview({ mode, data, exportState = "idle", onClose, onExport, onRange }: {
  mode: Mode;
  data: ReportInput;
  exportState?: ExportState;
  onClose: () => void;
  onExport: () => void;
  onRange: () => void;
}) {
  const R = theme(mode).pattern.report;
  const depth = depthOf(data);
  const change = changeStateOf(data, depth);
  const dim = s(D.textSec, D.lTextSec, mode);

  return (
    // The header is the shared DetailScreen shell. It was hand-rolled here
    // first, then twice more, which is how the shell came to exist. No badge,
    // no crown, no upgrade affordance — there is nowhere on this screen for one.
    <DetailScreen mode={mode} title="Doctor report" onClose={onClose}>

        {/* RANGE CHIP. States what the range YIELDED, not just what it is, so
            narrowing to a window with nothing in it explains itself instead of
            rendering a blank page. */}
        <button onClick={onRange} className="btn-press flex items-center justify-between w-full rounded-xl px-3 shrink-0"
          style={{ height: 40, background: "transparent", border: `1px solid ${R.divider}`, cursor: "pointer" }}>
          <span style={{ fontSize: scale.font.size.xs, color: dim }}>
            {depth === "first" ? "Since you started" : data.rangeLabel}
            {data.entryCount > 0 && <span> · {data.entryCount} {data.entryCount === 1 ? "entry" : "entries"}</span>}
          </span>
          <span style={{ fontSize: scale.font.size.xs, color: dim }}>Change ›</span>
        </button>

        {depth === "empty" ? <EmptyBody mode={mode} R={R} /> : (
          <>
            {/* ── THE DOMINANT BLOCK ────────────────────────────────────────
                Spec §4.7: "what changed since last visit" is the visually
                dominant block. It is first, it is the only element with a
                filled background, and its heading is the largest type on the
                screen. Everything below it is support. */}
            <div className="rounded-2xl px-4 py-4 flex flex-col gap-3"
              style={{ background: R.changeBlock, border: `1px solid ${R.divider}` }}>
              <div style={{ fontSize: scale.font.size.xl, fontWeight: 700, color: R.heading, lineHeight: 1.25 }}>
                {change === "noAnchor" ? "Since you started" : "What changed since last visit"}
              </div>

              {change === "changes" && (
                <>
                  <div style={{ fontSize: scale.font.size["2xs"], fontWeight: 400, color: R.heading, opacity: 0.85 }}>
                    Compared with {data.lastVisit}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {data.changes.map((c) => {
                      const p = dirParts(c.direction, mode);
                      return (
                        <div key={c.label} className="flex items-baseline gap-2">
                          <span style={{ fontSize: scale.font.size.sm, fontWeight: 700, color: p.ink, minWidth: 92 }}>
                            {p.glyph} {p.word}
                          </span>
                          <span style={{ fontSize: scale.font.size.sm, color: R.heading, fontWeight: 600 }}>{c.label}</span>
                          <span style={{ fontSize: scale.font.size.xs, fontWeight: 400, color: R.heading }}>{c.detail}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Nothing moved. The wording carries no verdict — a flat fortnight
                  is a fact about the data, not a report card on the person. */}
              {change === "noChange" && (
                <div style={{ fontSize: scale.font.size.sm, color: R.heading, lineHeight: 1.5 }}>
                  Much the same as {data.lastVisit}. Pain, sleep and mobility are all
                  holding steady — there is nothing new to flag.
                </div>
              )}

              {/* Two points is not a trend, and saying so is the feature. */}
              {change === "insufficient" && (
                <div style={{ fontSize: scale.font.size.sm, color: R.heading, lineHeight: 1.5 }}>
                  Not enough logged yet to compare. A few more check-ins and this
                  will show what moved between visits.
                </div>
              )}

              {change === "noAnchor" && (
                <div style={{ fontSize: scale.font.size.sm, color: R.heading, lineHeight: 1.5 }}>
                  This is your first report, so there is no previous visit to compare
                  against. Everything below covers your whole recovery so far.
                </div>
              )}
            </div>

            {/* CONDITIONAL CONTENT within ready — not a state, and deliberately
                HIGH. It sits directly under the dominant block and above every
                supporting section, because guidance that routes someone to care
                cannot live under a medications table. This is the one surface
                permitted the reserved safety hue (N3). */}
            {data.redFlags.length > 0 && <RedFlags mode={mode} items={data.redFlags} />}

            <Overview mode={mode} R={R} data={data} />
            {depth !== "sparse" && <PainTrend mode={mode} R={R} pain={data.pain} />}
            {data.events.length > 0 && <Section mode={mode} R={R} title="Key events"
              rows={data.events.map((e) => [e.date, e.text])} />}
            {data.meds.length > 0 && <Section mode={mode} R={R} title="Medications"
              rows={data.meds.map((m) => [m.name, m.adherence])} />}
            {data.questions.length > 0 && <Questions mode={mode} R={R} items={data.questions} />}

          </>
        )}

        {/* EXPORT. Free, per P6/N6 — the button carries no badge in any state.
            The failure case is real: sharing is unavailable on some devices, and
            saying so plainly beats failing silently. */}
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={onExport} disabled={depth === "empty" || exportState === "working"}
            className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
            style={{
              height: 48, border: "none",
              cursor: depth === "empty" ? "default" : "pointer",
              fontSize: scale.font.size.md,
              background: depth === "empty" ? theme(mode).color.state.disabled : `linear-gradient(135deg,${theme(mode).color.cta.from},${theme(mode).color.cta.to})`,
              color: depth === "empty" ? theme(mode).color.state.disabledText : theme(mode).color.cta.label,
            }}>
            {exportState === "working" ? "Preparing PDF…" : "Export as PDF"}
          </button>
          {exportState === "failed" && (
            <div style={{ fontSize: scale.font.size.xs, color: theme(mode).color.safety.ink, lineHeight: 1.45 }}>
              This device could not open the share sheet, so the PDF was not created.
              Your report is unchanged and still here.
            </div>
          )}
          <div style={{ fontSize: scale.font.size["2xs"], color: R.meta, textAlign: "center" }}>
            Free, always. Your report stays on your device.
          </div>
        </div>
    </DetailScreen>
  );
}

// ── Empty ───────────────────────────────────────────────────────────────────
// Reachable on day one. It describes what the report becomes and offers the one
// action that gets there. No count of what is missing, no "0 entries", nothing
// that reads as a scolding (P2, N2).
function EmptyBody({ mode, R }: { mode: Mode; R: any }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl px-4 py-5"
      style={{ background: R.changeBlock, border: `1px solid ${R.divider}` }}>
      <div style={{ fontSize: scale.font.size.xl, fontWeight: 700, color: R.heading, lineHeight: 1.25 }}>
        Your report builds itself
      </div>
      <div style={{ fontSize: scale.font.size.sm, color: R.heading, lineHeight: 1.55 }}>
        Every check-in, note and photo you add lands here automatically — pain over
        time, what changed since your last visit, medications and the questions you
        wanted to ask. Nothing to fill in.
      </div>
      <div style={{ fontSize: scale.font.size.xs, color: R.meta, lineHeight: 1.5 }}>
        Start with one check-in whenever you feel like it.
      </div>
    </div>
  );
}

function Overview({ mode, R, data }: { mode: Mode; R: any; data: ReportInput }) {
  return (
    <div className="flex flex-col gap-1">
      <div style={{ fontSize: scale.font.size.base, fontWeight: 600, color: R.heading }}>{data.condition}</div>
      <div style={{ fontSize: scale.font.size.xs, color: R.meta }}>
        Day {data.dayN} · {data.rangeLabel}
      </div>
    </div>
  );
}

// A chart with no sentence above it is forbidden (§4, P4), so the headline is
// part of the component rather than something a caller may forget.
function PainTrend({ mode, R, pain }: { mode: Mode; R: any; pain: number[] }) {
  const w = 300, h = 56;
  const max = 10;
  const pts = pain.map((v, i) => [
    (i / Math.max(1, pain.length - 1)) * w,
    h - (v / max) * h,
  ] as const);
  const dPath = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const first = pain[0] ?? 0, last = pain[pain.length - 1] ?? 0;
  const word = last < first ? "down" : last > first ? "up" : "level";
  return (
    <div className="flex flex-col gap-2">
      <div style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: R.heading }}>
        Pain is trending {word} — {first}/10 to {last}/10
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", height: 56 }}>
        <path d={dPath} fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ fontSize: scale.font.size["2xs"], color: R.meta }}>0–10 scale, whole range shown</div>
    </div>
  );
}

function Section({ mode, R, title, rows }: { mode: Mode; R: any; title: string; rows: [string, string][] }) {
  return (
    <div className="flex flex-col gap-2">
      <div style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: R.heading }}>{title}</div>
      <div className="flex flex-col">
        {rows.map(([a, b], i) => (
          <div key={i} className="flex items-baseline justify-between gap-3 py-1.5"
            style={{ borderTop: i ? `1px solid ${R.divider}` : "none" }}>
            <span style={{ fontSize: scale.font.size.xs, color: R.meta, minWidth: 74 }}>{a}</span>
            <span style={{ fontSize: scale.font.size.xs, color: R.heading, textAlign: "right", flex: 1 }}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Questions({ mode, R, items }: { mode: Mode; R: any; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: R.heading }}>Questions I wanted to ask</div>
      {items.map((q, i) => (
        <div key={i} className="flex items-baseline gap-2">
          <span style={{ fontSize: scale.font.size.xs, color: R.meta }}>·</span>
          <span style={{ fontSize: scale.font.size.xs, color: R.heading, lineHeight: 1.5 }}>{q}</span>
        </div>
      ))}
    </div>
  );
}

// The ONE place the reserved alert colour is allowed (N3). Calm but
// unmistakable — this routes people to care, it does not decorate.
function RedFlags({ mode, items }: { mode: Mode; items: string[] }) {
  const t = theme(mode).color.safety;
  const R = theme(mode).pattern.report;
  return (
    <div className="rounded-xl px-3 py-3 flex flex-col gap-1.5"
      style={{ background: R.surface, border: `1.5px solid ${t.mark}` }}>
      <div style={{ fontSize: scale.font.size.sm, fontWeight: 700, color: t.ink }}>
        ⚑ When to contact a doctor
      </div>
      {items.map((f, i) => (
        <div key={i} style={{ fontSize: scale.font.size.xs, color: R.heading, lineHeight: 1.5 }}>{f}</div>
      ))}
    </div>
  );
}
