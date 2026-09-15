"use client";

import { PaywallPrompt } from "@/components/paywall/paywall-prompt";
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
    <PaywallPrompt
      heading={`${feature} ${t.titleSuffix}`}
      body={t.body.replace("{feature}", feature)}
      businessId={businessId}
      email={email}
    />
  );
}
