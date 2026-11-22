import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";

/**
 * Every read in this file goes through Supabase's REST API on every call —
 * there was no caching at all, so every homepage/subject-page visit re-ran
 * the full query even though this content (synthesis, ideas, polls,
 * decisions) rarely changes between publishing sessions. Wrapped in Next's
 * Data Cache: a 60s revalidate window is a large cut in Supabase read
 * volume/egress at real traffic, at the cost of results/vote counts lagging
 * by up to 60s for cache hits — an acceptable tradeoff for aggregate
 * numbers. Never wrap anything that reads `cookies()`/the current user
 * (see lib/supabase/server.ts) — that stays fully dynamic, per request.
 */
const CACHE_REVALIDATE_SECONDS = 60;

export type GovernmentStance = "for" | "against" | "neutral";

export interface CategoryRow {
  slug: string;
  name: string;
  /** Raw (unscaled) euros — approximate annual weight of this policy area in the French state budget. */
  budget_eur: number | null;
  /** budget_eur as a percentage of the total French state budget. */
  budget_pct_state: number | null;
  /** 1-100 indicative public-trust score over the last 30 years — never shown as a raw number on the frontend. */
  trust_score: number | null;
}

export interface ImpactRow {
  id: string;
  title: string;
  value: number;
  unit: string;
  is_headline: boolean;
}

export interface ArgumentSourceRow {
  id: string;
  title: string;
  publisher: string | null;
  url: string | null;
  published_on: string | null;
}

export interface ArgumentRow {
  id: string;
  title: string;
  description: string;
  sources: ArgumentSourceRow[];
}

export interface IdeaRow {
  id: string;
  title: string;
  description: string | null;
  /** Raw figure in the parent subject's headline impact unit; null when no distinctly-scoped figure exists. */
  impact_value: number | null;
  arguments: ArgumentRow[];
}

export interface ResultRow {
  id: string;
  label: string;
  leaning: number;
  vote_count: number;
}

export interface GovernmentPositionRow {
  id: string;
  position_date: string;
  title: string;
  description: string;
  stance: GovernmentStance;
  source_url: string | null;
}

export interface PollRow {
  id: string;
  institute: string;
  conducted_on: string;
  question: string;
  favorable_pct: number;
  sample_size: number;
  source_url: string | null;
}

export interface SubjectDetail {
  id: string;
  slug: string;
  title: string;
  synthesis: string;
  categories: CategoryRow[];
  impacts: ImpactRow[];
  ideas: IdeaRow[];
  results: ResultRow[];
  governmentPositions: GovernmentPositionRow[];
  polls: PollRow[];
}

// Shape of the raw nested response from PostgREST, before we flatten/sort it
// into SubjectDetail below.
type RawArgumentSource = ArgumentSourceRow & { display_order: number };
type RawArgument = Omit<ArgumentRow, "sources"> & {
  display_order: number;
  review_status: ReviewStatus;
  argument_sources: RawArgumentSource[] | null;
};
type RawIdea = Omit<IdeaRow, "arguments"> & {
  display_order: number;
  review_status: ReviewStatus;
  arguments: RawArgument[] | null;
};
type RawImpact = ImpactRow & { display_order: number; review_status: ReviewStatus };
type RawResult = ResultRow & { display_order: number };
type RawGovernmentPosition = GovernmentPositionRow & { display_order: number; review_status: ReviewStatus };
type RawPoll = PollRow & { review_status: ReviewStatus };
type RawSubjectRow = {
  id: string;
  slug: string;
  title: string;
  synthesis: string;
  metadata_review_status: ReviewStatus;
  status: "active" | "archived";
  subject_categories: { categories: CategoryRow | null }[] | null;
  impacts: RawImpact[] | null;
  ideas: RawIdea[] | null;
  results: RawResult[] | null;
  government_positions: RawGovernmentPosition[] | null;
  polls: RawPoll[] | null;
};

function byDisplayOrder<T extends { display_order: number }>(rows: T[] | null): T[] {
  return [...(rows ?? [])].sort((a, b) => a.display_order - b.display_order);
}

