// ============================================================
// SCREEN: PhotoCompare (§4.11, P9, §9)
//
// PURPOSE. Two photos side by side, weeks apart. This is the moment recovery
// becomes visible to someone living it a day at a time — which is exactly why
// it is the premium feature people will actually pay for, and exactly why the
// gate has to be honest.
//
// THE SECOND LEGITIMATELY GATED SURFACE, after education deep-dives. Taking
// photos is free and the timeline is free (N7); only the COMPARISON is premium
// (P9). The gate therefore sits here and not on PhotoCapture — putting it on
// the act of adding a photo would gate the core loop.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATES, derived from the entitlement and the photo count:
//   locked        no premium. Both photos are VISIBLE — value before the gate
//                 (§9) — and the comparison affordance is what is withheld.
//                 A blank wall here would teach people the app is a billboard.
//   insufficient  premium held, but fewer than two photos. Not a gate at all,
//                 and it must not look like one: the answer is "take another in
//                 a couple of weeks", never "upgrade".
//   ready         premium and enough photos.
//
// That middle state is the one worth having. Without it, a subscriber with one
// photo sees either a broken screen or — far worse — an upsell for something
// they have already bought.
//
// NOT states: loading, error. Local files, nothing to fetch.
// ============================================================

import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailCard } from "./patterns/DetailScreen";

export type CompareState = "locked" | "insufficient" | "ready";

export function compareStateOf(photoCount: number, hasPremium: boolean): CompareState {
  if (!hasPremium) return "locked";
  return photoCount < 2 ? "insufficient" : "ready";
}

function Frame({ mode, label, day }: { mode: Mode; label: string; day: string }) {
  const t = theme(mode);
  return (
    <div className="flex-1 flex flex-col gap-1">
      <div className="rounded-xl flex items-center justify-center"
        style={{ height: 150, background: t.pattern.rest.surface, border: `1px solid ${t.color.surface.border}` }}>
        <span style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted }}>{label}</span>
      </div>
      <div style={{ fontSize: scale.font.size["2xs"], fontWeight: 600, color: t.color.text.secondary, textAlign: "center" }}>
        {day}
      </div>
    </div>
  );
}

export default function PhotoCompare({ mode, photoCount = 4, hasPremium = false, onClose, onUnlock }: {
  mode: Mode;
  photoCount?: number;
  hasPremium?: boolean;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const t = theme(mode);
  const state = compareStateOf(photoCount, hasPremium);

  return (
    <DetailScreen mode={mode} title="Compare photos" onClose={onClose}>
      {state === "insufficient" ? (
        // Premium is already held. This is a "come back later", and there is
        // deliberately nothing to buy on it.
        <DetailCard mode={mode}>
          <div style={{ fontSize: scale.font.size.base, fontWeight: 600, color: t.color.text.primary }}>
            One photo so far
          </div>
          <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.55, marginTop: 6 }}>
            Comparisons need two. Add another in a week or two and the change
            will be here waiting — that gap is what makes it worth looking at.
          </div>
        </DetailCard>
      ) : (
        <>
          {/* Both photos are visible in EVERY state, including locked. What the
              gate withholds is the comparison tooling, not the evidence. */}
          <div className="flex gap-3">
            <Frame mode={mode} label="Photo" day="Day 3" />
            <Frame mode={mode} label="Photo" day="Day 46" />
          </div>

          {state === "ready" ? (
            <>
              <DetailCard mode={mode}>
                <div style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.55 }}>
                  43 days between these two.
                </div>
              </DetailCard>
              <button
                className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
                style={{
                  height: 48, cursor: "pointer", fontSize: scale.font.size.sm,
                  background: t.color.surface.card,
                  border: `1px solid ${t.color.surface.border}`,
                  color: t.color.text.primary,
                }}>
                Choose different photos
              </button>
            </>
          ) : (
            // The gate. Soft, inline, dismissible by simply not tapping — §9
            // forbids a hard wall and a modal interrupt, and the free product
            // stays completely intact behind it.
            <div className="rounded-2xl px-4 py-3 flex flex-col gap-2"
              style={{ background: t.color.accent.surface, border: `1px solid ${t.color.accent.edge}` }}>
              <div style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: t.color.text.primary, lineHeight: 1.45 }}>
                Line them up side by side, pick any two dates, and see the
                difference you cannot feel day to day.
              </div>
              <button onClick={onUnlock}
                className="btn-press self-start rounded-full px-4"
                style={{
                  height: 32, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`,
                  fontSize: scale.font.size.xs, fontWeight: 600,
                  color: t.color.cta.label,
                }}>
                Unlock photo compare
              </button>
            </div>
          )}
        </>
      )}

      <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, lineHeight: 1.5 }}>
        Your photos stay on your device in every case, premium or not.
      </div>
    </DetailScreen>
  );
}
