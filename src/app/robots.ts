import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/locales";
import { siteUrl } from "@/lib/site-url";

// Logged-in app and back-office routes: nothing here belongs in search results.
const PRIVATE_PATHS = [
  "/admin",
  "/billing",
  "/categories",
  "/contractors",
  "/dashboard",
  "/help",
  "/reconciliation",
  "/reports",
  "/settings",
  "/tax-planner",
  "/transactions",
];

export default function robots(): MetadataRoute.Robots {
  // English is unprefixed (proxy.ts collapses /en/...), so only other locales get a prefixed copy.
  const prefixes = locales.filter((l) => l !== defaultLocale).map((l) => `/${l}`);
  const disallow = ["/api/", ...PRIVATE_PATHS.flatMap((p) => [p, ...prefixes.map((x) => `${x}${p}`)])];
  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
