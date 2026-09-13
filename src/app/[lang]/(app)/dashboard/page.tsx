import { requireBusiness } from "@/lib/current-business";
import { getDashboardData } from "@/lib/data/dashboard";
import { PeriodSummary } from "@/components/dashboard/period-summary";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { MonthStatusGrid } from "@/components/dashboard/month-status-grid";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function DashboardPage() {
  const { business } = await requireBusiness();
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const data = await getDashboardData(
    business.id,
    business.taxYear,
    parseFloat(business.beginningBankBalance),
    locale
  );
  const t = dict.dashboard;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {business.businessName} &middot; {t.subtitleTaxYear} {business.taxYear}
        </p>
      </div>

      <PeriodSummary data={data} />
      <RevenueChart months={data.months} />
      <MonthStatusGrid months={data.months} taxYear={data.taxYear} />
    </div>
  );
}
