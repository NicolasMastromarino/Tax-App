"use client";

import { useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { useLocale } from "@/i18n/use-locale";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const DICTIONARIES = { en: en_, es: es_ };
type Cycle = "monthly" | "annual";

export function UpgradeGate({
  feature,
  businessId,
  email,
}: {
  feature: string;
  businessId: string;
  email: string;
}) {
  const [cycle, setCycle] = useState<Cycle>("annual");
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.upgradeGate;
  const p = dict.marketing.pricing;

  const plan =
    cycle === "monthly"
      ? {
          label: p.monthly,
          price: p.monthlyPrice,
          period: p.monthlyPeriod,
          note: p.monthlyNote,
          priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY,
        }
      : {
          label: p.annual,
          price: p.annualPrice,
          period: p.annualPeriod,
          note: p.annualNote,
          priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_ANNUAL,
        };

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        {feature} {t.titleSuffix}
      </h1>
      <p className="mt-2 text-sm text-muted">{t.body.replace("{feature}", feature)}</p>

      <div className="mx-auto mt-6 flex w-fit items-center gap-1 rounded-full border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setCycle("monthly")}
          aria-pressed={cycle === "monthly"}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {p.monthly}
        </button>
        <button
          type="button"
          onClick={() => setCycle("annual")}
          aria-pressed={cycle === "annual"}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            cycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {p.annual}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              cycle === "annual" ? "bg-white/20 text-primary-foreground" : "bg-success/15 text-success"
            }`}
          >
            {p.saveBadge}
          </span>
        </button>
      </div>

      <div className="relative mx-auto mt-6 max-w-md rounded-2xl border border-primary bg-surface p-8 text-left shadow-sm ring-2 ring-primary/20">
        {cycle === "annual" && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {p.bestValue}
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
        <CheckoutButton priceId={plan.priceId} businessId={businessId} email={email} size="lg" className="mt-8 w-full">
          {t.subscribe}
        </CheckoutButton>
        <p className="mt-3 text-center text-xs text-muted">{t.cancelAnytime}</p>
      </div>
    </div>
  );
}
