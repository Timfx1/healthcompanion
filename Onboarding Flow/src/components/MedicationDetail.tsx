// ============================================================
// SCREEN: MedicationDetail (§4.9, P2, N1, N2, N7)
//
// PURPOSE. What this medication is, when it is due, and what actually happened —
// without turning any of it into a scorecard.
//
// THIS IS THE SCREEN WHERE P2 IS EASIEST TO BREAK, so the token contracts do the
// deciding rather than taste:
//
//   TAKEN doses render as `accumulation.*` dots. That family's contract is "a
//   count, or dots that only ever accrue. Nothing sequential that can visibly
//   reset" — so there is no streak here and none can be built.
//
//   SKIPPED doses render as `rest.*`. That family's contract is "muted neutral,
//   visually quieter than a logged day. Never red, never alert-coloured, never
//   labelled 'missed', NEVER COUNTED" — so a skipped dose is quieter than a
//   taken one and the screen states no total for it. There is no adherence
//   percentage on this screen for exactly that reason.
//
//   And the safety hue appears nowhere near any of it (N3). A missed painkiller
//   is not a red flag.
//
// STATES, derived from the data:
//   noHistory  added, nothing logged yet. Not an empty state to apologise for —
//              it is day one of this medication.
//   history    doses logged. The log is shown as texture, not as a grade.
//
// DUE is ORTHOGONAL to both, because a dose can be due over either — the same
// shape as the report's export state sitting across its depth.
//
// N7 — medications and reminders are core loop, free forever.
// ============================================================

import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailSection, DetailCard, DetailButton } from "./patterns/DetailScreen";
import type { Medication } from "./timelineFixtures";

export type MedState = "noHistory" | "history";
export function medStateOf(m: Medication): MedState {
  return m.log.length === 0 ? "noHistory" : "history";
}

export default function MedicationDetail({ mode, medication, onClose }: {
  mode: Mode;
  medication: Medication;
  onClose: () => void;
}) {
  const t = theme(mode);
  const state = medStateOf(medication);
  const taken = medication.log.filter((d) => d.status === "taken").length;

  return (
    <DetailScreen mode={mode} title="Medication" onClose={onClose}>
      <div className="flex flex-col gap-1">
        <div style={{ fontSize: scale.font.size.xl, fontWeight: 700, color: t.color.text.primary }}>
          {medication.name} {medication.dose}
        </div>
        <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>
          {medication.schedule}
        </div>
      </div>

      {/* Orthogonal to state: a dose can be due whether or not anything is
          logged. Phrased as an offer, never a demand — reminders in this product
          "never escalate, never scold" (P2). */}
      {medication.dueNow && (
        <button
          className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
          style={{
            height: 48, border: "none", cursor: "pointer", fontSize: scale.font.size.md,
            background: `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`,
            color: t.color.cta.label,
          }}>
          Log a dose
        </button>
      )}

      {state === "noHistory" ? (
        <DetailCard mode={mode}>
          <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.55 }}>
            Nothing logged yet.
          </div>
          <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary, lineHeight: 1.5, marginTop: 4 }}>
            Log a dose whenever you take one. Skipping is fine and gets recorded
            the same way — the point is the picture, not the score.
          </div>
        </DetailCard>
      ) : (
        <>
          {/* ACCUMULATION, not a streak. The counter states what happened and
              nothing about what did not — `rest.*` says skipped days are never
              counted, so there is no "3 missed" anywhere on this screen and no
              adherence percentage. */}
          <DetailSection mode={mode} label="Recent doses">
            <div className="flex items-center gap-2 flex-wrap">
              {medication.log.map((d, i) => (
                <span key={i} className="rounded-full" title={d.status}
                  style={{
                    width: 12, height: 12,
                    background: d.status === "taken"
                      ? t.pattern.accumulation.dotFilled
                      : t.pattern.rest.mark,
                  }} />
              ))}
              <span className="rounded-full px-3 py-0.5 ml-1"
                style={{ background: t.pattern.accumulation.counterFill, border: `1px solid ${t.pattern.accumulation.counterEdge}` }}>
                <span style={{ fontSize: scale.font.size["2xs"], fontWeight: 700, color: t.pattern.accumulation.counterLabel }}>
                  {taken} logged
                </span>
              </span>
            </div>

            {/* N4: the dot colours are reinforcement. The list below says which
                is which in words, and a skipped row reads as rest rather than as
                a failure — "a quiet day", never "missed". */}
            <div className="flex flex-col mt-1">
              {medication.log.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-1.5"
                  style={{ borderTop: i ? `1px solid ${t.color.surface.border}` : "none" }}>
                  <span style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>{d.date}</span>
                  <span style={{
                    fontSize: scale.font.size.xs,
                    fontWeight: d.status === "taken" ? 600 : 400,
                    color: d.status === "taken" ? t.color.text.primary : t.pattern.rest.label,
                  }}>
                    {d.status === "taken" ? "Taken" : "Not taken"}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>
        </>
      )}

      <DetailButton mode={mode} label="Edit medication" />

      <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, lineHeight: 1.5 }}>
        Doses you log feed the doctor report. Nothing here is shared anywhere else.
      </div>
    </DetailScreen>
  );
}
