import { requireBusiness } from "@/lib/current-business";
import { getContractorRows, get1099Threshold } from "@/lib/data/contractors";
import { ContractorsClient } from "@/components/contractors/contractors-client";

export default async function ContractorsPage() {
  const { business } = await requireBusiness();
  const rows = await getContractorRows(business.id, business.taxYear);

  return (
    <ContractorsClient
      taxYear={business.taxYear}
      threshold={get1099Threshold(business.taxYear)}
      rows={rows}
    />
  );
}
