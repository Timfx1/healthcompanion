// ============================================================
// PATTERN: DetailScreen — the shell every Recovery Companion detail shares.
//
// The RN counterpart of `Onboarding Flow/src/components/patterns/DetailScreen`.
// The prototype grew this shell only after three screens had each hand-rolled
// the same header and drift had started; porting is the chance to have it from
// the first screen instead of the fourth.
//
// The `action` slot is deliberately narrow — ONE optional control on the right.
// A detail screen that needs a toolbar has stopped being a detail, and the
// shell should make that awkward rather than easy.
//
// It owns no colours of its own. The body sits on `surface.raised`, which is
// both a full-screen reading surface and a known backdrop for anything tinted
// that lands on it — the reason the contrast manifest can measure these screens
// at all.
// ============================================================

import { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAppTheme } from "../../state/AppThemeContext";
import { scale } from "../../theme/tokens.generated";
import { Body, Caption } from "./primitives";

export function DetailScreen({
  title, onClose, action, gap = 4, children,
}: {
  title: string;
  onClose: () => void;
  action?: ReactNode;
  /**
   * Vertical rhythm between body blocks. Three of the first four screens to
   * adopt the web shell wanted a different value — a reading surface breathes
   * differently from a list of red flags — so the shell asks rather than
   * assumes. Discovered by migrating, not by designing.
   */
  gap?: 3 | 4 | 5;
  children: ReactNode;
}) {
  const { tokens } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.surface.raised }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: scale.space[2],
          paddingHorizontal: scale.space[5],
          minHeight: scale.size.buttonPrimary,
          borderBottomWidth: scale.size.hairline,
          borderBottomColor: tokens.color.surface.border,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onClose}
          style={{ minWidth: scale.size.tap, minHeight: scale.size.tap, justifyContent: "center" }}
        >
          <Text style={{ color: tokens.color.text.secondary, fontSize: tokens.type.body.size }}>←</Text>
        </Pressable>
        <Text
          style={{
            flex: 1,
            color: tokens.color.text.primary,
            fontSize: tokens.type.body.size,
            lineHeight: tokens.type.body.lineHeight,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
        {action}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: scale.space[5],
          paddingTop: scale.space[4],
          paddingBottom: scale.space[8],
          gap: scale.space[gap],
        }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** A labelled block of body copy. */
export function DetailSection({ label, children }: { label: string; children: ReactNode }) {
  const { tokens } = useAppTheme();
  return (
    <View style={{ gap: scale.space[2] }}>
      <Text
        style={{
          color: tokens.color.text.secondary,
          fontSize: tokens.type.eyebrow.size,
          lineHeight: tokens.type.eyebrow.lineHeight,
          fontWeight: "600",
          letterSpacing: tokens.type.eyebrow.tracking,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

/** The standard neutral card these screens put content in. */
export function DetailCard({ children }: { children: ReactNode }) {
  const { tokens } = useAppTheme();
  return (
    <View
      style={{
        borderRadius: scale.radius["2xl"],
        paddingHorizontal: scale.space[4],
        paddingVertical: scale.space[3],
        gap: scale.space[2],
        backgroundColor: tokens.color.surface.card,
        borderWidth: scale.size.hairline,
        borderColor: tokens.color.surface.border,
      }}
    >
      {children}
    </View>
  );
}

/** Full-width secondary action. Primary actions use the CTA gradient instead. */
export function DetailButton({
  label, onPress, disabled = false,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { tokens } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: scale.size.buttonSecondary,
        borderRadius: scale.radius["2xl"],
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: disabled ? tokens.color.state.disabled : tokens.color.surface.card,
        borderWidth: scale.size.hairline,
        borderColor: tokens.color.surface.border,
      }}
    >
      <Text
        style={{
          color: disabled ? tokens.color.state.disabledText : tokens.color.text.primary,
          fontSize: tokens.type.buttonSecondary.size,
          lineHeight: tokens.type.buttonSecondary.lineHeight,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** An empty state that describes rather than reproaches. */
export function DetailEmpty({ headline, hint }: { headline: string; hint: string }) {
  return (
    <DetailCard>
      <Body>{headline}</Body>
      <Caption>{hint}</Caption>
    </DetailCard>
  );
}
