import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/i18n/locales";

const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Picks a supported locale from an Accept-Language header, e.g.
 * "es-MX,es;q=0.9,en;q=0.8" -> "es". No geo-IP: this is purely the
 * browser's language preference, per product decision.
 */
function negotiateLocale(header: string | null): Locale {
  if (!header) return defaultLocale;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const match = locales.find((locale) => locale === base);
    if (match) return match;
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already under a real locale segment (/es, /es/...) - native [lang]
  // routing handles it, nothing for the proxy to do.
  if (pathname === "/es" || pathname.startsWith("/es/")) {
    return NextResponse.next();
  }

  // English never shows a visible /en prefix - collapse it away so there
  // isn't a second valid URL for the same page.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    cookieLocale === "en" || cookieLocale === "es" ? cookieLocale : negotiateLocale(request.headers.get("accept-language"));

  if (locale === "es") {
    const url = request.nextUrl.clone();
    url.pathname = `/es${pathname}`;
    const response = NextResponse.redirect(url);
    if (!cookieLocale) response.cookies.set(LOCALE_COOKIE, locale, { maxAge: ONE_YEAR, path: "/" });
    return response;
  }

  // Default locale: rewrite invisibly to /en/... so app/[lang]/... resolves,
  // while the URL bar keeps showing the clean, unprefixed path.
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname}`;
  const response = NextResponse.rewrite(url);
  if (!cookieLocale) response.cookies.set(LOCALE_COOKIE, locale, { maxAge: ONE_YEAR, path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!api|admin|_next/static|_next/image|.*\\..*).*)"],
};
