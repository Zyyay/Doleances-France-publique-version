"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryBadge, categoryColorVar } from "@/components/CategoryBadge";
import { CategoryMetaPanel } from "@/components/CategoryMeta";
import { type CategoryRow, type SubjectSummary } from "@/lib/subjects";
import styles from "@/app/home.module.css";

const MAIN_LIST_PREVIEW_COUNT = 12;
// Ranked sections render as a 3-card podium — never more.
const RANKED_SECTION_COUNT = 3;

/** The response option with the largest share of votes on a subject, e.g. { label: "Pour", pct: 91 }. */
function leadingChoice(subject: SubjectSummary): { label: string; pct: number } {
  const options = [
    { label: "Pour", pct: subject.forPct },
    { label: "Contre", pct: subject.againstPct },
    { label: "Neutre", pct: subject.neutralPct },
  ];
  return options.reduce((max, option) => (option.pct > max.pct ? option : max));
}

function leadingChoicePct(subject: SubjectSummary): number {
  return leadingChoice(subject).pct;
}

// Matches the card's grow transition duration in home.module.css — the URL
// change is deliberately delayed until the animation has had time to read.
const CARD_LEAVE_DELAY_MS = 180;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M5 10h10M11 5.5L15.5 10 11 14.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PODIUM_RANK_CLASS = { 1: "podiumFirst", 2: "podiumSecond", 3: "podiumThird" } as const;

function SubjectCard({
  subject,
  voted,
  rank,
  catThemed,
}: {
  subject: SubjectSummary;
  voted: boolean;
  rank?: 1 | 2 | 3;
  catThemed?: boolean;
}) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const href = `/sujets/${subject.slug}`;
  const catSlug = subject.categories[0]?.slug;
  const catVar = catSlug ? categoryColorVar(catSlug) : undefined;

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (new tab, new window, middle-click) through untouched.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setIsLeaving(true);
    setTimeout(() => router.push(href), CARD_LEAVE_DELAY_MS);
  }

  const themed = Boolean(catThemed && catVar);
  const { label: leadingLabel, pct: leadingPct } = leadingChoice(subject);

  return (
    <Link
      className={`${styles.card} ${voted ? styles.cardVoted : ""} ${isLeaving ? styles.cardLeaving : ""} ${
        rank ? `${styles.podiumCard} ${styles[PODIUM_RANK_CLASS[rank]]}` : ""
      } ${themed ? styles.cardCatThemed : ""}`}
      href={href}
      prefetch={false}
      onClick={handleClick}
      style={themed ? ({ "--cat-color": `var(${catVar})` } as CSSProperties) : undefined}
    >
      {subject.totalVotes > 0 && (
        <div className={styles.rankBadge}>
          <span className={styles.rankNote}>
            {Math.round(leadingPct)} % {leadingLabel}
          </span>
        </div>
      )}
      <div className={styles.cardTop}>
        <div className={styles.cardTopLeft}>
          <span className={styles.catTag} title={subject.categories[0]?.name}>
            {subject.categories[0] && <CategoryBadge slug={subject.categories[0].slug} size={22} invert={themed} />}
            <span className={styles.catTagLabel}>{subject.categories[0]?.name}</span>
          </span>
          {voted && <span className={styles.votedBadge}>✓ Déjà voté</span>}
        </div>
      </div>
      <div className={styles.cardTitleWrap}>
        <h3>{subject.title}</h3>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.cta}>
          <span className={styles.ctaLabel}>Voir le sujet</span>
          <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}

