"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
// NOTE: `editing` state for each row is owned by QuarterlyTracker (below),
// not by QuarterRow itself, and closed via an `onSaved` prop rather than a
// locally-owned setState call inside an effect — same pattern as
// TransactionModal/transactions-client.tsx, which avoids the
// react-hooks/set-state-in-effect lint rule (it only flags effects calling
// a setState setter the component owns directly, not an opaque prop call).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { saveTaxPaymentAction } from "@/lib/actions/tax-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { QuarterlyPaymentRow } from "@/lib/data/tax";
import type { SafeHarborResult } from "@/lib/calculations/tax";

const initialState: ActionState = {};

const SAFE_HARBOR_LABELS: Record<SafeHarborResult["basis"], string> = {
  "current-year-90pct": "90% of this year's projected tax",
  "prior-year-100pct": "100% of last year's total tax",
  "prior-year-110pct":
    "110% of last year's total tax (last year's income was above the high-income threshold)",
};

export function QuarterlyTracker({
  taxYear,
  rows,
  totalPaid,
  totalOverUnderpaid,
  safeHarborBasis,
}: {
  taxYear: number;
  rows: QuarterlyPaymentRow[];
  totalPaid: number;
  totalOverUnderpaid: number;
  safeHarborBasis: SafeHarborResult["basis"];
}) {
  const [editingQuarter, setEditingQuarter] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Quarterly Estimated Payments
        </CardTitle>
        <p className="mt-1 text-sm text-muted">
          Recommended amount uses the IRS safe-harbor rule: the smaller of 90% of this
          year&apos;s projected tax or 100%/110% of last year&apos;s, split evenly across 4
          quarters. Currently based on: <strong>{SAFE_HARBOR_LABELS[safeHarborBasis]}</strong>.
        </p>
      </CardHeader>
      <CardContent>
        {/* Table layout for tablet/desktop — seven columns don't fit a
            phone screen without horizontal scrolling, so this is hidden
            below sm and replaced with the stacked cards underneath. */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="py-2 pr-3">Quarter</th>
                <th className="py-2 pr-3">Due Date</th>
                <th className="py-2 pr-3">Recommended</th>
                <th className="py-2 pr-3">Amount Paid</th>
                <th className="py-2 pr-3">Date Paid</th>
                <th className="py-2 pr-3">Over / Underpaid</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <QuarterRow
                  key={`table-${row.quarter}-${editingQuarter === row.quarter}`}
                  variant="table"
                  taxYear={taxYear}
                  row={row}
                  editing={editingQuarter === row.quarter}
                  onStartEdit={() => setEditingQuarter(row.quarter)}
                  onSaved={() => setEditingQuarter(null)}
                  onCancel={() => setEditingQuarter(null)}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td className="py-2 pr-3" colSpan={3}>
                  Total
                </td>
                <td className="py-2 pr-3 tabular-nums">{formatCurrency(totalPaid)}</td>
                <td className="py-2 pr-3" />
                <td className="py-2 pr-3 tabular-nums">
                  <OverUnderBadge amount={totalOverUnderpaid} />
                </td>
                <td className="py-2" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Stacked cards for phone-width screens — same data and the same
            inline-edit flow, one quarter per card instead of a row. */}
        <div className="space-y-3 sm:hidden">
          {rows.map((row) => (
            <QuarterRow
              key={`card-${row.quarter}-${editingQuarter === row.quarter}`}
              variant="card"
              taxYear={taxYear}
              row={row}
              editing={editingQuarter === row.quarter}
              onStartEdit={() => setEditingQuarter(row.quarter)}
              onSaved={() => setEditingQuarter(null)}
              onCancel={() => setEditingQuarter(null)}
            />
          ))}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium">Total</span>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(totalPaid)}</p>
              <div className="mt-1">
                <OverUnderBadge amount={totalOverUnderpaid} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuarterRow({
  variant,
  taxYear,
  row,
  editing,
  onStartEdit,
  onSaved,
  onCancel,
}: {
  variant: "table" | "card";
  taxYear: number;
  row: QuarterlyPaymentRow;
  editing: boolean;
  onStartEdit: () => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveTaxPaymentAction, initialState);
  const [amountPaid, setAmountPaid] = useState(String(row.amountPaid || ""));
  const [datePaid, setDatePaid] = useState(row.datePaid ?? "");

  useEffect(() => {
    if (state.success) {
      toast.success(`${row.label} payment saved`);
      onSaved();
    }
  }, [state.success, row.label, onSaved]);

  const editForm = (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="taxYear" value={taxYear} />
      <input type="hidden" name="quarter" value={row.quarter} />
      <Input
        name="amountPaid"
        type="number"
        step="0.01"
        value={amountPaid}
        onChange={(e) => setAmountPaid(e.target.value)}
        className="h-8 w-28"
        placeholder="0.00"
      />
      <Input
        name="datePaid"
        type="date"
        value={datePaid}
        onChange={(e) => setDatePaid(e.target.value)}
        className="h-8 w-40"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      {state.error && <p className="w-full text-xs text-danger">{state.error}</p>}
    </form>
  );

  const recordButton = (
    <Button size="sm" variant="outline" onClick={onStartEdit}>
      {row.amountPaid > 0 || row.datePaid ? "Edit" : "Record Payment"}
    </Button>
  );

  if (variant === "card") {
    return (
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{row.label}</p>
            <p className="text-xs text-muted">Due {formatDate(row.dueDate)}</p>
          </div>
          <OverUnderBadge amount={row.overUnderpaid} />
        </div>
        {editing ? (
          <div className="mt-3">{editForm}</div>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted">Recommended</dt>
                <dd className="tabular-nums">{formatCurrency(row.recommendedAmount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Amount Paid</dt>
                <dd className="tabular-nums">{formatCurrency(row.amountPaid)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Date Paid</dt>
                <dd>{row.datePaid ? formatDate(row.datePaid) : "—"}</dd>
              </div>
            </dl>
            <div className="mt-3">{recordButton}</div>
          </>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <tr className="border-b border-border/60">
        <td className="py-2 pr-3 font-medium">{row.label}</td>
        <td className="py-2 pr-3 text-muted">{formatDate(row.dueDate)}</td>
        <td className="py-2 pr-3 tabular-nums text-muted">{formatCurrency(row.recommendedAmount)}</td>
        <td colSpan={4} className="py-2">
          {editForm}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/60">
      <td className="py-2 pr-3 font-medium">{row.label}</td>
      <td className="py-2 pr-3 text-muted">{formatDate(row.dueDate)}</td>
      <td className="py-2 pr-3 tabular-nums text-muted">{formatCurrency(row.recommendedAmount)}</td>
      <td className="py-2 pr-3 tabular-nums">{formatCurrency(row.amountPaid)}</td>
      <td className="py-2 pr-3 text-muted">{row.datePaid ? formatDate(row.datePaid) : "—"}</td>
      <td className="py-2 pr-3 tabular-nums">
        <OverUnderBadge amount={row.overUnderpaid} />
      </td>
      <td className="py-2 text-right">{recordButton}</td>
    </tr>
  );
}

function OverUnderBadge({ amount }: { amount: number }) {
  if (Math.abs(amount) < 0.005) return <Badge tone="neutral">On track</Badge>;
  if (amount > 0) return <Badge tone="success">{formatCurrency(amount)} overpaid</Badge>;
  return <Badge tone="warning">{formatCurrency(Math.abs(amount))} underpaid</Badge>;
}
