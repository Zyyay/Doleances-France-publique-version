const UTM_SOURCES = new Set(["x", "threads", "reddit"]);
const UTM_MEDIUMS = new Set(["plateforme", "perso"]);
const CAMPAIGN_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Real subject slugs are generated from full question titles and run up to
// ~116 chars today (checked against the live data) — 160 gives headroom
// without being unbounded. Purely a sanity cap; the regex below is what
// actually validates the value against subjects.slug's own format.
const CAMPAIGN_MAX_LENGTH = 160;

export interface Utm {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

/**
 * Validates the three UTM params against a fixed whitelist — never store an
 * arbitrary URL query parameter in the database, that's an injection and
 * data-pollution vector. All three must be present and valid together, or
 * this returns null (no anonymous session gets created just for a
 * malformed/partial link — see proxy.ts).
 */
export function parseUtm(searchParams: URLSearchParams): Utm | null {
  const source = searchParams.get("utm_source");
  const medium = searchParams.get("utm_medium");
  const campaign = searchParams.get("utm_campaign");
  if (!source || !medium || !campaign) return null;
  if (!UTM_SOURCES.has(source)) return null;
  if (!UTM_MEDIUMS.has(medium)) return null;
  if (campaign.length > CAMPAIGN_MAX_LENGTH || !CAMPAIGN_RE.test(campaign)) return null;

  return { utm_source: source, utm_medium: medium, utm_campaign: campaign };
}
