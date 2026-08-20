// ============================================================
// SCREEN: EducationArticle (§4.8, P9, §9)
//
// PURPOSE. Answer "what is normal" with something evidence-based and short,
// attributed to a source the reader could check, and framed as common
// experience rather than a judgement about them (§10).
//
// ─────────────────────────────────────────────────────────────────────────────
// STATE vs RENDERING VARIANT — and this is the first surface in the product
// with a LEGITIMATE gate, so the distinction earns its keep.
//
// ACCESS, derived from the article's tier and the entitlement, never set:
//   free           the article, in full. Everything answering "what is normal"
//                  is free forever, which is the half of §9 that matters at 2am.
//   deepDiveLocked a premium deep dive, for someone without premium. The real
//                  opening paragraph is VISIBLE and the gate is a soft fade
//                  plus a pill — §9: value before the gate, never a blank wall,
//                  never a modal interrupt.
//   deepDiveOpen   the same article for someone who has premium.
//
// SAVED is orthogonal to access, exactly as the report's export state is
// orthogonal to its depth: it is a boolean from stored data that can be true or
// false over any of the three.
//
// NOT states:
//   loading  — content is local.
//   error    — nothing can fail here; the outbound link is the browser's problem.
//   empty    — an article with no body is a content bug, not a state.
//
// WHY THIS SCREEN MAY GATE AND THE REPORT MAY NOT. P9 puts "education
// deep-dives" in premium and the doctor report, safety content and the whole
// core loop in free-forever. So `lock.*` is legal here and illegal there, and
// checks/restricted.mjs enforces exactly that split rather than trusting anyone
// to remember which side a surface is on.
// ============================================================

import { theme, scale, type Mode } from "./tokens";
import DetailScreen from "./patterns/DetailScreen";
import { type Article } from "./educationContent";

export type Access = "free" | "deepDiveLocked" | "deepDiveOpen";

export function accessOf(article: Article, hasPremium: boolean): Access {
  if (article.tier === "free") return "free";
  return hasPremium ? "deepDiveOpen" : "deepDiveLocked";
}

export default function EducationArticle({ mode, article, hasPremium = false, saved = false, onClose, onToggleSave, onUnlock }: {
  mode: Mode;
  article: Article;
  hasPremium?: boolean;
  saved?: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onUnlock: () => void;
}) {
  const t = theme(mode);
  const access = accessOf(article, hasPremium);
  const locked = access === "deepDiveLocked";

  // Value before the gate: the first paragraph is always readable, whatever the
  // tier. A locked article that shows nothing teaches people the app is a
  // billboard.
  const visible = locked ? article.body.slice(0, 1) : article.body;

  return (
    <DetailScreen mode={mode} title="Learn" onClose={onClose} gap={3}
      action={
        <button onClick={onToggleSave} aria-label={saved ? "Saved" : "Save article"}
          className="btn-press flex items-center gap-1"
          style={{ background: "none", border: "none", cursor: "pointer" }}>
          {/* Icon AND word — the saved state is never carried by colour alone (N4). */}
          <span style={{ fontSize: scale.font.size.xs, fontWeight: 600, color: saved ? t.color.accent.strong : t.color.text.secondary }}>
            {saved ? "★ Saved" : "☆ Save"}
          </span>
        </button>
      }>

        <div style={{ fontSize: scale.font.size["2xs"], fontWeight: 700, letterSpacing: scale.font.tracking.wide, color: t.color.accent.strong, textTransform: "uppercase" }}>
          {article.category}
        </div>
        <div style={{ fontSize: scale.font.size.xl, fontWeight: 700, color: t.color.text.primary, lineHeight: 1.3 }}>
          {article.title}
        </div>
        <div style={{ fontSize: scale.font.size.xs, color: t.color.text.secondary }}>
          {article.readingTime} · {article.source}
        </div>

        <div className="flex flex-col gap-3 mt-1" style={{ position: "relative" }}>
          {visible.map((p) => (
            <div key={p} style={{ fontSize: scale.font.size.sm, color: t.color.text.primary, lineHeight: 1.6 }}>{p}</div>
          ))}

          {/* THE GATE. A gradient fade over real content plus an inline pill —
              the historyFade contract, reused because the situation is the same:
              show that more exists, never hide that it does, never interrupt.
              No modal, and the escape is simply not tapping. */}
          {locked && (
            <div className="flex flex-col gap-3">
              <div style={{
                height: 64, marginTop: -64, pointerEvents: "none",
                background: `linear-gradient(to bottom, ${t.pattern.historyFade.fadeFrom}, ${t.pattern.historyFade.fadeTo})`,
              }} />
              {/* NO accent card around this. historyFade's contract is "gradient
                  fade plus an INLINE pill" and the pill's colours are solved for
                  sitting on the surface — nesting it inside an accent container
                  tints the backdrop twice and cost 0.5:1, failing light at 3.95.
                  The pattern was designed for a boundary on the page, so it goes
                  on the page. */}
              <div className="flex flex-col gap-2">
                <div style={{ fontSize: scale.font.size.sm, fontWeight: 600, color: t.color.text.primary, lineHeight: 1.45 }}>
                  {article.deepDiveHook}
                </div>
                <button onClick={onUnlock}
                  className="btn-press self-start rounded-full px-3"
                  style={{
                    height: 32, border: "none", cursor: "pointer",
                    background: t.pattern.historyFade.pillFill,
                    fontSize: scale.font.size.xs, fontWeight: 600,
                    color: t.pattern.historyFade.pillLabel,
                  }}>
                  Unlock deep dives
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          className="btn-press w-full flex items-center justify-center rounded-2xl font-semibold mt-1"
          style={{
            height: 48, border: `1px solid ${t.color.surface.border}`,
            background: t.color.surface.card, cursor: "pointer",
            fontSize: scale.font.size.sm, color: t.color.text.primary,
          }}>
          Read the full article on {article.source}
        </button>

        {/* §10 — education, not advice, and it says which. */}
        <div className="rounded-xl px-3 py-3"
          style={{ background: t.color.surface.card, border: `1px solid ${t.color.surface.border}` }}>
          <div style={{ fontSize: scale.font.size["2xs"], color: t.color.text.secondary, lineHeight: 1.55 }}>
            General education, not medical advice, and not an assessment of your
            situation. Common experiences vary widely. If symptoms are severe or
            getting worse, see a clinician.
          </div>
        </div>
    </DetailScreen>
  );
}
