/**
 * Arguments — writes benefit-and-limits arguments (with sources) for one
 * idea, drafted by Claude directly in conversation (no billed Anthropic API
 * key involved).
 *
 * Usage: npx tsx scripts/content-pipeline/insertArguments.ts <draft.json>
 *
 * Expected JSON shape:
 * {
 *   "ideaId": "uuid",
 *   "arguments": [{ "title": "...", "description": "...", "sources": [{ "title": "...", "url": "...", "publisher": "..." }] }]
 * }
 *
 * Only runs against an idea that is already review_status = 'approved'.
 * Hard checks here: length limits + every source URL must be in the
 * whitelist (config.ts) — non-negotiable, checked in code, not trusted from
 * the draft alone.
 */
import { readFileSync } from "fs";
import { z } from "zod";
import { supabaseAdmin } from "./supabaseAdmin";
import { LENGTH_LIMITS } from "./config";
import { checkLength, checkWhitelisted, type ValidationIssue } from "./validators";

const ArgumentSchema = z.object({
  title: z.string(),
  description: z.string(),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        publisher: z.string().optional(),
      })
    )
    .min(1),
});

const DraftSchema = z.object({
  ideaId: z.string(),
  arguments: z.array(ArgumentSchema),
});

type Argument = z.infer<typeof ArgumentSchema>;

function validateArgument(arg: Argument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  checkLength("argument.title", arg.title, LENGTH_LIMITS.argumentTitle, issues);
  checkLength("argument.description", arg.description, LENGTH_LIMITS.argumentDescription, issues);
  for (const source of arg.sources) {
    checkLength("source.title", source.title, LENGTH_LIMITS.sourceTitle, issues);
    checkWhitelisted("source.url", source.url, issues);
  }
  return issues;
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: npx tsx scripts/content-pipeline/insertArguments.ts <draft.json>");
    process.exit(1);
  }

  const draft = DraftSchema.parse(JSON.parse(readFileSync(path, "utf-8")));

  const { data: idea, error } = await supabaseAdmin
    .from("ideas")
    .select("id, title, review_status")
    .eq("id", draft.ideaId)
    .maybeSingle();
  if (error) throw error;
  if (!idea) {
    console.error(`No idea found with id "${draft.ideaId}".`);
    process.exit(1);
  }
  if (idea.review_status !== "approved") {
    console.error(`Idea "${idea.title}" is ${idea.review_status}, not approved. Approve it first (see review.ts).`);
    process.exit(1);
  }

  let order = 0;
  let inserted = 0;
  for (const arg of draft.arguments) {
    const issues = validateArgument(arg);
    if (issues.length > 0) {
      console.log(`[insertArguments] Dropped argument "${arg.title}": ${issues.map((i) => i.message).join("; ")}`);
      continue;
    }

    const { data: insertedRow, error: argError } = await supabaseAdmin
      .from("arguments")
      .insert({
        idea_id: idea.id,
        title: arg.title,
        description: arg.description,
        display_order: order++,
        review_status: "pending_review",
      })
      .select("id")
      .single();
    if (argError) throw argError;

    for (const [sourceOrder, source] of arg.sources.entries()) {
      const { error: sourceError } = await supabaseAdmin.from("argument_sources").insert({
        argument_id: insertedRow.id,
        title: source.title,
        url: source.url,
        publisher: source.publisher ?? null,
        display_order: sourceOrder,
      });
      if (sourceError) throw sourceError;
    }

    inserted++;
  }

  console.log(`[insertArguments] Inserted ${inserted} argument(s) as pending_review.`);
  console.log("[insertArguments] Run `npm run pipeline:review -- list` to review them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
