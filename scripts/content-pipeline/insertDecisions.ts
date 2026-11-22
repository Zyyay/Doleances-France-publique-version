/**
 * Government decisions — writes a subject's government positions
 * ("décisions gouvernementales"), drafted by Claude directly in
 * conversation (no billed Anthropic API key involved).
 *
 * Usage: npx tsx scripts/content-pipeline/insertDecisions.ts <draft.json>
 *
 * Expected JSON shape:
 * {
 *   "slug": "reduction-flux-migratoires",
 *   "positions": [
 *     { "position_date": "2024-01-26", "title": "...", "description": "...", "stance": "for", "source_url": "..." }
 *   ]
 * }
 *
 * The draft should already have gone through the two-pass review described
 * in the pipeline (Claude drafts, an independent Task/Agent subagent judges
 * neutrality) before it ever reaches this script. This script's own job is
 * the hard, non-negotiable checks: length limits and source whitelist. It
 * writes everything as review_status = 'pending_review' — a human still has
 * to approve it via review.ts.
 */
import { readFileSync } from "fs";
import { z } from "zod";
import { supabaseAdmin } from "./supabaseAdmin";
import { LENGTH_LIMITS } from "./config";
import { checkLength, checkWhitelisted, type ValidationIssue } from "./validators";

const PositionSchema = z.object({
  position_date: z.string(),
  title: z.string(),
  description: z.string(),
  stance: z.enum(["for", "against", "neutral"]),
  source_url: z.string(),
});

const DraftSchema = z.object({
  slug: z.string(),
  positions: z.array(PositionSchema),
});

type Position = z.infer<typeof PositionSchema>;

function validatePosition(position: Position): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  checkLength("position.title", position.title, LENGTH_LIMITS.governmentPositionTitle, issues);
  checkLength("position.description", position.description, LENGTH_LIMITS.governmentPositionDescription, issues);
  checkWhitelisted("position.source_url", position.source_url, issues);
  if (Number.isNaN(Date.parse(position.position_date))) {
    issues.push({
      field: "position.position_date",
      message: `position_date "${position.position_date}" is not a valid date`,
    });
  }
  return issues;
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/content-pipeline/insertDecisions.ts <draft.json>");
    process.exit(1);
  }

  const draft = DraftSchema.parse(JSON.parse(readFileSync(path, "utf-8")));

  const { data: subject, error } = await supabaseAdmin
    .from("subjects")
    .select("id, title")
    .eq("slug", draft.slug)
    .maybeSingle();
  if (error) throw error;
  if (!subject) {
    console.error(`No subject found with slug "${draft.slug}".`);
    process.exit(1);
  }

  let inserted = 0;
  for (const [index, position] of draft.positions.entries()) {
    const issues = validatePosition(position);
    if (issues.length > 0) {
      console.log(`[insertDecisions] Dropped position "${position.title}": ${issues.map((i) => i.message).join("; ")}`);
      continue;
    }
    const { error: insertError } = await supabaseAdmin.from("government_positions").insert({
      subject_id: subject.id,
      position_date: position.position_date,
      title: position.title,
      description: position.description,
      stance: position.stance,
      source_url: position.source_url,
      display_order: index,
      review_status: "pending_review",
    });
    if (insertError) throw insertError;
    inserted++;
  }

  console.log(`[insertDecisions] Inserted ${inserted}/${draft.positions.length} position(s) as pending_review.`);
  console.log("[insertDecisions] Run `npm run pipeline:review -- list` to review them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
