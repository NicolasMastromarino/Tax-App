import "server-only";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema";
import { and, eq, gte, lt, asc } from "drizzle-orm";

export interface CategoryLine {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface ProfitAndLoss {
  from: string;
  to: string; // exclusive
  income: CategoryLine[];
  totalIncome: number;
  expenses: CategoryLine[];
  totalExpenses: number;
  netIncome: number;
  ownerContributions: number;
  ownerDistributions: number;
}

export async function getProfitAndLoss(
  businessId: string,
  from: string,
  toExclusive: string
): Promise<ProfitAndLoss> {
  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryType: categories.type,
      sortOrder: categories.sortOrder,
      amount: transactions.amount,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.businessId, businessId),
        gte(transactions.date, from),
        lt(transactions.date, toExclusive)
      )
    )
    .orderBy(asc(categories.sortOrder));

  const incomeMap = new Map<string, CategoryLine>();
  const expenseMap = new Map<string, CategoryLine>();
  let ownerContributions = 0;
  let ownerDistributions = 0;

  for (const r of rows) {
    const amt = parseFloat(r.amount);
    if (r.categoryType === "income") {
      const line = incomeMap.get(r.categoryId) ?? {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        total: 0,
      };
      line.total += amt;
      incomeMap.set(r.categoryId, line);
    } else if (r.categoryType === "expense") {
      const line = expenseMap.get(r.categoryId) ?? {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        total: 0,
      };
      line.total += amt;
      expenseMap.set(r.categoryId, line);
    } else if (r.categoryType === "owner_contribution") {
      ownerContributions += amt;
    } else if (r.categoryType === "owner_distribution") {
      ownerDistributions += amt;
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const income = Array.from(incomeMap.values())
    .map((l) => ({ ...l, total: round(l.total) }))
    .sort((a, b) => b.total - a.total);
  const expenses = Array.from(expenseMap.values())
    .map((l) => ({ ...l, total: round(l.total) }))
    .sort((a, b) => b.total - a.total);

  const totalIncome = round(income.reduce((s, l) => s + l.total, 0));
  const totalExpenses = round(expenses.reduce((s, l) => s + l.total, 0));

  return {
    from,
    to: toExclusive,
    income,
    totalIncome,
    expenses,
    totalExpenses,
    netIncome: round(totalIncome - totalExpenses),
    ownerContributions: round(ownerContributions),
    ownerDistributions: round(ownerDistributions),
  };
}
