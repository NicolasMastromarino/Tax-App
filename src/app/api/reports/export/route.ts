import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasActiveSubscription } from "@/lib/data/subscription";
import { listTransactions } from "@/lib/data/transactions";
import { getProfitAndLoss } from "@/lib/data/reports";
import { getContractorRows, get1099Threshold } from "@/lib/data/contractors";
import { firstOfMonthISO } from "@/lib/utils";
import { toCSV } from "@/lib/csv";

const TYPE_LABEL: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  owner_contribution: "Owner Contribution",
  owner_distribution: "Owner Distribution",
};

const SIGN: Record<string, 1 | -1> = {
  income: 1,
  expense: -1,
  owner_contribution: 1,
  owner_distribution: -1,
};

/**
 * Bundles a tax year's books into a ZIP of accountant-ready CSVs: full
 * transaction detail, a category-level P&L, and the 1099/contractor
 * summary. Paid feature (see hasActiveSubscription) -- gated the same way
 * as Tax Planner and Contractors & 1099s.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, session.user.id))
    .limit(1);
  if (!business) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  if (!hasActiveSubscription(business, session.user.email)) {
    return NextResponse.json({ error: "This export requires an active subscription." }, { status: 403 });
  }

  const url = new URL(request.url);
  const taxYear = Number(url.searchParams.get("year")) || business.taxYear;
  const yearStart = firstOfMonthISO(taxYear, 1);
  const yearEndExclusive = firstOfMonthISO(taxYear + 1, 1);

  const [transactions, pl, contractors] = await Promise.all([
    listTransactions(business.id, { from: yearStart, to: yearEndExclusive, sortBy: "date", sortDir: "asc" }),
    getProfitAndLoss(business.id, yearStart, yearEndExclusive),
    getContractorRows(business.id, taxYear),
  ]);

  const transactionsCSV = toCSV(
    transactions.map((t) => ({
      date: t.date,
      type: TYPE_LABEL[t.type] ?? t.type,
      category: t.categoryName,
      description: t.description,
      vendor: t.vendorName ?? "",
      amount: SIGN[t.type] * parseFloat(t.amount),
      notes: t.notes ?? "",
    })),
    [
      { key: "date", header: "Date" },
      { key: "type", header: "Type" },
      { key: "category", header: "Category" },
      { key: "description", header: "Description" },
      { key: "vendor", header: "Vendor" },
      { key: "amount", header: "Amount" },
      { key: "notes", header: "Notes" },
    ]
  );

  const plRows = [
    ...pl.income.map((l) => ({ section: "Income", category: l.categoryName, total: l.total })),
    { section: "Income", category: "Total Income", total: pl.totalIncome },
    ...pl.expenses.map((l) => ({ section: "Expenses", category: l.categoryName, total: l.total })),
    { section: "Expenses", category: "Total Expenses", total: pl.totalExpenses },
    { section: "Summary", category: "Net Income", total: pl.netIncome },
    { section: "Summary", category: "Owner Contributions", total: pl.ownerContributions },
    { section: "Summary", category: "Owner Distributions", total: pl.ownerDistributions },
  ];
  const profitAndLossCSV = toCSV(plRows, [
    { key: "section", header: "Section" },
    { key: "category", header: "Category" },
    { key: "total", header: "Total" },
  ]);

  const threshold = get1099Threshold(taxYear);
  const contractorsCSV = toCSV(
    contractors.map((c) => ({
      vendor: c.vendorName,
      payments: String(c.paymentCount), // plain integer, not currency-formatted
      totalPaid: c.totalPaid,
      needs1099: c.needs1099 ? "Yes" : "No",
      email: c.vendor?.email ?? "",
      phone: c.vendor?.phone ?? "",
      address: c.vendor?.address ?? "",
      taxId: c.vendor?.taxId ?? "",
      w9OnFile: c.vendor?.w9DocumentUrl ? "Yes" : "No",
    })),
    [
      { key: "vendor", header: "Vendor" },
      { key: "payments", header: "Payments" },
      { key: "totalPaid", header: "Total Paid" },
      { key: "needs1099", header: `Needs 1099 (>= $${threshold})` },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "address", header: "Address" },
      { key: "taxId", header: "Tax ID" },
      { key: "w9OnFile", header: "W-9 On File" },
    ]
  );

  const zip = new JSZip();
  zip.file("transactions.csv", transactionsCSV);
  zip.file("profit-and-loss.csv", profitAndLossCSV);
  zip.file("contractors-1099.csv", contractorsCSV);
  const buffer = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${business.businessName.replace(/[^a-z0-9]+/gi, "-")}-${taxYear}-books.zip"`,
    },
  });
}
