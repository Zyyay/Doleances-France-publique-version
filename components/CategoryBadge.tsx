import Link from "next/link";

const CATEGORY_COLOR_VAR: Record<string, string> = {
  econ: "--cat-econ",
  secu: "--cat-secu",
  just: "--cat-just",
  trav: "--cat-trav",
  sante: "--cat-sante",
  intl: "--cat-intl",
  edu: "--cat-edu",
  eco: "--cat-eco",
  culture: "--cat-culture",
  soc: "--cat-soc",
};

/** The CSS custom property (unresolved, e.g. "--cat-econ") backing a category's color — shared with anything that needs to color itself by category identity (e.g. CategoryMeta's budget-share ring). */
export function categoryColorVar(slug: string): string {
  return CATEGORY_COLOR_VAR[slug] ?? "--ink-faint";
}

function CategoryIcon({ slug }: { slug: string }) {
  const common = {
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    // Without explicit sizing, an inline <svg> falls back to the browser's
    // default replaced-element size (historically 300×150) instead of
    // filling its slot — the parent span's inline styles below can't
    // constrain it because <span> is display:inline, where width/height
    // are ignored. Forcing both here is what actually centers the icon.
    style: { display: "block" as const, width: "100%", height: "100%" },
  };

  switch (slug) {
    case "econ":
      // A friendly stack of coins instead of a single circled currency sign.
      return (
        <svg {...common}>
          <ellipse cx="10" cy="14" rx="6.4" ry="2.3" fill="currentColor" stroke="none" opacity="0.35" />
          <ellipse cx="10" cy="11.2" rx="6.4" ry="2.3" fill="currentColor" stroke="none" opacity="0.65" />
          <ellipse cx="10" cy="8.3" rx="6.4" ry="2.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "secu":
      // Shield with a bold keyhole instead of a thin sparkle cross.
      return (
        <svg {...common}>
          <path d="M10 3.3l5.6 2v4.2c0 3.7-2.3 6.3-5.6 7.5-3.3-1.2-5.6-3.8-5.6-7.5V5.3z" />
          <circle cx="10" cy="9.4" r="1.3" fill="currentColor" stroke="none" />
          <path d="M10 10.5v2.3" strokeWidth={2.4} />
        </svg>
      );
    case "just":
      // Bolder scale with solid filled pans instead of thin bead circles.
      return (
        <svg {...common}>
          <path d="M10 3.5v13.2M4.2 6.6h11.6M6.8 16.7h6.4" />
          <path d="M4.2 6.6l-2.4 4.3a2.7 2.7 0 0 0 4.8 0z" fill="currentColor" fillOpacity="0.85" stroke="none" />
          <path d="M15.8 6.6l-2.4 4.3a2.7 2.7 0 0 0 4.8 0z" fill="currentColor" fillOpacity="0.85" stroke="none" />
        </svg>
      );
    case "trav":
      // Briefcase with a bolder body fill and a solid clasp for more presence.
      return (
        <svg {...common}>
          <rect x="3.2" y="7.2" width="13.6" height="8.8" rx="2" fill="currentColor" fillOpacity="0.22" />
          <path d="M7.6 7.2V5.6c0-.7.6-1.3 1.3-1.3h2.2c.7 0 1.3.6 1.3 1.3v1.6M3.2 11.4h13.6" />
          <rect x="9" y="10.6" width="2" height="1.6" rx="0.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sante":
      // Solid, plush heart with a tiny sparkle instead of a heartbeat line.
      return (
        <svg {...common}>
          <path
            d="M10 16.3c-.3-.3-4.6-4.1-6-6.6-1-1.7-.6-3.9 1.2-4.9 1.6-.9 3.5-.3 4.8 1.3 1.3-1.6 3.2-2.2 4.8-1.3 1.8 1 2.2 3.2 1.2 4.9-1.4 2.5-5.7 6.3-6 6.6z"
            fill="currentColor"
            stroke="none"
          />
          <circle cx="13.6" cy="6.1" r="0.9" fill="currentColor" stroke="none" opacity="0.5" />
        </svg>
      );
    case "intl":
      // Globe with a bolder fill wash and thicker meridian lines for more weight.
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="7" fill="currentColor" fillOpacity="0.22" />
          <path
            d="M3 10h14M10 3c2.1 1.9 2.1 12.1 0 14M10 3c-2.1 1.9-2.1 12.1 0 14M4.3 6h11.4M4.3 14h11.4"
            strokeWidth={2}
          />
        </svg>
      );
    case "edu":
      // Filled mortarboard cap with a dangling tassel bead.
      return (
        <svg {...common}>
          <path d="M10 4.2l7.4 3.3-7.4 3.3-7.4-3.3z" fill="currentColor" stroke="none" />
          <path d="M5.6 9.2v2.6c0 1.3 2 2.4 4.4 2.4s4.4-1.1 4.4-2.4V9.2" />
          <path d="M16.4 8.2v3.4" />
          <circle cx="16.4" cy="12.4" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "eco":
      // Filled leaf with a small dew-drop accent instead of a stroked vein.
      return (
        <svg {...common}>
          <path
            d="M15.6 4.6c.5 5-1 8.7-4.5 10.6-2 1.1-4.3.4-5.3-1.5-1.5-3 .6-6.7 4.2-8.1 1.9-.8 4-1 5.6-1z"
            fill="currentColor"
            stroke="none"
          />
          <circle cx="13.3" cy="6.4" r="0.85" fill="currentColor" stroke="none" opacity="0.45" />
        </svg>
      );
    case "culture":
      // Classical pediment + columns (museum/monument) — a filled facade, not an outline.
      return (
        <svg {...common}>
          <path d="M10 2.6l7.2 4.1v1.7H2.8V6.7z" fill="currentColor" stroke="none" />
          <rect x="4.1" y="8.6" width="1.7" height="6.7" fill="currentColor" fillOpacity="0.85" stroke="none" />
          <rect x="9.1" y="8.6" width="1.7" height="6.7" fill="currentColor" fillOpacity="0.85" stroke="none" />
          <rect x="14.1" y="8.6" width="1.7" height="6.7" fill="currentColor" fillOpacity="0.85" stroke="none" />
          <rect x="2.4" y="15.5" width="15.2" height="1.7" rx="0.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "soc":
      // Two overlapping figures (population/société) — filled heads, arced bodies.
      return (
        <svg {...common}>
          <circle cx="7.2" cy="7" r="2.6" fill="currentColor" stroke="none" opacity="0.85" />
          <path d="M2.6 16.2c0-3 2-5 4.6-5s4.6 2 4.6 5" fill="currentColor" fillOpacity="0.22" stroke="none" />
          <circle cx="13.2" cy="8.4" r="2.3" fill="currentColor" stroke="none" />
          <path d="M9.8 16.2c0-2.6 1.7-4.4 3.9-4.4s3.9 1.8 3.9 4.4" fill="currentColor" fillOpacity="0.35" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="4" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

/** `invert` swaps the badge to a white circle with a category-colored icon — used when the badge sits on a surface that's already the category color (e.g. the active filter chip), so it doesn't disappear into its own background. */
export function CategoryBadge({ slug, size = 26, invert = false }: { slug: string; size?: number; invert?: boolean }) {
  const colorVar = categoryColorVar(slug);
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        background: invert ? "#fff" : `var(${colorVar})`,
        // Not var(--paper) — that token flips to near-black in dark mode,
        // which would turn this icon glyph near-invisible against the
        // still-bright category-colored circle. Always white here.
        color: invert ? `var(${colorVar})` : "#fff",
      }}
    >
      <span style={{ display: "block", width: size * 0.68, height: size * 0.68 }}>
        <CategoryIcon slug={slug} />
      </span>
    </span>
  );
}

// Only ever rendered on the subject page's color-block hero band — filled
// with the category's own color (like the homepage's active filter chip),
// so the badge inside is inverted (white circle, colored icon) to stay
// visible against a same-colored pill instead of disappearing into it.
export function CategoryTag({ slug, name }: { slug: string; name: string }) {
  const colorVar = categoryColorVar(slug);
  return (
    <Link
      href={`/?categorie=${slug}#sujets`}
      className="inline-flex items-center gap-2 text-[15.5px] font-semibold rounded-full"
      style={{ background: `var(${colorVar})`, color: "#fff", textDecoration: "none", padding: "5px 14px 5px 6px" }}
      title={`Voir les sujets — ${name}`}
    >
      <CategoryBadge slug={slug} size={24} invert />
      <span className="hidden sm:inline">{name}</span>
    </Link>
  );
}