// ---------------------------------------------------------------------------
// Homepage list: one row per subject, with just enough to render a card and
// sort/filter it (full ideas/arguments/sources are only loaded on the detail
// page).
// ---------------------------------------------------------------------------
export interface SubjectSummary {
  id: string;
  slug: string;
  title: string;
  categories: CategoryRow[];
  headlineImpact: ImpactRow | null;
  /** Aggregated from `results`; 0/0/0 when nobody has voted yet. */
  forPct: number;
  againstPct: number;
  neutralPct: number;
  totalVotes: number;
  /** Most recently conducted approved poll, if any. */
  latestPoll: PollRow | null;
}

type RawSummaryRow = {
  id: string;
  slug: string;
  title: string;
  subject_categories: { categories: CategoryRow | null }[] | null;
  impacts: (ImpactRow & { review_status: ReviewStatus })[] | null;
  results: { leaning: number; vote_count: number }[] | null;
  polls: RawPoll[] | null;
};

/** Review gate for AI-generated content — only 'approved' rows are ever shown publicly. */
export type ReviewStatus = "pending_review" | "approved" | "rejected";

function onlyApproved<T extends { review_status: ReviewStatus }>(rows: T[] | null): T[] {
  return (rows ?? []).filter((row) => row.review_status === "approved");
}

export const getSubjectsList = unstable_cache(fetchSubjectsList, ["subjects-list"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["subjects"],
});

async function fetchSubjectsList(): Promise<SubjectSummary[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      id, slug, title,
      subject_categories ( categories ( slug, name, budget_eur, budget_pct_state, trust_score ) ),
      impacts ( id, title, value, unit, is_headline, review_status ),
      results ( leaning, vote_count ),
      polls ( id, institute, conducted_on, question, favorable_pct, sample_size, source_url, review_status )
    `
    )
    .eq("status", "active")
    .order("title");

  if (error) throw error;

  return (data as unknown as RawSummaryRow[]).map((row) => {
    const impacts = onlyApproved(row.impacts);
    const results = row.results ?? [];
    const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);
    const pctOf = (matches: (leaning: number) => boolean) =>
      totalVotes > 0 ? (results.filter((r) => matches(r.leaning)).reduce((s, r) => s + r.vote_count, 0) / totalVotes) * 100 : 0;
    const polls = onlyApproved(row.polls).sort((a, b) => b.conducted_on.localeCompare(a.conducted_on));

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      categories: (row.subject_categories ?? [])
        .map((link) => link.categories)
        .filter((category): category is CategoryRow => category !== null),
      headlineImpact: impacts.find((impact) => impact.is_headline) ?? impacts[0] ?? null,
      forPct: pctOf((l) => l > 0),
      againstPct: pctOf((l) => l < 0),
      neutralPct: pctOf((l) => l === 0),
      totalVotes,
      latestPoll: polls[0] ?? null,
    };
  });
}

export interface VoteExpressSubject {
  id: string;
  slug: string;
  title: string;
  category: CategoryRow | null;
  headlineImpact: ImpactRow | null;
  latestPoll: PollRow | null;
  results: ResultRow[];
  forPct: number;
  totalVotes: number;
}

type RawVoteExpressRow = {
  id: string;
  slug: string;
  title: string;
  subject_categories: { categories: CategoryRow | null }[] | null;
  impacts: (ImpactRow & { review_status: ReviewStatus })[] | null;
  results: ResultRow[] | null;
  polls: RawPoll[] | null;
};

/**
 * Subjects with voting open (i.e. at least one `results` row), shaped for
 * the Vote Express quick-vote deck: one category, one headline stat, and
 * the raw result rows so the deck can call castQuickVote with a real
 * result_id.
 */
export const getVoteExpressSubjects = unstable_cache(fetchVoteExpressSubjects, ["vote-express-subjects"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["subjects"],
});

async function fetchVoteExpressSubjects(): Promise<VoteExpressSubject[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      id, slug, title,
      subject_categories ( categories ( slug, name, budget_eur, budget_pct_state, trust_score ) ),
      impacts ( id, title, value, unit, is_headline, review_status ),
      results ( id, label, leaning, vote_count ),
      polls ( id, institute, conducted_on, question, favorable_pct, sample_size, source_url, review_status )
    `
    )
    .eq("status", "active")
    .order("title");

  if (error) throw error;

  return (data as unknown as RawVoteExpressRow[])
    .map((row) => {
      const impacts = onlyApproved(row.impacts);
      const results = row.results ?? [];
      const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);
      const forVotes = results.filter((r) => r.leaning > 0).reduce((sum, r) => sum + r.vote_count, 0);
      const polls = onlyApproved(row.polls).sort((a, b) => b.conducted_on.localeCompare(a.conducted_on));

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: (row.subject_categories ?? []).map((link) => link.categories).find((c): c is CategoryRow => c !== null) ?? null,
        headlineImpact: impacts.find((impact) => impact.is_headline) ?? impacts[0] ?? null,
        latestPoll: polls[0] ?? null,
        results,
        forPct: totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0,
        totalVotes,
      };
    })
    .filter((subject) => subject.results.length > 0);
}

