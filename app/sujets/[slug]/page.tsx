import type { Metadata } from "next";
import { type CSSProperties, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { CategoryTag, categoryColorVar } from "@/components/CategoryBadge";
import { CategoryMetaInline } from "@/components/CategoryMeta";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser, isRealUser } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/siteUrl";
import { createClient } from "@/lib/supabase/server";
import { getSubjectBySlug, getSubjectCard, type ArgumentRow } from "@/lib/subjects";
import { AgricultureTrendChart } from "./AgricultureTrendChart";
import { BacSuccessRateChart } from "./BacSuccessRateChart";
import { CorruptionDelayChart } from "./CorruptionDelayChart";
import { DecisionTimeline } from "./DecisionTimeline";
import { PassCultureSpendingChart } from "./PassCultureSpendingChart";
import { PrisonPopulationChart } from "./PrisonPopulationChart";
import { SeniorsEmploymentCharts } from "./SeniorsEmploymentCharts";
import { StickyTitleBar } from "./StickyTitleBar";
import { TeacherSalaryChart } from "./TeacherSalaryChart";
import styles from "./subject.module.css";
import { VoteCard } from "./VoteCard";
import { ZfeIncomeChart } from "./ZfeIncomeChart";

/** Renders `**text**` spans (hand-picked in the synthesis copy — the 1-3 phrases that crystallize the subject's core dysfunction) as `<strong>`. Not general markdown — just this one marker. */
function Bolded({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
      )}
    </>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12M12 4h4v4M16 4l-7 7" />
    </svg>
  );
}

function IdeaIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M10 3.5a5 5 0 0 0-3 9c.6.45 1 1.15 1 1.9V15h4v-.6c0-.75.4-1.45 1-1.9a5 5 0 0 0-3-9Z" />
      <path d="M8.3 17h3.4" strokeLinecap="round" />
    </svg>
  );
}

function SynthesisIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M5 3.5h7l3 3V16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M12 3.5V6.5a1 1 0 0 0 1 1H16" />
      <path d="M6.5 11h7M6.5 13.5h7M6.5 8.5h3" strokeLinecap="round" />
    </svg>
  );
}

function DecisionsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M10 2.5 17 6.5H3z" strokeLinejoin="round" />
      <path d="M4.5 8.5V15M8 8.5V15M12 8.5V15M15.5 8.5V15" strokeLinecap="round" />
      <path d="M3 17h14" strokeLinecap="round" />
    </svg>
  );
}

function EtatDesLieuxIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M4 16.5V3.5" strokeLinecap="round" />
      <path d="M4 16.5h13" strokeLinecap="round" />
      <path d="M6.5 13.5v-3M10 13.5v-6M13.5 13.5v-4.5" strokeLinecap="round" />
    </svg>
  );
}

/** Shared "icon + h2" pattern so every top-level section reads consistently — see the heading-hierarchy pass that added this. */
function SectionHead({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionIcon}>{icon}</span>
      <h2>{children}</h2>
    </div>
  );
}

/** Arguments are drafted as "Bénéfice : ...\n\nLimites :\n- ...\n- ..." (see prompts/arguments-extract.md) — split that convention apart so limits can carry their own marker instead of blending into the paragraph. Line endings are normalized first: rows written via the SQL editor can carry \r\n instead of \n. */
function parseArgumentDescription(rawDescription: string): { benefit: string; limits: string[] } {
  const description = rawDescription.replace(/\r\n/g, "\n");
  const marker = "\n\nLimites :\n";
  const splitAt = description.indexOf(marker);

  const benefitPart = splitAt === -1 ? description : description.slice(0, splitAt);
  const strippedBenefit = benefitPart.replace(/^Bénéfice\s*:\s*/, "");
  // Drafts write this sentence as a continuation of the "Bénéfice : " label —
  // stripping the label leaves a lowercase start, so re-capitalize it here.
  const benefit = strippedBenefit.charAt(0).toUpperCase() + strippedBenefit.slice(1);
  if (splitAt === -1) return { benefit, limits: [] };

  const limits = description
    .slice(splitAt + marker.length)
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);

  return { benefit, limits };
}

