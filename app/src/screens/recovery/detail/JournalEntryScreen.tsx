// ============================================================
// SCREEN: JournalEntry — the Recovery Journal (§4.5, N7)
//
// Room to write more than one line, when the user wants it. Quick capture is
// the ten-second lane; this is the one for the evening somebody actually wants
// to say something.
//
// It is called the Recovery Journal and NEVER a Diary. That is a product
// decision from §4.5, not a synonym: "diary" carries an obligation to keep it
// up, and this product is not allowed to imply one.
//
// STATES, derived from the entry and the draft — nothing sets them:
//   composing  a new entry. Save is inert until there is text, and pressing it
//              empty is a NO-OP rather than a refusal — the same contract as
//              capture, for the same reason.
//   reading    an existing entry. The actions are edit and promote.
//   promoted   already a milestone. Promotion is ONE-WAY and the control says
//              so rather than vanishing, because a control that disappears
//              leaves somebody wondering whether they imagined it.
//
// NOT states: saving and error. Journal writes are local and optimistic like
// every capture path here (P1). No spinner, nothing to fail.
//
// N7 — journal is core loop, free forever. No `locked` prop anywhere in this
// file, and it is registered as a core-loop surface in restricted.mjs.
// ============================================================

import { useState } from "react";
import { TextInput } from "react-native";

import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/RecoveryDataContext";
import { scale } from "../../../theme/tokens.generated";
import type { TimelineEntry } from "../../../types/recovery";
import { journalStateOf } from "../../../rules";
import { DetailScreen, DetailButton, DetailCard, DetailSection } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

export function JournalEntryScreen({
  entry, onClose,
}: {
  entry?: TimelineEntry;
  onClose: () => void;
}) {
  const { tokens } = useAppTheme();
  const { addJournal, promoteToMilestone, milestones } = useRecoveryData();

  const state = journalStateOf(entry, milestones);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [text, setText] = useState(entry?.detail ?? "");
  const canSave = text.trim().length > 0 || title.trim().length > 0;

  function save() {
    // No-op when there is nothing to save. Nothing to apologise for.
    if (!canSave) return;
    addJournal(title, text);
    onClose();
  }

  if (state === "composing") {
    return (
      <DetailScreen title="Recovery journal" onClose={onClose}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Give it a name (optional)"
          placeholderTextColor={tokens.color.text.muted}
          accessibilityLabel="Journal title"
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
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          placeholder="However much or little you feel like writing."
          placeholderTextColor={tokens.color.text.muted}
          accessibilityLabel="Journal text"
          style={{
            minHeight: scale.size.shellHeight / scale.space[4],
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
        <DetailButton label="Save to timeline" onPress={save} disabled={!canSave} />
        <Caption>Nothing here is required, and there is no schedule to keep.</Caption>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen title="Recovery journal" onClose={onClose}>
      <DetailSection label={new Date(entry!.date).toLocaleDateString()}>
        <DetailCard>
          <Body>{entry!.title}</Body>
          {!!entry!.detail && <Caption>{entry!.detail}</Caption>}
        </DetailCard>
      </DetailSection>

      {state === "promoted" ? (
        <>
          {/* The control STAYS, disabled, and says why. Promotion is one-way;
              a button that silently vanished would read as a bug. */}
          <DetailButton label="Already a milestone" disabled />
          <Caption>Promoting is one-way. The journal entry stays exactly where it is either way.</Caption>
        </>
      ) : (
        <>
          <DetailButton label="Make this a milestone" onPress={() => { promoteToMilestone(entry!.id); onClose(); }} />
          <Caption>This adds a milestone. It does not move or delete what you wrote.</Caption>
        </>
      )}
    </DetailScreen>
  );
}
