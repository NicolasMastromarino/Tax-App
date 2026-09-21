import type { MetadataRoute } from "next";
import { getPublishedPostSitemapEntries } from "@/lib/blog";
import { defaultLocale, locales } from "@/i18n/locales";
import { absoluteUrl } from "@/lib/seo";

// Reads the blog table on every request instead of being prerendered at
// build time, so a post published from /admin shows up without a redeploy
// (and a build without database access can't freeze a post-less sitemap).
export const dynamic = "force-dynamic";

// Public pages that exist in every locale. Signed-in app routes, /login,
// /register, /thank-you etc. are deliberately left out.
const PAGES = ["/", "/blog", "/contact", "/privacy", "/terms", "/refunds"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    PAGES.map((path) => ({
      url: absoluteUrl(locale, path),
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, absoluteUrl(l, path)])),
          "x-default": absoluteUrl(defaultLocale, path),
        },
      },
    }))
  );

  // Post bodies are English-only and /es/blog/<slug> canonicalizes to the
  // English URL, so each post is listed once, at its English URL.
  let posts: MetadataRoute.Sitemap = [];
  try {
    const rows = await getPublishedPostSitemapEntries();
    posts = rows.map(({ slug, updatedAt }) => ({
      url: absoluteUrl(defaultLocale, `/blog/${slug}`),
      lastModified: updatedAt,
    }));
  } catch (error) {
    // Better to serve the static pages than a 500 the crawler will retry.
    console.error("sitemap: could not load blog posts", error);
  }

  return [...pages, ...posts];
}
