import "server-only";
import { db } from "@/db";
import { transactions, taxParameters, taxBrackets, qbiPhaseoutParameters, taxPayments } from "@/db/schema";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import {
  computeSoleProp,
  computeSCorp,
  computeSafeHarborQuarterly,
  annualizeIncome,
  quarterlyDueDates,
  type TaxBracket,
  type QbiPhaseout,
  type TaxYearParams,
  type EntityTaxResult,
  type FilingStatus,
  type SafeHarborResult,
} from "@/lib/calculations/tax";
import { firstOfMonthISO } from "@/lib/utils";

export interface TaxYearData {
  params: TaxYearParams;
  brackets: TaxBracket[];
  qbiPhaseout: QbiPhaseout;
}

/**
 * Loads the versioned tax parameters/brackets/QBI phaseout for a given tax
 * year + filing status (spec §12.15 — versioned by year, not hardcoded).
 * Returns null if that year hasn't been seeded yet, so the UI can show a
 * clear "not available for this year" message instead of a wrong number.
 */
export async function getTaxYearData(
  taxYear: number,
  filingStatus: FilingStatus
): Promise<TaxYearData | null> {
  const [paramsRow] = await db
    .select()
    .from(taxParameters)
    .where(eq(taxParameters.taxYear, taxYear))
    .limit(1);

  if (!paramsRow) return null;

  const bracketRows = await db
    .select()
    .from(taxBrackets)
    .where(and(eq(taxBrackets.taxYear, taxYear), eq(taxBrackets.filingStatus, filingStatus)))
    .orderBy(asc(taxBrackets.sortOrder));

  const [qbiRow] = await db
    .select()
    .from(qbiPhaseoutParameters)
    .where(
      and(
        eq(qbiPhaseoutParameters.taxYear, taxYear),
        eq(qbiPhaseoutParameters.filingStatus, filingStatus)
      )
    )
    .limit(1);

  if (bracketRows.length === 0 || !qbiRow) return null;

  return {
    params: {
      seWageBase: parseFloat(paramsRow.seWageBase),
      seTaxableFraction: parseFloat(paramsRow.seTaxableFraction),
      seFullRate: parseFloat(paramsRow.seFullRate),
      seMedicareOnlyRate: parseFloat(paramsRow.seMedicareOnlyRate),
      seDeductibleFraction: parseFloat(paramsRow.seDeductibleFraction),
      qbiRate: parseFloat(paramsRow.qbiRate),
      qbiMinDeductionThreshold:
        paramsRow.qbiMinDeductionThreshold != null
          ? parseFloat(paramsRow.qbiMinDeductionThreshold)
          : null,
      qbiMinDeductionFloor:
        paramsRow.qbiMinDeductionFloor != null ? parseFloat(paramsRow.qbiMinDeductionFloor) : null,
    },
    brackets: bracketRows.map((b) => ({
      rate: parseFloat(b.rate),
      lowerBound: parseFloat(b.lowerBound),
      upperBound: b.upperBound == null ? null : parseFloat(b.upperBound),
    })),
    qbiPhaseout: {
      phaseoutStart: parseFloat(qbiRow.phaseoutStart),
      phaseoutEnd: parseFloat(qbiRow.phaseoutEnd),
    },
  };
}

/**
 * Number of months in the tax year that have any transaction activity —
 * the modern equivalent of the workbook's "Latest Month Completed" (spec
 * §6.2), used to annualize year-to-date income (spec §6.3 D18) without
 * requiring a manual per-month "record" step.
 */
export async function getActiveMonthsCount(businessId: string, taxYear: number): Promise<number> {
  const yearStart = firstOfMonthISO(taxYear, 1);
  const yearEndExclusive = firstOfMonthISO(taxYear + 1, 1);
  const rows = await db
    .select({ date: transactions.date })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        gte(transactions.date, yearStart),
        lt(transactions.date, yearEndExclusive)
      )
    );

  const months = new Set<number>();
  for (const r of rows) {
    const month = parseInt(r.date.slice(5, 7), 10);
    months.add(month);
  }
  return months.size;
}

export interface TaxProjection {
  taxYear: number;
  filingStatus: FilingStatus;
  isSCorp: boolean;
  ytdNetIncome: number;
  activeMonths: number;
  annualizedIncome: number;
  soleProp: EntityTaxResult;
  sCorp: EntityTaxResult | null; // null if no S-Corp salary is set
  sCorpSavings: number | null; // soleProp.totalTax - sCorp.totalTax, positive = S-Corp saves money
  currentScenario: EntityTaxResult; // whichever of the above matches the business's actual election
  dataAvailable: boolean; // false if the tax year isn't seeded, or there's no income data yet
  safeHarbor: SafeHarborResult; // real IRS safe-harbor basis for the quarterly recommendation (spec §12.8)
}

