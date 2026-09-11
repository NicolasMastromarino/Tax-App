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

// Founder/owner accounts that always have full access, independent of any
// Paddle subscription row. Deliberately a code-level check (keyed on login
// email) rather than a database flag: it can't be lost to a bad migration,
// a stray webhook overwrite, or a database reset, and it doesn't depend on
// the businesses.subscription* columns existing at all. Lowercased so the
// comparison is case-insensitive.
const FOUNDER_EMAILS = new Set(["nicolas.mastromarino@gmail.com"]);

export function isFounder(email: string | null | undefined): boolean {
  return !!email && FOUNDER_EMAILS.has(email.toLowerCase());
}

/**
 * Whether this business currently has paid access (Tax Planner, Contractors
 * & 1099s). Core bookkeeping is free regardless of this — see the gate
 * components in src/app/(app)/tax-planner and src/app/(app)/contractors.
 *
 * `email` is the signed-in user's login email (optional so existing callers
 * that only have the business row keep working) — pass it whenever it's
 * available so founder accounts in FOUNDER_EMAILS always get access.
 */
export function hasActiveSubscription(
  business: Pick<Business, "subscriptionStatus">,
  email?: string | null
): boolean {
  if (isFounder(email)) return true;
  return !!business.subscriptionStatus && ACTIVE_STATUSES.has(business.subscriptionStatus);
}

export type SubscriptionSummary = {
  active: boolean;
  status: string | null;
  plan: string | null;
  currentPeriodEnd: Date | null;
  /** True for a founder/owner override — see FOUNDER_EMAILS above. The
   * Billing UI uses this to show "lifetime access" instead of a Paddle
   * plan/renewal date or checkout buttons, since there's no real
   * subscription behind it. */
  isFounderOverride: boolean;
};

export function getSubscriptionSummary(
  business: Pick<Business, "subscriptionStatus" | "subscriptionPlan" | "subscriptionCurrentPeriodEnd">,
  email?: string | null
): SubscriptionSummary {
  if (isFounder(email)) {
    return { active: true, status: "lifetime", plan: "founder", currentPeriodEnd: null, isFounderOverride: true };
  }
  return {
    active: hasActiveSubscription(business),
    status: business.subscriptionStatus,
    plan: business.subscriptionPlan,
    currentPeriodEnd: business.subscriptionCurrentPeriodEnd,
    isFounderOverride: false,
  };
}
