"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate, MONTH_NAMES } from "@/lib/utils";
import type { ProfitAndLoss } from "@/lib/data/reports";

type OtherExpenseLine = { description: string; count: number; total: number; minDate: string; maxDate: string };

export function ReportsClient({
  mode,
  year,
  month,
  customFrom,
  customTo,
  label,
  pl,
  otherExpenses,
}: {
  mode: string;
  year: number;
  month: number;
  from: string;
  to: string;
  customFrom: string;
  customTo: string;
  label: string;
  pl: ProfitAndLoss;
  otherExpenses: OtherExpenseLine[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"pl" | "other">("pl");

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams();
    params.set("mode", patch.mode ?? mode);
    params.set("year", String(patch.year ?? year));
    if ((patch.mode ?? mode) === "monthly") params.set("month", String(patch.month ?? month));
    if ((patch.mode ?? mode) === "custom") {
      params.set("from", patch.from ?? customFrom);
      params.set("to", patch.to ?? customTo);
    }
    router.push(`/reports?${params.toString()}`);
  }

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted">{label}</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabButton active={tab === "pl"} onClick={() => setTab("pl")}>
          Profit &amp; Loss
        </TabButton>
        <TabButton active={tab === "other"} onClick={() => setTab("other")}>
          Other Expenses
        </TabButton>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">View</label>
          <Select value={mode} onChange={(e) => update({ mode: e.target.value })} className="w-40">
            <option value="ytd">Year to Date</option>
            <option value="monthly">Monthly</option>
            <option value="year">Full Year</option>
            <option value="custom">Custom Range</option>
          </Select>
        </div>
        {mode === "monthly" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Year</label>
              <Select value={String(year)} onChange={(e) => update({ year: e.target.value })} className="w-24">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Month</label>
              <Select value={String(month)} onChange={(e) => update({ month: e.target.value })} className="w-36">
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}
        {(mode === "ytd" || mode === "year") && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Year</label>
            <Select value={String(year)} onChange={(e) => update({ year: e.target.value })} className="w-24">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        )}
        {mode === "custom" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">From</label>
              <Input type="date" defaultValue={customFrom} onBlur={(e) => update({ from: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">To</label>
              <Input type="date" defaultValue={customTo} onBlur={(e) => update({ to: e.target.value })} />
            </div>
          </>
        )}
      </div>

      {tab === "pl" ? <ProfitAndLossView pl={pl} /> : <OtherExpensesView lines={otherExpenses} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-3 py-2 text-sm font-medium -mb-px",
        active ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ProfitAndLossView({ pl }: { pl: ProfitAndLoss }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Income</CardTitle>
        </CardHeader>
        <CardContent>
          {pl.income.length === 0 ? (
            <p className="text-sm text-muted">No income recorded for this period.</p>
          ) : (
            <ul className="space-y-2">
              {pl.income.map((line) => (
                <li key={line.categoryId} className="flex justify-between text-sm">
                  <span>{line.categoryName}</span>
                  <span className="tabular-nums font-medium">{formatCurrency(line.total)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total Income</span>
            <span className="tabular-nums text-success">{formatCurrency(pl.totalIncome)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {pl.expenses.length === 0 ? (
            <p className="text-sm text-muted">No expenses recorded for this period.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {pl.expenses.map((line) => (
                <li key={line.categoryId} className="flex justify-between text-sm">
                  <span>{line.categoryName}</span>
                  <span className="tabular-nums font-medium">{formatCurrency(line.total)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
            <span>Total Expenses</span>
            <span className="tabular-nums text-danger">{formatCurrency(pl.totalExpenses)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Net Income</p>
              <p className={cn("text-2xl font-semibold tabular-nums", pl.netIncome >= 0 ? "text-success" : "text-danger")}>
                {formatCurrency(pl.netIncome)}
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-muted">Owner Contributions</p>
                <p className="font-medium tabular-nums">{formatCurrency(pl.ownerContributions)}</p>
              </div>
              <div>
                <p className="text-muted">Owner Distributions</p>
                <p className="font-medium tabular-nums">{formatCurrency(pl.ownerDistributions)}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Owner contributions and distributions are equity movements, not part of Net Income.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function OtherExpensesView({ lines }: { lines: OtherExpenseLine[] }) {
  const total = lines.reduce((s, l) => s + l.total, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Other Expenses, Itemized</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="text-sm text-muted">
            No transactions have been recorded under &quot;Other Expenses&quot; for this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4 text-right">Occurrences</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2">Date Range</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.description} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">{l.description}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{l.count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(l.total)}</td>
                    <td className="py-2 text-muted">
                      {formatDate(l.minDate)} – {formatDate(l.maxDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-end border-t border-border pt-3 text-sm font-semibold">
              Total: {formatCurrency(total)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
