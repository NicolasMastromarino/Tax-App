"use client";

import { Lock } from "lucide-react";
import { SubscribeCard } from "@/components/billing/subscribe-card";

// The centered "you need to subscribe" moment: lock icon, heading, body,
// then the pricing toggle card. Shared by the Tax Planner/Contractors
// paywall (UpgradeGate) and the standalone /billing page's unsubscribed
// state, so both feel like the same screen instead of one being a plain
// centered prompt and the other a bordered Settings-style panel.
export function PaywallPrompt({
  heading,
  body,
  businessId,
  email,
}: {
  heading: string;
  body: string;
  businessId: string;
  email: string;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-foreground">{heading}</h1>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <div className="mt-6">
        <SubscribeCard businessId={businessId} email={email} />
      </div>
    </div>
  );
}
