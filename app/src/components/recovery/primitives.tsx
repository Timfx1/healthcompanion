// ============================================================
// FILE: components/recovery/primitives.tsx
//
// The small shared pieces the five Recovery Companion tabs are built from.
// They exist so the screens contain layout and copy and nothing else — every
// colour, radius, spacing and duration in here comes from `theme(mode)` and
// `scale`, so the literal ratchet stays at zero for new code rather than
// climbing by 103 the way the inherited RN screens did.
//
// MARK vs INK vs ONMARK is the distinction these enforce. It is the single most
// repeated defect in this codebase — five token families have shipped a `mark`
// used as text or as a meaningful stroke — so the primitives take a category
// and decide, rather than taking a colour and trusting the caller.
// ============================================================

import { ReactNode } from "react";
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

import { useAppTheme } from "../../state/AppThemeContext";
import { scale } from "../../theme/tokens.generated";

// ── Card ────────────────────────────────────────────────────────────────────

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { tokens } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tokens.color.surface.card,
          borderColor: tokens.color.surface.border,
          borderWidth: scale.size.hairline,
          borderRadius: scale.radius.lg,
          padding: scale.space[4],
          gap: scale.space[2],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── Type ────────────────────────────────────────────────────────────────────
//
// Hierarchy comes from SIZE and WEIGHT, never from lowering contrast. That is
// the standing rule, and it is the resolution four separate failures of
// secondary-weight text on an accent tint were each fixed into.

export function Title({ children }: { children: ReactNode }) {
  const { tokens } = useAppTheme();
  return <Text style={[role(tokens.type.title), { color: tokens.color.text.primary }]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const { tokens } = useAppTheme();
  return <Text style={[role(tokens.type.body), { color: tokens.color.text.primary }, style]}>{children}</Text>;
}

export function Caption({ children }: { children: ReactNode }) {
  const { tokens } = useAppTheme();
  return <Text style={[role(tokens.type.caption), { color: tokens.color.text.secondary }]}>{children}</Text>;
}

/** An uppercase section kicker. Small and tracked, so held to body contrast. */
export function SectionLabel({ children }: { children: ReactNode }) {
  const { tokens } = useAppTheme();
  return <Text style={[role(tokens.type.eyebrow), { color: tokens.color.text.secondary }]}>{children}</Text>;
}

// ── Buttons ─────────────────────────────────────────────────────────────────

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { tokens } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: scale.size.buttonSecondary,
        borderRadius: scale.radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: scale.space[4],
        backgroundColor: disabled ? tokens.color.state.disabled : tokens.color.cta.from,
      }}
    >
      <Text style={[role(tokens.type.buttonPrimary), { color: disabled ? tokens.color.state.disabledText : tokens.color.cta.label }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function QuietButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { tokens } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: scale.size.tap,
        borderRadius: scale.radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: scale.space[4],
        borderWidth: scale.size.hairline,
        borderColor: tokens.color.surface.border,
      }}
    >
      <Text style={[role(tokens.type.buttonSecondary), { color: tokens.color.accent.strong }]}>{label}</Text>
    </Pressable>
  );
}

// ── Accumulation counter (P2) ───────────────────────────────────────────────
//
// A count, never a chain. `accumulation.*` exists precisely so that no screen
// has to decide for itself whether a consistency figure is allowed to go down.
// This one cannot: it takes a total, not a run.

export function AccumulationPill({ count }: { count: number }) {
  const { tokens } = useAppTheme();
  const a = tokens.pattern.accumulation;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: scale.space[1],
        paddingHorizontal: scale.space[3],
        paddingVertical: scale.space[1],
        borderRadius: scale.radius.full,
        backgroundColor: a.counterFill,
        borderWidth: scale.size.hairline,
        borderColor: a.counterEdge,
      }}
    >
      <View style={{ width: scale.size.dot, height: scale.size.dot, borderRadius: scale.radius.full, backgroundColor: a.dotFilled }} />
      <Text style={[role(tokens.type.caption), { color: a.counterLabel }]}>
        {count} check-in{count === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

// ── Rest (P2) ───────────────────────────────────────────────────────────────
//
// A gap is neutral rest. Never red, never a count of what was skipped, and the
// copy is descriptive rather than evaluative — `rest.label`'s own contract.

export function RestRow({ days }: { days: number }) {
  const { tokens } = useAppTheme();
  const r = tokens.pattern.rest;
  return (
    <View
      style={{
        backgroundColor: r.surface,
        borderRadius: scale.radius.md,
        paddingVertical: scale.space[3],
        paddingHorizontal: scale.space[4],
        flexDirection: "row",
        alignItems: "center",
        gap: scale.space[2],
      }}
    >
      <View style={{ width: scale.size.dot, height: scale.size.dot, borderRadius: scale.radius.full, backgroundColor: r.mark }} />
      <Text style={[role(tokens.type.caption), { color: r.label }]}>
        {days === 1 ? "A quiet day" : `${days} quiet days`}
      </Text>
    </View>
  );
}

// ── Category chip ───────────────────────────────────────────────────────────
//
// Fill from `mark`, label from `ink`. N4: the chip always carries a WORD, so
// the hue is reinforcement and never the only thing saying what this is.

export type CategoryKey = "pain" | "sleep" | "energy" | "mood" | "meds";

export function CategoryChip({ category, label }: { category: CategoryKey; label: string }) {
  const { tokens } = useAppTheme();
  const c = tokens.color.category[category];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: scale.space[2],
        paddingVertical: scale.space[1],
        borderRadius: scale.radius.sm,
        backgroundColor: c.mark,
      }}
    >
      <Text style={[role(tokens.type.eyebrow), { color: c.onMark }]}>{label}</Text>
    </View>
  );
}

// ── Insight sentence (P4) ───────────────────────────────────────────────────
//
// "Never show a chart without a plain-language sentence above it." The trend
// vocabulary is improving / worsening / steady everywhere — screen, paper and
// report. The GLYPH carries direction and the WORD carries valence, so "pain
// down" and "sleep up" can both read as improving without the colour having to
// mean two opposite things.

export function InsightSentence({ text, trend }: { text: string; trend: "improving" | "worsening" | "steady" }) {
  const { tokens } = useAppTheme();
  const ink =
    trend === "improving" ? tokens.pattern.insight.improving
      : trend === "worsening" ? tokens.pattern.insight.worsening
        : tokens.pattern.insight.steady;
  const glyph = trend === "improving" ? "▲" : trend === "worsening" ? "▼" : "—";
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: scale.space[2] }}>
      <Text style={[role(tokens.type.insight), { color: ink }]}>{glyph}</Text>
      <Text style={[role(tokens.type.insight), { color: tokens.color.text.primary, flex: 1 }]}>{text}</Text>
    </View>
  );
}

// ── Type roles, not sizes ───────────────────────────────────────────────────
//
// Written first with six raw `fontSize` values, which the literal ratchet
// rejected on this file's first run — new code held to the same standard as
// old, which is the entire point of the ratchet being per tree.
//
// `type.*` carries size, weight, line height and tracking together, so a role
// is applied whole rather than reassembled by eye at each call site. RN wants
// `fontWeight` as a string, hence the cast; everything else transfers directly.
const role = (r: { size: number; weight: number; lineHeight: number; tracking: number }): TextStyle => ({
  fontSize: r.size,
  lineHeight: r.lineHeight,
  fontWeight: String(r.weight) as TextStyle["fontWeight"],
  letterSpacing: r.tracking,
});

