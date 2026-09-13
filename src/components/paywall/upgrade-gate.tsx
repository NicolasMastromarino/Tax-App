import { Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { getDictionary } from "@/i18n/dictionaries";

export async function UpgradeGate({
  feature,
  businessId,
  email,
}: {
  feature: string;
  businessId: string;
  email: string;
}) {
  const dict = await getDictionary();
  const t = dict.upgradeGate;

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        {feature} {t.titleSuffix}
      </h1>
      <p className="mt-2 text-sm text-muted">{t.body.replace("{feature}", feature)}</p>

      <Card className="mt-6 text-left">
        <CardContent className="p-6">
          <ul className="space-y-2.5">
            {t.included.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CheckoutButton
              priceId={process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY}
              businessId={businessId}
              email={email}
              variant="outline"
              size="lg"
            >
              {t.monthly}
            </CheckoutButton>
            <CheckoutButton
              priceId={process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_ANNUAL}
              businessId={businessId}
              email={email}
              size="lg"
            >
              {t.annual}
            </CheckoutButton>
          </div>
          <p className="mt-3 text-center text-xs text-muted">{t.cancelAnytime}</p>
        </CardContent>
      </Card>
    </div>
  );
}
