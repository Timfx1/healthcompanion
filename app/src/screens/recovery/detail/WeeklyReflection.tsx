// ============================================================
// SCREEN: WeeklyReflection — the weekly give-back (§4.13, P7, N7)
//
// "Once a week, unprompted, the app hands the user meaning." The reward for
// logging is BEING NOTICED, not points — so this screen's whole job is to say
// something specific that the app could only know because the person wrote it
// down, and then get out of the way.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATES, derived from stored data:
//   fresh    a reflection exists and has not been replied to.
//   replied  the user wrote something back. It is shown, because a reply that
//            vanishes is worse than no reply box at all.
//   none     no reflection this week. NOT an empty state to apologise for —
//            the give-back is the app's obligation, not the user's, so a week
//            without one is the app having nothing to say.
//
// THE REPLY PERSISTS. That is the claim this screen makes that a screenshot
// cannot check, and it is the one the web prototype's behaviour suite was
// written for: `saveReflectionReply` writes to AsyncStorage, and an empty save
// is a no-op rather than a refusal.
//
// N7 — the give-back is core loop and free forever. Nothing here is gated, and
// there is no "unlock more insights" anywhere in this file.
// ============================================================

import { useState } from "react";
import { TextInput, View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/RecoveryDataContext";
import { scale } from "../../../theme/tokens.generated";
import { DetailScreen, DetailButton, DetailCard, DetailSection } from "../../../components/recovery/DetailScreen";
import { Body, Caption, InsightSentence } from "../../../components/recovery/primitives";

export function WeeklyReflectionScreen({ onClose }: { onClose: () => void }) {
  const { tokens } = useAppTheme();
  const { reflections, saveReflectionReply } = useRecoveryData();
  const reflection = reflections[0];
  const [draft, setDraft] = useState("");

  if (!reflection) {
    return (
      <DetailScreen title="Your week" onClose={onClose}>
        <DetailCard>
          <Body>Nothing from this week yet.</Body>
          <Caption>
            These arrive on their own when there is something worth pointing out. Nothing is expected from you in
            the meantime.
          </Caption>
        </DetailCard>
      </DetailScreen>
    );
  }

  function save() {
    // No-op on empty. Nothing to apologise for.
    if (!draft.trim()) return;
    saveReflectionReply(reflection.weekStart, draft);
    setDraft("");
  }

  return (
    <DetailScreen title="Your week" onClose={onClose}>
      <DetailSection label="WHAT WE NOTICED">
        {/* The specific detail comes FIRST. A comparison table above it would
            make this a report; the point is that somebody was paying attention. */}
        <DetailCard>
          <Body>{reflection.noticedDetail}</Body>
        </DetailCard>
      </DetailSection>

      <DetailSection label="COMPARED TO LAST WEEK">
        {reflection.comparison.map((c, i) => (
          <InsightSentence
            key={i}
            text={c.text}
            // The stored direction is raw; the VOCABULARY is improving /
            // worsening / steady everywhere in this product. `flat` is steady,
            // and for pain a downward move is an improvement — direction alone
            // has no valence, which is exactly why the word carries it.
            trend={c.direction === "flat" ? "steady" : c.metric === "Pain" ? (c.direction === "down" ? "improving" : "worsening") : (c.direction === "up" ? "improving" : "worsening")}
          />
        ))}
      </DetailSection>

      <Body>{reflection.encouragement}</Body>

      {reflection.reply ? (
        <DetailSection label="WHAT YOU SAID">
          <DetailCard>
            <Body>{reflection.reply}</Body>
          </DetailCard>
        </DetailSection>
      ) : (
        <View style={{ gap: scale.space[2] }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder="Optional — how did the week feel?"
            placeholderTextColor={tokens.color.text.muted}
            accessibilityLabel="Reply to this reflection"
            style={{
              minHeight: scale.size.rowStandard,
              borderRadius: scale.radius.md,
              borderWidth: scale.size.hairline,
              borderColor: tokens.color.surface.border,
              padding: scale.space[3],
              color: tokens.color.text.primary,
              fontSize: tokens.type.body.size,
              lineHeight: tokens.type.body.lineHeight,
              textAlignVertical: "top",
            }}
          />
          <DetailButton label="Save" onPress={save} disabled={!draft.trim()} />
          <Caption>Optional, like everything else here.</Caption>
        </View>
      )}
    </DetailScreen>
  );
}
