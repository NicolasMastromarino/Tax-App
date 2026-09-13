import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, type Locale } from "@/i18n/locales";

const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already under a real locale segment (/es, /es/...) - native [lang]
  // routing handles it. Still worth remembering the choice: a visitor can
  // land here via the toggle, a bookmark, or a shared link, not just a
  // redirect below, and without the cookie an unprefixed redirect
  // elsewhere (e.g. after login) would fall back to English.
  if (pathname === "/es" || pathname.startsWith("/es/")) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    if (cookieLocale === "es") return NextResponse.next();
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, "es", { maxAge: ONE_YEAR, path: "/" });
    return response;
  }

  // English never shows a visible /en prefix - collapse it away so there
  // isn't a second valid URL for the same page.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  // No Accept-Language negotiation: locale is decided by the cookie only
  // (set here on an /es/... visit, or by the language switcher), never by
  // guessing from the browser's language. A visitor with no cookie yet
  // always gets English.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = cookieLocale === "es" ? "es" : defaultLocale;

  if (locale === "es") {
    const url = request.nextUrl.clone();
    url.pathname = `/es${pathname}`;
    return NextResponse.redirect(url);
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
