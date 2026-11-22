/**
 * Every table below has a `subject_id uuid references public.subjects(id) on
 * delete cascade` column, so rows here should never actually outlive their
 * parent subject. This script exists for the case where that's no longer
 * true in practice (rows inserted before a constraint existed, manual data
 * surgery, schema drift between a migration file and what's actually live)
 * — it finds subject_id values that don't match any row in `subjects` and
 * removes them.
 *
 * Defaults to a dry run: it only reports what it would delete. Pass --apply
 * to actually delete.
 *
 * Usage:
 *   npx tsx scripts/content-pipeline/cleanupOrphanedSubjectRows.ts            (dry run)
 *   npx tsx scripts/content-pipeline/cleanupOrphanedSubjectRows.ts --apply    (deletes)
 */
import { supabaseAdmin } from "./supabaseAdmin";

const TABLES_WITH_SUBJECT_ID = [
  "subject_categories",
  "impacts",
  "ideas",
  "results",
  "government_positions",
  "polls",
  "votes",
  "page_feedback",
] as const;

async function getValidSubjectIds(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin.from("subjects").select("id").limit(100000);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.id as string));
}

async function findOrphanSubjectIds(table: string, validIds: Set<string>): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from(table).select("subject_id").limit(100000);
  if (error) throw error;

  const seen = new Set<string>();
  for (const row of data ?? []) {
    const subjectId = row.subject_id as string;
    if (subjectId && !validIds.has(subjectId)) seen.add(subjectId);
  }
  return [...seen];
}

async function main() {
  const apply = process.argv.includes("--apply");

  const validIds = await getValidSubjectIds();
  console.log(`[cleanupOrphanedSubjectRows] ${validIds.size} valid subject(s) in public.subjects.`);

  for (const table of TABLES_WITH_SUBJECT_ID) {
    const orphanIds = await findOrphanSubjectIds(table, validIds);
    if (orphanIds.length === 0) {
      console.log(`[cleanupOrphanedSubjectRows] ${table}: no orphaned subject_id(s).`);
      continue;
    }

    if (!apply) {
      console.log(
        `[cleanupOrphanedSubjectRows] ${table}: ${orphanIds.length} orphaned subject_id(s) found ` +
          `(dry run, would delete): ${orphanIds.join(", ")}`
      );
      continue;
    }

    const { data, error } = await supabaseAdmin.from(table).delete().in("subject_id", orphanIds).select("id");
    if (error) throw error;
    console.log(`[cleanupOrphanedSubjectRows] ${table}: deleted ${data?.length ?? 0} row(s).`);
  }

  if (!apply) {
    console.log("\n[cleanupOrphanedSubjectRows] Dry run only — re-run with --apply to delete the rows above.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
