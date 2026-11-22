import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getSubjectBySlug, getSubjectCard } from "@/lib/subjects";
import { SITE_URL } from "@/lib/siteUrl";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_DIR = path.join(process.cwd(), "assets/fonts");

/** Below this, a voter count reads as "nobody cares" on a shared card — show a call to vote instead. */
const MIN_VOTES_SHOWN = 100;

// Dark slate background with an amber accent: the headline figure has to
// stop the scroll even as a thumbnail in a feed, which a light card doesn't.
const BACKGROUND = "#0f172a";
const ACCENT = "#f59e0b";

const integerFormatter = new Intl.NumberFormat("fr-FR");

/**
 * Adaptive title size, tiered by character count — a fixed size leaves a
 * disgraceful gap for a short question and overflows for a long one. Tuned
 * against the real range of subject titles in production (51 to 118 chars at
 * last check). With a card figure, the figure leads and the title drops to
 * a supporting size.
 */
function titleFontSize(length: number, withFigure: boolean): number {
  if (withFigure) return length <= 70 ? 38 : length <= 100 ? 34 : 31;
  const tiers: [number, number][] = [
    [40, 80],
    [55, 70],
    [70, 60],
    [85, 52],
    [100, 45],
    [120, 39],
  ];
  return tiers.find(([maxLength]) => length <= maxLength)?.[1] ?? 34;
}

/** The figure is free text ("142 %", "2,767 millions") — shrink it so the longest still fits on one line. */
function figureFontSize(figure: string): number {
  if (figure.length <= 6) return 170;
  if (figure.length <= 9) return 140;
  return 104;
}

function FrenchFlag() {
  return (
    <div style={{ display: "flex", width: 42, height: 28, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ display: "flex", flex: 1, background: "#002395" }} />
      <div style={{ display: "flex", flex: 1, background: "#ffffff" }} />
      <div style={{ display: "flex", flex: 1, background: "#ed2939" }} />
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [subject, card] = await Promise.all([getSubjectBySlug(slug), getSubjectCard(slug)]);

  if (!subject) {
    return new Response("Not found", { status: 404 });
  }

  const [interBold, interSemiBold] = await Promise.all([
    readFile(path.join(FONT_DIR, "Inter-Bold.ttf")),
    readFile(path.join(FONT_DIR, "Inter-SemiBold.ttf")),
  ]);

  const category = subject.categories[0]?.name;
  const domain = SITE_URL.replace(/^https?:\/\//, "");
  const totalVotes = subject.results.reduce((sum, result) => sum + result.vote_count, 0);
  const callToAction =
    totalVotes >= MIN_VOTES_SHOWN
      ? `${integerFormatter.format(totalVotes)} citoyens ont déjà voté`
      : "Donnez votre avis";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 96px",
          background: BACKGROUND,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <FrenchFlag />
          {category && (
            <div style={{ display: "flex", fontSize: 24, fontWeight: 600, letterSpacing: 3, color: ACCENT }}>
              {category.toUpperCase()}
            </div>
          )}
        </div>

        {/* Centered in whatever vertical space is left between the header and
            footer lines — this is also what makes the content survive an
            off-center crop toward a wider ratio (X on some mobile layouts):
            the trim eats into the sacrificial header/footer first. */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {card && (
            // A real wrapper, not a fragment: Satori lays fragment children out on top of each other.
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: figureFontSize(card.figure), fontWeight: 700, lineHeight: 1, color: "#ffffff" }}>
                {card.figure}
              </div>
              <div style={{ display: "flex", fontSize: card.label.length <= 56 ? 34 : 30, fontWeight: 600, lineHeight: 1.25, color: ACCENT, marginTop: 14 }}>
                {card.label}
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: titleFontSize(subject.title.length, card !== null),
              fontWeight: card ? 600 : 700,
              lineHeight: 1.25,
              color: card ? "rgba(255,255,255,0.82)" : "#ffffff",
              marginTop: card ? 24 : 0,
            }}
          >
            {subject.title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{domain}</div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              color: BACKGROUND,
              background: ACCENT,
              padding: "12px 26px",
              borderRadius: 999,
            }}
          >
            {callToAction}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      ],
      headers: {
        // Not immutable: the voter count on the card moves over time.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
