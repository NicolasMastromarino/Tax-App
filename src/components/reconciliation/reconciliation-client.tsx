"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { saveReconciliationAction } from "@/lib/actions/reconciliation-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { cn, formatCurrency, formatDate, getMonthNames } from "@/lib/utils";
import type { PeriodSummary } from "@/lib/calculations/ledger";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

const initialState: ActionState = {};
const DICTIONARIES = { en: en_, es: es_ };

export function ReconciliationClient({
  year,
  month,
  monthLabel,
  monthISO,
  summary,
  existingStatementBalance,
  existingStatus,
  history,
}: {
  year: number;
  month: number;
  monthLabel: string;
  monthISO: string;
  summary: PeriodSummary;
  existingStatementBalance: number | null;
  existingStatus: "reconciled" | "unreconciled";
  history: {
    month: string;
    status: string;
    calculatedEndingBalance: number;
    statementEndingBalance: number | null;
    difference: number | null;
  }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveReconciliationAction, initialState);
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.reconciliation;
  const monthNames = getMonthNames(locale);

  const difference =
    existingStatementBalance != null
      ? Math.round((summary.endingBalance - existingStatementBalance) * 100) / 100
      : null;
  const isReconciled = existingStatus === "reconciled" && difference === 0;

  function changeMonth(y: number, m: number) {
    router.push(localizedPath(locale, `/reconciliation?year=${y}&month=${m}`));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {t.title}
            {isReconciled && <Badge tone="success">{t.reconciledBadge}</Badge>}
          </h1>
          <p className="mt-1 text-sm text-muted">{monthLabel}</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(year)} onChange={(e) => changeMonth(Number(e.target.value), month)} className="w-24">
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select value={String(month)} onChange={(e) => changeMonth(year, Number(e.target.value))} className="w-36">
            {monthNames.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.calculatedFromBooks}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label={t.beginningBalance} value={summary.beginningBalance} />
            <Row label={t.income} value={summary.revenue} positive />
            <Row label={t.expenses} value={-summary.expenses} />
            <Row label={t.ownerContributions} value={summary.ownerContributions} positive />
            <Row label={t.ownerDistributions} value={-summary.ownerDistributions} />
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold">{t.calculatedEndingBalance}</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(summary.endingBalance)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.compareToStatement}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="month" value={monthISO} />
              <div>
                <Label htmlFor="statementEndingBalance">{t.statementEndingBalance}</Label>
                <Input
                  id="statementEndingBalance"
                  name="statementEndingBalance"
                  type="number"
                  step="0.01"
                  defaultValue={existingStatementBalance ?? ""}
                  placeholder="0.00"
                  required
                />
              </div>

              {difference !== null && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg p-3 text-sm font-medium",
                    difference === 0 ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                  )}
                >
                  {difference === 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {t.matchMessage}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {(difference > 0 ? t.higherThan : t.lowerThan).replace(
                        "{amount}",
                        formatCurrency(Math.abs(difference))
                      )}
                    </>
                  )}
                </div>
              )}

              {state.error && <p className="text-sm text-danger">{translateMessage(dict, state.error)}</p>}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? t.saving : t.save}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.history.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted">{t.history.emptyState}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4">{t.history.month}</th>
                    <th className="py-2 pr-4 text-right">{t.history.calculated}</th>
                    <th className="py-2 pr-4 text-right">{t.history.statement}</th>
                    <th className="py-2 pr-4 text-right">{t.history.difference}</th>
                    <th className="py-2">{t.history.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.month} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4">{formatDate(h.month, locale)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatCurrency(h.calculatedEndingBalance)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {h.statementEndingBalance != null ? formatCurrency(h.statementEndingBalance) : "—"}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {h.difference != null ? formatCurrency(h.difference) : "—"}
                      </td>
                      <td className="py-2">
                        <Badge tone={h.status === "reconciled" ? "success" : "warning"}>
                          {h.status === "reconciled" ? t.reconciledBadge : t.unreconciledBadge}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={cn("tabular-nums font-medium", positive ? "text-success" : value < 0 ? "text-danger" : "")}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
