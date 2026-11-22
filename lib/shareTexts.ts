import type { SubjectCard } from "@/lib/subjects";

/**
 * Post-vote share texts for a subject. The fact line is built from the same
 * card_figure/card_label as the share image (see getSubjectCard), so the text
 * and the preview under it always show the same figure. Neutral on purpose:
 * none of them says which way the sharer voted — publishing that stays the
 * sharer's own choice (it can reveal a political opinion, see the article-9
 * consent gate).
 */

const X_MAX_LENGTH = 280;
/** X counts every link as 23 characters, whatever its real length. */
const X_URL_LENGTH = 23;

function factLine(card: SubjectCard | null): string | null {
  return card ? `${card.figure} ${card.label}.` : null;
}

/** OS share sheet (phones): the URL is passed separately, the target app appends it. */
export function nativeShareText(title: string, card: SubjectCard | null): string {
  return [factLine(card), title, "J'ai donné mon avis. Et vous ?"].filter(Boolean).join("\n");
}

/** WhatsApp: conversational, "tu" — shared with friends and family. */
export function whatsappShareText(title: string, card: SubjectCard | null, url: string): string {
  const fact = factLine(card);
  return [
    fact && `Tu savais ? ${fact}`,
    `J'ai donné mon avis sur cette question :\n${title}`,
    `Les résultats s'affichent après ton vote 👉 ${url}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Approximates X's weighted count: emoji and other astral characters count double. */
function xLength(text: string): number {
  let length = 0;
  for (const char of text) length += char.codePointAt(0)! > 0xffff ? 2 : 1;
  return length;
}

/** X: no hashtag; the title is dropped when it would push the post past 280 characters. */
export function xShareText(title: string, card: SubjectCard | null): string {
  const fact = factLine(card);
  const outro = "J'ai donné mon avis, à vous 👇";
  const withTitle = [fact, title, outro].filter(Boolean).join("\n\n");
  // +1 for the line break X puts between the text and the url parameter.
  if (!fact || xLength(withTitle) + 1 + X_URL_LENGTH <= X_MAX_LENGTH) return withTitle;
  return [fact, outro].join("\n\n");
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function xShareUrl(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
