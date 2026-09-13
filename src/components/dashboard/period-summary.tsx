"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/data/dashboard";
import { useLocale } from "@/i18n/use-locale";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

type Period = "month" | "ytd" | "year";
const DICTIONARIES = { en: en_, es: es_ };

export function PeriodSummary({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<Period>("ytd");
  const locale = useLocale();
  const t = DICTIONARIES[locale].dashboard;

  const summary =
    period === "month" ? data.currentMonth : period === "ytd" ? data.yearToDate : data.fullYear;

  const periodLabel =
    period === "month"
      ? data.currentMonth.label
      : period === "ytd"
        ? `${data.taxYear} ${t.yearToDate}`
        : `${data.taxYear} ${t.fullYear}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {(
            [
              ["month", t.periods.month],
              ["ytd", t.periods.ytd],
              ["year", t.periods.year],
            ] as [Period, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                period === key ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{periodLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <SummaryCard label={t.cards.totalRevenue} value={summary.revenue} tone="success" />
        <SummaryCard label={t.cards.totalExpenses} value={summary.expenses} tone="danger" />
        <SummaryCard label={t.cards.netIncome} value={summary.netIncome} tone={summary.netIncome >= 0 ? "success" : "danger"} />
        <SummaryCard label={t.cards.currentBankBalance} value={data.currentBankBalance} tone="info" />
        <SummaryCard label={t.cards.ownerContributions} value={summary.ownerContributions} tone="neutral" />
        <SummaryCard label={t.cards.ownerDistributions} value={summary.ownerDistributions} tone="neutral" />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "info" | "neutral";
}) {
  const toneClass = {
    success: "text-success",
    danger: "text-danger",
    info: "text-info",
    neutral: "text-foreground",
  }[tone];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-semibold tabular-nums", toneClass)}>
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
}
