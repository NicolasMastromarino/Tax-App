import { requireBusiness } from "@/lib/current-business";
import { getTaxProjection, getQuarterlyPayments } from "@/lib/data/tax";
import { TaxPlannerClient } from "@/components/tax-planner/tax-planner-client";

export default async function TaxPlannerPage() {
  const { business } = await requireBusiness();

  const projection = await getTaxProjection({
    id: business.id,
    taxYear: business.taxYear,
    filingStatus: business.filingStatus,
    isSCorp: business.isSCorp,
    sCorpSalary: business.sCorpSalary,
    spouseIncome: business.spouseIncome,
    isSstb: business.isSstb,
    w2WagesPaid: business.w2WagesPaid,
    ubiaQualifiedProperty: business.ubiaQualifiedProperty,
  });

  const quarterly = projection
    ? await getQuarterlyPayments(
        business.id,
        business.taxYear,
        projection.safeHarbor.requiredAnnualPayment / 4
      )
    : null;

  return (
    <TaxPlannerClient
      business={{
        businessName: business.businessName,
        taxYear: business.taxYear,
        filingStatus: business.filingStatus,
        isSCorp: business.isSCorp,
        sCorpSalary: business.sCorpSalary,
      }}
      projection={projection}
      quarterly={quarterly}
    />
  );
}