export const getCategories = unstable_cache(fetchCategories, ["categories"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["categories"],
});

async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from("categories").select("slug, name, budget_eur, budget_pct_state, trust_score").order("display_order");
  if (error) throw error;
  return data ?? [];
}

export interface SubjectSitemapEntry {
  slug: string;
  updatedAt: string;
}

/** Slug + last-modified only — for app/sitemap.ts, deliberately not the full getSubjectsList() shape. */
export const getActiveSubjectSlugs = unstable_cache(fetchActiveSubjectSlugs, ["subject-slugs"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["subjects"],
});

async function fetchActiveSubjectSlugs(): Promise<SubjectSitemapEntry[]> {
  const { data, error } = await supabase.from("subjects").select("slug, updated_at").eq("status", "active");
  if (error) throw error;
  return (data ?? []).map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}

export const getSubjectBySlug = unstable_cache(fetchSubjectBySlug, ["subject-by-slug"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["subjects"],
});

async function fetchSubjectBySlug(slug: string): Promise<SubjectDetail | null> {
  const { data, error } = await supabase
    .from("subjects")
    .select(
      `
      id, slug, title, synthesis, metadata_review_status, status,
      subject_categories ( categories ( slug, name, budget_eur, budget_pct_state, trust_score ) ),
      impacts ( id, title, value, unit, is_headline, display_order, review_status ),
      ideas ( id, title, description, impact_value, display_order, review_status,
        arguments ( id, title, description, display_order, review_status,
          argument_sources ( id, title, publisher, url, published_on, display_order )
        )
      ),
      results ( id, label, leaning, vote_count, display_order ),
      government_positions ( id, position_date, title, description, stance, source_url, display_order, review_status ),
      polls ( id, institute, conducted_on, question, favorable_pct, sample_size, source_url, review_status )
    `
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as RawSubjectRow;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    synthesis: row.metadata_review_status === "approved" ? row.synthesis : "",
    categories: (row.subject_categories ?? [])
      .map((link) => link.categories)
      .filter((category): category is CategoryRow => category !== null),
    impacts: byDisplayOrder(onlyApproved(row.impacts)),
    ideas: byDisplayOrder(onlyApproved(row.ideas)).map((idea) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      impact_value: idea.impact_value,
      arguments: byDisplayOrder(onlyApproved(idea.arguments)).map((arg) => ({
        id: arg.id,
        title: arg.title,
        description: arg.description,
        sources: byDisplayOrder(arg.argument_sources),
      })),
    })),
    results: byDisplayOrder(row.results),
    governmentPositions: onlyApproved(row.government_positions).sort((a, b) =>
      a.position_date.localeCompare(b.position_date)
    ),
    polls: onlyApproved(row.polls).sort((a, b) => a.conducted_on.localeCompare(b.conducted_on)),
  };
}

// ---------------------------------------------------------------------------
// Share card: one fact from the synthesis, shown both on the share image
// (app/sujets/[slug]/opengraph-image.tsx) and in the post-vote share texts
// (lib/shareTexts.ts) — both read it from here so they can never disagree.
// ---------------------------------------------------------------------------
export interface SubjectCard {
  figure: string;
  label: string;
}

export const getSubjectCard = unstable_cache(fetchSubjectCard, ["subject-card"], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: ["subjects"],
});

/**
 * Kept apart from fetchSubjectBySlug: card_figure/card_label come from a
 * manually-run migration (20261031100000_add_subject_card_figure.sql), and
 * until it runs the select fails — callers then fall back to the title alone
 * instead of the whole subject page breaking.
 */
async function fetchSubjectCard(slug: string): Promise<SubjectCard | null> {
  const { data, error } = await supabase.from("subjects").select("card_figure, card_label").eq("slug", slug).maybeSingle();
  if (error || !data?.card_figure || !data.card_label) return null;
  return { figure: data.card_figure, label: data.card_label };
}
