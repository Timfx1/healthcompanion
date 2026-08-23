// ============================================================
// SCREEN: AddTimelineEntry — the FAB sheet (§4.3, N7)
//
// What the Timeline's FAB opens. Six ways into the timeline, one tap each.
//
// CAPTURE IS FIRST AND IS SHAPED DIFFERENTLY FROM THE REST. P1 says there must
// always be a path that takes under ten seconds with no categorisation
// decision — and a menu of six categories is, by construction, a
// categorisation decision. So the capture row sits above the list, on the
// accent tint, as the way OUT of the menu rather than an item in it. Everything
// below it is the slower, structured lane for when somebody wants it.
//
// N4: every row carries an icon AND a label, so the category colour is
// reinforcement rather than the carrier.
//
// N7: every destination here is core loop and free forever. No row takes a lock
// badge, and this file is registered as a core-loop surface in restricted.mjs.
// ============================================================

import { Pressable, Text, View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { scale } from "../../../theme/tokens.generated";
import { DetailScreen } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";
import type { CaptureTag } from "../../../data/captureTags";

export type EntryKind = "capture" | "note" | "photo" | "milestone" | "medication" | "appointment";

const ROWS: { kind: EntryKind; icon: string; label: string; hint: string; category: CaptureTag }[] = [
  { kind: "note", icon: "📓", label: "Journal entry", hint: "A longer write-up", category: "mood" },
  { kind: "photo", icon: "📷", label: "Photo", hint: "Stays on your device", category: "pain" },
  { kind: "milestone", icon: "🎉", label: "Milestone", hint: "Something worth remembering", category: "energy" },
  { kind: "medication", icon: "💊", label: "Medication", hint: "Taken, skipped or changed", category: "meds" },
  { kind: "appointment", icon: "📅", label: "Appointment", hint: "Past or upcoming", category: "sleep" },
];

export function AddTimelineEntry({ onClose, onPick }: { onClose: () => void; onPick: (kind: EntryKind) => void }) {
  const { tokens } = useAppTheme();

  return (
    <DetailScreen title="Add to timeline" onClose={onClose} gap={3}>
      {/* THE FAST WAY OUT OF THIS MENU. On the accent tint, above the list, and
          reachable without reading any of it.
          The hint takes PRIMARY ink at a smaller size, not secondary ink:
          text.secondary on this 13% tint measures 4.49:1 over a card and 4.23
          over the page, and hierarchy here comes from size and weight instead.
          That is the same resolution six separate failures converged on. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => onPick("capture")}
        style={{
          borderRadius: scale.radius.lg,
          padding: scale.space[4],
          gap: scale.space[1],
          backgroundColor: tokens.color.accent.surface,
          borderWidth: scale.size.hairline,
          borderColor: tokens.color.accent.edge,
        }}
      >
        <Body>✍️  Just write something</Body>
        <Text
          style={{
            color: tokens.color.text.primary,
            fontSize: tokens.type.caption.size,
            lineHeight: tokens.type.caption.lineHeight,
          }}
        >
          One line, no questions. Ten seconds.
        </Text>
      </Pressable>

      <Caption>Or file it as something specific:</Caption>

      {ROWS.map((row) => {
        const c = tokens.color.category[row.category];
        return (
          <Pressable
            key={row.kind}
            accessibilityRole="button"
            onPress={() => onPick(row.kind)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: scale.space[3],
              minHeight: scale.size.rowStandard,
              paddingHorizontal: scale.space[4],
              paddingVertical: scale.space[2],
              borderRadius: scale.radius.md,
              backgroundColor: tokens.color.surface.card,
              borderWidth: scale.size.hairline,
              borderColor: tokens.color.surface.border,
            }}
          >
            <View
              style={{
                width: scale.size.iconTile,
                height: scale.size.iconTile,
                borderRadius: scale.radius.sm,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.mark,
              }}
            >
              <Text>{row.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Body>{row.label}</Body>
              <Caption>{row.hint}</Caption>
            </View>
          </Pressable>
        );
      })}
    </DetailScreen>
  );
}
