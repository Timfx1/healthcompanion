// ============================================================
// PATTERN: DetailScreen — the shell every timeline detail shares.
//
// WHY A SHELL. Five detail screens land at once, and ReportPreview, Safety and
// EducationArticle had each already hand-rolled the same header: a 56px bar, a
// back control, a title, a bottom border, a scrolling body on `surface.raised`.
// Three copies is where drift starts and eight would guarantee it. This system
// exists to define a thing once.
//
// The `action` slot is deliberately narrow — one optional control on the right.
// A detail screen that needs a toolbar is a screen that has stopped being a
// detail, and the shell should make that awkward rather than easy.
//
// Everything here resolves through tokens; the shell owns no colours of its own.
// ============================================================

import { theme, scale, type Mode } from "../tokens";

export default function DetailScreen({ mode, title, onClose, action, children }: {
  mode: Mode;
  title: string;
  onClose: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = theme(mode);
  return (
    <div className="absolute inset-0 flex flex-col animate-fade-up"
      // `raised`, matching ReportPreview — a full-screen reading surface, and a
      // known backdrop for anything tinted that sits on it.
      style={{ background: t.color.surface.raised, zIndex: scale.z.feature }}>

      <div className="flex items-center gap-2 px-5 shrink-0"
        style={{ height: 56, borderBottom: `1px solid ${t.color.surface.border}` }}>
        <button onClick={onClose} aria-label="Back" className="btn-press flex items-center"
          style={{ background: "none", border: "none", cursor: "pointer", color: t.color.text.secondary }}>
          <span style={{ fontSize: scale.font.size.base }}>←</span>
        </button>
        <div className="flex-1" style={{ fontSize: scale.font.size.md, fontWeight: 600, color: t.color.text.primary }}>
          {title}
        </div>
        {action}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4 flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

/** A labelled block of body copy. Used by four of the five detail screens. */
export function DetailSection({ mode, label, children }: { mode: Mode; label: string; children: React.ReactNode }) {
  const t = theme(mode);
  return (
    <div className="flex flex-col gap-2">
      <div style={{ fontSize: scale.font.size["2xs"], fontWeight: 700, letterSpacing: scale.font.tracking.wide, color: t.color.text.secondary, textTransform: "uppercase" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/** The standard neutral card these screens put content in. */
export function DetailCard({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  const t = theme(mode);
  return (
    <div className="rounded-2xl px-4 py-3"
      style={{ background: t.color.surface.card, border: `1px solid ${t.color.surface.border}` }}>
      {children}
    </div>
  );
}

/** Full-width secondary action. Primary actions use the CTA gradient instead. */
export function DetailButton({ mode, label, onClick, disabled = false }: {
  mode: Mode; label: string; onClick?: () => void; disabled?: boolean;
}) {
  const t = theme(mode);
  return (
    <button onClick={onClick} disabled={disabled}
      className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold"
      style={{
        height: 48, cursor: disabled ? "default" : "pointer", fontSize: scale.font.size.sm,
        background: disabled ? t.color.state.disabled : t.color.surface.card,
        color: disabled ? t.color.state.disabledText : t.color.text.primary,
        border: `1px solid ${t.color.surface.border}`,
      }}>
      {label}
    </button>
  );
}
