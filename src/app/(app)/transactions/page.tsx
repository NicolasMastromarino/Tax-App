import { requireBusiness } from "@/lib/current-business";
import { listCategories } from "@/lib/data/categories";
import { listTransactions, listVendorNames, listLedgerRows } from "@/lib/data/transactions";
import { summarizePeriod } from "@/lib/calculations/ledger";
import { firstOfMonthISO, MONTH_NAMES } from "@/lib/utils";
import { TransactionsClient } from "@/components/transactions/transactions-client";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const now = new Date();
  const year = Number(sp.year) || (business.taxYear as number) || now.getFullYear();
  const showAll = sp.all === "1";
  const month = showAll ? undefined : Number(sp.month) || now.getMonth() + 1;

  const categoryId = typeof sp.categoryId === "string" && sp.categoryId ? sp.categoryId : undefined;
  const type = typeof sp.type === "string" && sp.type ? (sp.type as "income" | "expense" | "owner_contribution" | "owner_distribution") : undefined;
  const search = typeof sp.search === "string" && sp.search ? sp.search : undefined;
  const sortBy = (typeof sp.sortBy === "string" ? sp.sortBy : "date") as "date" | "amount" | "category" | "description";
  const sortDir = (typeof sp.sortDir === "string" ? sp.sortDir : "desc") as "asc" | "desc";

  const from = month ? firstOfMonthISO(year, month) : undefined;
  const to = month ? firstOfMonthISO(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1) : undefined;

  const [categories, transactions, vendorNames] = await Promise.all([
    listCategories(),
    listTransactions(business.id, { from, to, categoryId, type, search, sortBy, sortDir }),
    listVendorNames(business.id),
  ]);

  let monthSummary = null;
  if (month && from && to) {
    const [beforeRows, inRows] = await Promise.all([
      listLedgerRows(business.id, { before: from }),
      listLedgerRows(business.id, { from, to }),
    ]);
    monthSummary = summarizePeriod({
      businessBeginningBalance: parseFloat(business.beginningBankBalance),
      transactionsBeforePeriod: beforeRows.map((r) => ({ type: r.type, amount: parseFloat(r.amount) })),
      transactionsInPeriod: inRows.map((r) => ({ type: r.type, amount: parseFloat(r.amount) })),
    });
  }

  return (
    <TransactionsClient
      categories={categories}
      transactions={transactions}
      vendorNames={vendorNames}
      monthSummary={monthSummary}
      year={year}
      month={month}
      monthLabel={month ? `${MONTH_NAMES[month - 1]} ${year}` : "All Transactions"}
      filters={{ categoryId, type, search, sortBy, sortDir }}
      homeOffice={{
        used: business.homeOfficeUsed,
        officeSqFt: business.homeOfficeSqFt ? parseFloat(business.homeOfficeSqFt) : 0,
        totalSqFt: business.totalHomeSqFt ? parseFloat(business.totalHomeSqFt) : 0,
      }}
    />
  );
}