/** Business fields that feed the household-level tax refinements (spec §12.5, §12.6, §12.11). */
export interface TaxProjectionBusinessInput {
  id: string;
  taxYear: number;
  filingStatus: FilingStatus;
  isSCorp: boolean;
  sCorpSalary: string | null;
  spouseIncome?: string | null;
  isSstb?: boolean | null;
  w2WagesPaid?: string | null;
  ubiaQualifiedProperty?: string | null;
}

/**
 * Computes a prior tax year's total tax + AGI from that year's *actual*
 * recorded transactions (not annualized — a completed year's real net
 * income), run through that year's own seeded tax parameters and the
 * business's current filing settings. This is the basis IRS safe harbor
 * needs (spec §12.8): 100%/110% of "last year's tax". If the prior year
 * isn't seeded, or there's no transaction history for it at all, returns
 * null so the safe-harbor calc falls back to the 90%-of-current-year test
 * only. Known simplification: the business's *current* filing status/entity
 * election/spouse income is applied retroactively to prior-year income,
 * since this app doesn't store a separate historical settings snapshot.
 */
async function getPriorYearActuals(
  business: TaxProjectionBusinessInput,
  priorTaxYear: number
): Promise<{ totalTax: number; agi: number } | null> {
  if (priorTaxYear < 0) return null;
  const taxYearData = await getTaxYearData(priorTaxYear, business.filingStatus);
  if (!taxYearData) return null;

  const yearStart = firstOfMonthISO(priorTaxYear, 1);
  const yearEndExclusive = firstOfMonthISO(priorTaxYear + 1, 1);
  const rows = await db
    .select({ type: transactions.type, amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, business.id),
        gte(transactions.date, yearStart),
        lt(transactions.date, yearEndExclusive)
      )
    );
  if (rows.length === 0) return null;

  let revenue = 0;
  let expenses = 0;
  for (const r of rows) {
    const mag = Math.abs(parseFloat(r.amount));
    if (r.type === "income") revenue += mag;
    else if (r.type === "expense") expenses += mag;
  }
  const priorNetIncome = Math.round((revenue - expenses) * 100) / 100;

  const spouseIncome = business.spouseIncome != null ? parseFloat(business.spouseIncome) : 0;
  const isSstb = business.isSstb ?? true;
  const w2WagesPaid = business.w2WagesPaid != null ? parseFloat(business.w2WagesPaid) : 0;
  const ubiaQualifiedProperty =
    business.ubiaQualifiedProperty != null ? parseFloat(business.ubiaQualifiedProperty) : 0;
  const salary = business.sCorpSalary != null ? parseFloat(business.sCorpSalary) : null;

  const result =
    business.isSCorp && salary != null
      ? computeSCorp({
          ordIncome: priorNetIncome,
          sCorpSalary: salary,
          brackets: taxYearData.brackets,
          qbiPhaseout: taxYearData.qbiPhaseout,
          taxParams: taxYearData.params,
          filingStatus: business.filingStatus,
          spouseIncome,
          isSstb,
          w2WagesPaid,
          ubiaQualifiedProperty,
        })
      : computeSoleProp({
          ordIncome: priorNetIncome,
          brackets: taxYearData.brackets,
          qbiPhaseout: taxYearData.qbiPhaseout,
          taxParams: taxYearData.params,
          filingStatus: business.filingStatus,
          spouseIncome,
          isSstb,
          w2WagesPaid,
          ubiaQualifiedProperty,
        });

  return { totalTax: result.totalTax, agi: result.agi };
}

/**
 * The full Tax Planner projection for a business: annualizes YTD net
 * income, then runs both the Sole Prop and S-Corp scenarios (spec §6.3) so
 * the comparison table always has both sides, regardless of the business's
 * actual current election.
 */
