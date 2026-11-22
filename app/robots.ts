import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/compte", "/completer-profil", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
