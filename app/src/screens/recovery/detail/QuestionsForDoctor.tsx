// ============================================================
// SCREEN: QuestionsForDoctor (§4.10, N7)
//
// Catch the question at 2am, so it is still there at 10:15 on Thursday. The
// least glamorous screen in the product and one of the most useful: what people
// actually regret is walking out having forgotten to ask.
//
// It is also where the report's closing block comes from, which is why entries
// are plain text with a single answered flag and nothing more.
//
// STATES, derived from the list:
//   empty  nothing added yet. It explains what it is FOR — this screen is
//          reached before anyone has used it, so the empty state is the one most
//          people meet first, and an apology would be the wrong thing to meet.
//   list   questions exist. ANSWERED ONES STAY VISIBLE and struck through rather
//          than disappearing: at an appointment "already covered" is useful
//          information, and a list that shrinks as you work makes it hard to see
//          what you came in with.
//
// NOT states: saving, error, loading — local and optimistic like every capture
// path here. Not premium either: appointments are core loop (N7).
// ============================================================

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/RecoveryDataContext";
import { scale } from "../../../theme/tokens.generated";
import type { Appointment } from "../../../types/recovery";
import { DetailScreen, DetailButton, DetailCard } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

export function QuestionsForDoctor({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { tokens } = useAppTheme();
  const { addQuestion } = useRecoveryData();
  const [draft, setDraft] = useState("");
  const [answered, setAnswered] = useState<number[]>([]);

  function add() {
    // No-op on empty. Same contract as every other write in this product.
    if (!draft.trim()) return;
    addQuestion(appointment.id, draft);
    setDraft("");
  }

  return (
    <DetailScreen title="Questions for my doctor" onClose={onClose}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        returnKeyType="done"
        placeholder="Something you want to remember to ask"
        placeholderTextColor={tokens.color.text.muted}
        accessibilityLabel="New question"
        style={{
          minHeight: scale.size.buttonSecondary,
          borderRadius: scale.radius.md,
          borderWidth: scale.size.hairline,
          borderColor: tokens.color.surface.border,
          paddingHorizontal: scale.space[3],
          color: tokens.color.text.primary,
          fontSize: tokens.type.body.size,
        }}
      />
      <DetailButton label="Add" onPress={add} disabled={!draft.trim()} />

      {appointment.questions.length === 0 ? (
        <DetailCard>
          <Body>Nothing here yet.</Body>
          <Caption>
            Add a question whenever one occurs to you. They will be waiting on this screen, and in your doctor report,
            when the appointment comes round.
          </Caption>
        </DetailCard>
      ) : (
        appointment.questions.map((q, i) => {
          const done = answered.includes(i);
          return (
            <Pressable
              key={i}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => setAnswered((prev) => (done ? prev.filter((x) => x !== i) : [...prev, i]))}
            >
              <DetailCard>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: scale.space[2] }}>
                  {/* N4: the state is carried by a GLYPH and a line through the
                      text, never by colour alone. */}
                  <Text style={{ color: tokens.color.text.secondary }}>{done ? "✓" : "○"}</Text>
                  <Body
                    style={{
                      flex: 1,
                      // Answered questions STAY. Struck through, still readable.
                      textDecorationLine: done ? "line-through" : "none",
                      color: done ? tokens.color.text.secondary : tokens.color.text.primary,
                    }}
                  >
                    {q}
                  </Body>
                </View>
              </DetailCard>
            </Pressable>
          );
        })
      )}

      {appointment.questions.length > 0 && (
        <Caption>Answered questions stay on the list. Seeing what you came in with is the point.</Caption>
      )}
    </DetailScreen>
  );
}
