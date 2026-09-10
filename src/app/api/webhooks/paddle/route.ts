import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { verifyPaddleWebhookSignature } from "@/lib/paddle/verify-webhook";

// Paddle Billing webhook receiver. Configure this URL
// (https://<your-domain>/api/webhooks/paddle) as a notification destination
// in Paddle -> Developer Tools -> Notifications, subscribed to at least the
// subscription.* events. Paddle will show a signing secret once the
// destination is created — put that in PADDLE_WEBHOOK_SECRET.
//
// This only keeps `businesses.subscription*` in sync so the app knows who
// has paid access (see src/lib/data/subscription.ts). It does not email
// receipts, handle refunds, or anything else — Paddle's own dashboard and
// emails cover that.

type PaddleSubscriptionData = {
  id: string;
  status: string;
  customer_id: string;
  current_billing_period?: { ends_at?: string | null } | null;
  items?: Array<{ price?: { id?: string } }>;
  custom_data?: { businessId?: string } | null;
};

function planFromPriceId(priceId: string | undefined): "monthly" | "annual" | null {
  if (!priceId) return null;
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY) return "monthly";
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_ANNUAL) return "annual";
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paddle-signature");
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? "";

  const verification = verifyPaddleWebhookSignature(rawBody, signatureHeader, secret);
  if (!verification.valid) {
    console.error("[paddle webhook] rejected:", verification.reason);
    return NextResponse.json({ error: verification.reason }, { status: 401 });
  }

  let payload: { event_type?: string; data?: PaddleSubscriptionData };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const eventType = payload.event_type ?? "";
  const data = payload.data;

  if (!eventType.startsWith("subscription.") || !data) {
    // Not something we track (e.g. transaction.* events) — acknowledge so
    // Paddle doesn't retry, but do nothing.
    return NextResponse.json({ ignored: true });
  }

  const priceId = data.items?.[0]?.price?.id;
  const plan = planFromPriceId(priceId);
  const periodEnd = data.current_billing_period?.ends_at
    ? new Date(data.current_billing_period.ends_at)
    : null;

  const update = {
    paddleCustomerId: data.customer_id,
    paddleSubscriptionId: data.id,
    subscriptionStatus: data.status,
    subscriptionPlan: plan,
    subscriptionCurrentPeriodEnd: periodEnd,
    updatedAt: new Date(),
  };

  // A brand-new subscription (subscription.created) carries the businessId
  // we attached as custom_data when opening checkout (see
  // checkout-button.tsx) — that's how we link a Paddle subscription to a
  // business the first time. Any later event for the same subscription
  // (updated/paused/canceled/resumed) is matched by the subscription id we
  // stored on that first event instead, since custom_data isn't guaranteed
  // to be echoed back on every subsequent event.
  const businessIdFromCustomData = data.custom_data?.businessId;

  let matched: { id: string }[] | undefined = undefined;
  if (businessIdFromCustomData) {
    matched = await db
      .update(businesses)
      .set(update)
      .where(eq(businesses.id, businessIdFromCustomData))
      .returning({ id: businesses.id });
  }

  if (!matched?.length) {
    matched = await db
      .update(businesses)
      .set(update)
      .where(eq(businesses.paddleSubscriptionId, data.id))
      .returning({ id: businesses.id });
  }

  if (!matched?.length) {
    // Nothing in our database references this subscription yet and there
    // was no usable custom_data — log it so it's visible in Vercel's
    // function logs, but still 200 so Paddle doesn't retry forever.
    console.error(
      `[paddle webhook] could not match ${eventType} for subscription ${data.id} to a business (no custom_data.businessId and no existing paddleSubscriptionId match)`
    );
    return NextResponse.json({ matched: false });
  }

  return NextResponse.json({ matched: true, businessId: matched[0].id });
}
