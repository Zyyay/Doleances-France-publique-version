/**
 * Ideas — writes a subject's idea list, drafted by Claude directly in
 * conversation (no billed Anthropic API key involved).
 *
 * Usage: npx tsx scripts/content-pipeline/insertIdeas.ts <draft.json>
 *
 * Expected JSON shape:
 * {
 *   "slug": "retraite-a-points-unique",
 *   "ideas": [{ "title": "...", "description": "...", "impact_value": 1800000000 }, ...]
 * }
 *
 * `impact_value` is optional and, when present, must be a raw (unscaled)
 * figure in the same unit as the subject's own headline impact — see
 * prompts/ideas-extract.md for how it's chosen. There's no per-idea unit
 * field: the unit is always inherited from the subject's headline impact.
 *
 * Only runs against a subject whose own metadata is already
 * review_status = 'approved' (see insertSubject.ts) — a subject's title,
 * description and synthesis must be validated before ideas are drafted
 * for it. The subject must also already have a headline impact (every
 * approved subject does, see insertSubject.ts).
 *
 * The draft should already have gone through the two-pass review described
 * in the pipeline (Claude drafts, an independent Task/Agent subagent judges
 * neutrality) before it ever reaches this script. This script's own job is
 * the hard, non-negotiable check: length limits. It writes everything as
 * review_status = 'pending_review' — a human still has to approve it via
 * review.ts.
 */
import { readFileSync } from "fs";
import { z } from "zod";
import { supabaseAdmin } from "./supabaseAdmin";
import { LENGTH_LIMITS } from "./config";
import { checkLength, type ValidationIssue } from "./validators";

const DraftSchema = z.object({
  slug: z.string(),
  ideas: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact_value: z.number().positive().optional(),
    })
  ),
});

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/content-pipeline/insertIdeas.ts <draft.json>");
    process.exit(1);
  }

  const draft = DraftSchema.parse(JSON.parse(readFileSync(path, "utf-8")));

  const { data: subject, error } = await supabaseAdmin
    .from("subjects")
    .select("id, title, metadata_review_status, impacts(value, unit, is_headline)")
    .eq("slug", draft.slug)
    .maybeSingle();
  if (error) throw error;
  if (!subject) {
    console.error(`No subject found with slug "${draft.slug}".`);
    process.exit(1);
  }
  if (subject.metadata_review_status !== "approved") {
    console.error(
      `Subject "${subject.title}" is ${subject.metadata_review_status}, not approved. Approve it first (see review.ts).`
    );
    process.exit(1);
  }
  const headlineImpact = subject.impacts.find((impact) => impact.is_headline);
  if (!headlineImpact && draft.ideas.some((idea) => idea.impact_value !== undefined)) {
    console.error(`Subject "${subject.title}" has no headline impact yet — can't validate ideas' impact_value unit.`);
    process.exit(1);
  }

  let inserted = 0;
  for (const [index, idea] of draft.ideas.entries()) {
    const issues: ValidationIssue[] = [];
    checkLength("idea.title", idea.title, LENGTH_LIMITS.ideaTitle, issues);
    checkLength("idea.description", idea.description, LENGTH_LIMITS.ideaDescription, issues);
    if (issues.length > 0) {
      console.log(`[insertIdeas] Dropped idea "${idea.title}": ${issues.map((i) => i.message).join("; ")}`);
      continue;
    }
    const { error: insertError } = await supabaseAdmin.from("ideas").insert({
      subject_id: subject.id,
      title: idea.title,
      description: idea.description,
      impact_value: idea.impact_value ?? null,
      display_order: index,
      review_status: "pending_review",
    });
    if (insertError) throw insertError;
    inserted++;
  }

  console.log(`[insertIdeas] Inserted ${inserted}/${draft.ideas.length} idea(s) as pending_review.`);
  console.log("[insertIdeas] Run `npm run pipeline:review -- list` to review them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
