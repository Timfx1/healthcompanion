import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PremiumLockCard } from "../../components/PremiumLockCard";
import { exercises } from "../../data/mockRecoveryPlan";
import { trackerConfigs } from "../../data/trackerCheckIns";
import { useAppData } from "../../state/AppDataContext";
import { AppPalette, useAppTheme } from "../../state/AppThemeContext";
import { painStep } from "../../theme/tokens.generated";
import { useOnboarding } from "../../state/OnboardingContext";
import { usePremium } from "../../hooks/usePremium";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackButtonClick, trackEvent } from "../../services/analytics/posthog";
import { exportRecoveryReport } from "../../services/report/exportReport";
import {
  HIGHER_IS_BETTER,
  Insight,
  Tone,
  TRACKER_ORDER,
  buildProgression,
  buildProgressInsights
} from "../../utils/recoveryInsights";
import { spacing, typography } from "../../theme";

// The pain ramp comes from the design system's painScale, which is mode-paired
// and split mark/ink — a numeral is text and needs ink, a chart bar is a fill
// and needs mark. The version this replaces hardcoded green/amber/red, which
// put the RESERVED safety hue on a high pain score: a "bad" data point, which
// N3 forbids in almost exactly those words.

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ReportsScreen() {
  const { palette, tokens, mode } = useAppTheme();
  const { painEntries, trackerCheckIns, completedExerciseIds, exerciseCompletions, profile } = useAppData();
  const { state: onboarding } = useOnboarding();
  const { locked } = usePremium();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!locked) trackEvent(AnalyticsEvents.insightsViewed, { checkIns: painEntries.length + trackerCheckIns.length });
  }, [locked]);

  // Exportable recovery reports are a Premium feature. Free users still keep every
  // check-in they logged — they just see an upsell here until they upgrade.
  if (locked) {
    return (
      <ScreenContainer>
        <Text style={[styles.title, { color: palette.text }]}>Recovery report</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>
          A shareable summary of your healing journey — pain trends, mobility, and adherence in one place.
        </Text>
        <View style={{ marginTop: spacing.md }}>
          <PremiumLockCard
            title="Unlock your recovery report"
            subtitle="Turn your check-ins into a clear, exportable summary you can share with a clinician."
            benefits={[
              "Pain trend over time",
              "Mobility & strength progress",
              "Exercise adherence",
              "Clinician-ready summary"
            ]}
            sourceScreen="Reports"
          />
        </View>
      </ScreenContainer>
    );
  }

  const hasData = painEntries.length > 0 || trackerCheckIns.length > 0;

  const painChrono = [...painEntries].reverse(); // oldest -> newest
  const latestPain = painEntries[0]?.pain;
  const firstPain = painChrono[0]?.pain;
  const avgPain = painEntries.length
    ? Math.round((painEntries.reduce((sum, entry) => sum + entry.pain, 0) / painEntries.length) * 10) / 10
    : undefined;
  const painChange =
    latestPain !== undefined && firstPain !== undefined && painEntries.length > 1 ? latestPain - firstPain : undefined;

  const timestamps = [...painEntries, ...trackerCheckIns].map((entry) => new Date(entry.createdAt).getTime());
  const daysTracking = timestamps.length
    ? Math.max(1, Math.round((Date.now() - Math.min(...timestamps)) / 86_400_000) + 1)
    : 0;
  const totalCheckIns = painEntries.length + trackerCheckIns.length;
  const completedCount = completedExerciseIds.length;
  const totalExercises = exercises.length;

  // All the analysis comes from the shared pure module, so Reports, the Plan tab,
  // Readiness and the exported PDF can never disagree about the same numbers.
  const insights = buildProgressInsights(painEntries, trackerCheckIns, exerciseCompletions);
  const progression = buildProgression(painEntries, trackerCheckIns, completedExerciseIds, onboarding.injuryTiming);

  const exportReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    trackButtonClick("Export report", "Reports");
    try {
      await exportRecoveryReport({
        displayName: profile.displayName,
        injuryType: onboarding.injuryType,
        phaseLabel: progression.phase.label,
        painEntries,
        trackerCheckIns,
        exerciseCompletions,
        completedExerciseIds,
        insights
      });
      trackEvent(AnalyticsEvents.reportExported, { checkIns: totalCheckIns, insights: insights.length });
    } catch (error) {
      trackEvent(AnalyticsEvents.reportExportFailed);
      Alert.alert(
        "Could not create the PDF",
        error instanceof Error ? error.message : "Something went wrong while building your report. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const headline =
    painChange !== undefined && painChange < 0
      ? "Your pain is trending down — keep it up."
      : painChange !== undefined && painChange > 0
        ? "Pain ticked up recently. Keep resting and monitoring it."
        : hasData
          ? "You're building a steady recovery record."
          : "";

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>Recovery report</Text>
      <Text style={[styles.subtitle, { color: palette.textMuted }]}>A summary of your healing journey so far.</Text>

      {!hasData ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
          <Ionicons name="bar-chart-outline" size={34} color={tokens.color.accent.default} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No check-ins yet</Text>
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            Log a pain check-in or a swelling, walking, range-of-motion, or balance review on the Track tab. Your
            progress report builds itself from there.
          </Text>
        </View>
      ) : (
        <>
          <AppButton
            label={isExporting ? "Building PDF..." : "Export report as PDF"}
            icon="download"
            disabled={isExporting}
            onPress={exportReport}
          />

          <View style={[styles.headlineCard, { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default }]}>
            <Text style={[styles.headlineLabel, { color: tokens.color.accent.strong }]}>{progression.phase.label}</Text>
            <Text style={[styles.headlineText, { color: palette.text }]}>{headline}</Text>
          </View>

          {insights.length > 0 ? (
            <View style={styles.insightList}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Insights</Text>
              {insights.map((insight) => (
                <InsightCard key={insight.id} palette={palette} insight={insight} />
              ))}
            </View>
          ) : null}

          <View style={styles.statRow}>
            <StatTile palette={palette} value={`${daysTracking}`} label={daysTracking === 1 ? "day tracked" : "days tracked"} />
            <StatTile palette={palette} value={`${totalCheckIns}`} label="check-ins" />
            <StatTile palette={palette} value={`${completedCount}/${totalExercises}`} label="exercises" />
          </View>

          {painEntries.length > 0 ? (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: palette.text }]}>Pain trend</Text>
                {painChange !== undefined ? (
                  <TrendBadge
                    palette={palette}
                    tone={painChange < 0 ? "good" : painChange > 0 ? "bad" : "neutral"}
                    label={
                      painChange < 0
                        ? `Down ${Math.abs(painChange)}`
                        : painChange > 0
                          ? `Up ${painChange}`
                          : "Steady"
                    }
                  />
                ) : null}
              </View>

              <View style={styles.painTopRow}>
                <View>
                  <Text style={[styles.bigValue, { color: painStep(mode, latestPain ?? 0).ink }]}>
                    {latestPain}
                    <Text style={[styles.bigValueUnit, { color: palette.textMuted }]}> /10</Text>
                  </Text>
                  <Text style={[styles.metaText, { color: palette.textMuted }]}>latest pain</Text>
                </View>
                {avgPain !== undefined ? (
                  <View style={styles.painAvg}>
                    <Text style={[styles.avgValue, { color: palette.text }]}>{avgPain}</Text>
                    <Text style={[styles.metaText, { color: palette.textMuted }]}>average</Text>
                  </View>
                ) : null}
              </View>

              <PainSparkline palette={palette} entries={painChrono.slice(-14)} />
              <Text style={[styles.metaText, { color: palette.textMuted }]}>
                {painEntries.length} check-in{painEntries.length === 1 ? "" : "s"} · {formatDate(painChrono[0].createdAt)} →{" "}
                {formatDate(painEntries[0].createdAt)}
              </Text>
            </View>
          ) : null}

          {trackerCheckIns.length > 0 ? (
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
              <Text style={[styles.cardTitle, { color: palette.text }]}>Mobility & strength</Text>
              {TRACKER_ORDER.map((key) => {
                const entries = trackerCheckIns.filter((entry) => entry.key === key);
                if (entries.length === 0) return null;
                const latest = entries[0];
                const earliest = entries[entries.length - 1];
                const delta = latest.value - earliest.value;
                const improving = HIGHER_IS_BETTER[key] ? delta > 0 : delta < 0;
                const tone: Tone = entries.length < 2 || delta === 0 ? "neutral" : improving ? "good" : "bad";
                const config = trackerConfigs[key];
                return (
                  <View key={key} style={[styles.trackerRow, { borderTopColor: palette.borderSoft }]}>
                    <View style={[styles.trackerIcon, { backgroundColor: tokens.color.accent.surface }]}>
                      <Ionicons name={config.icon} size={18} color={tokens.color.accent.default} />
                    </View>
                    <View style={styles.trackerCopy}>
                      <Text style={[styles.trackerTitle, { color: palette.text }]}>{config.title}</Text>
                      <Text style={[styles.metaText, { color: palette.textMuted }]}>
                        Now: {latest.label} · {entries.length} log{entries.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <TrendBadge
                      palette={palette}
                      tone={tone}
                      label={tone === "good" ? "Improving" : tone === "bad" ? "Watch" : "Steady"}
                    />
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Exercise adherence</Text>
            <Text style={[styles.metaText, { color: palette.textMuted }]}>
              {completedCount} of {totalExercises} exercises marked complete
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: tokens.color.accent.default,
                    width: `${totalExercises ? (completedCount / totalExercises) * 100 : 0}%`
                  }
                ]}
              />
            </View>
          </View>

          <View style={[styles.disclaimer, { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default }]}>
            <Ionicons name="shield-checkmark" size={20} color={tokens.color.accent.default} />
            <Text style={[styles.disclaimerText, { color: palette.textMuted }]}>
              This summary is for your own tracking and education — it is not a medical assessment. Share it with a
              clinician if you have concerns.
            </Text>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function StatTile({ palette, value, label }: { palette: AppPalette; value: string; label: string }) {
  return (
    <View style={[styles.statTile, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

function TrendBadge({ palette, tone, label }: { palette: AppPalette; tone: Tone; label: string }) {
  const { tokens } = useAppTheme();
  const color = tone === "good" ? tokens.pattern.insight.trendUp : tone === "bad" ? tokens.pattern.insight.trendDown : tokens.pattern.insight.trendFlat;
  const bg = tone === "neutral" ? palette.surfaceMuted : tokens.color.accent.surface;
  const icon = tone === "good" ? "arrow-down" : tone === "bad" ? "arrow-up" : "remove";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// Dumb renderer: every insight is built in `recoveryInsights.ts`, so this only
// picks colours from the tone and draws.
function InsightCard({ palette, insight }: { palette: AppPalette; insight: Insight }) {
  const { tokens } = useAppTheme();
  const accent =
    insight.tone === "good" ? tokens.pattern.insight.trendUp : insight.tone === "bad" ? tokens.pattern.insight.trendDown : tokens.color.accent.default;
  const accentSoft = tokens.color.accent.surface;

  return (
    <View style={[styles.insightCard, { backgroundColor: palette.surface, borderColor: palette.borderSoft }]}>
      <View style={[styles.insightIcon, { backgroundColor: accentSoft }]}>
        <Ionicons name={insight.icon} size={18} color={accent} />
      </View>
      <View style={styles.insightCopy}>
        <Text style={[styles.insightHeadline, { color: palette.text }]}>{insight.headline}</Text>
        <Text style={[styles.insightDetail, { color: palette.textMuted }]}>{insight.detail}</Text>
      </View>
    </View>
  );
}

function PainSparkline({ palette, entries }: { palette: AppPalette; entries: { id: string; pain: number }[] }) {
  const { mode } = useAppTheme();
  return (
    <View style={styles.sparkline}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.sparkColumn}>
          <View
            style={[
              styles.sparkBar,
              {
                backgroundColor: painStep(mode, entry.pain).mark,
                height: `${Math.max(8, (entry.pain / 10) * 100)}%`
              }
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  subtitle: {
    ...typography.body
  },
  empty: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm
  },
  emptyTitle: {
    ...typography.h3
  },
  emptyText: {
    ...typography.small,
    textAlign: "center"
  },
  headlineCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs
  },
  sectionTitle: {
    ...typography.h3
  },
  insightList: {
    gap: spacing.sm
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  insightCopy: {
    flex: 1,
    gap: spacing.xs
  },
  insightHeadline: {
    ...typography.bodyStrong
  },
  insightDetail: {
    ...typography.small
  },
  headlineLabel: {
    ...typography.small,
    fontWeight: "700"
  },
  headlineText: {
    ...typography.h3
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  statTile: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs
  },
  statValue: {
    ...typography.h2
  },
  statLabel: {
    ...typography.tiny,
    textAlign: "center"
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cardTitle: {
    ...typography.h3
  },
  painTopRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between"
  },
  bigValue: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800"
  },
  bigValueUnit: {
    ...typography.body,
    fontWeight: "600"
  },
  avgValue: {
    ...typography.h1
  },
  painAvg: {
    alignItems: "flex-end"
  },
  metaText: {
    ...typography.small
  },
  sparkline: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 96,
    gap: 4
  },
  sparkColumn: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end"
  },
  sparkBar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 6
  },
  trackerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1
  },
  trackerIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  trackerCopy: {
    flex: 1
  },
  trackerTitle: {
    ...typography.bodyStrong
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  badgeText: {
    ...typography.tiny,
    fontWeight: "700"
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  disclaimer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start"
  },
  disclaimerText: {
    ...typography.small,
    flex: 1
  }
});
