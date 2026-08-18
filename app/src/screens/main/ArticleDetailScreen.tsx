import { StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { articles } from "../../data/mockRecoveryPlan";
import { MainStackParamList } from "../../navigation/types";
import { spacing, typography } from "../../theme";
import { useAppTheme } from "../../state/AppThemeContext";
import { useAppData } from "../../state/AppDataContext";

export function ArticleDetailScreen() {
  const route = useRoute<RouteProp<MainStackParamList, "ArticleDetail">>();
  const { palette, tokens } = useAppTheme();
  const { savedArticles, toggleArticleSaved } = useAppData();
  const article = articles.find((item) => item.id === route.params.articleId) ?? articles[0];
  const saved = savedArticles.includes(article.title);

  return (
    <ScreenContainer>
      <Text style={[styles.category, { color: tokens.color.accent.strong }]}>{article.category}</Text>
      <Text style={[styles.title, { color: palette.text }]}>{article.title}</Text>
      <Text style={[styles.meta, { color: palette.textMuted }]}>
        {article.readingTime} · {article.source}
      </Text>

      <View style={styles.body}>
        {article.body.map((paragraph) => (
          <Text key={paragraph} style={[styles.paragraph, { color: palette.text }]}>
            {paragraph}
          </Text>
        ))}
      </View>

      <AppButton
        label={`Read the full article on ${article.source}`}
        icon="open-outline"
        onPress={() => WebBrowser.openBrowserAsync(article.url)}
      />

      <View style={[styles.disclaimer, { backgroundColor: tokens.color.accent.surface, borderColor: tokens.color.accent.default }]}>
        <Text style={[styles.disclaimerText, { color: palette.textMuted }]}>
          This summary is general education, not medical advice. The full article opens on {article.source}. If your
          symptoms are severe or getting worse, see a clinician.
        </Text>
      </View>

      <AppButton
        label={saved ? "Saved" : "Save article"}
        variant="secondary"
        icon={saved ? "bookmark" : "bookmark-outline"}
        onPress={() => toggleArticleSaved(article.title)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  category: {
    ...typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  title: {
    ...typography.h1
  },
  meta: {
    ...typography.small
  },
  body: {
    gap: spacing.lg
  },
  paragraph: {
    ...typography.body
  },
  disclaimer: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg
  },
  disclaimerText: {
    ...typography.small
  }
});
