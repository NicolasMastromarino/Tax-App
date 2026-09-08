import { requireBusiness } from "@/lib/current-business";
import { getProfitAndLoss } from "@/lib/data/reports";
import { otherExpensesReport } from "@/lib/data/transactions";
import { firstOfMonthISO, nextDayISO, MONTH_NAMES } from "@/lib/utils";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;

  const now = new Date();
  const mode = (typeof sp.mode === "string" ? sp.mode : "ytd") as "monthly" | "ytd" | "year" | "custom";
  const year = Number(sp.year) || business.taxYear || now.getFullYear();
  const month = Number(sp.month) || now.getMonth() + 1;
  const customFrom = typeof sp.from === "string" ? sp.from : firstOfMonthISO(year, 1);
  const customTo = typeof sp.to === "string" ? sp.to : firstOfMonthISO(year + 1, 1);

  let from: string;
  let to: string;
  let label: string;

  if (mode === "monthly") {
    from = firstOfMonthISO(year, month);
    to = firstOfMonthISO(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);
    label = `${MONTH_NAMES[month - 1]} ${year}`;
  } else if (mode === "year") {
    from = firstOfMonthISO(year, 1);
    to = firstOfMonthISO(year + 1, 1);
    label = `Full Year ${year}`;
  } else if (mode === "custom") {
    from = customFrom;
    to = nextDayISO(customTo); // customTo is inclusive from the user's perspective
    label = `${from} to ${customTo}`;
  } else {
    from = firstOfMonthISO(year, 1);
    const ytdEnd =
      year === now.getFullYear()
        ? firstOfMonthISO(now.getMonth() + 2 > 12 ? year + 1 : year, ((now.getMonth() + 1) % 12) + 1)
        : firstOfMonthISO(year + 1, 1);
    to = ytdEnd;
    label = `${year} Year-to-Date`;
  }

  const [pl, otherExpenses] = await Promise.all([
    getProfitAndLoss(business.id, from, to),
    otherExpensesReport(business.id, from, to),
  ]);

  return (
    <ReportsClient
      mode={mode}
      year={year}
      month={month}
      from={from}
      to={to}
      customFrom={customFrom}
      customTo={customTo}
      label={label}
      pl={pl}
      otherExpenses={otherExpenses}
    />
  );
}
