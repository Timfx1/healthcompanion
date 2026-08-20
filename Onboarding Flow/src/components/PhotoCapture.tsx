// ============================================================
// SCREEN: PhotoCapture (§4.11, P10, N7)
//
// PURPOSE. Add a photo to the timeline — swelling, a wound, a scar — so the
// change over weeks is visible rather than remembered. It attaches to the
// timeline and flows into the doctor report.
//
// P10 IS THE WHOLE POINT OF THIS SCREEN'S COPY. Photographs of a healing body
// are the most private thing this product will ever hold, so "stays on your
// device" is stated where the data is handled, not buried in a settings page.
// It is placed BEFORE the capture controls, because a reassurance that arrives
// after the decision is not reassurance.
//
// STATES, derived from whether an image is selected:
//   empty   nothing chosen. The two ways in, and the privacy cue.
//   chosen  an image is selected. Preview, an optional note, and save.
//
// NOT states: uploading, error. Nothing leaves the device, so there is no
// upload to fail — the same reason the capture path has no error state, for a
// stronger reason. There is also no entitlement state: taking photos is free.
// Only COMPARING them is premium (P9), and that gate lives on PhotoCompare.
//
// The preview is a neutral placeholder frame. This prototype does not ship
// invented photographs of injuries.
// ============================================================

import { useState } from "react";
import { theme, scale, type Mode } from "./tokens";
import DetailScreen, { DetailCard } from "./patterns/DetailScreen";
import CaptureField from "./patterns/CaptureField";

export type PhotoState = "empty" | "chosen";

export default function PhotoCapture({ mode, hasImage = false, onClose }: {
  mode: Mode;
  hasImage?: boolean;
  onClose: () => void;
}) {
  const t = theme(mode);
  const [note, setNote] = useState("");
  const state: PhotoState = hasImage ? "chosen" : "empty";

  return (
    <DetailScreen mode={mode} title="Add a photo" onClose={onClose}>
      {/* Before the controls, deliberately. */}
      <DetailCard mode={mode}>
        <div style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: t.color.text.primary }}>
          Stays on your device
        </div>
        <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary, lineHeight: 1.55, marginTop: 4 }}>
          Photos are saved locally and are never uploaded. They appear on your
          timeline and in your doctor report, and nowhere else unless you send
          them yourself.
        </div>
      </DetailCard>

      {state === "empty" ? (
        <>
          <div className="rounded-2xl flex flex-col items-center justify-center gap-2"
            style={{
              height: 180,
              background: t.pattern.rest.surface,
              border: `1px dashed ${t.color.surface.border}`,
            }}>
            <div style={{ fontSize: scale.font.size["2xl"] }}>📷</div>
            <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>
              Nothing selected yet
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
              style={{
                height: 48, border: "none", cursor: "pointer", fontSize: scale.font.size.md,
                background: `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`,
                color: t.color.cta.label,
              }}>
              Take a photo
            </button>
            <button
              className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
              style={{
                height: 48, cursor: "pointer", fontSize: scale.font.size.sm,
                background: t.color.surface.card,
                border: `1px solid ${t.color.surface.border}`,
                color: t.color.text.primary,
              }}>
              Choose from library
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-2xl flex items-center justify-center"
            style={{
              height: 220,
              background: t.pattern.rest.surface,
              border: `1px solid ${t.color.surface.border}`,
            }}>
            <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted }}>
              Photo preview
            </div>
          </div>

          <CaptureField
            mode={mode} value={note} onChange={setNote} onSave={onClose}
            placeholder="Add a note (optional)"
          />

          <button
            className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
            style={{
              height: 48, border: "none", cursor: "pointer", fontSize: scale.font.size.md,
              background: `linear-gradient(135deg,${t.color.cta.from},${t.color.cta.to})`,
              color: t.color.cta.label,
            }}>
            Save to timeline
          </button>

          {/* No required fields, here or anywhere on a capture path (P1). */}
          <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted, textAlign: "center" }}>
            The note is optional — saving works without it.
          </div>
        </>
      )}
    </DetailScreen>
  );
}
