"use client";

import { usePathname } from "next/navigation";
import { defaultLocale, type Locale } from "./locales";

/** Client-side locale, derived from the URL (no /es prefix -> English). */
export function useLocale(): Locale {
  const pathname = usePathname();
  return pathname === "/es" || pathname?.startsWith("/es/") ? "es" : defaultLocale;
}
