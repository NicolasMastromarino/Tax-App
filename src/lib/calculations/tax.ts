// Tax Planner math. Pure functions, no I/O — same philosophy as ledger.ts.
// Every function here has a direct analog documented in
// docs/WORKBOOK_SPEC.md §6 (Tax Estimator sheet); comments cite the
// relevant subsection.
//
// One deliberate correction vs. the original workbook (spec §12.3, decided
// with the user): the workbook computes the QBI deduction and the
// deductible half of self-employment tax, but never actually subtracts
// them from income before running the progressive bracket calculation —
// so it overstates projected income tax. Here, `taxableIncome` is AGI
// minus the QBI deduction, and that's what feeds the bracket calculation.
//
// Known simplifications carried over from the workbook on purpose (flagged
// to the user in the Tax Planner UI's disclaimer, not silently hidden):
// no Additional Medicare Tax (spec §12.6), no standard deduction modeled,
// a linear QBI phaseout with no SSTB/W-2-wage branching (spec §12.5), the
// S-Corp side's payroll tax ignores the SE wage-base cap (spec §6.3 E20),
// and the quarterly "recommended" amount is a flat even split with no
// safe-harbor logic (spec §12.8).

import { round2 } from "./ledger";

export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household";

export interface TaxBracket {
  rate: number;
  lowerBound: number;
  upperBound: number | null; // null = top/unbounded bracket
}

export interface QbiPhaseout {
  phaseoutStart: number;
  phaseoutEnd: number;
}

export interface TaxYearParams {
  seWageBase: number;
  seTaxableFraction: number;
  seFullRate: number;
  seMedicareOnlyRate: number;
  seDeductibleFraction: number;
  qbiRate: number;
}

// Additional Medicare Tax (IRC §1401(b)(2)) — a flat 0.9% surtax on
// self-employment income/wages above these thresholds, on top of the
// regular 2.9% Medicare portion already inside SE tax / payroll tax. Unlike
// the brackets, QBI phaseout, and SE wage base, these dollar thresholds are
// NOT inflation-adjusted — they've been fixed by statute at these exact
// values since the tax took effect in 2013 — so they're true constants
// here rather than versioned-by-tax-year database rows (spec §12.6).
export const ADDITIONAL_MEDICARE_TAX_RATE = 0.009;
export const ADDITIONAL_MEDICARE_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200_000,
  married_filing_jointly: 250_000,
  married_filing_separately: 125_000,
  head_of_household: 200_000,
};

/**
 * Progressive "bucket fill" bracket tax (spec §6.6 step 3-4), using clean
 * half-open bracket intervals [lowerBound, upperBound). Equivalent to the
 * workbook's algorithm but doesn't require a bracket-width lookup table.
 */
export function bracketTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;
  const sorted = [...brackets].sort((a, b) => a.lowerBound - b.lowerBound);
  let tax = 0;
  for (const b of sorted) {
    if (taxableIncome <= b.lowerBound) continue;
    const upper = b.upperBound ?? Infinity;
    const amountInBracket = Math.min(taxableIncome, upper) - b.lowerBound;
    if (amountInBracket > 0) tax += amountInBracket * b.rate;
  }
  return round2(tax);
}

/** The marginal rate that applies to the next dollar of taxableIncome (spec §6.7). */
export function marginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  const sorted = [...brackets].sort((a, b) => a.lowerBound - b.lowerBound);
  if (sorted.length === 0) return 0;
  for (const b of sorted) {
    const upper = b.upperBound ?? Infinity;
    if (taxableIncome >= b.lowerBound && taxableIncome < upper) return b.rate;
  }
  return sorted[sorted.length - 1].rate;
}

/**
 * Self-employment tax (spec §6.4): full rate up to the SE wage base,
 * Medicare-only rate above it.
 */
export function computeSeTax(seTaxBase: number, params: TaxYearParams): number {
  if (seTaxBase <= 0) return 0;
  if (seTaxBase > params.seWageBase) {
    return round2(
      params.seFullRate * params.seWageBase +
        params.seMedicareOnlyRate * (seTaxBase - params.seWageBase)
    );
  }
  return round2(seTaxBase * params.seFullRate);
}

