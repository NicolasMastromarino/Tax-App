import { requireBusiness } from "@/lib/current-business";
import { getContractorRows, get1099Threshold } from "@/lib/data/contractors";
import { hasActiveSubscription } from "@/lib/data/subscription";
import { ContractorsClient } from "@/components/contractors/contractors-client";
import { UpgradeGate } from "@/components/paywall/upgrade-gate";

export default async function ContractorsPage() {
  const { session, business } = await requireBusiness();

  if (!hasActiveSubscription(business)) {
    return (
      <UpgradeGate
        feature="Contractors & 1099s"
        businessId={business.id}
        email={session.user?.email ?? ""}
      />
    );
  }

  const rows = await getContractorRows(business.id, business.taxYear);

  return (
    <ContractorsClient
      taxYear={business.taxYear}
      threshold={get1099Threshold(business.taxYear)}
      rows={rows}
    />
  );
}
