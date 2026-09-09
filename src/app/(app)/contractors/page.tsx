import { requireBusiness } from "@/lib/current-business";
import { getContractorRows, FORM_1099_THRESHOLD } from "@/lib/data/contractors";
import { ContractorsClient } from "@/components/contractors/contractors-client";

export default async function ContractorsPage() {
  const { business } = await requireBusiness();
  const rows = await getContractorRows(business.id, business.taxYear);

  return (
    <ContractorsClient
      taxYear={business.taxYear}
      threshold={FORM_1099_THRESHOLD}
      rows={rows}
    />
  );
}
