// ============================================================
// SCREEN: QuickCaptureSheet — the Notes-app lane as a sheet (§4.2, P1)
//
// Capture anything in under ten seconds with zero categorisation decisions.
// Open, type, done. The app files it on the timeline itself.
//
// The persistent field on Home is the zero-tap version; this is the version
// reachable from anywhere — the FAB, and the reserved `recoverycompanion://
// capture` deep link — with room for more than one line.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATE vs RENDERING VARIANT
//
// STATES, all derived from the TEXT. Nothing sets them:
//   empty   nothing typed. The save action is idle and pressing it is a NO-OP,
//           not a refusal. Nothing to save is not an error.
//   ready   text present, no keywords recognised. THE NORMAL CASE — which is
//           why an empty tag row renders nothing at all rather than "no tags".
//   tagged  text present, keywords recognised. Chips appear silently and are
//           editable later; they never gate the save.
//
// EXPLICITLY NOT STATES, and each absence is a decision:
//   saving  — the write is optimistic and local. A spinner would be a lie about
//             what it costs.
//   error   — the capture path CANNOT fail (P1). Same reason the confirmation
//             toast has no failure branch: there is nothing to apologise for.
//             Contrast the report's export, which genuinely can fail.
//   offline — local-first; there is nothing to be offline from.
//   premium — capture is core loop, free forever (N7). No locked variant.
// ============================================================

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/recoveryContext";
import { scale } from "../../../theme/tokens.generated";
import { detectTags, TAG_LABEL } from "../../../data/captureTags";
import { DetailScreen } from "../../../components/recovery/DetailScreen";
import { Caption, CategoryChip } from "../../../components/recovery/primitives";

export function QuickCaptureSheet({ onClose }: { onClose: () => void }) {
  const { tokens } = useAppTheme();
  const { addCapture } = useRecoveryData();
  const [text, setText] = useState("");

  const tags = detectTags(text);
  const ready = text.trim().length > 0;

  function save() {
    // No-op on empty rather than a refusal. The path never scolds.
    if (!ready) return;
    addCapture(text.trim());
    setText("");
    onClose();
  }

  return (
    <DetailScreen
      title="Quick capture"
      onClose={onClose}
      action={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save capture"
          accessibilityState={{ disabled: !ready }}
          onPress={save}
          style={{
            width: scale.size.control,
            height: scale.size.control,
            borderRadius: scale.radius.full,
            alignItems: "center",
            justifyContent: "center",
            // The fill IS the affordance appearing, so it is measured as
            // load-bearing rather than exempted as decoration.
            backgroundColor: ready ? tokens.pattern.capture.actionReady : tokens.pattern.capture.actionIdle,
          }}
        >
          <Text style={{ color: ready ? tokens.color.text.onAccent : tokens.color.text.secondary }}>✓</Text>
        </Pressable>
      }
    >
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        placeholder="Anything at all. 'knee hurt after stairs today'"
        placeholderTextColor={tokens.pattern.capture.placeholder}
        accessibilityLabel="Capture text"
        style={{
          minHeight: scale.size.shellHeight / scale.space[6],
          borderRadius: scale.radius.md,
          borderWidth: scale.size.hairline,
          borderColor: tokens.pattern.capture.edge,
          backgroundColor: tokens.pattern.capture.field,
          padding: scale.space[3],
          color: tokens.color.text.primary,
          fontSize: tokens.type.body.size,
          lineHeight: tokens.type.body.lineHeight,
          textAlignVertical: "top",
        }}
      />

      {/* The `tagged` state. When nothing is recognised this renders NOTHING —
          not an empty row, not "no tags". The normal capture has no tags and
          must not be made to look deficient for it. */}
      {tags.length > 0 && (
        <View style={{ gap: scale.space[2] }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: scale.space[2] }}>
            {tags.map((tag) => (
              <CategoryChip key={tag} category={tag} label={TAG_LABEL[tag]} />
            ))}
          </View>
          <Caption>Filed automatically. You can change these later.</Caption>
        </View>
      )}

      <Caption>No fields, no categories, nothing required. Saved to your timeline as you wrote it.</Caption>
    </DetailScreen>
  );
}
