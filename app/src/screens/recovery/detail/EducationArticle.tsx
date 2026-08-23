// ============================================================
// SCREEN: EducationArticle (§4.8, P9, §9)
//
// Answer "what is normal" with something evidence-based and short, attributed
// to a source the reader could check, framed as common experience rather than a
// judgement about them (§10).
//
// ─────────────────────────────────────────────────────────────────────────────
// ACCESS, derived from the article's tier and the entitlement — never set:
//   free            the article in full. Everything answering "what is normal"
//                   is free forever, which is the half of §9 that matters at 2am.
//   deepDiveLocked  a premium deep dive, without premium. The real opening
//                   paragraph is VISIBLE and the gate is a soft fade plus a
//                   pill — value before the gate, never a blank wall, never a
//                   modal interrupt.
//   deepDiveOpen    the same article with premium held.
//
// SAVED is orthogonal to access, exactly as the report's export state is
// orthogonal to its depth.
//
// WHY THIS SCREEN MAY GATE AND THE REPORT MAY NOT. P9 puts education deep-dives
// on the premium list by name and the doctor report on the free-forever list by
// name. The distinction is not about effort or value — it is that the report is
// the thing somebody needs in a consulting room, and a deep dive is something
// they can want without needing.
// ============================================================

import { Linking, View } from "react-native";

import { useAppData } from "../../../state/AppDataContext";
import { useAppTheme } from "../../../state/AppThemeContext";
import { scale } from "../../../theme/tokens.generated";
import { ARTICLES, NEEDS_CLINICAL_REVIEW, type Article } from "../../../data/educationContent";
import { DetailScreen, DetailButton, DetailCard, DetailSection } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

export type ArticleAccess = "free" | "deepDiveLocked" | "deepDiveOpen";

export function accessOf(article: Article, isPremium: boolean): ArticleAccess {
  if (article.tier === "free") return "free";
  return isPremium ? "deepDiveOpen" : "deepDiveLocked";
}

export function EducationArticle({
  articleId, onClose, onUnlock,
}: {
  articleId: string;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const { tokens } = useAppTheme();
  const { isPremium, savedArticles, toggleArticleSaved } = useAppData();

  const article = ARTICLES.find((a) => a.id === articleId);
  if (!article) {
    // An article with no body is a CONTENT BUG, not a state — but a missing id
    // is a routing bug, and the screen should say so rather than render blank.
    return (
      <DetailScreen title="Article" onClose={onClose}>
        <DetailCard>
          <Body>That article is not available.</Body>
        </DetailCard>
      </DetailScreen>
    );
  }

  const access = accessOf(article, isPremium);
  const saved = savedArticles.includes(article.title);
  const locked = access === "deepDiveLocked";

  return (
    <DetailScreen
      title={article.category}
      onClose={onClose}
      action={
        <DetailButton
          // N4: saved state carries a GLYPH and a word, so colour is never the
          // only channel.
          label={saved ? "★ Saved" : "☆ Save"}
          onPress={() => toggleArticleSaved(article.title)}
        />
      }
      gap={5}
    >
      <View style={{ gap: scale.space[1] }}>
        <Body style={{ fontWeight: "700" }}>{article.title}</Body>
        <Caption>{article.readingTime}</Caption>
      </View>

      <Body>{article.summary}</Body>

      {/* VALUE BEFORE THE GATE. On a deep dive the first paragraph is the REAL
          first paragraph, not a teaser written to be withheld. */}
      {locked ? (
        <>
          <Body>{article.body[0]}</Body>
          {!!article.deepDiveHook && (
            <DetailCard>
              <Body>{article.deepDiveHook}</Body>
            </DetailCard>
          )}
          {/* A soft pill, inline on the surface — never a wall, never a modal.
              The pill was once nested inside an accent card, which tinted its
              backdrop twice and measured 4.28 dark / 3.95 light: a failure
              invented by the layout rather than by the tokens. */}
          <View
            style={{
              alignSelf: "flex-start",
              borderRadius: scale.radius.full,
              paddingHorizontal: scale.space[4],
              paddingVertical: scale.space[2],
              backgroundColor: tokens.pattern.historyFade.pillFill,
              borderWidth: scale.size.hairline,
              borderColor: tokens.pattern.historyFade.pillEdge,
            }}
          >
            <Body style={{ color: tokens.pattern.historyFade.pillLabel }}>Read the full deep dive</Body>
          </View>
          <DetailButton label="See what is included" onPress={onUnlock} />
          <Caption>Everything answering &ldquo;is this normal&rdquo; stays free, including this article&rsquo;s summary above.</Caption>
        </>
      ) : (
        article.body.map((para, i) => <Body key={i}>{para}</Body>)
      )}

      <DetailSection label="SOURCE">
        <DetailCard>
          <Body>{article.source}</Body>
          <DetailButton label="Read the original" onPress={() => Linking.openURL(article.url)} />
        </DetailCard>
      </DetailSection>

      {NEEDS_CLINICAL_REVIEW && (
        <Caption>NEEDS CLINICAL REVIEW — this content is placeholder and has not been reviewed by a clinician.</Caption>
      )}
    </DetailScreen>
  );
}
