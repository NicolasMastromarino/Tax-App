"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/data/dashboard";

type Period = "month" | "ytd" | "year";

export function PeriodSummary({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<Period>("ytd");

  const summary =
    period === "month" ? data.currentMonth : period === "ytd" ? data.yearToDate : data.fullYear;

  const periodLabel =
    period === "month" ? data.currentMonth.label : period === "ytd" ? `${data.taxYear} Year-to-Date` : `${data.taxYear} Full Year`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {(
            [
              ["month", "Current Month"],
              ["ytd", "Year to Date"],
              ["year", "Full Year"],
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
        <SummaryCard label="Total Revenue" value={summary.revenue} tone="success" />
        <SummaryCard label="Total Expenses" value={summary.expenses} tone="danger" />
        <SummaryCard label="Net Income" value={summary.netIncome} tone={summary.netIncome >= 0 ? "success" : "danger"} />
        <SummaryCard label="Current Bank Balance" value={data.currentBankBalance} tone="info" />
        <SummaryCard label="Owner Contributions" value={summary.ownerContributions} tone="neutral" />
        <SummaryCard label="Owner Distributions" value={summary.ownerDistributions} tone="neutral" />
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
