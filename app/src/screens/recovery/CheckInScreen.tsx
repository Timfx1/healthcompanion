// ============================================================
// SCREEN: Check-in — the retention engine (§4.4). Spec §5, centre tab.
//
// TWO LAYERS, ONE SCREEN, AND THE ORDER IS THE WHOLE DESIGN.
//
// P3: "The core check-in fast path is ≤10 seconds and typing-free: one tap on
// Better / Same / Worse logs a valid check-in; the fuller sliders/toggles are
// an optional second layer."
//
// So the fast path is the largest, first-rendered element on this screen — the
// design criteria say so explicitly — and tapping one of the three buttons
// SAVES AND LEAVES. It does not open the detail layer, it does not ask "add
// more?", it does not wait for a confirm. The moment a fast path needs a second
// tap to commit, it has stopped being a fast path and has become step one of a
// form.
//
// The detail layer is collapsed by default and is opened by an explicit,
// separate action. Everything in it is optional; nothing in it can block a
// save, because the save has already happened by the time anybody gets there.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT IS DELIBERATELY ABSENT
//
//   • No streak, no chain, no "don't break it" (N1/N2, P2).
//   • No red for "worse". Worse is honest information about a body, not a
//     failure by a person — it takes the category hue like the others, and the
//     WORD carries the meaning (N4).
//   • No score, no percentage, no grade of any kind.
// ============================================================

import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { useAppTheme } from "../../state/AppThemeContext";
import { useRecoveryData } from "../../state/recoveryContext";
import { painStep, scale } from "../../theme/tokens.generated";
import type { QuickAnswer, ThreeLevel } from "../../types/recovery";
import { Body, Card, Caption, PrimaryButton, QuietButton, SectionLabel, Title } from "../../components/recovery/primitives";

const OPTIONS: { key: QuickAnswer; label: string; descriptor: string }[] = [
  { key: "better", label: "Better", descriptor: "than yesterday" },
  { key: "same", label: "Same", descriptor: "as yesterday" },
  { key: "worse", label: "Worse", descriptor: "than yesterday" },
];

