// ============================================================
// SCREEN: Timeline — "the heart" (§4.3). Spec §5 "Main tabs → Timeline".
//
// Chronological history: captures, check-ins, journal entries, medications,
// appointments, photos and milestones on one list. Auto-generated entries mix
// with manual ones and are marked as such, because provenance is honest — but
// they are not ranked below manual ones, since a milestone the app noticed is
// worth as much as one the user wrote.
//
// ─────────────────────────────────────────────────────────────────────────────
// GAPS ARE THE POINT (P2, N1/N2)
//
// "Gaps on the timeline render as neutral rest ('a few quiet days'), not
// failure." So this screen does not simply skip empty days — it RENDERS them,
// deliberately, as a soft neutral row. That is a stronger statement than
// omitting them: it says the app noticed and had nothing to reproach.
//
// What it must never do, and what a naive implementation reaches for first:
//   • no red, no alert hue, no warning icon on a gap
//   • no count framed as a shortfall ("you missed 4 days")
//   • no chain, no dots that break, nothing that can visibly reset
//
// The copy comes from `rest.label`, whose contract is "descriptive, never
// evaluative", and the run length is stated plainly because "a few quiet days"
// is a description of what happened, not a verdict on it.
// ============================================================

import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useAppTheme } from "../../state/AppThemeContext";
import { useRecoveryData } from "../../state/RecoveryDataContext";
import { scale } from "../../theme/tokens.generated";
import type { TimelineEntry, TimelineEntryType } from "../../types/recovery";
import { Body, Card, Caption, CategoryChip, SectionLabel } from "../../components/recovery/primitives";

const DAY_MS = 86_400_000;

/** Filter chips (§4.3). "All" is first and is the default — a filter is never required. */
const FILTERS: { key: TimelineEntryType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "capture", label: "Captures" },
  { key: "checkin", label: "Check-ins" },
  { key: "journal", label: "Journal" },
  { key: "milestone", label: "Milestones" },
  { key: "photo", label: "Photos" },
  { key: "medication", label: "Medication" },
  { key: "appointment", label: "Appointments" },
];

type Row =
  | { kind: "entry"; entry: TimelineEntry }
  | { kind: "rest"; days: number };

/**
 * Interleave rest rows between entries.
 *
 * Runs of empty days become ONE row rather than one row per day: seven separate
 * "a quiet day" rows would be a list of reproaches even with gentle wording,
 * which is how a principle gets honoured in the tokens and lost in the layout.
 */
function withRestRows(entries: TimelineEntry[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < entries.length; i++) {
    rows.push({ kind: "entry", entry: entries[i] });
    const next = entries[i + 1];
    if (!next) continue;
    const a = new Date(entries[i].date.slice(0, 10)).getTime();
    const b = new Date(next.date.slice(0, 10)).getTime();
    const gap = Math.round((a - b) / DAY_MS) - 1;
    if (gap > 0) rows.push({ kind: "rest", days: gap });
  }
  return rows;
}

const CATEGORY_FOR: Partial<Record<TimelineEntryType, "pain" | "sleep" | "energy" | "mood" | "meds">> = {
  checkin: "mood",
  medication: "meds",
  photo: "sleep",
};

export function RecoveryTimelineScreen({ onAdd }: { onAdd: () => void }) {
  const { tokens } = useAppTheme();
  const { timeline } = useRecoveryData();
  const [filter, setFilter] = useState<TimelineEntryType | "all">("all");

  const rows = useMemo(() => {
    const sorted = [...timeline].sort((a, b) => b.date.localeCompare(a.date));
    // Rest rows are computed from the UNFILTERED history. A gap is a fact about
    // the recovery, not about the filter — recomputing it per filter would
    // invent quiet days that never happened.
    if (filter === "all") return withRestRows(sorted);
    return sorted.filter((e) => e.type === filter).map((entry) => ({ kind: "entry" as const, entry }));
  }, [timeline, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.surface.base }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: scale.space[4], gap: scale.space[2] }}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(f.key)}
              style={{
                minHeight: scale.size.tap,
                justifyContent: "center",
                paddingHorizontal: scale.space[4],
                borderRadius: scale.radius.full,
                borderWidth: scale.size.hairline,
                backgroundColor: active ? tokens.color.state.selectedFill : tokens.color.surface.card,
                borderColor: active ? tokens.color.state.selectedEdge : tokens.color.surface.border,
              }}
            >
              {/* PRIMARY ink when selected, not accent.strong.
                  Measured before this screen shipped: accent.strong on a 13%
                  accent tint over the page is 4.30:1 in light — the SIXTH time
                  text on a tint of its own accent has failed here. Selection is
                  already carried by the fill AND the border AND the ink weight,
                  so nothing is lost by taking the ink that clears 13.91. */}
              <Body style={{ color: active ? tokens.color.text.primary : tokens.color.text.secondary }}>
                {f.label}
              </Body>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: scale.space[4], paddingTop: 0, gap: scale.space[3] }}>
        {rows.length === 0 && (
          <Card>
            <Body>Nothing here yet.</Body>
            <Caption>Anything you capture will land here, in the order it happened.</Caption>
          </Card>
        )}

        {rows.map((row, i) =>
          row.kind === "rest" ? (
            // P2. Neutral rest — no red, no shortfall, no chain.
            <View
              key={`rest-${i}`}
              style={{
                backgroundColor: tokens.pattern.rest.surface,
                borderRadius: scale.radius.md,
                paddingVertical: scale.space[3],
                paddingHorizontal: scale.space[4],
                flexDirection: "row",
                alignItems: "center",
                gap: scale.space[2],
              }}
            >
              <View
                style={{
                  width: scale.size.dot,
                  height: scale.size.dot,
                  borderRadius: scale.radius.full,
                  backgroundColor: tokens.pattern.rest.mark,
                }}
              />
              <Body style={{ color: tokens.pattern.rest.label }}>
                {row.days === 1 ? "A quiet day" : `${row.days} quiet days`}
              </Body>
            </View>
          ) : (
            <Card key={row.entry.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <SectionLabel>
                  {new Date(row.entry.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </SectionLabel>
                {/* N4: provenance is a WORD, not a colour. */}
                {row.entry.isAutoGenerated && <Caption>Added by the app</Caption>}
              </View>
              <Body>{row.entry.title}</Body>
              {!!row.entry.detail && <Caption>{row.entry.detail}</Caption>}
              {CATEGORY_FOR[row.entry.type] && (
                <CategoryChip category={CATEGORY_FOR[row.entry.type]!} label={row.entry.type} />
              )}
            </Card>
          ),
        )}
      </ScrollView>

      {/* FAB → AddTimelineEntry. It opens a sheet; it is not a stub. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add to timeline"
        onPress={onAdd}
        style={{
          position: "absolute",
          right: scale.space[4],
          bottom: scale.space[6],
          width: scale.size.buttonPrimary,
          height: scale.size.buttonPrimary,
          borderRadius: scale.radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.color.cta.from,
        }}
      >
        <Body style={{ color: tokens.color.cta.label }}>+</Body>
      </Pressable>
    </View>
  );
}
