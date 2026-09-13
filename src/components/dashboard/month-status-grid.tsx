import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, MinusCircle } from "lucide-react";
import type { MonthChartPoint, MonthStatus } from "@/lib/data/dashboard";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/locales";

export async function MonthStatusGrid({ months, taxYear }: { months: MonthChartPoint[]; taxYear: number }) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.dashboard.monthlyStatus;

  const STATUS_META: Record<MonthStatus, { label: string; tone: "success" | "warning" | "neutral"; icon: React.ElementType }> = {
    complete: { label: t.complete, tone: "success", icon: CheckCircle2 },
    in_progress: { label: t.inProgress, tone: "warning", icon: Circle },
    not_started: { label: t.notStarted, tone: "neutral", icon: MinusCircle },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.heading}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {months.map((m) => {
            const meta = STATUS_META[m.status];
            const Icon = meta.icon;
            return (
              <Link
                key={m.month}
                href={localizedPath(locale, `/transactions?year=${taxYear}&month=${m.month}`)}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-surface-muted"
              >
                <span className="text-sm font-medium">{m.monthName}</span>
                <Badge tone={meta.tone} className="gap-1">
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </Badge>
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
