import { requireBusiness } from "@/lib/current-business";
import { listLedgerRows } from "@/lib/data/transactions";
import { listReconciliations, getReconciliation } from "@/lib/data/reconciliations";
import { summarizePeriod } from "@/lib/calculations/ledger";
import { firstOfMonthISO, MONTH_NAMES } from "@/lib/utils";
import { ReconciliationClient } from "@/components/reconciliation/reconciliation-client";

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const now = new Date();
  const year = Number(sp.year) || business.taxYear || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;

  const monthISO = firstOfMonthISO(year, month);
  const nextMonthISO = firstOfMonthISO(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);

  const [beforeRows, inRows, existing, history] = await Promise.all([
    listLedgerRows(business.id, { before: monthISO }),
    listLedgerRows(business.id, { from: monthISO, to: nextMonthISO }),
    getReconciliation(business.id, monthISO),
    listReconciliations(business.id),
  ]);

  const summary = summarizePeriod({
    businessBeginningBalance: parseFloat(business.beginningBankBalance),
    transactionsBeforePeriod: beforeRows.map((r) => ({ type: r.type, amount: parseFloat(r.amount) })),
    transactionsInPeriod: inRows.map((r) => ({ type: r.type, amount: parseFloat(r.amount) })),
  });

  return (
    <ReconciliationClient
      year={year}
      month={month}
      monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
      monthISO={monthISO}
      summary={summary}
      existingStatementBalance={existing?.statementEndingBalance ? parseFloat(existing.statementEndingBalance) : null}
      existingStatus={existing?.status ?? "unreconciled"}
      history={history.map((h) => ({
        month: h.month,
        status: h.status,
        calculatedEndingBalance: parseFloat(h.calculatedEndingBalance),
        statementEndingBalance: h.statementEndingBalance ? parseFloat(h.statementEndingBalance) : null,
        difference: h.difference ? parseFloat(h.difference) : null,
      }))}
    />
  );
}
