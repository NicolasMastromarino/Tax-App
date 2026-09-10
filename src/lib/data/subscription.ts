import "server-only";
import type { businesses } from "@/db/schema";

type Business = typeof businesses.$inferSelect;

// Paddle subscription statuses that should grant access to paid features.
// "past_due" is included deliberately: Paddle keeps retrying payment for a
// while (dunning) before a subscription moves to "paused"/"canceled", and
// cutting access off at the first missed payment is a worse experience than
// the small revenue risk of a short grace period — this mirrors common SaaS
// practice (Stripe's own docs recommend the same).
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * Whether this business currently has paid access (Tax Planner, Contractors
 * & 1099s). Core bookkeeping is free regardless of this — see the gate
 * components in src/app/(app)/tax-planner and src/app/(app)/contractors.
 */
export function hasActiveSubscription(business: Pick<Business, "subscriptionStatus">): boolean {
  return !!business.subscriptionStatus && ACTIVE_STATUSES.has(business.subscriptionStatus);
}

export type SubscriptionSummary = {
  active: boolean;
  status: string | null;
  plan: string | null;
  currentPeriodEnd: Date | null;
};

export function getSubscriptionSummary(
  business: Pick<Business, "subscriptionStatus" | "subscriptionPlan" | "subscriptionCurrentPeriodEnd">
): SubscriptionSummary {
  return {
    active: hasActiveSubscription(business),
    status: business.subscriptionStatus,
    plan: business.subscriptionPlan,
    currentPeriodEnd: business.subscriptionCurrentPeriodEnd,
  };
}
