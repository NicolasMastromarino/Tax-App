import { requireBusiness } from "@/lib/current-business";
import { getSubscriptionSummary } from "@/lib/data/subscription";
import { BillingCard } from "@/components/billing/billing-card";

export default async function BillingPage() {
  const { session, business } = await requireBusiness();
  return (
    <div className="max-w-3xl">
      <BillingCard
        summary={getSubscriptionSummary(business, session.user?.email)}
        businessId={business.id}
        email={session.user?.email ?? ""}
      />
    </div>
  );
}
