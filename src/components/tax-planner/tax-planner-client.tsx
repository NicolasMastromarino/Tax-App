"use client";

import Link from "next/link";
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
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {business.businessName} &middot; {dict.dashboard.subtitleTaxYear} {business.taxYear} &middot;{" "}
            {t.filingStatus[business.filingStatus]}
          </p>
        </div>
        <Link
          href={localizedPath(locale, "/settings")}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t.editProfileLink}
        </Link>
      </div>

      {!projection && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted">{t.noDataForYear.replace("{taxYear}", String(business.taxYear))}</p>
          </CardContent>
        </Card>
      )}

      {projection && !projection.dataAvailable && (
        <Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">{t.estimate.heading}</CardTitle>
              <p className="mt-1 text-sm text-muted">
                {(projection.activeMonths === 1 ? t.estimate.subtitleOne : t.estimate.subtitleMany)
                  .replace("{months}", String(projection.activeMonths))
                  .replace("{netIncome}", formatCurrency(projection.ytdNetIncome))
                  .replace("{annualized}", formatCurrency(projection.annualizedIncome))}{" "}
                <strong>{business.isSCorp ? t.estimate.sCorp : t.estimate.soleProp}</strong>.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <EstimateGrid result={projection.currentScenario} t={t} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">{t.comparison.heading}</CardTitle>
              <p className="mt-1 text-sm text-muted">{t.comparison.subtitle}</p>
            </CardHeader>
            <CardContent>
              {projection.sCorp ? (
                <>
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
                </>
              ) : (
                <p className="text-sm text-muted">
                  {t.comparison.setSalaryPrompt}{" "}
                  <Link href={localizedPath(locale, "/settings")} className="text-primary hover:underline">
                    {t.comparison.settingsLink}
                  </Link>{" "}
                  {t.comparison.toSeeComparison}
                </p>
              )}
            </CardContent>
          </Card>

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

      <Card>
        <CardContent className="py-4 text-xs text-muted">
          <p className="font-medium text-foreground">{t.disclaimer.heading}</p>
          <p className="mt-1">{t.disclaimer.body.replace("{taxYear}", String(business.taxYear))}</p>
        </CardContent>
      </Card>
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
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-primary/5 p-4 sm:gap-4">
        <Stat label={e.totalEstimatedTax} value={result.totalTax} tone="primary" big />
        <Stat label={e.quarterlyPayment} value={result.quarterlyTax} tone="info" big />
      </div>

      {/* Supporting detail — how that number was arrived at, roughly in
          calculation order (income in, deductions out, tax out). */}
      <p className="mb-3 mt-5 text-xs font-medium uppercase tracking-wide text-muted">{e.howCalculated}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <Stat label={e.agi} value={result.agi} small />
        <Stat label={e.qbiDeduction} value={result.qbiDeduction} small />
        <Stat label={e.taxableIncome} value={result.taxableIncome} small />
        <Stat label={e.incomeTax} value={result.incomeTax} small />
        <Stat label={e.seTax} value={result.seTax} small />
        <Stat label={e.additionalMedicareTax} value={result.additionalMedicareTax} small />
        <Stat label={e.marginalRate} value={`${(result.marginalRate * 100).toFixed(0)}%`} raw small />
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

function Stat({
  label,
  value,
  tone = "neutral",
  big = false,
  small = false,
  raw = false,
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "primary" | "info";
  big?: boolean;
  small?: boolean;
  raw?: boolean;
}) {
  const toneClass = {
    neutral: "text-foreground",
    primary: "text-primary",
    info: "text-info",
  }[tone];

  const sizeClass = big ? "text-xl sm:text-2xl" : small ? "text-base" : "text-lg";

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 tabular-nums font-semibold ${sizeClass} ${toneClass}`}>
        {raw ? value : formatCurrency(value as number)}
      </p>
    </div>
  );
}
