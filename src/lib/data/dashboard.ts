import "server-only";
import { db } from "@/db";
import { transactions, reconciliations } from "@/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";
import {
  summarizePeriod,
  balanceThrough,
  type LedgerTransaction,
} from "@/lib/calculations/ledger";
import { MONTH_NAMES, firstOfMonthISO, todayISO, nextDayISO } from "@/lib/utils";

export type MonthStatus = "not_started" | "in_progress" | "complete";

export interface MonthChartPoint {
  month: number;
  monthName: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  status: MonthStatus;
}

export interface DashboardData {
  taxYear: number;
  currentBankBalance: number;
  currentMonth: { year: number; month: number; label: string } & Awaited<
    ReturnType<typeof summarizePeriod>
  >;
  yearToDate: ReturnType<typeof summarizePeriod>;
  fullYear: ReturnType<typeof summarizePeriod>;
  months: MonthChartPoint[];
}

async function rowsInRange(businessId: string, from: string, toExclusive: string) {
  return db
    .select({ date: transactions.date, type: transactions.type, amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.businessId, businessId),
        gte(transactions.date, from),
        lt(transactions.date, toExclusive)
      )
    );
}

async function rowsBefore(businessId: string, before: string) {
  return db
    .select({ date: transactions.date, type: transactions.type, amount: transactions.amount })
    .from(transactions)
    .where(and(eq(transactions.businessId, businessId), lt(transactions.date, before)));
}

function toLedgerRows(rows: { date: string; type: string; amount: string }[]): LedgerTransaction[] {
  return rows.map((r) => ({
    date: r.date,
    type: r.type as LedgerTransaction["type"],
    amount: parseFloat(r.amount),
  }));
}

export async function getCurrentBankBalance(businessId: string, businessBeginningBalance: number) {
  const today = todayISO();
  const rows = await rowsInRange(businessId, "0001-01-01", nextDayISO(today));
  return balanceThrough(businessBeginningBalance, toLedgerRows(rows));
}

export async function getDashboardData(
  businessId: string,
  taxYear: number,
  businessBeginningBalance: number
): Promise<DashboardData> {
  const now = new Date();
  const realYear = now.getFullYear();
  const realMonth = now.getMonth() + 1;

  // "As of" date used for YTD/current-month framing when viewing the live
  // tax year; past years show their full 12 months, future years show none.
  const asOfMonth = taxYear === realYear ? realMonth : taxYear < realYear ? 12 : 0;

  const yearStart = firstOfMonthISO(taxYear, 1);
  const yearEndExclusive = firstOfMonthISO(taxYear + 1, 1);

  const [beforeYearRows, yearRows, reconciliationRows] = await Promise.all([
    rowsBefore(businessId, yearStart),
    rowsInRange(businessId, yearStart, yearEndExclusive),
    db
      .select({ month: reconciliations.month, status: reconciliations.status })
      .from(reconciliations)
      .where(
        and(
          eq(reconciliations.businessId, businessId),
          gte(reconciliations.month, yearStart),
          lt(reconciliations.month, yearEndExclusive)
        )
      ),
  ]);

  const beforeYearLedger = toLedgerRows(beforeYearRows);
  const yearLedger = toLedgerRows(yearRows);

  const reconciledMonths = new Set(
    reconciliationRows.filter((r) => r.status === "reconciled").map((r) => r.month)
  );

  const months: MonthChartPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthStart = firstOfMonthISO(taxYear, m);
    const monthEndExclusive = firstOfMonthISO(m === 12 ? taxYear + 1 : taxYear, m === 12 ? 1 : m + 1);
    const monthRows = yearLedger.filter((r) => r.date >= monthStart && r.date < monthEndExclusive);

    let revenue = 0;
    let expenses = 0;
    for (const r of monthRows) {
      const mag = Math.abs(r.amount);
      if (r.type === "income") revenue += mag;
      else if (r.type === "expense") expenses += mag;
    }

    const status: MonthStatus = reconciledMonths.has(monthStart)
      ? "complete"
      : monthRows.length > 0
        ? "in_progress"
        : "not_started";

    months.push({
      month: m,
      monthName: MONTH_NAMES[m - 1],
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      netIncome: Math.round((revenue - expenses) * 100) / 100,
      status,
    });
  }

  const ytdEndExclusive =
    asOfMonth === 0 ? yearStart : firstOfMonthISO(asOfMonth === 12 ? taxYear + 1 : taxYear, asOfMonth === 12 ? 1 : asOfMonth + 1);
  const ytdRows = yearLedger.filter((r) => r.date < ytdEndExclusive);

  const yearToDate = summarizePeriod({
    businessBeginningBalance,
    transactionsBeforePeriod: beforeYearLedger,
    transactionsInPeriod: ytdRows,
  });

  const fullYear = summarizePeriod({
    businessBeginningBalance,
    transactionsBeforePeriod: beforeYearLedger,
    transactionsInPeriod: yearLedger,
  });

  const currentMonthNum = asOfMonth === 0 ? 1 : asOfMonth;
  const currentMonthStart = firstOfMonthISO(taxYear, currentMonthNum);
  const currentMonthEndExclusive = firstOfMonthISO(
    currentMonthNum === 12 ? taxYear + 1 : taxYear,
    currentMonthNum === 12 ? 1 : currentMonthNum + 1
  );
  const beforeCurrentMonth = [
    ...beforeYearLedger,
    ...yearLedger.filter((r) => r.date < currentMonthStart),
  ];
  const currentMonthRows = yearLedger.filter(
    (r) => r.date >= currentMonthStart && r.date < currentMonthEndExclusive
  );
  const currentMonthSummary = summarizePeriod({
    businessBeginningBalance,
    transactionsBeforePeriod: beforeCurrentMonth,
    transactionsInPeriod: currentMonthRows,
  });

  const currentBankBalance = await getCurrentBankBalance(businessId, businessBeginningBalance);

  return {
    taxYear,
    currentBankBalance,
    currentMonth: {
      year: taxYear,
      month: currentMonthNum,
      label: MONTH_NAMES[currentMonthNum - 1] + " " + taxYear,
      ...currentMonthSummary,
    },
    yearToDate,
    fullYear,
    months,
  };
}
