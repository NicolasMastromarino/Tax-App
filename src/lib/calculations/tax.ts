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
 * QBI deduction with linear phaseout (spec §6.5). `ordIncome` (not
 * `qbiBase`) is what determines phaseout position, matching the workbook.
 */
export function computeQbiDeduction(params: {
  ordIncome: number;
  qbiBase: number;
  phaseout: QbiPhaseout;
  qbiRate: number;
}): number {
  const { ordIncome, qbiBase, phaseout, qbiRate } = params;
  const fullDeduction = qbiRate * Math.max(0, qbiBase);
  if (ordIncome <= phaseout.phaseoutStart) return round2(fullDeduction);
  if (ordIncome >= phaseout.phaseoutEnd) return 0;
  const phaseWidth = phaseout.phaseoutEnd - phaseout.phaseoutStart;
  if (phaseWidth <= 0) return 0;
  return round2(fullDeduction * (1 - (ordIncome - phaseout.phaseoutStart) / phaseWidth));
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
  totalTax: number;
  quarterlyTax: number;
  marginalRate: number;
}

/** Sole Proprietor scenario (spec §6.3 column D). */
export function computeSoleProp(params: {
  ordIncome: number;
  brackets: TaxBracket[];
  qbiPhaseout: QbiPhaseout;
  taxParams: TaxYearParams;
}): EntityTaxResult {
  const { ordIncome, brackets, qbiPhaseout, taxParams } = params;
  const seTaxBase = round2(Math.max(0, ordIncome) * taxParams.seTaxableFraction);
  const seTax = computeSeTax(seTaxBase, taxParams);
  const seDeductible = round2(seTax * taxParams.seDeductibleFraction);
  const agi = round2(ordIncome - seDeductible);
  const qbi = computeQbiDeduction({
    ordIncome,
    qbiBase: agi, // spec: qbi = income - dpset (the SE-tax deduction)
    phaseout: qbiPhaseout,
    qbiRate: taxParams.qbiRate,
  });
  // Corrected step (spec §12.3): actually subtract the QBI deduction
  // before computing income tax, instead of only displaying it.
  const taxableIncome = Math.max(0, round2(agi - qbi));
  const incomeTax = bracketTax(taxableIncome, brackets);
  const totalTax = round2(incomeTax + seTax);
  return {
    ordIncome: round2(ordIncome),
    seTaxBase,
    seTax,
    seDeductible,
    agi,
    qbiDeduction: qbi,
    taxableIncome,
    incomeTax,
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
export function computeSCorp(params: {
  ordIncome: number;
  sCorpSalary: number;
  brackets: TaxBracket[];
  qbiPhaseout: QbiPhaseout;
  taxParams: TaxYearParams;
}): EntityTaxResult {
  const { ordIncome, sCorpSalary, brackets, qbiPhaseout, taxParams } = params;
  const salary = Math.max(0, sCorpSalary);
  const seTaxBase = round2(salary);
  const seTax = round2(taxParams.seFullRate * salary);
  const seDeductible = 0; // spec: S-Corp side gets no above-the-line SE-tax deduction here
  const agi = round2(ordIncome); // spec: S-Corp AGI doesn't net out payroll tax
  const qbiBase = Math.max(0, round2(ordIncome - salary));
  const qbi = computeQbiDeduction({
    ordIncome,
    qbiBase,
    phaseout: qbiPhaseout,
    qbiRate: taxParams.qbiRate,
  });
  const taxableIncome = Math.max(0, round2(agi - qbi));
  const incomeTax = bracketTax(taxableIncome, brackets);
  const totalTax = round2(incomeTax + seTax);
  return {
    ordIncome: round2(ordIncome),
    seTaxBase,
    seTax,
    seDeductible,
    agi,
    qbiDeduction: qbi,
    taxableIncome,
    incomeTax,
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