/**
 * QBI deduction with phaseout (spec §6.5, refined per spec §12.5).
 * `ordIncome` (not `qbiBase`) is what determines phaseout position,
 * matching the workbook.
 *
 * For an SSTB (the workbook's only case — real estate agents and similar
 * service providers), the deduction still tapers straight to $0 across the
 * phaseout band, exactly as before. For a non-SSTB, the real IRC §199A(b)(3)
 * rule instead limits the deduction to the greater of 50% of W-2 wages paid
 * by the business, or 25% of W-2 wages + 2.5% of the unadjusted basis
 * immediately after acquisition (UBIA) of qualified property — phased in
 * linearly across the same band rather than tapering to zero. Both cases
 * fall out of one formula: an SSTB's "wage-limited amount" is defined as
 * $0, which reduces to the original straight-line-to-zero taper.
 */
export function computeQbiDeduction(params: {
  ordIncome: number;
  qbiBase: number;
  phaseout: QbiPhaseout;
  qbiRate: number;
  isSstb?: boolean;
  w2WagesPaid?: number;
  ubiaQualifiedProperty?: number;
}): number {
  const {
    ordIncome,
    qbiBase,
    phaseout,
    qbiRate,
    isSstb = true,
    w2WagesPaid = 0,
    ubiaQualifiedProperty = 0,
  } = params;
  const fullDeduction = qbiRate * Math.max(0, qbiBase);
  if (ordIncome <= phaseout.phaseoutStart) return round2(fullDeduction);

  const phaseWidth = phaseout.phaseoutEnd - phaseout.phaseoutStart;
  if (phaseWidth <= 0) return 0;

  const wageLimitedAmount = isSstb
    ? 0
    : Math.max(
        0.5 * Math.max(0, w2WagesPaid),
        0.25 * Math.max(0, w2WagesPaid) + 0.025 * Math.max(0, ubiaQualifiedProperty)
      );
  const excessAmount = Math.max(0, fullDeduction - wageLimitedAmount);
  const taperFraction =
    ordIncome >= phaseout.phaseoutEnd
      ? 1
      : (ordIncome - phaseout.phaseoutStart) / phaseWidth;

  return round2(fullDeduction - excessAmount * taperFraction);
}

export interface EntityTaxResult {
  ordIncome: number;
  seTaxBase: number;
  seTax: number;
  seDeductible: number;
  agi: number;
  qbiDeduction: number;
  taxableIncome: number;
  incomeTax: number;
  additionalMedicareTax: number;
  totalTax: number;
  quarterlyTax: number;
  marginalRate: number;
}

/**
 * Optional household/QBI-refinement inputs shared by both entity scenarios
 * (spec §12.5, §12.6, §12.11). All default to values that reproduce the
 * original behavior exactly when omitted, so existing callers/tests are
 * unaffected.
 */
interface HouseholdRefinements {
  filingStatus?: FilingStatus;
  spouseIncome?: number;
  isSstb?: boolean;
  w2WagesPaid?: number;
  ubiaQualifiedProperty?: number;
}

