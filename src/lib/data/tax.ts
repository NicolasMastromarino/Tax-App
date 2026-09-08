import "server-only";
import { db } from "@/db";
import { transactions, taxParameters, taxBrackets, qbiPhaseoutParameters, taxPayments } from "@/db/schema";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import {
  computeSoleProp,
  computeSCorp,
  annualizeIncome,
  quarterlyDueDates,
  type TaxBracket,
  type QbiPhaseout,
  type TaxYearParams,
  type EntityTaxResult,
  type FilingStatus,
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
}

/**
 * The full Tax Planner projection for a business: annualizes YTD net
 * income, then runs both the Sole Prop and S-Corp scenarios (spec §6.3) so
 * the comparison table always has both sides, regardless of the business's
 * actual current election.
 */
export async function getTaxProjection(business: {
  id: string;
  taxYear: number;
  filingStatus: FilingStatus;
  isSCorp: boolean;
  sCorpSalary: string | null;
}): Promise<TaxProjection | null> {
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

  const soleProp = computeSoleProp({
    ordIncome: annualizedIncome,
    brackets: taxYearData.brackets,
    qbiPhaseout: taxYearData.qbiPhaseout,
    taxParams: taxYearData.params,
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
        })
      : null;

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
    currentScenario: business.isSCorp && sCorp ? sCorp : soleProp,
    dataAvailable: activeMonths > 0,
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
 * current projected total tax (a known simplification — no safe-harbor
 * logic, spec §12.8).
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
