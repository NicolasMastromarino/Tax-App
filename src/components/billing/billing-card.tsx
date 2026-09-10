"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertTriangle, Loader2, Infinity as InfinityIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/billing/checkout-button";
import {
  openBillingPortalAction,
  type BillingActionState,
} from "@/lib/actions/billing-actions";
import type { SubscriptionSummary } from "@/lib/data/subscription";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  paused: "Paused",
  canceled: "Canceled",
  lifetime: "Lifetime access",
};

const PLAN_LABEL: Record<string, string> = {
  monthly: "Monthly: $9.95/mo",
  annual: "Annual: $100/yr",
  founder: "Founder account",
};

const initialState: BillingActionState = {};

function ManageBillingButton() {
  const [state, formAction, pending] = useActionState(openBillingPortalAction, initialState);
  return (
    <div>
      <form action={formAction}>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Manage billing
        </Button>
      </form>
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        {summary.isFounderOverride ? (
          <div className="flex items-start gap-2.5 text-sm text-foreground">
            <InfinityIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-medium">Founder account: lifetime access</p>
              <p className="mt-0.5 text-xs text-muted">
                Every feature, permanently, no subscription needed.
              </p>
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
                  {summary.plan ? PLAN_LABEL[summary.plan] ?? summary.plan : "Paid plan"} &middot;{" "}
                  {summary.status ? STATUS_LABEL[summary.status] ?? summary.status : "Unknown"}
                </p>
                {summary.status === "past_due" && (
                  <p className="mt-1 text-xs text-warning">
                    Your last payment didn&apos;t go through. Update your card to keep access.
                    It will be paused if this isn&apos;t resolved soon.
                  </p>
                )}
                {summary.currentPeriodEnd && summary.status !== "past_due" && (
                  <p className="mt-0.5 text-xs text-muted">
                    Renews{" "}
                    {summary.currentPeriodEnd.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
            <ManageBillingButton />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Core bookkeeping is free. Subscribe to unlock Tax Planner and Contractors & 1099s.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CheckoutButton
                priceId={process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY}
                businessId={businessId}
                email={email}
                variant="outline"
              >
                $9.95/month
              </CheckoutButton>
              <CheckoutButton
                priceId={process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_ANNUAL}
                businessId={businessId}
                email={email}
              >
                $100/year
              </CheckoutButton>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
