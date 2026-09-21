import type { Metadata } from "next";
import { defaultLocale, locales, localizedPath, type Locale } from "@/i18n/locales";

// Resolves relative Open Graph/Twitter image URLs and canonical/hreflang
// links against the real deployed domain instead of localhost.
// Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically in production;
// falls back to bookkeeply.me (the intended production domain — must be
// added as a custom domain in Vercel with DNS pointed at it before this
// fallback resolves for real visitors), then localhost for local dev.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://bookkeeply.me");

/** localizedPath, minus the trailing slash it leaves on a non-default locale's home ("/es/" -> "/es"). */
function pagePath(locale: Locale, path: string): string {
  const href = localizedPath(locale, path);
  return href.length > 1 ? href.replace(/\/$/, "") : href;
}

/**
 * Self-referencing canonical plus hreflang alternates for a page that exists
 * in every locale. Relative paths resolve against metadataBase (root layout).
 * English is the unprefixed default, so it doubles as x-default.
 */
export function localizedAlternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: pagePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, pagePath(l, path)])),
      "x-default": pagePath(defaultLocale, path),
    },
  };
}

/** Absolute URL for a path under the site, in the given locale. */
export function absoluteUrl(locale: Locale, path: string): string {
  return new URL(pagePath(locale, path), siteUrl).toString();
}
