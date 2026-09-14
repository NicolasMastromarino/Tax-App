import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDot, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonthChartPoint, MonthStatus } from "@/lib/data/dashboard";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/locales";

type Tone = "success" | "warning" | "primary" | "neutral";

const PANEL_TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/10 border-success/20",
  warning: "bg-warning/10 border-warning/20",
  primary: "bg-primary/5 border-primary/20",
  neutral: "bg-surface-muted border-hairline",
};

const LABEL_TONE_CLASSES: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  primary: "text-primary",
  neutral: "text-muted-faintest",
};

export async function MonthStatusGrid({
  months,
  taxYear,
  currentMonth,
}: {
  months: MonthChartPoint[];
  taxYear: number;
  currentMonth: number;
}) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.dashboard.monthlyStatus;

  const STATUS_META: Record<MonthStatus, { label: string; icon: React.ElementType }> = {
    complete: { label: t.complete, icon: CheckCircle2 },
    in_progress: { label: t.inProgress, icon: CircleDot },
    not_started: { label: t.notStarted, icon: MinusCircle },
  };

  const completeCount = months.filter((m) => m.status === "complete").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t.heading}</CardTitle>
        <Badge tone="success">
          {completeCount} {t.monthsComplete}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {months.map((m) => {
            const isCurrent = m.month === currentMonth && m.status !== "complete";
            const tone: Tone = isCurrent ? "primary" : m.status === "complete" ? "success" : m.status === "in_progress" ? "warning" : "neutral";
            const meta = STATUS_META[m.status];
            const Icon = meta.icon;
            return (
              <Link
                key={m.month}
                href={localizedPath(locale, `/transactions?year=${taxYear}&month=${m.month}`)}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3.5 py-3 transition-colors hover:brightness-95",
                  PANEL_TONE_CLASSES[tone]
                )}
              >
                <span className="text-sm font-semibold text-foreground">
                  {/* Abbreviated below `sm` so the status label/icon still fits
                      in a narrow 2-col mobile cell without wrapping or truncating. */}
                  <span className="sm:hidden">{m.monthName.slice(0, 3)}</span>
                  <span className="hidden sm:inline">{m.monthName}</span>
                </span>
                <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", LABEL_TONE_CLASSES[tone])}>
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          {t.footnotePrefix} <strong>{t.footnoteComplete}</strong> {t.footnoteSuffix}
        </p>
      </CardContent>
    </Card>
  );
}
