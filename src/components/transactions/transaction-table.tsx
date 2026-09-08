"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransactionAction } from "@/lib/actions/transaction-actions";
import type { TransactionRow } from "@/lib/data/transactions";

const TYPE_META: Record<
  string,
  { label: string; tone: "success" | "danger" | "info" | "neutral"; sign: string }
> = {
  income: { label: "Income", tone: "success", sign: "+" },
  expense: { label: "Expense", tone: "danger", sign: "-" },
  owner_contribution: { label: "Contribution", tone: "info", sign: "+" },
  owner_distribution: { label: "Distribution", tone: "neutral", sign: "-" },
};

function SortHeader({
  column,
  sortBy,
  sortDir,
  onToggle,
  children,
}: {
  column: string;
  sortBy: string;
  sortDir: string;
  onToggle: (column: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onToggle(column)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
    >
      {children}
      {sortBy === column &&
        (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </button>
  );
}

export function TransactionTable({
  transactions,
  sortBy,
  sortDir,
  onEdit,
}: {
  transactions: TransactionRow[];
  sortBy: string;
  sortDir: string;
  onEdit: (tx: TransactionRow) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function toggleSort(column: string) {
    const params = new URLSearchParams(searchParams.toString());
    const nextDir = sortBy === column && sortDir === "asc" ? "desc" : "asc";
    params.set("sortBy", column);
    params.set("sortDir", nextDir);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleDelete(id: string, description: string) {
    if (!window.confirm(`Delete "${description}"? This can't be undone.`)) return;
    const result = await deleteTransactionAction(id);
    if (result.success) {
      toast.success("Transaction deleted");
    } else {
      toast.error(result.error ?? "Couldn't delete transaction");
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm font-medium">No transactions yet</p>
        <p className="mt-1 text-sm text-muted">Add your first transaction to get started.</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border bg-surface", isPending && "opacity-60")}>
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left"><SortHeader column="date" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>Date</SortHeader></th>
            <th className="px-4 py-3 text-left"><SortHeader column="description" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>Description</SortHeader></th>
            <th className="px-4 py-3 text-left"><SortHeader column="category" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>Category</SortHeader></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Vendor</th>
            <th className="px-4 py-3 text-right"><SortHeader column="amount" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>Amount</SortHeader></th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const meta = TYPE_META[tx.type];
            return (
              <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(tx.date)}</td>
                <td className="px-4 py-3">
                  <span className="font-medium">{tx.description}</span>
                  {tx.isOtherExpense && tx.otherExpenseDescription && (
                    <span className="block text-xs text-muted">{tx.otherExpenseDescription}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{tx.categoryName}</td>
                <td className="px-4 py-3">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </td>
                <td className="px-4 py-3 text-muted">{tx.vendorName || "—"}</td>
                <td
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums",
                    meta.sign === "+" ? "text-success" : "text-danger"
                  )}
                >
                  {meta.sign}
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(tx)}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id, tx.description)}
                      className="rounded-md p-1.5 text-muted hover:bg-danger-bg hover:text-danger"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