export function RecoveryCheckInScreen({ onDone }: { onDone: () => void }) {
  const { mode, tokens } = useAppTheme();
  const { addCheckIn } = useRecoveryData();

  const [choice, setChoice] = useState<QuickAnswer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pain, setPain] = useState<number | undefined>();
  const [sleep, setSleep] = useState<ThreeLevel | undefined>();
  const [note, setNote] = useState("");

  /**
   * THE FAST PATH. One tap: saves, confirms briefly, leaves.
   *
   * The confirmation is ~600ms per §4.4 and is not a dialog — nothing here
   * requires acknowledging. If the user wants to add detail they can, from the
   * link below, and the entry is already safely written either way.
   */
  function tapFastPath(key: QuickAnswer) {
    setChoice(key);
    addCheckIn(key);
    // ~600ms, per §4.4. Taken from `motion.celebrate` rather than typed as a
    // number: that role IS 600ms with a gentle spring, which is exactly what
    // this moment is. Inventing a `confirmation` duration would have added a
    // token for a value the system already had a name for.
    setTimeout(onDone, tokens.motion.celebrate.duration);
  }

  function saveDetail() {
    if (!choice) return;
    addCheckIn(choice, {
      pain,
      sleep,
      note: note.trim() || undefined,
    });
    onDone();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.color.surface.base }}
      contentContainerStyle={{ padding: scale.space[4], gap: scale.space[5] }}
    >
      {/* LAYER ONE — largest, first, typing-free. */}
      <View style={{ gap: scale.space[3] }}>
        <Title>How{"’"}s today?</Title>
        <Caption>One tap is a complete check-in.</Caption>

        <View style={{ flexDirection: "row", gap: scale.space[2] }}>
          {OPTIONS.map((o) => {
            const fp = tokens.pattern.fastPath[o.key];
            const selected = choice === o.key;
            return (
              <Pressable
                key={o.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => tapFastPath(o.key)}
                style={{
                  flex: 1,
                  minHeight: scale.size.buttonPrimary,
                  borderRadius: scale.radius.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: scale.space[1],
                  paddingVertical: scale.space[4],
                  backgroundColor: selected ? fp.selectedFill : tokens.pattern.fastPath.optionFill,
                  borderWidth: scale.size.hairline,
                  borderColor: selected ? fp.mark : tokens.color.surface.border,
                }}
              >
                {/* The MARK is a dot; the label is INK. A mark used as text is
                    the single most repeated defect in this codebase. */}
                <View
                  style={{
                    width: scale.size.dot,
                    height: scale.size.dot,
                    borderRadius: scale.radius.full,
                    backgroundColor: fp.mark,
                  }}
                />
                <Text
                  style={{
                    fontSize: tokens.type.buttonPrimary.size,
                    lineHeight: tokens.type.buttonPrimary.lineHeight,
                    fontWeight: "600",
                    color: fp.ink,
                  }}
                >
                  {o.label}
                </Text>
                <Caption>{o.descriptor}</Caption>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* LAYER TWO — optional, collapsed, and it cannot block anything. */}
      {!detailOpen ? (
        <QuietButton label="Add more detail (optional)" onPress={() => setDetailOpen(true)} />
      ) : (
        <Card>
          <SectionLabel>OPTIONAL</SectionLabel>
          <Caption>Nothing here is required. Skip anything that does not apply.</Caption>

          {/* PAIN 0-10.
              THE NUMERAL IS NOT ON THE SWATCH, and that is a token decision
              rather than a layout preference. `painScale.N` supplies `mark`
              and `ink` and NO `onMark` — the system has no declared colour for
              text sitting on a pain fill, so there is no honest way to write on
              one. Putting a numeral there anyway is precisely the mark-as-text
              mistake five token families have already shipped.

              So the mark is a BAR and the numeral sits below it in text ink,
              which also means the number is always legible regardless of the
              hue behind it (N4: never meaning by colour alone). Selection is
              carried by `state.selectedFill/Edge`, the roles that exist for it. */}
          <Body>Pain today</Body>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: scale.space[1] }}>
            {Array.from({ length: 11 }, (_, n) => {
              const step = painStep(mode, n);
              const on = pain === n;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`Pain ${n}`}
                  accessibilityState={{ selected: on }}
                  onPress={() => setPain(on ? undefined : n)}
                  style={{
                    width: scale.size.control,
                    minHeight: scale.size.tap,
                    borderRadius: scale.radius.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: scale.space[1],
                    paddingVertical: scale.space[1],
                    backgroundColor: on ? tokens.color.state.selectedFill : tokens.color.surface.raised,
                    borderWidth: scale.size.hairline,
                    borderColor: on ? tokens.color.state.selectedEdge : tokens.color.surface.border,
                  }}
                >
                  <View
                    style={{
                      width: scale.size.glyph,
                      height: scale.size.hairlineThick * 2,
                      borderRadius: scale.radius.full,
                      backgroundColor: step.mark,
                    }}
                  />
                  <Text style={{ color: on ? tokens.color.text.primary : tokens.color.text.secondary, fontSize: tokens.type.caption.size }}>
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Body>Sleep</Body>
          <View style={{ flexDirection: "row", gap: scale.space[2] }}>
            {([1, 2, 3] as ThreeLevel[]).map((lvl) => {
              const on = sleep === lvl;
              return (
                <Pressable
                  key={lvl}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setSleep(on ? undefined : lvl)}
                  style={{
                    flex: 1,
                    minHeight: scale.size.tap,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: scale.radius.md,
                    backgroundColor: on ? tokens.color.state.selectedFill : tokens.color.surface.raised,
                    borderWidth: scale.size.hairline,
                    borderColor: on ? tokens.color.state.selectedEdge : tokens.color.surface.border,
                  }}
                >
                  <Body>{lvl === 1 ? "Poor" : lvl === 2 ? "OK" : "Good"}</Body>
                </Pressable>
              );
            })}
          </View>

          <Body>Anything else</Body>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Optional"
            placeholderTextColor={tokens.color.text.muted}
            style={{
              minHeight: scale.size.rowStandard,
              borderRadius: scale.radius.md,
              borderWidth: scale.size.hairline,
              borderColor: tokens.color.surface.border,
              padding: scale.space[3],
              color: tokens.color.text.primary,
              fontSize: tokens.type.body.size,
            }}
          />

          <PrimaryButton label="Save check-in" onPress={saveDetail} disabled={!choice} />
          {!choice && <Caption>Pick Better, Same or Worse above first — that is the whole check-in.</Caption>}
        </Card>
      )}
    </ScrollView>
  );
}
