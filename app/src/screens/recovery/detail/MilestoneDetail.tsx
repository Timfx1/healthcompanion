// ============================================================
// SCREEN: MilestoneDetail (§4.14, P8, N7)
//
// Give a milestone somewhere to live, and OFFER — never push — the share card.
// P8 is explicit that sharing is the honest growth loop precisely because it is
// user-initiated: "no share nags".
//
// STATE. This screen has ONE, and that is deliberate rather than unexamined.
// What looks like a second is not: a milestone is either auto-generated
// (Day 7/30/100) or promoted from a journal entry, and it either carries a note
// or does not — but both are CONDITIONAL CONTENT inside the same state. The
// screen does not change shape, only what it has to show.
//
// No loading state, no error state, no entitlement state: milestones are core
// loop and free forever (N7), and this file is registered as a core-loop
// surface in restricted.mjs.
//
// WHAT IS NOT HERE, on purpose: any count of milestones, any "next milestone"
// target, any progress bar toward one. N1 and N5 both forbid it — a milestone
// is something that HAPPENED, never a goal somebody can fall behind.
//
// The preview card mirrors the share artifact's palette so the share screen is
// not a surprise. `share.*` is the family that owns that look, and it is
// mode-invariant by contract because the artifact leaves the app.
// ============================================================

import { Text, View } from "react-native";

import { shortDate } from "../../../rules";

import { useAppTheme } from "../../../state/AppThemeContext";
import { scale } from "../../../theme/tokens.generated";
import type { Milestone } from "../../../types/recovery";
import { DetailScreen, DetailButton } from "../../../components/recovery/DetailScreen";
import { Caption } from "../../../components/recovery/primitives";

export function MilestoneDetail({
  milestone, dayN, onClose, onShare,
}: {
  milestone: Milestone;
  dayN: number;
  onClose: () => void;
  onShare: () => void;
}) {
  const { tokens } = useAppTheme();
  const SH = tokens.pattern.share;

  return (
    <DetailScreen title="Milestone" onClose={onClose}>
      <View
        style={{
          borderRadius: scale.radius["2xl"],
          paddingHorizontal: scale.space[5],
          paddingVertical: scale.space[6],
          alignItems: "center",
          gap: scale.space[2],
          backgroundColor: SH.cardFrom,
        }}
      >
        <Text style={{ fontSize: tokens.type.title.size }}>{milestone.emoji ?? "🎉"}</Text>
        <Text
          style={{
            color: SH.title,
            fontSize: tokens.type.title.size,
            lineHeight: tokens.type.title.lineHeight,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {milestone.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: scale.space[2] }}>
          <Text style={{ color: SH.title, fontSize: tokens.type.caption.size, fontWeight: "700" }}>Day {dayN}</Text>
          <Text style={{ color: SH.meta, fontSize: tokens.type.caption.size }}>
            · {shortDate(milestone.date)}
          </Text>
        </View>
      </View>

      {/* OFFERED, never pushed. One control, no badge, no nag, and nothing
          that appears on its own. */}
      <DetailButton label="Create share card" onPress={onShare} />
      <Caption>Sharing is always your choice. The app never posts anything or prompts you to.</Caption>
    </DetailScreen>
  );
}