function ArgumentCard({ argument }: { argument: ArgumentRow }) {
  const { benefit, limits } = parseArgumentDescription(argument.description);

  return (
    <div className={styles.argCard}>
      <div className={styles.argDescription}>{benefit}</div>
      {limits.length > 0 && (
        <ul className={styles.argLimitList}>
          {limits.map((limit, i) => (
            <li className={styles.argLimitItem} key={i}>
              <span className={styles.argLimitTag}>Limite</span>
              {limit}
            </li>
          ))}
        </ul>
      )}
      {argument.sources.map((src) => {
        const label = (
          <>
            <ExternalLinkIcon />
            {src.title}
            {src.publisher ? ` · ${src.publisher}` : ""}
            {src.published_on ? ` · ${new Date(src.published_on).getFullYear()}` : ""}
          </>
        );
        return src.url ? (
          <a key={src.id} className={styles.argSource} href={src.url} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          <span key={src.id} className={styles.argSource}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  if (!subject) return {};

  const title = `${subject.title} — Doléances`;
  // Strips the **bold** markers the synthesis uses on the page (see Bolded) — previews show them raw.
  const rawDescription = subject.synthesis.replace(/\*\*/g, "").replace(/\s*\n\s*/g, " ").trim();
  const description =
    rawDescription.length > 155 ? `${rawDescription.slice(0, 155).replace(/\s+\S*$/, "")}…` : rawDescription;

  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description: description || undefined,
      url: `${SITE_URL}/sujets/${slug}`,
      type: "article",
      siteName: "Doléances",
      locale: "fr_FR",
    },
    twitter: { card: "summary_large_image", title, description: description || undefined },
  };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [subject, card, user] = await Promise.all([getSubjectBySlug(slug), getSubjectCard(slug), getCurrentUser()]);

  if (!subject) {
    notFound();
  }

  const loggedIn = isRealUser(user);

  let votedResultId: string | null = null;
  if (loggedIn) {
    const supabase = await createClient();
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select("result_id")
      .eq("user_id", user.id)
      .eq("subject_id", subject.id)
      .maybeSingle();
    if (voteError) throw voteError;
    votedResultId = vote?.result_id ?? null;
  }

  const timelineColorVar = subject.categories[0] ? categoryColorVar(subject.categories[0].slug) : undefined;
  const sectionAccentStyle = timelineColorVar
    ? ({ "--section-accent": `var(${timelineColorVar})` } as CSSProperties)
    : undefined;

  return (
    <>
      <SiteNav />
      <StickyTitleBar title={subject.title} />

      <div id="main-content" className={styles.pageBody}>
        <header className={styles.hero}>
          <div className={styles.wrap}>
            <div className={styles.heroInner}>
              <div className={styles.categoryRow}>
                {subject.categories.map((category) => (
                  <CategoryTag key={category.slug} slug={category.slug} name={category.name} />
                ))}
                {subject.categories.map((category) => (
                  <CategoryMetaInline key={category.slug} category={category} />
                ))}
              </div>
              <h1>{subject.title}</h1>
            </div>
          </div>
        </header>

        <div className={`${styles.wrap} ${styles.layout}`}>
          <main className={styles.main}>
          <section className={`${styles.section} ${styles.sectionAccent}`} id="synthese" style={sectionAccentStyle}>
            <SectionHead icon={<SynthesisIcon />}>Synthèse</SectionHead>
            {subject.synthesis ? (
              subject.slug === "faut-il-maintenir-les-interdictions-zones-a-faibles-emissions-zfe-aux-vehicules-anciens-en-ville" ? (
                (() => {
                  const marker = "\n\nEn avril 2026";
                  const splitAt = subject.synthesis.indexOf(marker);
                  const before = splitAt === -1 ? subject.synthesis : subject.synthesis.slice(0, splitAt);
                  const after = splitAt === -1 ? "" : subject.synthesis.slice(splitAt + 2);
                  return (
                    <>
                      <div className={styles.synthBody}><Bolded text={before} /></div>
                      <ZfeIncomeChart />
                      {after && <div className={styles.synthBody}><Bolded text={after} /></div>}
                    </>
                  );
                })()
              ) : subject.slug === "attractivite-metier-enseignant" ? (
                (() => {
                  const marker = "\n\nDeux revalorisations";
                  const splitAt = subject.synthesis.indexOf(marker);
                  const before = splitAt === -1 ? subject.synthesis : subject.synthesis.slice(0, splitAt);
                  const after = splitAt === -1 ? "" : subject.synthesis.slice(splitAt + 2);
                  return (
                    <>
                      <div className={styles.synthBody}><Bolded text={before} /></div>
                      <TeacherSalaryChart />
                      {after && <div className={styles.synthBody}><Bolded text={after} /></div>}
                    </>
                  );
                })()
              ) : subject.slug === "faut-il-reduire-les-delais-et-augmenter-les-poursuites-contre-la-corruption-d-elus" ? (
                (() => {
                  const marker = "\r\n\r\nExemple:";
                  const splitAt = subject.synthesis.indexOf(marker);
                  const before = splitAt === -1 ? subject.synthesis : subject.synthesis.slice(0, splitAt);
                  const after = splitAt === -1 ? "" : subject.synthesis.slice(splitAt + 4);
                  return (
                    <>
                      <div className={styles.synthBody}><Bolded text={before} /></div>
                      <CorruptionDelayChart />
                      {after && <div className={styles.synthBody}><Bolded text={after} /></div>}
                    </>
                  );
                })()
              ) : subject.slug ===
                "faut-il-relever-le-niveau-d-exigence-des-examens-bac-brevet-meme-si-cela-fait-baisser-le-taux-de-reussite" ? (
                (() => {
                  const marker = "\n\nLe brevet donne une mesure";
                  const splitAt = subject.synthesis.indexOf(marker);
                  const before = splitAt === -1 ? subject.synthesis : subject.synthesis.slice(0, splitAt);
                  const after = splitAt === -1 ? "" : subject.synthesis.slice(splitAt + 2);
                  return (
                    <>
                      <div className={styles.synthBody}><Bolded text={before} /></div>
                      <BacSuccessRateChart />
                      {after && <div className={styles.synthBody}><Bolded text={after} /></div>}
                    </>
                  );
                })()
              ) : subject.slug ===
                "faut-il-reserver-le-pass-culture-au-patrimoine-plutot-qu-a-des-industries-culturelles-deja-rentables" ? (
                (() => {
                  const marker = "\n\nS'y ajoute un problème social";
                  const splitAt = subject.synthesis.indexOf(marker);
                  const before = splitAt === -1 ? subject.synthesis : subject.synthesis.slice(0, splitAt);
                  const after = splitAt === -1 ? "" : subject.synthesis.slice(splitAt + 2);
                  return (
                    <>
                      <div className={styles.synthBody}><Bolded text={before} /></div>
                      <PassCultureSpendingChart />
                      {after && <div className={styles.synthBody}><Bolded text={after} /></div>}
                    </>
                  );
                })()
              ) : subject.slug ===
                "prisons-faut-il-construire-plus-de-places-et-faire-cesser-drogue-telephones-et-loisirs-non-autorises-en-detention" ? (
                <>
                  <div className={styles.synthBody}><Bolded text={subject.synthesis} /></div>
                  <PrisonPopulationChart />
                </>
              ) : (
                <div className={styles.synthBody}><Bolded text={subject.synthesis} /></div>
              )
            ) : (
              <p className={styles.emptyNote}>La synthèse de ce sujet n&apos;a pas encore été rédigée.</p>
            )}
            {subject.slug === "faut-il-reformer-les-regles-agricoles-pour-revaloriser-le-metier-d-agriculteur" && (
              <AgricultureTrendChart />
            )}
            {subject.slug === "faut-il-faire-plus-pour-l-emploi-des-seniors-en-france" && <SeniorsEmploymentCharts />}
          </section>

          {subject.governmentPositions.length > 0 && (
            <section
              className={`${styles.section} ${styles.sectionAccent}`}
              id="decisions-gouvernementales"
              style={sectionAccentStyle}
            >
              <SectionHead icon={<DecisionsIcon />}>Décisions gouvernementales</SectionHead>
              <DecisionTimeline positions={subject.governmentPositions} colorVar={timelineColorVar} />
            </section>
          )}

          {(subject.polls.length > 0 || subject.ideas.length > 0) && (
            <section
              className={`${styles.section} ${styles.sectionAccent}`}
              id="etat-des-lieux"
              style={sectionAccentStyle}
            >
              <SectionHead icon={<EtatDesLieuxIcon />}>État des lieux</SectionHead>

              {subject.polls.length > 0 && (
                <div className={`${styles.subBlock} ${styles.dataPanel}`}>
                  <h3 className={styles.subHeading}>Ce qu&apos;en disent les Français</h3>
                  <div className={styles.pollList}>
                    {subject.polls.map((poll) => (
                      <div className={styles.pollRow} key={poll.id}>
                        <span className={styles.pollYear}>{new Date(poll.conducted_on).getFullYear()}</span>
                        <span className={styles.pollInstitute}>{poll.institute}</span>
                        <a
                          className={styles.pollQuestion}
                          href={poll.source_url ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          «&nbsp;{poll.question}&nbsp;»
                          <span className={styles.pollQuestionIcon} aria-hidden="true">
                            <ExternalLinkIcon />
                          </span>
                        </a>
                        <span className={styles.pollAnswer}>
                          <span className={styles.pollAnswerLabel}>« Favorable »</span>
                          <span className={styles.pollPct}>{poll.favorable_pct} %</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subject.ideas.length > 0 && (
                <div
                  className={`${styles.subBlock} ${styles.dataPanel}`}
                  style={timelineColorVar ? ({ "--timeline-color": `var(${timelineColorVar})` } as CSSProperties) : undefined}
                >
                  <h3 className={styles.subHeading}>Pistes, bénéfices et limites</h3>
                  {subject.ideas.map((idea) => (
                    <div className={styles.ideaBlock} key={idea.id}>
                      <div className={styles.ideaHeader}>
                        <h4 className={styles.ideaTitle}>
                          <span className={styles.ideaIcon}>
                            <IdeaIcon />
                          </span>
                          {idea.title}
                        </h4>
                      </div>
                      <div className={styles.argList}>
                        {idea.arguments.length === 0 ? (
                          <p className={styles.emptyNote}>Aucun argument pour l&apos;instant.</p>
                        ) : (
                          idea.arguments.map((argument) => <ArgumentCard argument={argument} key={argument.id} />)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
        </div>

        <VoteCard
          subjectId={subject.id}
          subjectSlug={subject.slug}
          subjectTitle={subject.title}
          card={card}
          isLoggedIn={loggedIn}
          votedResultId={votedResultId}
          results={subject.results}
        />
      </div>

      <SiteFooter />
    </>
  );
}
