"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { en as fallback } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";

type Cycle = "monthly" | "annual";

// Client Component (needs useState for the monthly/annual toggle), so it
// can't read the dictionary via next/root-params like the rest of the
// marketing page — pick the matching dictionary from the URL instead.
const DICTIONARIES = { en: fallback, es };

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("annual");
  const locale = useLocale();
  const t = DICTIONARIES[locale].marketing.pricing;

  const plan =
    cycle === "monthly"
      ? { label: t.monthly, price: t.monthlyPrice, period: t.monthlyPeriod, note: t.monthlyNote }
      : { label: t.annual, price: t.annualPrice, period: t.annualPeriod, note: t.annualNote };

  return (
    <section id="pricing" className="border-y border-border bg-surface-muted/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.heading}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted">{t.subheading}</p>
        </div>

        <div className="mx-auto mt-10 flex w-fit items-center gap-1 rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            aria-pressed={cycle === "monthly"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              cycle === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.monthly}
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            aria-pressed={cycle === "annual"}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              cycle === "annual"
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.annual}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                cycle === "annual"
                  ? "bg-white/20 text-primary-foreground"
                  : "bg-success/15 text-success"
              }`}
            >
              {t.saveBadge}
            </span>
          </button>
        </div>

        <div className="mx-auto mt-8 max-w-md">
          <div className="relative rounded-2xl border border-primary bg-surface p-8 shadow-sm ring-2 ring-primary/20">
            {cycle === "annual" && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {t.bestValue}
              </span>
            )}
            <h3 className="text-sm font-semibold text-muted">{plan.label}</h3>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted">{plan.period}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{plan.note}</p>
            <ul className="mt-6 space-y-2.5">
              {t.included.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={localizedPath(locale, "/register")}
              className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {t.cta}
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted">{t.footnote}</p>
      </div>
    </section>
  );
}
