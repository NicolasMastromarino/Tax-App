"use client";

import Link from "next/link";
import { DollarSign, CalendarClock, ArrowLeftRight, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { TaxProjection, QuarterlyPaymentRow } from "@/lib/data/tax";
import type { EntityTaxResult, FilingStatus } from "@/lib/calculations/tax";
import { QuarterlyTracker } from "./quarterly-tracker";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import type { Dictionary } from "@/i18n/dictionaries/en";

const DICTIONARIES = { en: en_, es: es_ };

// Soft-CTA treatment shared by the two Settings hand-offs on this page (the
// header link and the S-Corp comparison prompt) — a plain text link reads
// as a dead end here, but a solid primary button is too heavy for a
// secondary action. Mirrors Button's "soft" variant, inlined because these
// are next/link anchors, not <button>s.
const softLinkClass =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/20 bg-primary/[0.04] px-3.5 py-2 text-sm font-semibold text-primary hover:bg-primary/10";

interface BusinessTaxProfile {
  businessName: string;
  taxYear: number;
  filingStatus: FilingStatus;
  isSCorp: boolean;
  sCorpSalary: string | null;
}

export function TaxPlannerClient({
  business,
  projection,
  quarterly,
}: {
  business: BusinessTaxProfile;
  projection: TaxProjection | null;
  quarterly: { rows: QuarterlyPaymentRow[]; totalPaid: number; totalOverUnderpaid: number } | null;
}) {
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.taxPlanner;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {business.businessName} &middot; {dict.dashboard.subtitleTaxYear} {business.taxYear} &middot;{" "}
            {t.filingStatus[business.filingStatus]}
          </p>
        </div>
        <Link href={localizedPath(locale, "/settings")} className={softLinkClass}>
          {t.editProfileLink}
        </Link>
      </div>

      {!projection && (
        <Card className="rounded-2xl">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted">{t.noDataForYear.replace("{taxYear}", String(business.taxYear))}</p>
          </CardContent>
        </Card>
      )}

      {projection && !projection.dataAvailable && (
        <Card className="rounded-2xl">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted">
              {t.noBookkeepingData.replace("{taxYear}", String(business.taxYear))}
            </p>
            <Link
              href={localizedPath(locale, "/transactions")}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t.goToTransactions}
            </Link>
          </CardContent>
        </Card>
      )}

      {projection && projection.dataAvailable && (
        <>
          <Card className="rounded-2xl">
            <CardHeader className="px-7 pt-7">
              <CardTitle className="text-base font-semibold text-foreground">{t.estimate.heading}</CardTitle>
              <p className="mt-1.5 max-w-2xl text-sm text-muted">
                {(projection.activeMonths === 1 ? t.estimate.subtitleOne : t.estimate.subtitleMany)
                  .replace("{months}", String(projection.activeMonths))
                  .replace("{netIncome}", formatCurrency(projection.ytdNetIncome))
                  .replace("{annualized}", formatCurrency(projection.annualizedIncome))}{" "}
                <strong className="font-semibold text-foreground">
                  {business.isSCorp ? t.estimate.sCorp : t.estimate.soleProp}
                </strong>
                .
              </p>
            </CardHeader>
            <CardContent className="px-7 pb-7 pt-5">
              <EstimateGrid result={projection.currentScenario} t={t} />
            </CardContent>
          </Card>

          {projection.sCorp ? (
            <Card className="rounded-2xl">
              <CardHeader className="px-7 pt-7">
                <CardTitle className="text-base font-semibold text-foreground">{t.comparison.heading}</CardTitle>
                <p className="mt-1.5 text-sm text-muted">{t.comparison.subtitle}</p>
              </CardHeader>
              <CardContent className="px-7 pb-7 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ScenarioColumn
                    title={t.estimate.soleProp}
                    result={projection.soleProp}
                    highlighted={!business.isSCorp}
                    t={t}
                  />
                  <ScenarioColumn
                    title={t.estimate.sCorp}
                    result={projection.sCorp}
                    highlighted={business.isSCorp}
                    t={t}
                  />
                </div>
                <div className="mt-4 rounded-lg bg-info-bg p-4 text-sm text-info">
                  {projection.sCorpSavings != null && projection.sCorpSavings > 0 ? (
                    <p>
                      {t.comparison.savingsPositive
                        .split("{amount}")
                        .map((part, i) =>
                          i === 0 ? (
                            <span key={i}>{part}</span>
                          ) : (
                            <span key={i}>
                              <strong>{formatCurrency(projection.sCorpSavings!)}</strong>
                              {part}
                            </span>
                          )
                        )}
                    </p>
                  ) : projection.sCorpSavings != null && projection.sCorpSavings < 0 ? (
                    <p>
                      {t.comparison.savingsNegative
                        .split("{amount}")
                        .map((part, i) =>
                          i === 0 ? (
                            <span key={i}>{part}</span>
                          ) : (
                            <span key={i}>
                              <strong>{formatCurrency(Math.abs(projection.sCorpSavings!))}</strong>
                              {part}
                            </span>
                          )
                        )}
                    </p>
                  ) : (
                    <p>{t.comparison.savingsNone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">{t.comparison.heading}</p>
                  <p className="mt-1 max-w-sm text-sm text-muted">{t.comparison.subtitle}</p>
                </div>
              </div>
              <Link href={localizedPath(locale, "/settings")} className={softLinkClass}>
                {t.comparison.setSalaryPrompt.replace(/[.,]?\s*$/, "")} {t.comparison.settingsLink} →
              </Link>
            </Card>
          )}

          {quarterly && (
            <QuarterlyTracker
              taxYear={business.taxYear}
              rows={quarterly.rows}
              totalPaid={quarterly.totalPaid}
              totalOverUnderpaid={quarterly.totalOverUnderpaid}
              safeHarborBasis={projection.safeHarbor.basis}
            />
          )}
        </>
      )}

      <div className="flex items-start gap-2.5 border-t border-border pt-4">
        <Info className="mt-0.5 h-[15px] w-[15px] shrink-0 text-muted-faintest" aria-hidden="true" />
        <p className="text-xs leading-5 text-muted-faintest">
          <strong className="font-semibold text-muted-faint">{t.disclaimer.heading}</strong>{" "}
          {t.disclaimer.body.replace("{taxYear}", String(business.taxYear))}
        </p>
      </div>
    </div>
  );
}

function EstimateGrid({ result, t }: { result: EntityTaxResult; t: Dictionary["taxPlanner"] }) {
  const e = t.estimate;
  return (
    <div>
      {/* Headline numbers — what you actually owe, set apart from the
          supporting detail below so the two most-asked-about figures don't
          compete visually with the other six. */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-primary/10 bg-primary/[0.06] sm:flex-row">
        <HeadlineStat icon={DollarSign} label={e.totalEstimatedTax} value={result.totalTax} />
        <div className="mx-4 hidden w-px self-stretch bg-primary/15 sm:block" />
        <div className="mx-4 h-px bg-primary/15 sm:hidden" />
        <HeadlineStat icon={CalendarClock} label={e.quarterlyPayment} value={result.quarterlyTax} />
      </div>

      {/* Supporting detail — how that number was arrived at, roughly in
          calculation order (income in, deductions out, tax out). */}
      <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-faint">{e.howCalculated}</p>
      <div className="rounded-lg border border-hairline bg-background p-5">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          <Stat label={e.agi} value={result.agi} />
          <Stat label={e.qbiDeduction} value={result.qbiDeduction} />
          <Stat label={e.taxableIncome} value={result.taxableIncome} />
          <Stat label={e.incomeTax} value={result.incomeTax} />
          <Stat label={e.seTax} value={result.seTax} />
          <Stat label={e.additionalMedicareTax} value={result.additionalMedicareTax} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-faint">{e.marginalRate}</span>
          <Badge tone="primary">{`${(result.marginalRate * 100).toFixed(0)}%`}</Badge>
        </div>
      </div>
    </div>
  );
}

function HeadlineStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-1 items-center gap-3.5 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-primary sm:text-[28px]">
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  );
}

function ScenarioColumn({
  title,
  result,
  highlighted,
  t,
}: {
  title: string;
  result: EntityTaxResult;
  highlighted?: boolean;
  t: Dictionary["taxPlanner"];
}) {
  const c = t.comparison;
  return (
    <div
      className={`rounded-lg border p-4 ${highlighted ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {highlighted && <Badge tone="primary">{c.current}</Badge>}
      </div>
      <dl className="space-y-1.5 text-sm">
        <Row label={c.seOrPayrollTax} value={formatCurrency(result.seTax)} />
        <Row label={t.estimate.qbiDeduction} value={formatCurrency(result.qbiDeduction)} />
        <Row label={t.estimate.taxableIncome} value={formatCurrency(result.taxableIncome)} />
        <Row label={t.estimate.incomeTax} value={formatCurrency(result.incomeTax)} />
        <Row label={t.estimate.additionalMedicareTax} value={formatCurrency(result.additionalMedicareTax)} />
        <Row
          label={c.totalTax}
          value={formatCurrency(result.totalTax)}
          className="border-t border-border pt-1.5 font-semibold"
        />
        <Row label={c.perQuarter} value={formatCurrency(result.quarterlyTax)} />
      </dl>
    </div>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-faint">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">{formatCurrency(value)}</p>
    </div>
  );
}
