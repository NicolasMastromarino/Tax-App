"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { getPaddle } from "@/lib/paddle/client";

export function CheckoutButton({
  priceId,
  businessId,
  email,
  children,
  ...buttonProps
}: {
  priceId: string | undefined;
  businessId: string;
  email: string;
  children: React.ReactNode;
} & Omit<ButtonProps, "onClick">) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!priceId) {
      console.error("[checkout] missing price id — check NEXT_PUBLIC_PADDLE_PRICE_ID_* env vars");
      return;
    }
    setLoading(true);
    try {
      const paddle = await getPaddle();
      if (!paddle) return; // getPaddle already logged why
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        // Read on the server by the webhook handler to link the resulting
        // subscription back to this business the first time it's created —
        // see src/app/api/webhooks/paddle/route.ts.
        customData: { businessId },
        settings: {
          successUrl: `${window.location.origin}/settings?upgraded=1`,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading || !priceId} {...buttonProps}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}
