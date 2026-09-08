"use client";

import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import type { MonthChartPoint } from "@/lib/data/dashboard";

export function RevenueChart({ months }: { months: MonthChartPoint[] }) {
  const data = months.map((m) => ({
    name: m.monthName.slice(0, 3),
    Revenue: m.revenue,
    Expenses: m.expenses,
    "Net Income": m.netIncome,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue, Expenses &amp; Net Income by Month</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCurrencyCompact(v)}
                width={60}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value) || 0)}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="Revenue" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line
                type="monotone"
                dataKey="Net Income"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
