"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/data/dashboard";
import { useLocale } from "@/i18n/use-locale";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

type Period = "month" | "ytd" | "year";
type Tone = "success" | "danger" | "primary" | "neutral";
const DICTIONARIES = { en: en_, es: es_ };

const ICON_TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary",
  neutral: "bg-muted-table/10 text-muted-table",
};

const VALUE_TONE_CLASSES: Record<Tone, string> = {
  success: "text-success",
  danger: "text-danger",
  primary: "text-primary",
  neutral: "text-foreground",
};

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

  const netIncomeTone: Tone = summary.netIncome >= 0 ? "success" : "danger";

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

      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-faint">
        {t.sections.performance}
      </p>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={TrendingUp} label={t.cards.totalRevenue} value={summary.revenue} tone="success" />
        <StatTile icon={TrendingDown} label={t.cards.totalExpenses} value={summary.expenses} tone="danger" />
        <StatTile icon={DollarSign} label={t.cards.netIncome} value={summary.netIncome} tone={netIncomeTone} />
      </div>

      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-faint">
        {t.sections.cashAndEquity}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={Landmark} label={t.cards.currentBankBalance} value={data.currentBankBalance} tone="primary" />
        <StatTile icon={ArrowDown} label={t.cards.ownerContributions} value={summary.ownerContributions} tone="neutral" />
        <StatTile icon={ArrowUp} label={t.cards.ownerDistributions} value={summary.ownerDistributions} tone="neutral" />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: Tone;
}) {
  return (
    <Card className="flex items-center gap-3.5 p-5">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]", ICON_TONE_CLASSES[tone])}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className={cn("mt-0.5 text-2xl font-bold tabular-nums", VALUE_TONE_CLASSES[tone])}>
          {formatCurrency(value)}
        </p>
      </div>
    </Card>
  );
}
