import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/locales";

export const metadata: Metadata = {
  title: "Thank You",
  description: "Thanks for subscribing to Bookkeeply.",
};

export default async function ThankYouPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.billing.thankYou;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <Link href={localizedPath(locale, "/")} className="mb-8 inline-flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" letterClassName="text-lg" />
          <span className="text-base font-semibold text-foreground">Bookkeeply</span>
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
            <CheckCircle2 className="h-6 w-6 text-success" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">{t.title}</h1>
          <p className="mt-2 text-sm text-muted">{t.body}</p>

          <Link
            href={localizedPath(locale, "/dashboard")}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            {t.cta}
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted">{t.receiptNote}</p>
      </div>
    </div>
  );
}
