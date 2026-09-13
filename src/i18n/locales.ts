export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale => (locales as readonly string[]).includes(value);

/**
 * Builds an href for `path` under `locale`. English is the unprefixed
 * default (proxy.ts rewrites it to /en internally), so only non-default
 * locales get a visible prefix.
 */
export function localizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return locale === defaultLocale ? normalized : `/${locale}${normalized}`;
}

/** Strips a leading /en or /es segment, if present, e.g. "/es/dashboard" -> "/dashboard". */
export function stripLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}
