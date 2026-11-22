/**
 * Manual validation CLI for AI-generated content sitting in review_status = 'pending_review'.
 *
 * Usage:
 *   npx tsx scripts/content-pipeline/review.ts list
 *   npx tsx scripts/content-pipeline/review.ts approve <table> <id>
 *   npx tsx scripts/content-pipeline/review.ts reject <table> <id>
 *
 * <table> is one of: subjects (targets metadata_review_status — title,
 * synthesis, category — and publishes the subject on approval),
 * ideas, arguments, impacts, polls, government_positions.
 */
import { supabaseAdmin } from "./supabaseAdmin";

const TABLES = ["ideas", "arguments", "impacts", "polls", "government_positions"] as const;
type Table = (typeof TABLES)[number];

async function list() {
  const { data: subjects, error: subjectsError } = await supabaseAdmin
    .from("subjects")
    .select("id, slug, title, synthesis, metadata_review_status")
    .eq("metadata_review_status", "pending_review");
  if (subjectsError) throw subjectsError;
  for (const s of subjects ?? []) {
    console.log(`\n[subjects] ${s.id}  (${s.slug})`);
    console.log(`  title: ${s.title}`);
    console.log(`  synthesis: ${s.synthesis.slice(0, 200)}${s.synthesis.length > 200 ? "..." : ""}`);
  }

  for (const table of TABLES) {
    const { data, error } = await supabaseAdmin.from(table).select("*").eq("review_status", "pending_review");
    if (error) throw error;
    for (const row of data ?? []) {
      console.log(`\n[${table}] ${row.id}`);
      console.log(`  ${JSON.stringify(row, null, 2).split("\n").join("\n  ")}`);
    }
  }

  console.log(
    "\nApprove with: npx tsx scripts/content-pipeline/review.ts approve <table> <id>" +
      "\nReject with:  npx tsx scripts/content-pipeline/review.ts reject <table> <id>"
  );
}

async function setStatus(action: "approve" | "reject", table: string, id: string) {
  const status = action === "approve" ? "approved" : "rejected";

  if (table === "subjects") {
    const update: Record<string, string> = { metadata_review_status: status };
    // Approving a subject's own metadata is what makes it visible on the
    // public site; rejecting it leaves it archived/hidden.
    if (action === "approve") update.status = "active";
    const { error } = await supabaseAdmin.from("subjects").update(update).eq("id", id);
    if (error) throw error;
    console.log(`subjects/${id} metadata -> ${status}${action === "approve" ? " (now live)" : ""}`);
    return;
  }

  if (!TABLES.includes(table as Table)) {
    console.error(`Unknown table "${table}". Expected one of: subjects, ${TABLES.join(", ")}`);
    process.exit(1);
  }

  const { error } = await supabaseAdmin
    .from(table)
    .update({ review_status: status })
    .eq("id", id);
  if (error) throw error;
  console.log(`${table}/${id} -> ${status}`);
}

async function main() {
  const [command, table, id] = process.argv.slice(2);

  if (command === "list") {
    await list();
  } else if (command === "approve" || command === "reject") {
    if (!table || !id) {
      console.error(`Usage: npx tsx scripts/content-pipeline/review.ts ${command} <table> <id>`);
      process.exit(1);
    }
    await setStatus(command, table, id);
  } else {
    console.error("Usage: review.ts list | review.ts approve <table> <id> | review.ts reject <table> <id>");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
