/**
 * Canonical site URL — used for metadataBase (og:image/canonical resolution)
 * and the sitemap/robots files. Without an explicit metadataBase, Next.js
 * falls back to VERCEL_URL (the deployment's own *.vercel.app address) on
 * Vercel, or localhost:3000 locally — both wrong now that the custom domain
 * is attached to production, so this is deliberately hardcoded/env-driven
 * rather than left to that fallback. Override with NEXT_PUBLIC_SITE_URL if
 * the production domain ever changes again.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doleances-france.fr";