export async function getTaxProjection(
  business: TaxProjectionBusinessInput
): Promise<TaxProjection | null> {
  const taxYearData = await getTaxYearData(business.taxYear, business.filingStatus);
  if (!taxYearData) return null;

  const yearStart = firstOfMonthISO(business.taxYear, 1);
  const yearEndExclusive = firstOfMonthISO(business.taxYear + 1, 1);
  const rows = await db
    .select({ type: transactions.type, amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, business.id),
        gte(transactions.date, yearStart),
        lt(transactions.date, yearEndExclusive)
      )
    );

  let revenue = 0;
  let expenses = 0;
  for (const r of rows) {
    const mag = Math.abs(parseFloat(r.amount));
    if (r.type === "income") revenue += mag;
    else if (r.type === "expense") expenses += mag;
  }
  const ytdNetIncome = Math.round((revenue - expenses) * 100) / 100;

  const activeMonths = await getActiveMonthsCount(business.id, business.taxYear);
  const annualizedIncome = annualizeIncome(ytdNetIncome, activeMonths);

  const spouseIncome = business.spouseIncome != null ? parseFloat(business.spouseIncome) : 0;
  const isSstb = business.isSstb ?? true;
  const w2WagesPaid = business.w2WagesPaid != null ? parseFloat(business.w2WagesPaid) : 0;
  const ubiaQualifiedProperty =
    business.ubiaQualifiedProperty != null ? parseFloat(business.ubiaQualifiedProperty) : 0;

  const soleProp = computeSoleProp({
    ordIncome: annualizedIncome,
    brackets: taxYearData.brackets,
    qbiPhaseout: taxYearData.qbiPhaseout,
    taxParams: taxYearData.params,
    filingStatus: business.filingStatus,
    spouseIncome,
    isSstb,
    w2WagesPaid,
    ubiaQualifiedProperty,
  });

  const salary = business.sCorpSalary != null ? parseFloat(business.sCorpSalary) : null;
  const sCorp =
    salary != null
      ? computeSCorp({
          ordIncome: annualizedIncome,
          sCorpSalary: salary,
          brackets: taxYearData.brackets,
          qbiPhaseout: taxYearData.qbiPhaseout,
          taxParams: taxYearData.params,
          filingStatus: business.filingStatus,
          spouseIncome,
          isSstb,
          w2WagesPaid,
          ubiaQualifiedProperty,
        })
      : null;

  const currentScenario = business.isSCorp && sCorp ? sCorp : soleProp;

  const priorYearActuals = await getPriorYearActuals(business, business.taxYear - 1);
  const safeHarbor = computeSafeHarborQuarterly({
    currentYearProjectedTotalTax: currentScenario.totalTax,
    priorYear: priorYearActuals,
    filingStatus: business.filingStatus,
  });

  return {
    taxYear: business.taxYear,
    filingStatus: business.filingStatus,
    isSCorp: business.isSCorp,
    ytdNetIncome,
    activeMonths,
    annualizedIncome,
    soleProp,
    sCorp,
    sCorpSavings: sCorp ? Math.round((soleProp.totalTax - sCorp.totalTax) * 100) / 100 : null,
    currentScenario,
    dataAvailable: activeMonths > 0,
    safeHarbor,
  };
}

export interface QuarterlyPaymentRow {
  quarter: 1 | 2 | 3 | 4;
  label: string;
  dueDate: string;
  recommendedAmount: number;
  amountPaid: number;
  datePaid: string | null;
  overUnderpaid: number;
}

/**
 * The quarterly estimated-payment tracker (spec §6.8): four rows, each
 * comparing what was actually paid against an even quarter-split of the
 * IRS safe-harbor required annual payment (spec §12.8 — `recommendedQuarterlyAmount`
 * should be `safeHarbor.requiredAnnualPayment / 4` from `getTaxProjection`).
 */
export async function getQuarterlyPayments(
  businessId: string,
  taxYear: number,
  recommendedQuarterlyAmount: number
): Promise<{ rows: QuarterlyPaymentRow[]; totalPaid: number; totalOverUnderpaid: number }> {
  const paymentRows = await db
    .select()
    .from(taxPayments)
    .where(and(eq(taxPayments.businessId, businessId), eq(taxPayments.taxYear, taxYear)));

  const byQuarter = new Map(paymentRows.map((p) => [p.quarter, p]));
  const dueDates = quarterlyDueDates(taxYear);

  const rows: QuarterlyPaymentRow[] = dueDates.map((d) => {
    const paid = byQuarter.get(d.quarter);
    const amountPaid = paid ? parseFloat(paid.amountPaid) : 0;
    return {
      quarter: d.quarter,
      label: d.label,
      dueDate: d.dueDate,
      recommendedAmount: Math.round(recommendedQuarterlyAmount * 100) / 100,
      amountPaid,
      datePaid: paid?.datePaid ?? null,
      overUnderpaid: Math.round((amountPaid - recommendedQuarterlyAmount) * 100) / 100,
    };
  });

  const totalPaid = Math.round(rows.reduce((sum, r) => sum + r.amountPaid, 0) * 100) / 100;
  const totalOverUnderpaid =
    Math.round(rows.reduce((sum, r) => sum + r.overUnderpaid, 0) * 100) / 100;

  return { rows, totalPaid, totalOverUnderpaid };
}