/** Sole Proprietor scenario (spec §6.3 column D). */
export function computeSoleProp(
  params: {
    ordIncome: number;
    brackets: TaxBracket[];
    qbiPhaseout: QbiPhaseout;
    taxParams: TaxYearParams;
  } & HouseholdRefinements
): EntityTaxResult {
  const {
    ordIncome,
    brackets,
    qbiPhaseout,
    taxParams,
    filingStatus = "single",
    spouseIncome = 0,
    isSstb = true,
    w2WagesPaid = 0,
    ubiaQualifiedProperty = 0,
  } = params;
  const seTaxBase = round2(Math.max(0, ordIncome) * taxParams.seTaxableFraction);
  const seTax = computeSeTax(seTaxBase, taxParams);
  const seDeductible = round2(seTax * taxParams.seDeductibleFraction);
  // The business's own AGI contribution (income minus the deductible half
  // of SE tax) — this is also the QBI base, since QBI is about the
  // business's own qualified income, not a spouse's separate income.
  const businessAgi = round2(ordIncome - seDeductible);
  // Household AGI blends in a spouse's income on a Married Filing Jointly
  // return (spec §12.11) — spouseIncome will be 0 for every other filing
  // status in practice, since the UI only surfaces that input for MFJ.
  const agi = round2(businessAgi + spouseIncome);
  // Phaseout position (QBI and, implicitly, the bracket calculation below)
  // is a household-level determination, so it uses the combined figure.
  const householdOrdIncome = round2(ordIncome + spouseIncome);
  const qbi = computeQbiDeduction({
    ordIncome: householdOrdIncome,
    qbiBase: businessAgi, // spec: qbi base = income - dpset (the SE-tax deduction)
    phaseout: qbiPhaseout,
    qbiRate: taxParams.qbiRate,
    isSstb,
    w2WagesPaid,
    ubiaQualifiedProperty,
  });
  // Corrected step (spec §12.3): actually subtract the QBI deduction
  // before computing income tax, instead of only displaying it.
  const taxableIncome = Math.max(0, round2(agi - qbi));
  const incomeTax = bracketTax(taxableIncome, brackets);
  // Additional Medicare Tax (spec §12.6): approximates the spouse's
  // earnings as also being Medicare-taxable wages/SE income for the
  // threshold check — a reasonable simplification since this app doesn't
  // separately model a second self-employed spouse's own SE tax.
  const additionalMedicareTax = round2(
    Math.max(0, seTaxBase + spouseIncome - ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus]) *
      ADDITIONAL_MEDICARE_TAX_RATE
  );
  const totalTax = round2(incomeTax + seTax + additionalMedicareTax);
  return {
    ordIncome: round2(ordIncome),
    seTaxBase,
    seTax,
    seDeductible,
    agi,
    qbiDeduction: qbi,
    taxableIncome,
    incomeTax,
    additionalMedicareTax,
    totalTax,
    quarterlyTax: round2(totalTax / 4),
    marginalRate: marginalRate(taxableIncome, brackets),
  };
}

/**
 * S-Corp scenario (spec §6.3 column E). The SE-tax-equivalent line here is
 * a flat 15.3% of the owner's salary (payroll tax), with no wage-base cap
 * modeled on this side — carried over from the workbook as-is (spec §6.3
 * note on E20), not part of the QBI/SE-tax bug fix decided with the user.
 */
export function computeSCorp(
  params: {
    ordIncome: number;
    sCorpSalary: number;
    brackets: TaxBracket[];
    qbiPhaseout: QbiPhaseout;
    taxParams: TaxYearParams;
  } & HouseholdRefinements
): EntityTaxResult {
  const {
    ordIncome,
    sCorpSalary,
    brackets,
    qbiPhaseout,
    taxParams,
    filingStatus = "single",
    spouseIncome = 0,
    isSstb = true,
    w2WagesPaid = 0,
    ubiaQualifiedProperty = 0,
  } = params;
  const salary = Math.max(0, sCorpSalary);
  const seTaxBase = round2(salary);
  const seTax = round2(taxParams.seFullRate * salary);
  const seDeductible = 0; // spec: S-Corp side gets no above-the-line SE-tax deduction here
  const agi = round2(ordIncome + spouseIncome); // spec: S-Corp AGI doesn't net out payroll tax
  const householdOrdIncome = round2(ordIncome + spouseIncome);
  const qbiBase = Math.max(0, round2(ordIncome - salary));
  const qbi = computeQbiDeduction({
    ordIncome: householdOrdIncome,
    qbiBase,
    phaseout: qbiPhaseout,
    qbiRate: taxParams.qbiRate,
    isSstb,
    // The owner's own S-Corp salary IS W-2 wages paid by the business for
    // QBI wage-limitation purposes, on top of any other employees' wages
    // entered separately.
    w2WagesPaid: salary + w2WagesPaid,
    ubiaQualifiedProperty,
  });
  const taxableIncome = Math.max(0, round2(agi - qbi));
  const incomeTax = bracketTax(taxableIncome, brackets);
  const additionalMedicareTax = round2(
    Math.max(0, seTaxBase + spouseIncome - ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus]) *
      ADDITIONAL_MEDICARE_TAX_RATE
  );
  const totalTax = round2(incomeTax + seTax + additionalMedicareTax);
  return {
    ordIncome: round2(ordIncome),
    seTaxBase,
    seTax,
    seDeductible,
    agi,
    qbiDeduction: qbi,
    taxableIncome,
    incomeTax,
    additionalMedicareTax,
    totalTax,
    quarterlyTax: round2(totalTax / 4),
    marginalRate: marginalRate(taxableIncome, brackets),
  };
}

