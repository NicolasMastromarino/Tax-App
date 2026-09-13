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
import { useLocale } from "@/i18n/use-locale";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import type { Dictionary } from "@/i18n/dictionaries/en";

const initialState: ActionState = {};
const DICTIONARIES = { en: en_, es: es_ };

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
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.taxPlanner.quarterly;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-7 pt-7">
        <CardTitle className="text-base font-semibold text-foreground">{t.heading}</CardTitle>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          {t.subtitle} <strong className="font-semibold text-foreground">{t.safeHarborLabels[safeHarborBasis]}</strong>.
        </p>
      </CardHeader>
      <CardContent className="px-7 pb-7 pt-5">
        {/* Table layout for tablet/desktop — seven columns don't fit a
            phone screen without horizontal scrolling, so this is hidden
            below sm and replaced with the stacked cards underneath. */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-background text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="rounded-l-lg border-b border-border py-2.5 pl-3 pr-3">{t.table.quarter}</th>
                <th className="border-b border-border py-2.5 pr-3">{t.table.dueDate}</th>
                <th className="border-b border-border py-2.5 pr-3 text-right">{t.table.recommended}</th>
                <th className="border-b border-border py-2.5 pr-3 text-right">{t.table.amountPaid}</th>
                <th className="border-b border-border py-2.5 pr-3">{t.table.datePaid}</th>
                <th className="border-b border-border py-2.5 pr-3">{t.table.overUnderpaid}</th>
                <th className="rounded-r-lg border-b border-border py-2.5" />
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
                  dict={dict}
                  locale={locale}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="py-3 pl-3 pr-3" colSpan={3}>
                  {t.table.total}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums">{formatCurrency(totalPaid)}</td>
                <td className="py-3 pr-3" />
                <td className="py-3 pr-3">
                  <OverUnderBadge amount={totalOverUnderpaid} t={t} />
                </td>
                <td className="py-3" />
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
              dict={dict}
              locale={locale}
            />
          ))}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium">{t.table.total}</span>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(totalPaid)}</p>
              <div className="mt-1">
                <OverUnderBadge amount={totalOverUnderpaid} t={t} />
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
  dict,
  locale,
}: {
  variant: "table" | "card";
  taxYear: number;
  row: QuarterlyPaymentRow;
  editing: boolean;
  onStartEdit: () => void;
  onSaved: () => void;
  onCancel: () => void;
  dict: Dictionary;
  locale: "en" | "es";
}) {
  const t = dict.taxPlanner.quarterly;
  const [state, formAction, pending] = useActionState(saveTaxPaymentAction, initialState);
  const [amountPaid, setAmountPaid] = useState(String(row.amountPaid || ""));
  const [datePaid, setDatePaid] = useState(row.datePaid ?? "");

  useEffect(() => {
    if (state.success) {
      toast.success(t.savedToast.replace("{label}", row.label));
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {pending ? t.saving : t.save}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        {t.cancel}
      </Button>
      {state.error && <p className="w-full text-xs text-danger">{translateMessage(dict, state.error)}</p>}
    </form>
  );

  const hasPayment = row.amountPaid > 0 || row.datePaid;
  const recordButton = (
    <Button size="sm" variant={hasPayment ? "outline" : "soft"} onClick={onStartEdit}>
      {hasPayment ? t.edit : t.recordPayment}
    </Button>
  );

  if (variant === "card") {
    return (
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{row.label}</p>
            <p className="text-xs text-muted">{t.due.replace("{date}", formatDate(row.dueDate, locale))}</p>
          </div>
          <OverUnderBadge amount={row.overUnderpaid} t={t} />
        </div>
        {editing ? (
          <div className="mt-3">{editForm}</div>
        ) : (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted">{t.table.recommended}</dt>
                <dd className="tabular-nums">{formatCurrency(row.recommendedAmount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t.table.amountPaid}</dt>
                <dd className="tabular-nums">{formatCurrency(row.amountPaid)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t.table.datePaid}</dt>
                <dd>{row.datePaid ? formatDate(row.datePaid, locale) : "—"}</dd>
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
      <tr className="border-b border-hairline">
        <td className="py-3.5 pl-3 pr-3 font-semibold">{row.label}</td>
        <td className="py-3.5 pr-3 text-muted">{formatDate(row.dueDate, locale)}</td>
        <td className="py-3.5 pr-3 text-right tabular-nums text-muted">{formatCurrency(row.recommendedAmount)}</td>
        <td colSpan={4} className="py-3.5 pr-3">
          {editForm}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-hairline">
      <td className="py-3.5 pl-3 pr-3 font-semibold">{row.label}</td>
      <td className="py-3.5 pr-3 text-muted">{formatDate(row.dueDate, locale)}</td>
      <td className="py-3.5 pr-3 text-right tabular-nums text-muted">{formatCurrency(row.recommendedAmount)}</td>
      <td className="py-3.5 pr-3 text-right font-semibold tabular-nums">{formatCurrency(row.amountPaid)}</td>
      <td className="py-3.5 pr-3 text-muted">{row.datePaid ? formatDate(row.datePaid, locale) : "—"}</td>
      <td className="py-3.5 pr-3">
        <OverUnderBadge amount={row.overUnderpaid} t={t} />
      </td>
      <td className="py-3.5 pr-3 text-right">{recordButton}</td>
    </tr>
  );
}

function OverUnderBadge({ amount, t }: { amount: number; t: Dictionary["taxPlanner"]["quarterly"] }) {
  if (Math.abs(amount) < 0.005) return <Badge tone="neutral">{t.onTrack}</Badge>;
  if (amount > 0) return <Badge tone="success">{t.overpaid.replace("{amount}", formatCurrency(amount))}</Badge>;
  return <Badge tone="warning">{t.underpaid.replace("{amount}", formatCurrency(Math.abs(amount)))}</Badge>;
}
