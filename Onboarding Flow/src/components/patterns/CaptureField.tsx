// ============================================================
// PATTERN: CaptureField — the Notes-app lane (P1, §4.2)
//
// One line, one save, no categorisation decision. This is the affordance the
// whole first product principle rests on: there must ALWAYS be a path where
// something can be captured in under ten seconds without a single decision.
//
// TWO DEFECTS ARE FIXED BY THIS EXTRACTION, both found by reading the code it
// replaces rather than by any gate:
//
//   1. THE SAVE BUTTON HAD NO onClick. The comment above it in MainApp said
//      "BUTTON PRESS: handleCaptureSave() when captureText is truthy" and the
//      handler was never wired, so the visible ✓ did nothing for the whole life
//      of the component and only the Enter key saved. On the app's single most
//      important interaction. Nothing caught it because a baseline photographs
//      appearance, not behaviour — the same blind spot that hid the Toast's
//      dead branch, one component over.
//
//   2. pattern.capture.* WAS DEFINED AND UNUSED, like insight.* still is. The
//      screen hardcoded the same values through the legacy `D` object, so the
//      family described a field nobody was drawing. Adopting it is zero-diff on
//      every value EXCEPT `placeholder`, which the field never set at all — it
//      was whatever the browser chose, unmeasured and unmeasurable.
//
// STATE is derived from the text, never passed in:
//   empty  → mic glyph on capture.actionIdle. Saving is a no-op, not an error.
//   ready  → check glyph on capture.actionReady.
//
// There is deliberately NO saving state and NO error state. The capture path is
// optimistic and offline-safe: it cannot fail, which is why the confirmation
// Toast has no failure branch either. A spinner here would be a lie about what
// the write costs.
// ============================================================

import { theme, scale, type Mode } from "../tokens";

export default function CaptureField({ value, onChange, onSave, mode, placeholder, autoFocus = false, multiline = false }: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  mode: Mode;
  placeholder?: string;
  autoFocus?: boolean;
  multiline?: boolean;
}) {
  const t = theme(mode).pattern.capture;
  const ready = value.trim().length > 0;
  const text = theme(mode).color.text.primary;
  const hint = placeholder ?? "Note anything… ('knee hurt after stairs')";

  const shared: React.CSSProperties = {
    flex: 1, background: "none", border: "none", outline: "none",
    fontSize: scale.font.size.sm, color: text, fontFamily: "inherit",
  };

  return (
    <div className={`flex ${multiline ? "items-end" : "items-center"} gap-2 rounded-2xl px-3`}
      style={{
        minHeight: 48,
        paddingTop: multiline ? 10 : 0,
        paddingBottom: multiline ? 10 : 0,
        background: t.field,
        border: `1px solid ${t.edge}`,
      }}>
      {/* The placeholder colour is set explicitly. It used to be the browser
          default, which meant the one piece of text guaranteed to be on screen
          before a user types was the one piece nothing could measure. */}
      <style>{`.rc-capture::placeholder { color: ${t.placeholder}; opacity: 1; }`}</style>

      {multiline ? (
        <textarea
          className="rc-capture" rows={3} value={value} autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSave(); }}
          placeholder={hint}
          style={{ ...shared, resize: "none", lineHeight: 1.45 }}
        />
      ) : (
        <input
          className="rc-capture" type="text" value={value} autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave()}
          placeholder={hint}
          style={shared}
        />
      )}

      {/* onClick is the fix. An empty field is a no-op rather than a refusal:
          nothing to save is not an error, and the capture path never scolds. */}
      <button
        onClick={onSave}
        aria-label={ready ? "Save to timeline" : "Dictate"}
        className="btn-press flex items-center justify-center rounded-xl"
        style={{
          width: 32, height: 32, flexShrink: 0, border: "none", cursor: "pointer",
          background: ready ? t.actionReady : t.actionIdle,
          transition: `background ${scale.duration.quick}ms`,
        }}>
        {ready
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={theme(mode).color.text.onAccent} strokeWidth="2" strokeLinecap="round"><path d="M2 7l4 4 6-6" /></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={theme(mode).color.text.secondary} strokeWidth="1.6"><rect x="5" y="1" width="4" height="7" rx="2" /><path d="M2 7c0 3 2.5 5 5 5s5-2 5-5" strokeLinecap="round" /><path d="M7 13v-1" /></svg>
        }
      </button>
    </div>
  );
}
