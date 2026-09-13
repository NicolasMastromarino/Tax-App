"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { deleteTransactionAction } from "@/lib/actions/transaction-actions";
import type { TransactionRow } from "@/lib/data/transactions";
import { useLocale } from "@/i18n/use-locale";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const DICTIONARIES = { en: en_, es: es_ };

const TONE_BY_TYPE: Record<string, "success" | "danger" | "info" | "neutral"> = {
  income: "success",
  expense: "danger",
  owner_contribution: "info",
  owner_distribution: "neutral",
};
const SIGN_BY_TYPE: Record<string, string> = {
  income: "+",
  expense: "-",
  owner_contribution: "+",
  owner_distribution: "-",
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
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.transactions;

  function toggleSort(column: string) {
    const params = new URLSearchParams(searchParams.toString());
    const nextDir = sortBy === column && sortDir === "asc" ? "desc" : "asc";
    params.set("sortBy", column);
    params.set("sortDir", nextDir);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleDelete(id: string, description: string) {
    if (!window.confirm(t.table.confirmDelete.replace("{description}", description))) return;
    const result = await deleteTransactionAction(id);
    if (result.success) {
      toast.success(t.table.deletedToast);
    } else {
      toast.error(translateMessage(dict, result.error) ?? t.table.deleteFailedToast);
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-sm font-medium">{t.table.emptyTitle}</p>
        <p className="mt-1 text-sm text-muted">{t.table.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border bg-surface", isPending && "opacity-60")}>
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left"><SortHeader column="date" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>{t.table.date}</SortHeader></th>
            <th className="px-4 py-3 text-left"><SortHeader column="description" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>{t.table.description}</SortHeader></th>
            <th className="px-4 py-3 text-left"><SortHeader column="category" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>{t.table.category}</SortHeader></th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">{t.table.type}</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">{t.table.vendor}</th>
            <th className="px-4 py-3 text-right"><SortHeader column="amount" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort}>{t.table.amount}</SortHeader></th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const tone = TONE_BY_TYPE[tx.type];
            const sign = SIGN_BY_TYPE[tx.type];
            return (
              <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(tx.date, locale)}</td>
                <td className="px-4 py-3">
                  <span className="font-medium">{tx.description}</span>
                  {tx.isOtherExpense && tx.otherExpenseDescription && (
                    <span className="block text-xs text-muted">{tx.otherExpenseDescription}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{tx.categoryName}</td>
                <td className="px-4 py-3">
                  <Badge tone={tone}>{t.typeShort[tx.type as keyof typeof t.typeShort]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted">{tx.vendorName || "—"}</td>
                <td
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums",
                    sign === "+" ? "text-success" : "text-danger"
                  )}
                >
                  {sign}
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(tx)}
                      className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
                      aria-label={t.table.edit}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id, tx.description)}
                      className="rounded-md p-1.5 text-muted hover:bg-danger-bg hover:text-danger"
                      aria-label={t.table.delete}
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
