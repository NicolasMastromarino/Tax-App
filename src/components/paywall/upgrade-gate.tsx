"use client";

import { Lock } from "lucide-react";
import { SubscribeCard } from "@/components/billing/subscribe-card";
import { useLocale } from "@/i18n/use-locale";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const DICTIONARIES = { en: en_, es: es_ };

export function UpgradeGate({
  feature,
  businessId,
  email,
}: {
  feature: string;
  businessId: string;
  email: string;
}) {
  const locale = useLocale();
  const t = DICTIONARIES[locale].upgradeGate;

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        {feature} {t.titleSuffix}
      </h1>
      <p className="mt-2 text-sm text-muted">{t.body.replace("{feature}", feature)}</p>

      <div className="mt-6">
        <SubscribeCard businessId={businessId} email={email} />
      </div>
    </div>
  );
}
