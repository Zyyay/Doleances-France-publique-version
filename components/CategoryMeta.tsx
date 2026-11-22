import type { CategoryRow } from "@/lib/subjects";
import { categoryColorVar } from "@/components/CategoryBadge";
import styles from "./CategoryMeta.module.css";

const pctFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** Circular meter: filled arc = this category's share of the state budget, out of the full 100% circle. Ring color follows the category's own identity color (same one used by CategoryBadge). Track and inside-value color default to that same category color (low opacity) / --ink, tuned for a light background — pass `trackColor`/`valueColor` to override both for use on a dark surface (e.g. the subject hero band), where a category color at low opacity can be nearly invisible. */
function BudgetShareRing({
  slug,
  pct,
  size,
  valueInside,
  valueColor = "var(--ink)",
  trackColor,
}: {
  slug: string;
  pct: number;
  size: number;
  valueInside?: string;
  valueColor?: string;
  trackColor?: string;
}) {
  const colorVar = `var(${categoryColorVar(slug)})`;
  const strokeWidth = size <= 30 ? 3.5 : 4;
  const r = 18 - strokeWidth / 2;
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" style={{ flex: "none" }}>
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke={trackColor ?? colorVar}
        strokeOpacity={trackColor ? 1 : 0.18}
        strokeWidth={strokeWidth}
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke={colorVar}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${clamped} ${100 - clamped}`}
        transform="rotate(-90 18 18)"
      />
      {valueInside && (
        <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill={valueColor}>
          {valueInside}
        </text>
      )}
    </svg>
  );
}

/** Shown to the right of the "Les plus populaires" title once a single category is selected. */
export function CategoryMetaPanel({ category }: { category: CategoryRow }) {
  if (category.budget_pct_state == null) return null;
  const pctLabel = `${pctFormatter.format(category.budget_pct_state)} %`;

  return (
    <div className={styles.row}>
      <span className={styles.label}>
        Budget de l&apos;état pour
        <br />
        {category.name}
      </span>
      <BudgetShareRing slug={category.slug} pct={category.budget_pct_state} size={68} valueInside={pctLabel} />
    </div>
  );
}

/** Sits to the right of the category CTA pill(s) on subject pages — sits on the dark hero band, so the ring's track/value are forced light regardless of the category color. */
export function CategoryMetaInline({ category }: { category: CategoryRow }) {
  if (category.budget_pct_state == null) return null;
  const pctLabel = `${pctFormatter.format(category.budget_pct_state)} %`;

  return (
    <div className={styles.inline}>
      <BudgetShareRing
        slug={category.slug}
        pct={category.budget_pct_state}
        size={60}
        valueInside={pctLabel}
        valueColor="#fff"
        trackColor="rgba(255, 255, 255, 0.6)"
      />
      <span>du budget de l&apos;État</span>
    </div>
  );
}
