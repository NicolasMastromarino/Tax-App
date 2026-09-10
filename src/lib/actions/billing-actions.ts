"use server";

import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/current-business";

// Paddle's customer portal gives subscribers a self-service page to update
// their card or cancel — without this, every card update or cancellation
// request becomes a support email. See
// https://developer.paddle.com/build/customers/integrate-customer-portal
//
// Portal sessions are single-use/short-lived by design (Paddle's own docs
// say not to cache them), so this creates a fresh one on every click rather
// than storing a URL.
export type BillingActionState = { error?: string };

// Params are unused (no form fields) but required by useActionState's signature.
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function openBillingPortalAction(
  _prevState: BillingActionState,
  _formData: FormData
): Promise<BillingActionState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const { business } = await requireBusiness();

  if (!business.paddleCustomerId) {
    return { error: "No billing account yet. Subscribe first." };
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    console.error("[billing portal] PADDLE_API_KEY is not configured");
    return { error: "Billing portal isn't configured yet. Try again shortly." };
  }

  const apiBase =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";

  const res = await fetch(`${apiBase}/customers/${business.paddleCustomerId}/portal-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscription_ids: business.paddleSubscriptionId ? [business.paddleSubscriptionId] : [],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[billing portal] Paddle API ${res.status}:`, body);
    return { error: "Couldn't open the billing portal right now. Try again shortly." };
  }

  const json = (await res.json()) as { data?: { urls?: { general?: { overview?: string } } } };
  const url = json.data?.urls?.general?.overview;
  if (!url) {
    console.error("[billing portal] Paddle response had no portal URL:", JSON.stringify(json));
    return { error: "Couldn't open the billing portal right now. Try again shortly." };
  }

  redirect(url);
}
