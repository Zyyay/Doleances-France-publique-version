import type { MetadataRoute } from "next";
import { getActiveSubjectSlugs } from "@/lib/subjects";
import { SITE_URL } from "@/lib/siteUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const subjects = await getActiveSubjectSlugs();

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/a-propos`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/vote-express`, changeFrequency: "daily", priority: 0.8 },
    ...subjects.map((subject) => ({
      url: `${SITE_URL}/sujets/${subject.slug}`,
      lastModified: subject.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
  ];
}
