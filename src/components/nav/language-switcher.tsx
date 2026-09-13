"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "@/i18n/use-locale";
import { stripLocalePrefix, localizedPath, type Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

const LOCALE_COOKIE = "NEXT_LOCALE";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const switchTo = (target: Locale) => {
    if (target === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${ONE_YEAR}`;
    const basePath = stripLocalePrefix(pathname ?? "/");
    const query = searchParams?.toString();
    router.push(localizedPath(target, basePath) + (query ? `?${query}` : ""));
  };

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5 text-xs font-medium", className)}>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-md px-2 py-1 transition-colors",
          locale === "en" ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo("es")}
        aria-pressed={locale === "es"}
        className={cn(
          "rounded-md px-2 py-1 transition-colors",
          locale === "es" ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
        )}
      >
        ES
      </button>
    </div>
  );
}
