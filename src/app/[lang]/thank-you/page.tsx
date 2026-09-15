"use client";

import Link from "next/link";
import { Check, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const DICTIONARIES = { en: en_, es: es_ };

export default function ThankYouPage() {
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.billing.thankYou;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel, hidden on small screens so the confirmation stays front and center */}
      <div
        className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-12 md:flex"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.10) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        <Link href={localizedPath(locale, "/")} className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/15">
            <span className="text-[17px] font-bold text-white">b</span>
          </span>
          <span className="text-base font-semibold text-white">Bookkeeply</span>
        </Link>

        <div className="relative flex max-w-md flex-col gap-5">
          <div className="text-[34px] font-semibold leading-tight text-white">{t.heroHeadline}</div>
          <div className="flex flex-col gap-3">
            {t.heroBenefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2.5">
                <Check className="h-[18px] w-[18px] shrink-0 text-white" strokeWidth={2.4} />
                <span className="text-sm text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/55">
          © {new Date().getFullYear()} Bookkeeply
        </div>
      </div>

      {/* Confirmation */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">{t.title}</h1>
            <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success-bg">
              <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{t.body}</p>
            <Link
              href={localizedPath(locale, "/dashboard")}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              {t.cta}
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted">{t.receiptNote}</p>
        </div>
      </div>
    </div>
  );
}
