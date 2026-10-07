import type { MetadataRoute } from "next";

/* robots.txt: що можна обходити пошуковикам. Адмінка і форма — закриті, решта відкрита. */
export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
