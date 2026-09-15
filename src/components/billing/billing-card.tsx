"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertTriangle, Loader2, Infinity as InfinityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubscribeCard } from "@/components/billing/subscribe-card";
import {
  openBillingPortalAction,
  type BillingActionState,
} from "@/lib/actions/billing-actions";
import type { SubscriptionSummary } from "@/lib/data/subscription";
import { useLocale } from "@/i18n/use-locale";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import type { Dictionary } from "@/i18n/dictionaries/en";

const DICTIONARIES = { en: en_, es: es_ };
const initialState: BillingActionState = {};

function ManageBillingButton({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(openBillingPortalAction, initialState);
  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {dict.billing.manageBilling}
        </Button>
      </form>
      {state.error && <p className="mt-2 text-sm text-danger">{translateMessage(dict, state.error)}</p>}
    </div>
  );
}

export function BillingCard({
  summary,
  businessId,
  email,
}: {
  summary: SubscriptionSummary;
  businessId: string;
  email: string;
}) {
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.billing;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.heading}</CardTitle>
      </CardHeader>
      <CardContent>
        {summary.isFounderOverride ? (
          <div className="flex items-start gap-2.5 text-sm text-foreground">
            <InfinityIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium">{t.founderTitle}</p>
              <p className="mt-0.5 text-xs text-muted">{t.founderBody}</p>
            </div>
          </div>
        ) : summary.active ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 text-sm text-foreground">
              {summary.status === "past_due" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              )}
              <div>
                <p className="font-medium">
                  {summary.plan
                    ? t.planLabels[summary.plan as keyof typeof t.planLabels] ?? summary.plan
                    : t.paidPlanFallback}{" "}
                  &middot;{" "}
                  {summary.status
                    ? t.statusLabels[summary.status as keyof typeof t.statusLabels] ?? summary.status
                    : t.unknownStatus}
                </p>
                {summary.status === "past_due" && (
                  <p className="mt-1 text-xs text-warning">{t.pastDueNote}</p>
                )}
                {summary.currentPeriodEnd && summary.status !== "past_due" && (
                  <p className="mt-0.5 text-xs text-muted">
                    {t.renews.replace(
                      "{date}",
                      summary.currentPeriodEnd.toLocaleDateString(locale === "es" ? "es" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    )}
                  </p>
                )}
              </div>
            </div>
            <ManageBillingButton dict={dict} />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">{t.freeNotice}</p>
            <SubscribeCard businessId={businessId} email={email} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