/**
 * Annualizes a year-to-date net income figure based on how many months of
 * bookkeeping have actually happened this tax year (spec §6.3 D18). Modern
 * equivalent of the workbook's "Latest Month Completed" lookup: instead of
 * gating on a manual per-month "record" step, this counts months that
 * actually have transaction activity.
 */
export function annualizeIncome(ytdNetIncome: number, activeMonths: number): number {
  if (activeMonths <= 0) return 0;
  return round2(ytdNetIncome / (activeMonths / 12));
}

export interface QuarterlyDueDate {
  quarter: 1 | 2 | 3 | 4;
  dueDate: string; // ISO yyyy-mm-dd
  label: string;
}

/** Standard IRS estimated-tax due dates, computed from the tax year (spec §6.8, fixing §12.7). */
export function quarterlyDueDates(taxYear: number): QuarterlyDueDate[] {
  return [
    { quarter: 1, dueDate: `${taxYear}-04-15`, label: "Q1 (Jan-Mar)" },
    { quarter: 2, dueDate: `${taxYear}-06-15`, label: "Q2 (Apr-May)" },
    { quarter: 3, dueDate: `${taxYear}-09-15`, label: "Q3 (Jun-Aug)" },
    { quarter: 4, dueDate: `${taxYear + 1}-01-15`, label: "Q4 (Sep-Dec)" },
  ];
}

export interface SafeHarborResult {
  requiredAnnualPayment: number;
  basis: "current-year-90pct" | "prior-year-100pct" | "prior-year-110pct";
}

/**
 * A real IRS safe-harbor estimated-tax calculation (spec §12.8), replacing
 * the flat "1/4 of this year's projection" split. To avoid the
 * underpayment penalty, the IRS lets you pay the SMALLER of: 90% of this
 * year's actual tax, or 100% of last year's total tax (110% if last year's
 * AGI was above $150k, or $75k if filing separately). If last year's
 * figures aren't available — a brand-new business, or a prior tax year
 * this app doesn't have data for — only the 90%-of-current-year test
 * applies, since the prior-year safe harbor requires having actually filed
 * a full prior year.
 *
 * This still doesn't model (a) unequal income spread across the year (a
 * seasonal business) or (b) catching up an underpaid earlier quarter in a
 * later quarter's recommendation — both flagged in spec §12.8 as a further
 * "stretch" level of accuracy beyond what's implemented here.
 */
export function computeSafeHarborQuarterly(params: {
  currentYearProjectedTotalTax: number;
  priorYear?: { totalTax: number; agi: number } | null;
  filingStatus: FilingStatus;
}): SafeHarborResult {
  const { currentYearProjectedTotalTax, priorYear, filingStatus } = params;
  const ninetyPctCurrent = round2(Math.max(0, currentYearProjectedTotalTax) * 0.9);

  if (!priorYear) {
    return { requiredAnnualPayment: ninetyPctCurrent, basis: "current-year-90pct" };
  }

  const highIncomeThreshold = filingStatus === "married_filing_separately" ? 75_000 : 150_000;
  const multiplier = priorYear.agi > highIncomeThreshold ? 1.1 : 1.0;
  const priorYearFloor = round2(Math.max(0, priorYear.totalTax) * multiplier);

  if (ninetyPctCurrent <= priorYearFloor) {
    return { requiredAnnualPayment: ninetyPctCurrent, basis: "current-year-90pct" };
  }
  return {
    requiredAnnualPayment: priorYearFloor,
    basis: multiplier === 1.1 ? "prior-year-110pct" : "prior-year-100pct",
  };
}
