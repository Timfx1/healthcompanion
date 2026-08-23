// ============================================================
// SCREEN: ShareCardPreview (§4.14, P8, C7)
//
// Reached ONLY by tapping "Create share card" on a milestone. Never
// auto-prompted, never suggested, never surfaced on its own.
//
// THE CARD IS `share.*` AND NOTHING ELSE. That is a rule, not a preference: the
// artifact LEAVES THE APP, and its recipient never sees the sender's colour
// mode, so every value on it is mode-invariant by contract. Mixing in a
// mode-paired family is the exact bug the manifest records against the Day-N
// pill, which measured 2.65:1 in light when it used `accumulation.counterLabel`
// — a dark lavender on a dark card.
//
// The web version of this screen is why `share.*` shipped the Day-N card's
// 1.58:1 bug undetected: it hardcoded `#fff` and never rendered the tokens it
// was declared for. This one renders them from the first line.
//
// The share ACTION is a Phase 2 integration (`expo-sharing` / view-shot per §7).
// The button is wired to a handler that says so; it is not a dead control with
// no `onPress`, which is a distinction this codebase has paid for twice.
// ============================================================

import { Alert, Text, View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { scale } from "../../../theme/tokens.generated";
import { DetailScreen, DetailButton } from "../../../components/recovery/DetailScreen";
import { Caption } from "../../../components/recovery/primitives";

const CARD_WIDTH = 280;

export function ShareCardPreview({
  title, dayN, date, onClose,
}: {
  title: string;
  dayN: number;
  date: string;
  onClose: () => void;
}) {
  const { tokens } = useAppTheme();
  const SH = tokens.pattern.share;
  const A = tokens.pattern.accumulation;

  return (
    <DetailScreen title="Share milestone" onClose={onClose}>
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: CARD_WIDTH,
            // Height from `share.aspectRatio`, so the 9:16 story ratio is a
            // token the design system owns rather than a second literal.
            height: Math.round(CARD_WIDTH / SH.aspectRatio),
            borderRadius: scale.radius["2xl"],
            borderWidth: scale.size.hairline,
            borderColor: SH.edge,
            backgroundColor: SH.cardFrom,
            paddingHorizontal: scale.space[6],
            paddingTop: scale.space[10],
            paddingBottom: scale.space[8],
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* A watermark by contract. The milestone is the subject. */}
          <Text
            style={{
              color: SH.brandmark,
              fontSize: tokens.type.eyebrow.size,
              letterSpacing: tokens.type.eyebrow.tracking,
              fontWeight: "700",
            }}
          >
            RECOVERY COMPANION
          </Text>

          <View style={{ alignItems: "center", gap: scale.space[3] }}>
            <Text style={{ fontSize: tokens.type.display.size }}>🎉</Text>
            <Text
              style={{
                color: SH.title,
                fontSize: tokens.type.title.size,
                lineHeight: tokens.type.title.lineHeight,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: scale.space[2] }}>
              {/* P2: an accumulation pill, never a streak. The LABEL is
                  share.title and not counterLabel — counterLabel is mode-PAIRED
                  and this card is not. The fills are the accent at a fixed
                  alpha, so they are safe here. */}
              <View
                style={{
                  paddingHorizontal: scale.space[3],
                  paddingVertical: scale.space[1],
                  borderRadius: scale.radius.full,
                  backgroundColor: A.counterFill,
                  borderWidth: scale.size.hairline,
                  borderColor: A.counterEdge,
                }}
              >
                <Text style={{ color: SH.title, fontSize: tokens.type.caption.size, fontWeight: "700" }}>
                  Day {dayN}
                </Text>
              </View>
              <Text style={{ color: SH.meta, fontSize: tokens.type.caption.size }}>{date}</Text>
            </View>
          </View>

          <Text
            style={{
              color: SH.meta,
              fontSize: tokens.type.caption.size,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            &ldquo;This app remembers my recovery so I don&rsquo;t have to.&rdquo;
          </Text>
        </View>
      </View>

      <DetailButton
        label="Share"
        onPress={() =>
          Alert.alert(
            "Not wired yet",
            "The OS share sheet is a Phase 2 integration (expo-sharing + view-shot, §7). The card above is the real render.",
          )
        }
      />
      <Caption>Share is always your choice — we never prompt automatically.</Caption>
    </DetailScreen>
  );
}
