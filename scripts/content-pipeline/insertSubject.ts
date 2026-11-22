/**
 * Subject — creates a new subject's own record (title, synthesis,
 * category), drafted by Claude directly in conversation (no
 * billed Anthropic API key involved). This is the first pipeline stage —
 * Ideas can only be drafted for a subject once this stage is approved.
 *
 * Usage: npx tsx scripts/content-pipeline/insertSubject.ts <draft.json>
 *
 * Expected JSON shape:
 * {
 *   "slug": "reduction-flux-migratoires",
 *   "title": "Immigration : faut-il réduire les flux migratoires ?",
 *   "synthesis": "...",
 *   "category": "secu",
 *   "card_figure": "6 sur 7",
 *   "card_label": "OQTF restent sans effet",
 *   "impacts": [
 *     { "title": "...", "value": 7740000000, "unit": "€", "is_headline": true },
 *     { "title": "...", "value": 6000000, "unit": "personnes", "is_headline": false }
 *   ]
 * }
 *
 * `impacts` needs exactly one € figure (mandatory) plus at most one
 * "personnes" figure (optional), and exactly one of them flagged
 * is_headline — see prompts/subject-extract.md for how the values are
 * chosen. Values are raw/unscaled (7740000000, not 7.74) — the frontend
 * applies compact formatting for display.
 *
 * `card_figure`/`card_label` are mandatory: the share image and the
 * post-vote share texts lead with them. They restate one fact from the
 * synthesis that illustrates the trend of the subject's polls — e.g. "142 %"
 * + "d'occupation : 90 020 détenus pour 63 348 places".
 *
 * The draft should already have gone through the two-pass review described
 * in the pipeline (Claude drafts, an independent Task/Agent subagent judges
 * neutrality) before it ever reaches this script. This script's own job is
 * the hard, non-negotiable checks: length limits, slug format/uniqueness,
 * a valid category, and impact shape. The subject is inserted as status =
 * 'archived' (hidden from the public site) with metadata_review_status =
 * 'pending_review' — a human has to approve it via review.ts before it
 * goes live. Impacts are inserted alongside it as review_status =
 * 'pending_review', same gate.
 */
import { readFileSync } from "fs";
import { z } from "zod";
import { supabaseAdmin } from "./supabaseAdmin";
import { CATEGORY_SLUGS, IMPACT_UNITS, LENGTH_LIMITS } from "./config";
import { checkLength, checkSlugFormat, type ValidationIssue } from "./validators";

const DraftSchema = z.object({
  slug: z.string(),
  title: z.string(),
  synthesis: z.string(),
  category: z.enum(CATEGORY_SLUGS),
  card_figure: z.string().min(1),
  card_label: z.string().min(1),
  impacts: z
    .array(
      z.object({
        title: z.string(),
        value: z.number().positive(),
        unit: z.enum(IMPACT_UNITS),
        is_headline: z.boolean(),
      })
    )
    .min(1),
});

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/content-pipeline/insertSubject.ts <draft.json>");
    process.exit(1);
  }

  const draft = DraftSchema.parse(JSON.parse(readFileSync(path, "utf-8")));

  const issues: ValidationIssue[] = [];
  checkSlugFormat("slug", draft.slug, issues);
  checkLength("title", draft.title, LENGTH_LIMITS.subjectTitle, issues);
  checkLength("synthesis", draft.synthesis, LENGTH_LIMITS.subjectSynthesis, issues);
  checkLength("card_figure", draft.card_figure, LENGTH_LIMITS.cardFigure, issues);
  checkLength("card_label", draft.card_label, LENGTH_LIMITS.cardLabel, issues);
  draft.impacts.forEach((impact, i) => checkLength(`impacts[${i}].title`, impact.title, LENGTH_LIMITS.impactTitle, issues));
  const euroImpacts = draft.impacts.filter((impact) => impact.unit === "€");
  const personnesImpacts = draft.impacts.filter((impact) => impact.unit === "personnes");
  const headlineImpacts = draft.impacts.filter((impact) => impact.is_headline);
  if (euroImpacts.length !== 1) {
    issues.push({ field: "impacts", message: `expected exactly one € impact, got ${euroImpacts.length}` });
  }
  if (personnesImpacts.length > 1) {
    issues.push({ field: "impacts", message: `expected at most one personnes impact, got ${personnesImpacts.length}` });
  }
  if (headlineImpacts.length !== 1) {
    issues.push({ field: "impacts", message: `expected exactly one is_headline impact, got ${headlineImpacts.length}` });
  }
  if (issues.length > 0) {
    console.error(`[insertSubject] Rejected: ${issues.map((i) => i.message).join("; ")}`);
    process.exit(1);
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("subjects")
    .select("id")
    .eq("slug", draft.slug)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    console.error(`[insertSubject] A subject with slug "${draft.slug}" already exists.`);
    process.exit(1);
  }

  const { data: category, error: categoryError } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("slug", draft.category)
    .single();
  if (categoryError) throw categoryError;

  const { data: subject, error: insertError } = await supabaseAdmin
    .from("subjects")
    .insert({
      slug: draft.slug,
      title: draft.title,
      synthesis: draft.synthesis,
      card_figure: draft.card_figure,
      card_label: draft.card_label,
      status: "archived",
      metadata_review_status: "pending_review",
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const { error: linkError } = await supabaseAdmin
    .from("subject_categories")
    .insert({ subject_id: subject.id, category_id: category.id });
  if (linkError) throw linkError;

  const { error: impactsError } = await supabaseAdmin.from("impacts").insert(
    draft.impacts.map((impact, index) => ({
      subject_id: subject.id,
      title: impact.title,
      value: impact.value,
      unit: impact.unit,
      is_headline: impact.is_headline,
      display_order: index,
      review_status: "pending_review",
    }))
  );
  if (impactsError) throw impactsError;

  // Default vote options — every subject gets Pour/Contre unless someone
  // manually adjusts `results` in the DB afterwards (e.g. to add "Sans
  // opinion" or a finer-grained scale, up to 4 options total).
  const { error: resultsError } = await supabaseAdmin.from("results").insert([
    { subject_id: subject.id, label: "Contre", leaning: -1, display_order: 0 },
    { subject_id: subject.id, label: "Pour", leaning: 1, display_order: 1 },
  ]);
  if (resultsError) throw resultsError;

  console.log(`[insertSubject] Inserted "${draft.title}" (${draft.slug}) as pending_review, hidden until approved.`);
  console.log("[insertSubject] Run `npm run pipeline:review -- list` to review it.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
