// Core bookkeeping math. Pure functions, no I/O, so they're easy to unit
// test and to trust — this is the money-correctness-critical part of the
// app. Every function here has a direct analog documented in
// docs/WORKBOOK_SPEC.md; see the section references in each comment.

export type TxType =
  | "income"
  | "expense"
  | "owner_contribution"
  | "owner_distribution";

export interface LedgerTransaction {
  date: string; // ISO yyyy-mm-dd
  type: TxType;
  amount: number; // always stored as a positive magnitude
  categoryName?: string;
}

/**
 * Converts a positive-magnitude amount + type into its signed effect on the
 * bank balance. Income and owner contributions are inflows (+); expenses and
 * owner distributions are outflows (-). This is the direct replacement for
 * the workbook's manual "type it into the Inflows column OR the Outflows
 * column" convention (spec §5.3) — here the sign is derived, not typed, so
 * the "Error- Double Entry" failure mode (spec §6, §27) cannot occur.
 */
export function signedAmount(tx: Pick<LedgerTransaction, "type" | "amount">): number {
  const magnitude = Math.abs(tx.amount);
  switch (tx.type) {
    case "income":
    case "owner_contribution":
      return magnitude;
    case "expense":
    case "owner_distribution":
      return -magnitude;
  }
}

/** Sum of signed effects for a set of transactions. */
export function sumSigned(txs: Pick<LedgerTransaction, "type" | "amount">[]): number {
  return round2(txs.reduce((acc, t) => acc + signedAmount(t), 0));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * The running bank balance as of (and including) a given date, given the
 * business's initial beginning balance and every transaction dated on or
 * before that date. Replaces the workbook's row-by-row running-balance
 * chain (spec §5.3, formula for column F) with a single sum, so historical
 * edits/deletes recompute correctly instead of requiring a manual re-walk
 * down the column.
 */
export function balanceThrough(
  beginningBalance: number,
  allTransactionsUpToDate: Pick<LedgerTransaction, "type" | "amount">[]
): number {
  return round2(beginningBalance + sumSigned(allTransactionsUpToDate));
}

export interface PeriodSummary {
  revenue: number;
  expenses: number; // positive magnitude, for display
  netIncome: number;
  ownerContributions: number;
  ownerDistributions: number;
  beginningBalance: number;
  endingBalance: number;
}

/**
 * Summarizes a period given (a) all transactions strictly before the
 * period start (to derive the period's beginning balance from the
 * business's initial balance) and (b) the transactions within the period.
 * This mirrors the workbook's Year To Date / month-sheet totals (spec §7.1,
 * §7.2) — Revenue, Total Expenses, Net Operating Income, and Contributions/
 * Distributions kept separate from P&L, per the workbook's own structure.
 */
export function summarizePeriod(params: {
  businessBeginningBalance: number;
  transactionsBeforePeriod: Pick<LedgerTransaction, "type" | "amount">[];
  transactionsInPeriod: Pick<LedgerTransaction, "type" | "amount">[];
}): PeriodSummary {
  const { businessBeginningBalance, transactionsBeforePeriod, transactionsInPeriod } = params;

  const beginningBalance = balanceThrough(businessBeginningBalance, transactionsBeforePeriod);

  let revenue = 0;
  let expenses = 0;
  let ownerContributions = 0;
  let ownerDistributions = 0;

  for (const t of transactionsInPeriod) {
    const mag = Math.abs(t.amount);
    if (t.type === "income") revenue += mag;
    else if (t.type === "expense") expenses += mag;
    else if (t.type === "owner_contribution") ownerContributions += mag;
    else if (t.type === "owner_distribution") ownerDistributions += mag;
  }

  const netIncome = round2(revenue - expenses);
  const endingBalance = balanceThrough(beginningBalance, transactionsInPeriod);

  return {
    revenue: round2(revenue),
    expenses: round2(expenses),
    netIncome,
    ownerContributions: round2(ownerContributions),
    ownerDistributions: round2(ownerDistributions),
    beginningBalance: round2(beginningBalance),
    endingBalance: round2(endingBalance),
  };
}

export interface ReconciliationResult {
  beginningBalance: number;
  calculatedEndingBalance: number;
  statementEndingBalance: number | null;
  difference: number | null;
  isReconciled: boolean;
}

/**
 * The reconciliation chain from spec §8: Beginning Balance + Income -
 * Expenses + Contributions - Distributions = Calculated Ending Balance,
 * then compared against what the bank statement says.
 */
export function reconcile(params: {
  beginningBalance: number;
  transactionsInMonth: Pick<LedgerTransaction, "type" | "amount">[];
  statementEndingBalance: number | null;
}): ReconciliationResult {
  const calculatedEndingBalance = balanceThrough(
    params.beginningBalance,
    params.transactionsInMonth
  );
  const difference =
    params.statementEndingBalance == null
      ? null
      : round2(calculatedEndingBalance - params.statementEndingBalance);

  return {
    beginningBalance: round2(params.beginningBalance),
    calculatedEndingBalance,
    statementEndingBalance: params.statementEndingBalance,
    difference,
    isReconciled: difference !== null && Math.abs(difference) < 0.005,
  };
}

/**
 * Home office deductible portion of a home-related bill (spec §9 / §5.2):
 * businessUsePercentage = officeSqFt / totalSqFt; deductible = bill *
 * businessUsePercentage. Unlike the workbook, this is a pure function the
 * UI can call live rather than a scratch cell the user must remember to
 * clear between uses.
 */
export function homeOfficeDeduction(params: {
  officeSqFt: number;
  totalSqFt: number;
  billAmount: number;
}): { businessUsePercentage: number; deductibleAmount: number } {
  const { officeSqFt, totalSqFt, billAmount } = params;
  if (!totalSqFt || totalSqFt <= 0) {
    return { businessUsePercentage: 0, deductibleAmount: 0 };
  }
  const pct = officeSqFt / totalSqFt;
  return {
    businessUsePercentage: pct,
    deductibleAmount: round2(billAmount * pct),
  };
}

/**
 * Simplified home-office method (IRS Rev. Proc. 2013-13): flat $5/sq ft of
 * office space, capped at 300 sq ft ($1,500 max for tax years where the
 * rate is $5/sq ft — the workbook mentions this method in prose only, spec
 * §12.4; this rebuild implements it so the app can recommend the larger of
 * the two methods instead of leaving it as a manual mental calculation.
 */
export function simplifiedHomeOfficeDeduction(officeSqFt: number, ratePerSqFt = 5): number {
  const cappedSqFt = Math.min(Math.max(officeSqFt, 0), 300);
  return round2(cappedSqFt * ratePerSqFt);
}
