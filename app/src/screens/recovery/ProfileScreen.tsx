// ============================================================
// SCREEN: Profile — the hub for everything that is not the daily loop.
// Spec §5: "account, recoveries, meds, appointments, education, reports
// history, premium status row, settings, disclaimer, theme".
//
// N6 APPLIES HERE MORE THAN ANYWHERE. Profile is where a "reports history" row
// sits next to a "premium status" row, and it is the single easiest place in
// the product to accidentally imply the report is part of what you are paying
// for. The audit that produced the N6 rule found the report gated or sold in
// ten places; a premium row and a reports row on one list is how the eleventh
// would happen.
//
// So the reports row says "Always free" in words, on the row, and the premium
// row lists what premium actually is — depth, not the report. `restricted.mjs`
// enforces both halves: a report surface may not reference a gating symbol, and
// a premium-offer surface may not name the report.
//
// The medical disclaimer is permanent and is not a dismissible notice (§10).
// ============================================================

import { Pressable, ScrollView, Switch, View } from "react-native";

import { useAppTheme } from "../../state/AppThemeContext";
import { useRecoveryData } from "../../state/recoveryContext";
import { scale } from "../../theme/tokens.generated";
import { dayNumber } from "../../types/recovery";
import { Body, Card, Caption, SectionLabel, Title } from "../../components/recovery/primitives";

function Row({ label, hint, onPress }: { label: string; hint?: string; onPress: () => void }) {
  const { tokens } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: scale.size.rowStandard,
        justifyContent: "center",
        paddingVertical: scale.space[2],
        paddingHorizontal: scale.space[4],
        borderRadius: scale.radius.md,
        backgroundColor: tokens.color.surface.card,
        borderWidth: scale.size.hairline,
        borderColor: tokens.color.surface.border,
        gap: scale.space[1],
      }}
    >
      <Body>{label}</Body>
      {!!hint && <Caption>{hint}</Caption>}
    </Pressable>
  );
}

export function RecoveryProfileScreen({
  onOpenMedications, onOpenAppointments, onOpenEducation, onOpenSafety, onOpenReport, onOpenPremium,
}: {
  onOpenMedications: () => void;
  onOpenAppointments: () => void;
  onOpenEducation: () => void;
  onOpenSafety: () => void;
  onOpenReport: () => void;
  onOpenPremium: () => void;
}) {
  const { tokens, mode, setMode } = useAppTheme();
  const { journey, medications, appointments } = useRecoveryData();
  const day = dayNumber(journey.startDate);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.color.surface.base }}
      contentContainerStyle={{ padding: scale.space[4], gap: scale.space[4] }}
    >
      <Title>Alex</Title>

      <Card>
        <SectionLabel>YOUR RECOVERY</SectionLabel>
        <Body>{journey.label} · Day {day}</Body>
        <Caption>{journey.condition}</Caption>
        {!!journey.goal && <Caption>Goal: {journey.goal}</Caption>}
      </Card>

      <View style={{ gap: scale.space[2] }}>
        <SectionLabel>YOUR RECORDS</SectionLabel>
        {/* P6/N6: free forever, said in words on the row itself. No badge, no
            lock, no "upgrade to export". */}
        <Row label="Doctor report" hint="Always free. Ready to show your clinician." onPress={onOpenReport} />
        <Row label="Medications" hint={`${medications.length} tracked`} onPress={onOpenMedications} />
        <Row label="Appointments" hint={`${appointments.length} on record`} onPress={onOpenAppointments} />
      </View>

      <View style={{ gap: scale.space[2] }}>
        <SectionLabel>LEARN</SectionLabel>
        <Row label="Recovery education" hint="What is normal, and what is not" onPress={onOpenEducation} />
        {/* N3: the reserved hue lives here, and the row carries a WORD as well,
            so the meaning never rests on the colour alone. */}
        <Row label="When to contact a doctor" hint="Red-flag guidance" onPress={onOpenSafety} />
      </View>

      <View style={{ gap: scale.space[2] }}>
        <SectionLabel>SETTINGS</SectionLabel>
        <View
          style={{
            minHeight: scale.size.rowStandard,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: scale.space[4],
            borderRadius: scale.radius.md,
            backgroundColor: tokens.color.surface.card,
            borderWidth: scale.size.hairline,
            borderColor: tokens.color.surface.border,
          }}
        >
          <Body>Dark mode</Body>
          <Switch
            value={mode === "dark"}
            onValueChange={(on) => setMode(on ? "dark" : "light")}
            accessibilityLabel="Dark mode"
          />
        </View>
      </View>

      {/* Premium. Depth only, and the report is deliberately not named here —
          N6 rule B fails the build if it ever is. */}
      <Card>
        <SectionLabel>PREMIUM</SectionLabel>
        <Body>Deeper insight, photo comparison, full history and multiple recoveries.</Body>
        <Caption>Everything in your daily loop stays free.</Caption>
        <Pressable accessibilityRole="button" onPress={onOpenPremium} style={{ minHeight: scale.size.tap, justifyContent: "center" }}>
          <Body style={{ color: tokens.color.accent.strong }}>See what is included</Body>
        </Pressable>
      </Card>

      {/* §10: permanent, not dismissible. */}
      <Caption>
        Recovery Health Companion is not a medical device and does not diagnose, treat or cure anything. Ranges shown in the
        app describe common experiences, not a schedule. Always speak to a qualified clinician about your own recovery.
      </Caption>
      <Caption>Your entries stay on this device.</Caption>
    </ScrollView>
  );
}
