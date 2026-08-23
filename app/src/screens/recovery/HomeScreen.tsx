// ============================================================
// SCREEN: Home — the daily hub. Spec §5 "Main tabs → Home".
//
// Order on this screen is an argument about priorities, so it is written down:
//
//   1. Welcome-back card, only after an absence (P2)
//   2. Quick capture field (P1) — above the fold, above everything else,
//      because the Notes-app lane is the thing this product is betting on
//   3. Day-N card
//   4. Next appointment, with the pre-visit report nudge (§4.10)
//   5. Today's actions
//   6. Weekly give-back, when one is fresh (P7)
//   7. Generate report — free, unbadged, and reachable in ONE tap (P6, §10)
//
// N6 IS WHY THE REPORT ROW LOOKS PLAIN. No lock badge, no premium chip, no
// "upgrade to export". The audit that produced `restricted.mjs`'s N6 rule found
// the report gated or sold in ten places, two of which had been photographed
// into baselines and passed review. The rule now fails the build; this screen
// is written to the rule.
// ============================================================

import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { useAppTheme } from "../../state/AppThemeContext";
import { useRecoveryData } from "../../state/RecoveryDataContext";
import { scale } from "../../theme/tokens.generated";
import { dayNumber } from "../../types/recovery";
import {
  AccumulationPill, Body, Card, Caption, InsightSentence, PrimaryButton, SectionLabel, Title,
} from "../../components/recovery/primitives";

const DAY_MS = 86_400_000;

export function RecoveryHomeScreen({
  onOpenCheckIn, onOpenReport, onOpenWeekly, onOpenAppointment,
}: {
  onOpenCheckIn: () => void;
  onOpenReport: () => void;
  onOpenWeekly: () => void;
  onOpenAppointment: () => void;
}) {
  const { tokens } = useAppTheme();
  const { journey, timeline, appointments, reflections, isWelcomeBack, addCapture } = useRecoveryData();
  const [text, setText] = useState("");

  const day = dayNumber(journey.startDate);
  const checkIns = timeline.filter((e) => e.type === "checkin").length;
  const nextAppointment = appointments
    .filter((a) => new Date(a.date).getTime() > Date.now())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const daysUntil = nextAppointment
    ? Math.ceil((new Date(nextAppointment.date).getTime() - Date.now()) / DAY_MS)
    : undefined;
  const freshReflection = reflections[0];

  function save() {
    // No-op on empty rather than a refusal. P1: nothing on the capture path
    // may fail, and there is nothing here to apologise for.
    addCapture(text);
    setText("");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.color.surface.base }}
      contentContainerStyle={{ padding: scale.space[4], gap: scale.space[4] }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Title>Alex</Title>
        <AccumulationPill count={checkIns} />
      </View>

      {/* P2. One warm line, no recap, no count of what was missed — the card is
          given no duration and so cannot render one. When it shows, the
          time-of-day greeting is suppressed so there is only ONE warm line. */}
      {isWelcomeBack && (
        <View
          style={{
            backgroundColor: tokens.pattern.welcomeBack.surface,
            borderColor: tokens.pattern.welcomeBack.edge,
            borderWidth: scale.size.hairline,
            borderRadius: scale.radius.lg,
            paddingVertical: scale.space[3],
            paddingHorizontal: scale.space[4],
          }}
        >
          <Body style={{ color: tokens.pattern.welcomeBack.message }}>
            Good to see you again. Pick up wherever you like.
          </Body>
        </View>
      )}

      {/* P1: THE NOTES-APP LANE. One line, one save, no required fields, no
          categorisation decision. Tagging happens silently after the write. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: scale.space[2],
          backgroundColor: tokens.pattern.capture.field,
          borderColor: tokens.pattern.capture.edge,
          borderWidth: scale.size.hairline,
          borderRadius: scale.radius.md,
          paddingHorizontal: scale.space[3],
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={save}
          returnKeyType="done"
          placeholder="Note anything… ('knee hurt after stairs')"
          placeholderTextColor={tokens.pattern.capture.placeholder}
          accessibilityLabel="Quick capture"
          style={{
            flex: 1,
            minHeight: scale.size.buttonSecondary,
            color: tokens.color.text.primary,
            fontSize: tokens.type.body.size,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save capture"
          onPress={save}
          style={{
            width: scale.size.control,
            height: scale.size.control,
            borderRadius: scale.radius.full,
            alignItems: "center",
            justifyContent: "center",
            // The fill IS the save affordance appearing. It is declared as a
            // load-bearing pair rather than exempted as decoration.
            backgroundColor: text.trim() ? tokens.pattern.capture.actionReady : tokens.pattern.capture.actionIdle,
          }}
        >
          <Text style={{ color: text.trim() ? tokens.color.text.onAccent : tokens.color.text.secondary }}>✓</Text>
        </Pressable>
      </View>

      {/* Day-N card. Both gradient stops are tokens; light mirrors dark rather
          than reusing it, which is what fixed a 1.58:1 at the top of this card. */}
      <View
        style={{
          backgroundColor: tokens.pattern.dayCard.to,
          borderRadius: scale.radius.lg,
          padding: scale.space[4],
          gap: scale.space[1],
        }}
      >
        <SectionLabel>YOUR RECOVERY</SectionLabel>
        <Text
          style={{
            fontSize: tokens.type.display.size,
            lineHeight: tokens.type.display.lineHeight,
            fontWeight: "700",
            color: tokens.pattern.dayCard.primary,
          }}
        >
          Day {day}
        </Text>
        <Caption>
          {journey.label} · Started {new Date(journey.startDate).toLocaleDateString()}
        </Caption>
      </View>

      {/* §4.10 pre-appointment nudge. A question, never an instruction. */}
      {nextAppointment && daysUntil !== undefined && daysUntil <= 7 && (
        <Pressable accessibilityRole="button" onPress={onOpenAppointment}>
          <Card>
            <SectionLabel>NEXT APPOINTMENT</SectionLabel>
            <Body>
              {daysUntil <= 1 ? "Appointment tomorrow" : `Appointment in ${daysUntil} days`}
              {nextAppointment.clinician ? ` · ${nextAppointment.clinician}` : ""}
            </Body>
            <Caption>Review your report before you go?</Caption>
          </Card>
        </Pressable>
      )}

      <View style={{ gap: scale.space[2] }}>
        <SectionLabel>TODAY</SectionLabel>
        <Card>
          <Body>Daily check-in</Body>
          <Caption>One tap is a complete check-in. The rest is optional.</Caption>
          <PrimaryButton label="Check in" onPress={onOpenCheckIn} />
        </Card>
      </View>

      {/* P7. Delivered unprompted, dismissible, and never a demand. */}
      {freshReflection && (
        <Pressable accessibilityRole="button" onPress={onOpenWeekly}>
          <Card>
            <SectionLabel>YOUR WEEK</SectionLabel>
            <InsightSentence text={freshReflection.noticedDetail} trend="improving" />
            <Caption>Tap to read the rest</Caption>
          </Card>
        </Pressable>
      )}

      {/* P6 / N6. Free forever: no badge, no gate, no upsell, one tap. */}
      <Card>
        <SectionLabel>DOCTOR REPORT</SectionLabel>
        <Body>A summary of what has changed, ready to show your clinician.</Body>
        <Caption>Always free.</Caption>
        <PrimaryButton label="Generate report" onPress={onOpenReport} />
      </Card>
    </ScrollView>
  );
}
