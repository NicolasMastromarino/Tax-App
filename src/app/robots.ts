import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Not for search: API routes and the founder-only blog admin.
      disallow: ["/api/", "/admin"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
