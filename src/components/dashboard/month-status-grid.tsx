import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, MinusCircle } from "lucide-react";
import type { MonthChartPoint, MonthStatus } from "@/lib/data/dashboard";

const STATUS_META: Record<MonthStatus, { label: string; tone: "success" | "warning" | "neutral"; icon: React.ElementType }> = {
  complete: { label: "Complete", tone: "success", icon: CheckCircle2 },
  in_progress: { label: "In Progress", tone: "warning", icon: Circle },
  not_started: { label: "Not Started", tone: "neutral", icon: MinusCircle },
};

export function MonthStatusGrid({ months, taxYear }: { months: MonthChartPoint[]; taxYear: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Bookkeeping Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {months.map((m) => {
            const meta = STATUS_META[m.status];
            const Icon = meta.icon;
            return (
              <Link
                key={m.month}
                href={`/transactions?year=${taxYear}&month=${m.month}`}
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
          A month is <strong>Complete</strong> once it&apos;s been reconciled against your bank
          statement.
        </p>
      </CardContent>
    </Card>
  );
}
