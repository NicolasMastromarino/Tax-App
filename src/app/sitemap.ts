import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { localizedPath } from "@/i18n/locales";
import { siteUrl } from "@/lib/site-url";

// Regenerated at most hourly so new blog posts show up without a redeploy,
// while a crawler hammering /sitemap.xml doesn't hit the (tiny) DB pool.
export const revalidate = 3600;

// Public, indexable marketing pages that exist in both locales.
const PAGES: { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/refunds", changeFrequency: "yearly", priority: 0.2 },
];

function url(locale: "en" | "es", path: string): string {
  const localized = localizedPath(locale, path).replace(/\/$/, "");
  return `${siteUrl}${localized}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = PAGES.map(({ path, changeFrequency, priority }) => ({
    url: url("en", path),
    changeFrequency,
    priority,
    alternates: { languages: { en: url("en", path), es: url("es", path) } },
  }));

  // Published posts only (drafts are never listed). Posts carry no language
  // column, so each is listed once at its default-locale URL, without hreflang.
  let posts: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    posts = rows.map((row) => ({
      url: url("en", `/blog/${row.slug}`),
      lastModified: row.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    // DB unreachable (e.g. at build time): still serve the static pages.
  }

  return [...pages, ...posts];
}
