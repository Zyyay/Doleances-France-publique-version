/**
 * Adds a new row to public.categories. display_order is assigned
 * automatically as (current max) + 1 — categories are append-only, existing
 * rows are never reordered (see migration 20260704120000_create_subjects_schema.sql).
 *
 * budget_eur/budget_pct_state/trust_score are intentionally left null: those
 * are illustrative figures (see migration 20260709110000_add_category_metadata.sql)
 * that should be filled in with real sourcing later, not guessed here.
 *
 * Adding a category here is only half the work — components/CategoryBadge.tsx
 * (icon + color CSS var) and app/globals.css (the --cat-<slug> light/dark
 * values) also need a matching entry, or the category renders as a plain
 * grey circle on the frontend.
 *
 * Defaults to a dry run. Pass --apply to actually insert.
 *
 * Usage:
 *   npx tsx scripts/content-pipeline/addCategory.ts <slug> <name>            (dry run)
 *   npx tsx scripts/content-pipeline/addCategory.ts <slug> <name> --apply    (inserts)
 */
import { supabaseAdmin } from "./supabaseAdmin";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--apply");
  const apply = process.argv.includes("--apply");
  const [slug, name] = args;
  if (!slug || !name) {
    console.error("Usage: npx tsx scripts/content-pipeline/addCategory.ts <slug> <name> [--apply]");
    process.exit(1);
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("categories")
    .select("id, slug, name, display_order")
    .order("display_order", { ascending: false });
  if (existingError) throw existingError;

  const collision = existing?.find((c) => c.slug === slug);
  if (collision) {
    console.error(`[addCategory] A category with slug "${slug}" already exists (display_order ${collision.display_order}).`);
    process.exit(1);
  }

  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1;
  console.log(
    `[addCategory] ${apply ? "INSERT" : "WOULD INSERT"}: slug="${slug}" name="${name}" display_order=${nextOrder}`
  );

  if (!apply) {
    console.log("[addCategory] Dry run only — re-run with --apply to insert.");
    return;
  }

  const { error: insertError } = await supabaseAdmin.from("categories").insert({
    slug,
    name,
    display_order: nextOrder,
  });
  if (insertError) throw insertError;

  console.log(`[addCategory] Inserted "${name}" (${slug}).`);
  console.log("[addCategory] Now add a matching icon/color in components/CategoryBadge.tsx and app/globals.css.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
