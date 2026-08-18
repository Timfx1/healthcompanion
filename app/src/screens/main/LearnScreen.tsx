import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { InfoCard } from "../../components/InfoCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { articles, learnCategories } from "../../data/mockRecoveryPlan";
import { useAppData } from "../../state/AppDataContext";
import { useAppTheme } from "../../state/AppThemeContext";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent } from "../../services/analytics/posthog";
import { spacing, typography } from "../../theme";

// Wait for typing to settle before recording a search, so one query is one event
// rather than one per keystroke.
const SEARCH_DEBOUNCE_MS = 800;
const MAX_TRACKED_QUERY_LENGTH = 60;

export function LearnScreen() {
  const navigation = useNavigation<any>();
  const { savedArticles, toggleArticleSaved } = useAppData();
  const { palette, tokens } = useAppTheme();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesQuery =
        !normalizedQuery ||
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.summary.toLowerCase().includes(normalizedQuery) ||
        article.source.toLowerCase().includes(normalizedQuery);
      const matchesCategory = !activeCategory || article.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, query]);

  // Records what people look for, so gaps in the article library show up as data
  // instead of guesses. `learn_search_no_results` is the content-gap signal —
  // those are the topics worth writing next.
  //
  // Consent is already handled upstream: trackEvent only reaches PostHog after
  // the user opts in on the consent screen (see posthog.ts).
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;

    const timer = setTimeout(() => {
      const properties = {
        query: trimmed.toLowerCase().slice(0, MAX_TRACKED_QUERY_LENGTH),
        resultCount: filteredArticles.length,
        activeCategory: activeCategory ?? undefined
      };
      trackEvent(AnalyticsEvents.learnSearched, properties);
      if (filteredArticles.length === 0) {
        trackEvent(AnalyticsEvents.learnSearchNoResults, properties);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, activeCategory, filteredArticles.length]);

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>Learn</Text>
      <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Ionicons name="search" size={20} color={palette.textSubtle} />
        <TextInput
          placeholder="Search ankle recovery"
          placeholderTextColor={palette.textSubtle}
          style={[styles.input, { color: palette.text }]}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Categories</Text>
      <View style={styles.chips}>
        {learnCategories.map((category) => {
          const active = activeCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(active ? null : category)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? tokens.color.accent.default : palette.surfaceRaised,
                  borderColor: active ? tokens.color.accent.default : palette.border
                }
              ]}
            >
              <Text style={[styles.chipText, { color: active ? palette.white : palette.text }]}>{category}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Articles</Text>
      <View style={styles.list}>
        {filteredArticles.map((article) => {
          const saved = savedArticles.includes(article.title);
          return (
            <InfoCard
              key={article.id}
              title={article.title}
              subtitle={saved ? `Saved · ${article.source}` : `${article.readingTime} · ${article.source}`}
              icon="document-text"
              onPress={() => navigation.navigate("ArticleDetail", { articleId: article.id })}
            >
              <Pressable onPress={() => toggleArticleSaved(article.title)} style={styles.saveRow}>
                <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={18} color={tokens.color.accent.default} />
                <Text style={[styles.saveText, { color: tokens.color.accent.strong }]}>{saved ? "Saved" : "Save article"}</Text>
              </Pressable>
            </InfoCard>
          );
        })}
        {filteredArticles.length === 0 ? (
          <Text style={[styles.empty, { color: palette.textMuted }]}>No articles match your search yet.</Text>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  search: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm
  },
  input: {
    flex: 1,
    ...typography.body
  },
  sectionTitle: {
    ...typography.h2
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipText: {
    ...typography.small
  },
  list: {
    gap: spacing.md
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  saveText: {
    ...typography.small,
    fontWeight: "700"
  },
  empty: {
    ...typography.body,
    textAlign: "center",
    paddingVertical: spacing.xl
  }
});
