/**
 * Polls — writes a subject's polls ("sondages"), drafted by Claude directly
 * in conversation (no billed Anthropic API key involved).
 *
 * Usage: npx tsx scripts/content-pipeline/insertPolls.ts <draft.json>
 *
 * Expected JSON shape:
 * {
 *   "slug": "reduction-flux-migratoires",
 *   "polls": [
 *     { "institute": "...", "conducted_on": "2026-01-15", "question": "...", "favorable_pct": 54, "sample_size": 1200, "source_url": "..." }
 *   ]
 * }
 *
 * The draft should already have gone through the two-pass review described
 * in the pipeline (Claude drafts, an independent Task/Agent subagent judges
 * plausibility) before it ever reaches this script. This script's own job is
 * the hard, non-negotiable checks: length limits, source whitelist, and
 * sane numeric ranges. It writes everything as review_status =
 * 'pending_review' — a human still has to approve it via review.ts.
 */
import { readFileSync } from "fs";
import { z } from "zod";
import { supabaseAdmin } from "./supabaseAdmin";
import { LENGTH_LIMITS } from "./config";
import { checkLength, checkWhitelisted, type ValidationIssue } from "./validators";

const PollSchema = z.object({
  institute: z.string(),
  conducted_on: z.string(),
  question: z.string(),
  favorable_pct: z.number(),
  sample_size: z.number(),
  source_url: z.string(),
});

const DraftSchema = z.object({
  slug: z.string(),
  polls: z.array(PollSchema),
});

type Poll = z.infer<typeof PollSchema>;

function validatePoll(poll: Poll): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  checkLength("poll.institute", poll.institute, LENGTH_LIMITS.pollInstitute, issues);
  checkLength("poll.question", poll.question, LENGTH_LIMITS.pollQuestion, issues);
  checkWhitelisted("poll.source_url", poll.source_url, issues);
  if (poll.favorable_pct < 0 || poll.favorable_pct > 100) {
    issues.push({ field: "poll.favorable_pct", message: `favorable_pct ${poll.favorable_pct} is out of range 0-100` });
  }
  if (poll.sample_size <= 0) {
    issues.push({ field: "poll.sample_size", message: `sample_size ${poll.sample_size} must be positive` });
  }
  if (Number.isNaN(Date.parse(poll.conducted_on))) {
    issues.push({ field: "poll.conducted_on", message: `conducted_on "${poll.conducted_on}" is not a valid date` });
  }
  return issues;
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/content-pipeline/insertPolls.ts <draft.json>");
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
  for (const poll of draft.polls) {
    const issues = validatePoll(poll);
    if (issues.length > 0) {
      console.log(`[insertPolls] Dropped poll "${poll.institute}": ${issues.map((i) => i.message).join("; ")}`);
      continue;
    }
    const { error: insertError } = await supabaseAdmin.from("polls").insert({
      subject_id: subject.id,
      institute: poll.institute,
      conducted_on: poll.conducted_on,
      question: poll.question,
      favorable_pct: poll.favorable_pct,
      sample_size: poll.sample_size,
      source_url: poll.source_url,
      review_status: "pending_review",
    });
    if (insertError) throw insertError;
    inserted++;
  }

  console.log(`[insertPolls] Inserted ${inserted}/${draft.polls.length} poll(s) as pending_review.`);
  console.log("[insertPolls] Run `npm run pipeline:review -- list` to review them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
