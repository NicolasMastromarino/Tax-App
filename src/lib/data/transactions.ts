import "server-only";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema";
import { and, asc, desc, eq, gte, lt, ilike, or, sql } from "drizzle-orm";

export interface TransactionFilters {
  from?: string; // ISO date, inclusive
  to?: string; // ISO date, exclusive
  categoryId?: string;
  type?: "income" | "expense" | "owner_contribution" | "owner_distribution";
  search?: string; // matches description, vendor, notes
  sortBy?: "date" | "amount" | "category" | "description";
  sortDir?: "asc" | "desc";
}

export async function listTransactions(businessId: string, filters: TransactionFilters = {}) {
  const conditions = [eq(transactions.businessId, businessId)];

  if (filters.from) conditions.push(gte(transactions.date, filters.from));
  if (filters.to) conditions.push(lt(transactions.date, filters.to));
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(transactions.description, term),
        ilike(transactions.vendorName, term),
        ilike(transactions.notes, term)
      )!
    );
  }

  const sortColumn =
    filters.sortBy === "amount"
      ? transactions.amount
      : filters.sortBy === "category"
        ? categories.name
        : filters.sortBy === "description"
          ? transactions.description
          : transactions.date;
  const sortFn = filters.sortDir === "asc" ? asc : desc;

  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      type: transactions.type,
      amount: transactions.amount,
      vendorName: transactions.vendorName,
      notes: transactions.notes,
      otherExpenseDescription: transactions.otherExpenseDescription,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      isOtherExpense: categories.isOtherExpense,
      isContractLabor: categories.isContractLabor,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(sortFn(sortColumn), desc(transactions.createdAt));
}

export type TransactionRow = Awaited<ReturnType<typeof listTransactions>>[number];

export async function getTransaction(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.businessId, businessId), eq(transactions.id, id)))
    .limit(1);
  return row ?? null;
}

/** Lightweight rows for balance/summary math — just type + amount + date. */
export async function listLedgerRows(
  businessId: string,
  opts: { before?: string; from?: string; to?: string } = {}
) {
  const conditions = [eq(transactions.businessId, businessId)];
  if (opts.before) conditions.push(lt(transactions.date, opts.before));
  if (opts.from) conditions.push(gte(transactions.date, opts.from));
  if (opts.to) conditions.push(lt(transactions.date, opts.to));

  return db
    .select({
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(and(...conditions));
}

export async function otherExpensesReport(businessId: string, from?: string, to?: string) {
  const conditions = [
    eq(transactions.businessId, businessId),
    eq(categories.isOtherExpense, true),
  ];
  if (from) conditions.push(gte(transactions.date, from));
  if (to) conditions.push(lt(transactions.date, to));

  const rows = await db
    .select({
      description: transactions.otherExpenseDescription,
      amount: transactions.amount,
      date: transactions.date,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions));

  const groups = new Map<
    string,
    { description: string; count: number; total: number; minDate: string; maxDate: string }
  >();

  for (const r of rows) {
    const key = (r.description ?? "(no description)").trim() || "(no description)";
    const amt = parseFloat(r.amount);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.total += amt;
      if (r.date < existing.minDate) existing.minDate = r.date;
      if (r.date > existing.maxDate) existing.maxDate = r.date;
    } else {
      groups.set(key, { description: key, count: 1, total: amt, minDate: r.date, maxDate: r.date });
    }
  }

  return Array.from(groups.values())
    .map((g) => ({ ...g, total: Math.round(g.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}

export async function contractorPaymentsReport(businessId: string, from?: string, to?: string) {
  const conditions = [
    eq(transactions.businessId, businessId),
    eq(categories.isContractLabor, true),
  ];
  if (from) conditions.push(gte(transactions.date, from));
  if (to) conditions.push(lt(transactions.date, to));

  const rows = await db
    .select({
      vendorName: transactions.vendorName,
      amount: transactions.amount,
      date: transactions.date,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions));

  const groups = new Map<string, { vendorName: string; count: number; total: number }>();
  for (const r of rows) {
    const key = (r.vendorName ?? "(unnamed contractor)").trim() || "(unnamed contractor)";
    const amt = parseFloat(r.amount);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.total += amt;
    } else {
      groups.set(key, { vendorName: key, count: 1, total: amt });
    }
  }

  return Array.from(groups.values())
    .map((g) => ({ ...g, total: Math.round(g.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}

/** Distinct vendor names already used, for the Add/Edit form's autocomplete. */
export async function listVendorNames(businessId: string) {
  const rows = await db
    .selectDistinct({ vendorName: transactions.vendorName })
    .from(transactions)
    .where(and(eq(transactions.businessId, businessId), sql`${transactions.vendorName} is not null and ${transactions.vendorName} <> ''`));
  return rows.map((r) => r.vendorName!).sort();
}
