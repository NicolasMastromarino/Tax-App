import { requireBusiness } from "@/lib/current-business";
import { getSubscriptionSummary } from "@/lib/data/subscription";
import { getDictionary } from "@/i18n/dictionaries";
import { BillingCard } from "@/components/billing/billing-card";
import { PaywallPrompt } from "@/components/paywall/paywall-prompt";

export default async function BillingPage() {
  const { session, business } = await requireBusiness();
  const summary = getSubscriptionSummary(business, session.user?.email);
  const email = session.user?.email ?? "";

  if (summary.active) {
    return (
      <div className="max-w-3xl">
        <BillingCard summary={summary} businessId={business.id} email={email} />
      </div>
    );
  }

  const dict = await getDictionary();
  return (
    <PaywallPrompt
      heading={dict.billing.unlockHeading}
      body={dict.billing.freeNotice}
      businessId={business.id}
      email={email}
    />
  );
}
