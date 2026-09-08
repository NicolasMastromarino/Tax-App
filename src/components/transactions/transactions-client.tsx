"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { FilterBar } from "@/components/transactions/filter-bar";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import type { CategoryRow } from "@/lib/data/categories";
import type { TransactionRow } from "@/lib/data/transactions";
import type { PeriodSummary } from "@/lib/calculations/ledger";

export function TransactionsClient({
  categories,
  transactions,
  vendorNames,
  monthSummary,
  year,
  month,
  monthLabel,
  filters,
  homeOffice,
}: {
  categories: CategoryRow[];
  transactions: TransactionRow[];
  vendorNames: string[];
  monthSummary: PeriodSummary | null;
  year: number;
  month?: number;
  monthLabel: string;
  filters: { categoryId?: string; type?: string; search?: string; sortBy?: string; sortDir?: string };
  homeOffice: { used: boolean; officeSqFt: number; totalSqFt: number };
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRow | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(tx: TransactionRow) {
    setEditing(tx);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-muted">{monthLabel}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {monthSummary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="Revenue" value={monthSummary.revenue} />
          <MiniStat label="Expenses" value={monthSummary.expenses} />
          <MiniStat label="Net Income" value={monthSummary.netIncome} />
          <MiniStat label="Beginning Balance" value={monthSummary.beginningBalance} />
          <MiniStat label="Ending Balance" value={monthSummary.endingBalance} />
          <MiniStat
            label="Contributions / Distributions"
            value={monthSummary.ownerContributions - monthSummary.ownerDistributions}
          />
        </div>
      )}

      <FilterBar categories={categories} year={year} month={month} filters={filters} />

      <TransactionTable
        transactions={transactions}
        sortBy={filters.sortBy ?? "date"}
        sortDir={filters.sortDir ?? "desc"}
        onEdit={openEdit}
      />

      <TransactionModal
        // Remount on every open/edit-target change so the form's internal
        // state (type/category/amount) always starts fresh from `editing`
        // instead of needing an effect to re-sync it.
        key={`${editing?.id ?? "create"}-${modalOpen}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        vendorNames={vendorNames}
        homeOffice={homeOffice}
        editing={editing}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pt-4">
        <CardTitle className="text-xs">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-lg font-semibold tabular-nums">{formatCurrency(value)}</p>
      </CardContent>
    </Card>
  );
}
