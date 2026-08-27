// ============================================================
// SCREEN: Safety — "when should I contact my doctor?" (§4.8, §10, N3, N7)
//
// THE TIERS ARE THE DESIGN. A flat list of warnings makes "call an ambulance"
// and "mention it next time" look identical, so the reader has to triage for
// themselves at exactly the moment they are least able to. Three tiers, in
// descending urgency, each stating what to DO rather than what it might be.
//
// N3 IS APPLIED WITHIN THIS SCREEN, not merely to it. The reserved hue is on
// tiers 1 and 2 — genuine red flags — and NOT on tier 3, which is routine. A
// screen that owns the alert colour is the easiest place in the product to
// start crying wolf with it.
//
// N4: urgency is carried by the HEADING and the ACTION LINE, not by the hue. A
// reader who cannot distinguish the colours still gets the triage, because the
// words do the work and the colour agrees with them.
//
// No item names a condition. "Calf pain with swelling" is an observation the
// reader can make; "this could be a DVT" is a diagnosis, which this app does not
// make and is not licensed to (§10).
//
// N7 — safety content is free forever and is on §9's list by name. It is also
// the single worst surface in the product to gate, which is why it is
// registered as a core-loop surface in restricted.mjs.
// ============================================================

import { View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { scale } from "../../../theme/tokens.generated";
import { NEEDS_CLINICAL_REVIEW, TIERS } from "../../../data/safetyContent";
import { DetailScreen, DetailCard } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

export function SafetyScreen({ onClose }: { onClose: () => void }) {
  const { tokens } = useAppTheme();

  return (
    <DetailScreen title="When to contact a doctor" onClose={onClose} gap={5}>
      {TIERS.map((tier) => {
        // N3: the reserved hue on the two genuine red-flag tiers only.
        const urgent = tier.urgency !== "routine";
        return (
          <View key={tier.urgency} style={{ gap: scale.space[2] }}>
            <Body style={{ color: urgent ? tokens.color.safety.ink : tokens.color.text.primary, fontWeight: "700" }}>
              {tier.heading}
            </Body>
            <Caption>{tier.action}</Caption>

            {tier.items.map((item, i) => (
              <View
                key={i}
                style={{
                  borderRadius: scale.radius.md,
                  paddingHorizontal: scale.space[4],
                  paddingVertical: scale.space[3],
                  gap: scale.space[1],
                  backgroundColor: urgent ? tokens.color.safety.surface : tokens.color.surface.card,
                  borderWidth: scale.size.hairline,
                  // Load-bearing on the urgent tiers: with the words in neutral
                  // ink, the edge and the fill are what mark a row as a red flag
                  // rather than a note.
                  borderColor: urgent ? tokens.color.safety.mark : tokens.color.surface.border,
                }}
              >
                {/* The WORDS take primary ink even on the safety tint. Guidance
                    somebody has to act on stays maximally readable; the hue is
                    carried by the fill and the edge. safety.ink over its own
                    tint measures 4.00–4.24 and fails, which is the same trap the
                    report's red-flag callout hit. */}
                <Body>{item.text}</Body>
                <Caption>{item.source}</Caption>
              </View>
            ))}
          </View>
        );
      })}

      <DetailCard>
        <Body>This is general information, not advice about you.</Body>
        <Caption>
          Healthcompanion does not diagnose anything. If you are worried about a symptom, contact a clinician —
          including when it is not on this list.
        </Caption>
        {NEEDS_CLINICAL_REVIEW && (
          <Caption>
            NEEDS CLINICAL REVIEW — this content is placeholder and has not been reviewed by a clinician.
          </Caption>
        )}
      </DetailCard>
    </DetailScreen>
  );
}
