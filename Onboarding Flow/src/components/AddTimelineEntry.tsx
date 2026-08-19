// ============================================================
// SCREEN: AddTimelineEntry — the FAB's destination (§4.3, §5)
//
// PURPOSE. Choose what to add to the timeline. That is all it does, and saying
// so matters: the Timeline FAB has been a documented stub since the prototype
// was written ("ACTION: Prototype stub (no action wired)"), so this is the
// screen that makes the button mean something.
//
// CAPTURE IS FIRST, and larger. §4.2 says the capture field is "reachable from
// the FAB everywhere" while §5 lists the FAB as
// "capture/note/photo/milestone/medication/appointment" — a chooser. Those pull
// in different directions: a chooser inserts exactly the categorisation
// decision P1 forbids. The reconciliation is that quick capture is the first
// and visually dominant row, one tap from here to a field, while the persistent
// Home field remains the true zero-decision path. Recorded in §11.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATE. This screen has ONE, and that is not an oversight.
//
// The six rows are always present and always enabled. There is no loading state
// (the list is static), no empty state (a chooser cannot be empty), no error
// state, and — most deliberately — NO LOCKED ROWS. Capture, journal, photos,
// milestones, medications and appointments are all core loop, free forever
// under N7, so there is no gated variant of this sheet to build.
//
// Photo COMPARE is premium (P9) and photo capture is not; the gate belongs on
// the compare surface, not on the row that adds a photo. Putting a lock here
// would be the Medisafe mistake in miniature.
//
// Rendering variants — light/dark, dynamic type — are variants, not states.
// ============================================================

import { theme, scale, type Mode } from "./tokens";
import { cat, type Category } from "./patterns/category";

export type EntryKind = "capture" | "note" | "photo" | "milestone" | "medication" | "appointment";

// Each row carries an icon AND a label, so the category colour is reinforcement
// rather than the carrier (N4).
const ROWS: { kind: EntryKind; icon: string; label: string; hint: string; category: Category }[] = [
  { kind: "note",        icon: "📓", label: "Journal entry",  hint: "A longer write-up",              category: "mood" },
  { kind: "photo",       icon: "📷", label: "Photo",          hint: "Stays on your device",           category: "pain" },
  { kind: "milestone",   icon: "🎉", label: "Milestone",      hint: "Something worth remembering",    category: "energy" },
  { kind: "medication",  icon: "💊", label: "Medication",     hint: "Taken, skipped or changed",      category: "meds" },
  { kind: "appointment", icon: "📅", label: "Appointment",    hint: "Past or upcoming",               category: "sleep" },
];

export default function AddTimelineEntry({ mode, onClose, onPick }: {
  mode: Mode;
  onClose: () => void;
  onPick: (kind: EntryKind) => void;
}) {
  const t = theme(mode);

  return (
    <div className="absolute inset-0 flex flex-col justify-end"
      style={{ zIndex: scale.z.sheet, background: t.color.state.scrim }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="animate-fade-up rounded-t-3xl flex flex-col gap-3 px-5 pt-3 pb-6"
        style={{ background: t.pattern.paywall.sheet }}>

        <div className="self-center rounded-full"
          style={{ width: 36, height: 4, background: t.pattern.paywall.handle }} />

        <div style={{ fontSize: scale.font.size.md, fontWeight: 600, color: t.color.text.primary }}>
          Add to your timeline
        </div>

        {/* CAPTURE FIRST, and given more weight than the typed rows, because a
            categorisation decision is exactly what P1 exists to avoid. */}
        <button onClick={() => onPick("capture")}
          className="btn-press flex items-center gap-3 rounded-2xl px-4 text-left"
          style={{
            minHeight: 60, border: `1px solid ${t.color.accent.edge}`,
            background: t.color.accent.surface, cursor: "pointer",
          }}>
          <span style={{ fontSize: scale.font.size["2xl"] }}>✍️</span>
          <span className="flex-1">
            <span className="block" style={{ fontSize: scale.font.size.base, fontWeight: 600, color: t.color.text.primary }}>
              Quick capture
            </span>
            {/* Primary ink at a smaller size and lighter weight, NOT secondary
                ink. text.secondary on the 13% accent tint measures 4.49:1 in
                light — under 4.5 by a hundredth, for the fourth time in this
                system. semantic.json's own note on the muted step already says
                why: "Differentiate quiet text by WEIGHT and SIZE, not by
                lowering contrast." */}
            <span className="block" style={{ fontSize: scale.font.size.xs, fontWeight: 400, color: t.color.text.primary }}>
              Type one line — we file it for you
            </span>
          </span>
        </button>

        <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.muted }}>
          Or add something specific
        </div>

        <div className="flex flex-col">
          {ROWS.map((row, i) => {
            const k = cat(mode, row.category);
            return (
              <button key={row.kind} onClick={() => onPick(row.kind)}
                className="btn-press flex items-center gap-3 text-left"
                style={{
                  minHeight: 52, background: "none", cursor: "pointer",
                  border: "none",
                  borderTop: i ? `1px solid ${t.color.surface.border}` : "none",
                }}>
                <span className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 36, height: 36, background: `${k.mark}22` }}>
                  <span style={{ fontSize: scale.font.size.lg }}>{row.icon}</span>
                </span>
                <span className="flex-1">
                  <span className="block" style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: t.color.text.primary }}>
                    {row.label}
                  </span>
                  <span className="block" style={{ fontSize: scale.font.size["2xs"], color: t.color.text.secondary }}>
                    {row.hint}
                  </span>
                </span>
                <span style={{ fontSize: scale.font.size.xs, color: t.color.text.muted }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
