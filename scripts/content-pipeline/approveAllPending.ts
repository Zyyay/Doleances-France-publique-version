/**
 * Bulk-approves every row currently sitting at review_status = 'pending_review'
 * across ideas, arguments, polls, government_positions. Intended for use right
 * after a batch has already gone through the independent-verifier review
 * described in the other pipeline scripts — this just saves calling
 * review.ts approve one id at a time.
 *
 * Usage: npx tsx scripts/content-pipeline/approveAllPending.ts [table ...]
 * With no arguments, approves pending rows in all four tables.
 */
import { supabaseAdmin } from "./supabaseAdmin";

const ALL_TABLES = ["ideas", "arguments", "polls", "government_positions"] as const;

async function main() {
  const requested = process.argv.slice(2);
  const tables = requested.length > 0 ? requested : ALL_TABLES;

  for (const table of tables) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ review_status: "approved" })
      .eq("review_status", "pending_review")
      .select("id");
    if (error) throw error;
    console.log(`[approveAllPending] ${table}: approved ${data?.length ?? 0} row(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
