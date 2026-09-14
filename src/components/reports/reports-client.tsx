"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate, getMonthNames } from "@/lib/utils";
import type { ProfitAndLoss } from "@/lib/data/reports";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import type { Dictionary } from "@/i18n/dictionaries/en";

type OtherExpenseLine = { description: string; count: number; total: number; minDate: string; maxDate: string };
const DICTIONARIES = { en: en_, es: es_ };

export function ReportsClient({
  mode,
  year,
  month,
  customFrom,
  customTo,
  label,
  pl,
  otherExpenses,
  taxYear,
  isSubscribed,
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
  taxYear: number;
  isSubscribed: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"pl" | "other">("pl");
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.reports;
  const monthNames = getMonthNames(locale);

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams();
    params.set("mode", patch.mode ?? mode);
    params.set("year", String(patch.year ?? year));
    if ((patch.mode ?? mode) === "monthly") params.set("month", String(patch.month ?? month));
    if ((patch.mode ?? mode) === "custom") {
      params.set("from", patch.from ?? customFrom);
      params.set("to", patch.to ?? customTo);
    }
    router.push(localizedPath(locale, `/reports?${params.toString()}`));
  }

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
        {isSubscribed ? (
          <a
            href={`/api/reports/export?year=${taxYear}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <Download className="h-4 w-4" />
            {t.export.button}
          </a>
        ) : (
          <Link
            href={localizedPath(locale, "/settings#billing")}
            title={t.export.lockedHint}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted hover:text-foreground"
          >
            <Lock className="h-4 w-4" />
            {t.export.locked}
          </Link>
        )}
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabButton active={tab === "pl"} onClick={() => setTab("pl")}>
          {t.tabs.pl}
        </TabButton>
        <TabButton active={tab === "other"} onClick={() => setTab("other")}>
          {t.tabs.other}
        </TabButton>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">{t.filters.view}</label>
          <Select value={mode} onChange={(e) => update({ mode: e.target.value })} className="w-40">
            <option value="ytd">{t.filters.viewOptions.ytd}</option>
            <option value="monthly">{t.filters.viewOptions.monthly}</option>
            <option value="year">{t.filters.viewOptions.year}</option>
            <option value="custom">{t.filters.viewOptions.custom}</option>
          </Select>
        </div>
        {mode === "monthly" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">{t.filters.year}</label>
              <Select value={String(year)} onChange={(e) => update({ year: e.target.value })} className="w-24">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">{t.filters.month}</label>
              <Select value={String(month)} onChange={(e) => update({ month: e.target.value })} className="w-36">
                {monthNames.map((name, i) => (
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
            <label className="mb-1 block text-xs font-medium text-muted">{t.filters.year}</label>
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
              <label className="mb-1 block text-xs font-medium text-muted">{t.filters.from}</label>
              <Input type="date" defaultValue={customFrom} onBlur={(e) => update({ from: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">{t.filters.to}</label>
              <Input type="date" defaultValue={customTo} onBlur={(e) => update({ to: e.target.value })} />
            </div>
          </>
        )}
      </div>

      {tab === "pl" ? <ProfitAndLossView pl={pl} t={dict} locale={locale} /> : <OtherExpensesView lines={otherExpenses} t={dict} locale={locale} />}
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

function ProfitAndLossView({ pl, t }: { pl: ProfitAndLoss; t: Dictionary; locale: "en" | "es" }) {
  const r = t.reports.pl;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{r.income}</CardTitle>
        </CardHeader>
        <CardContent>
          {pl.income.length === 0 ? (
            <p className="text-sm text-muted">{r.noIncome}</p>
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
            <span>{r.totalIncome}</span>
            <span className="tabular-nums text-success">{formatCurrency(pl.totalIncome)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{r.expenses}</CardTitle>
        </CardHeader>
        <CardContent>
          {pl.expenses.length === 0 ? (
            <p className="text-sm text-muted">{r.noExpenses}</p>
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
            <span>{r.totalExpenses}</span>
            <span className="tabular-nums text-danger">{formatCurrency(pl.totalExpenses)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{r.netIncome}</p>
              <p className={cn("text-2xl font-semibold tabular-nums", pl.netIncome >= 0 ? "text-success" : "text-danger")}>
                {formatCurrency(pl.netIncome)}
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-muted">{r.ownerContributions}</p>
                <p className="font-medium tabular-nums">{formatCurrency(pl.ownerContributions)}</p>
              </div>
              <div>
                <p className="text-muted">{r.ownerDistributions}</p>
                <p className="font-medium tabular-nums">{formatCurrency(pl.ownerDistributions)}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">{r.equityNote}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OtherExpensesView({ lines, t, locale }: { lines: OtherExpenseLine[]; t: Dictionary; locale: "en" | "es" }) {
  const r = t.reports.other;
  const total = lines.reduce((s, l) => s + l.total, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{r.heading}</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="text-sm text-muted">{r.emptyState}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">{r.description}</th>
                  <th className="py-2 pr-4 text-right">{r.occurrences}</th>
                  <th className="py-2 pr-4 text-right">{r.total}</th>
                  <th className="py-2">{r.dateRangeCol}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.description} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">{l.description}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{l.count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(l.total)}</td>
                    <td className="py-2 text-muted">
                      {formatDate(l.minDate, locale)} – {formatDate(l.maxDate, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-end border-t border-border pt-3 text-sm font-semibold">
              {r.totalLabel.replace("{total}", formatCurrency(total))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