function RankedSection({
  title,
  subjects,
  votedIds,
  highlight,
  categoryMeta,
}: {
  title: string;
  subjects: SubjectSummary[];
  votedIds: Set<string>;
  highlight?: boolean;
  categoryMeta?: CategoryRow;
}) {
  if (subjects.length === 0) return null;

  return (
    <section className={`${styles.boardSection} ${highlight ? styles.boardSectionHighlight : ""}`}>
      <div className={styles.wrap}>
        <div className={styles.boardMeta}>
          <h2 className={styles.boardSectionTitle}>{title}</h2>
          {categoryMeta && <CategoryMetaPanel category={categoryMeta} />}
        </div>
        <div className={styles.podium}>
          {subjects.map((subject, i) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              voted={votedIds.has(subject.id)}
              rank={(i + 1) as 1 | 2 | 3}
              catThemed={highlight}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function SubjectBoard({
  subjects,
  categories,
  votedSubjectIds = [],
}: {
  subjects: SubjectSummary[];
  categories: CategoryRow[];
  votedSubjectIds?: string[];
}) {
  const votedIds = useMemo(() => new Set(votedSubjectIds), [votedSubjectIds]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorieParam = searchParams.get("categorie");
  // Derived straight from the URL on every render (not local state) so a
  // category click from the header or a subject page — which changes only
  // the search params on the same "/" route, without remounting this
  // component — is picked up immediately instead of staying stale.
  const filter = categorieParam && categories.some((c) => c.slug === categorieParam) ? categorieParam : "all";
  const selectedCategory = filter !== "all" ? categories.find((c) => c.slug === filter) : undefined;

  function setFilter(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("categorie");
    else params.set("categorie", next);
    const qs = params.toString();
    router.replace(`/${qs ? `?${qs}` : ""}#sujets`, { scroll: false });
  }

  const filtered = useMemo(
    () => (filter === "all" ? subjects : subjects.filter((s) => s.categories.some((c) => c.slug === filter))),
    [filter, subjects]
  );

  // Not gated on totalVotes > 0 — ranks are still meaningful (and the
  // section stays visible) even pre-launch, before any real votes exist.
  const mostPopular = useMemo(
    () => [...filtered].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, RANKED_SECTION_COUNT),
    [filtered]
  );
  // Highest share any single response gets on a subject — the opposite of a
  // 50/50 split, so this needs actual votes to mean anything (unlike
  // "populaires" above, subjects with no votes yet are excluded).
  const highestConsensus = useMemo(
    () =>
      [...filtered]
        .filter((s) => s.totalVotes > 0)
        .sort((a, b) => leadingChoicePct(b) - leadingChoicePct(a))
        .slice(0, RANKED_SECTION_COUNT),
    [filtered]
  );
  // Both podiums sit above the main list now — never show the same subject
  // twice on the page, so anything ranked in either podium is excluded below.
  const rankedIds = useMemo(
    () => new Set([...mostPopular, ...highestConsensus].map((s) => s.id)),
    [mostPopular, highestConsensus]
  );

  // Already-voted subjects sink to the end — order within each group otherwise
  // untouched (stable partition), the relative order among voted subjects
  // doesn't matter. This ordering is specific to the main list — the
  // "populaires"/"controversées" sections above sort on their own metric only.
  const sorted = useMemo(() => {
    const rest = filtered.filter((s) => !rankedIds.has(s.id));
    return [...rest.filter((s) => !votedIds.has(s.id)), ...rest.filter((s) => votedIds.has(s.id))];
  }, [filtered, rankedIds, votedIds]);

  // Remembers which filter the "voir plus" expansion was opened under, so
  // switching category collapses the list again instead of leaving a stale,
  // longer one expanded.
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const showAllMain = expandedFilter === filter;
  const mainVisible = showAllMain ? sorted : sorted.slice(0, MAIN_LIST_PREVIEW_COUNT);

  return (
    <>
      <div className={styles.toolbar} id="sujets">
        <div className={styles.wrap}>
          <span className={styles.filterHeading}>Catégories</span>
        </div>
        <div className={`${styles.wrap} ${styles.toolbarRow}`}>
          <div className={styles.catScroller} role="group" aria-label="Filtrer par catégorie">
            {categories.map((category) => (
              <button
                key={category.slug}
                className={`${styles.chip} ${filter === category.slug ? styles.chipActive : ""}`}
                aria-pressed={filter === category.slug}
                onClick={() => setFilter(filter === category.slug ? "all" : category.slug)}
                title={category.name}
                style={
                  filter === category.slug
                    ? { background: `var(${categoryColorVar(category.slug)})`, borderColor: `var(${categoryColorVar(category.slug)})` }
                    : undefined
                }
              >
                <CategoryBadge slug={category.slug} size={20} invert={filter === category.slug} />
                <span className={styles.chipLabel}>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <RankedSection
        title="Les plus populaires"
        subjects={mostPopular}
        votedIds={votedIds}
        highlight
        categoryMeta={selectedCategory}
      />
      <RankedSection title="Plus haut consensus" subjects={highestConsensus} votedIds={votedIds} />

      <section className={styles.boardSection}>
        <div className={styles.wrap}>
          {sorted.length === 0 ? (
            <p className={styles.emptyState}>Aucun sujet ne correspond à ce filtre pour le moment.</p>
          ) : (
            <>
              <div className={styles.board}>
                {mainVisible.map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} voted={votedIds.has(subject.id)} />
                ))}
              </div>
              {!showAllMain && sorted.length > MAIN_LIST_PREVIEW_COUNT && (
                <button className={styles.showMoreBtn} type="button" onClick={() => setExpandedFilter(filter)}>
                  Voir plus ({sorted.length - MAIN_LIST_PREVIEW_COUNT})
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
