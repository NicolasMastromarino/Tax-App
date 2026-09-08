"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { TaxProjection, QuarterlyPaymentRow } from "@/lib/data/tax";
import type { EntityTaxResult, FilingStatus } from "@/lib/calculations/tax";
import { QuarterlyTracker } from "./quarterly-tracker";

const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  married_filing_jointly: "Married Filing Jointly",
  married_filing_separately: "Married Filing Separately",
  head_of_household: "Head of Household",
};

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
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tax Planner</h1>
          <p className="mt-1 text-sm text-muted">
            {business.businessName} &middot; Tax Year {business.taxYear} &middot;{" "}
            {FILING_STATUS_LABELS[business.filingStatus]}
          </p>
        </div>
        <Link
          href="/settings"
          className="text-sm font-medium text-primary hover:underline"
        >
          Edit tax profile in Settings →
        </Link>
      </div>

      {!projection && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted">
              Tax figures for {business.taxYear} aren&apos;t available yet. This app currently ships
              with {business.taxYear === 2025 ? "2025" : "2025 (not " + business.taxYear + ")"}{" "}
              rates — bracket and QBI data for other years hasn&apos;t been loaded.
            </p>
          </CardContent>
        </Card>
      )}

      {projection && !projection.dataAvailable && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted">
              Add some income and expense transactions for {business.taxYear} to see your tax
              estimate — this needs at least one month of bookkeeping data to annualize from.
            </p>
            <Link
              href="/transactions"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Go to Transactions →
            </Link>
          </CardContent>
        </Card>
      )}

      {projection && projection.dataAvailable && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Your Tax Estimate
              </CardTitle>
              <p className="mt-1 text-sm text-muted">
                Based on {projection.activeMonths} month{projection.activeMonths === 1 ? "" : "s"} of
                bookkeeping data ({formatCurrency(projection.ytdNetIncome)} net income so far),
                annualized to {formatCurrency(projection.annualizedIncome)} for the full year.
                Currently estimating as a{" "}
                <strong>{business.isSCorp ? "S Corporation" : "Sole Proprietor"}</strong>.
              </p>
            </CardHeader>
            <CardContent>
              <EstimateGrid result={projection.currentScenario} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Sole Proprietor vs. S-Corp
              </CardTitle>
              <p className="mt-1 text-sm text-muted">
                Same projected income, compared under each entity election.
              </p>
            </CardHeader>
            <CardContent>
              {projection.sCorp ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ScenarioColumn
                      title="Sole Proprietor"
                      result={projection.soleProp}
                      highlighted={!business.isSCorp}
                    />
                    <ScenarioColumn
                      title="S Corporation"
                      result={projection.sCorp}
                      highlighted={business.isSCorp}
                    />
                  </div>
                  <div className="mt-4 rounded-lg bg-info-bg p-4 text-sm text-info">
                    {projection.sCorpSavings != null && projection.sCorpSavings > 0 ? (
                      <p>
                        Electing S-Corp status could save approximately{" "}
                        <strong>{formatCurrency(projection.sCorpSavings)}</strong> per year at this
                        income level and salary.
                      </p>
                    ) : projection.sCorpSavings != null && projection.sCorpSavings < 0 ? (
                      <p>
                        At this income level and salary, Sole Proprietor status looks like it costs{" "}
                        <strong>{formatCurrency(Math.abs(projection.sCorpSavings))}</strong> less per
                        year than the S-Corp election.
                      </p>
                    ) : (
                      <p>Both elections project to about the same total tax at this income level.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">
                  Set an S-Corp reasonable salary in{" "}
                  <Link href="/settings" className="text-primary hover:underline">
                    Settings
                  </Link>{" "}
                  to see a side-by-side comparison.
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
            />
          )}
        </>
      )}

      <Card>
        <CardContent className="py-4 text-xs text-muted">
          <p className="font-medium text-foreground">Not tax advice.</p>
          <p className="mt-1">
            This is an estimate for planning purposes only, based on the {business.taxYear} federal
            brackets and a simplified QBI/self-employment-tax model. It does not account for the
            standard deduction, the Additional Medicare Tax, state taxes, an IRS safe-harbor
            calculation for quarterly payments, or SSTB/W-2-wage limits on the QBI deduction. Talk to
            a tax professional before making decisions based on these numbers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function EstimateGrid({ result }: { result: EntityTaxResult }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Total Estimated Tax" value={result.totalTax} tone="primary" big />
      <Stat label="Quarterly Payment" value={result.quarterlyTax} tone="info" big />
      <Stat label="Income Tax" value={result.incomeTax} />
      <Stat label="Self-Employment / Payroll Tax" value={result.seTax} />
      <Stat label="QBI Deduction" value={result.qbiDeduction} />
      <Stat label="Taxable Income" value={result.taxableIncome} />
      <Stat label="Adjusted Gross Income" value={result.agi} />
      <Stat
        label="Marginal Rate"
        value={`${(result.marginalRate * 100).toFixed(0)}%`}
        raw
      />
    </div>
  );
}

function ScenarioColumn({
  title,
  result,
  highlighted,
}: {
  title: string;
  result: EntityTaxResult;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${highlighted ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        {highlighted && <Badge tone="primary">Current</Badge>}
      </div>
      <dl className="space-y-1.5 text-sm">
        <Row label="SE / Payroll Tax" value={formatCurrency(result.seTax)} />
        <Row label="QBI Deduction" value={formatCurrency(result.qbiDeduction)} />
        <Row label="Taxable Income" value={formatCurrency(result.taxableIncome)} />
        <Row label="Income Tax" value={formatCurrency(result.incomeTax)} />
        <Row
          label="Total Tax"
          value={formatCurrency(result.totalTax)}
          className="border-t border-border pt-1.5 font-semibold"
        />
        <Row label="Per Quarter" value={formatCurrency(result.quarterlyTax)} />
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
  raw = false,
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "primary" | "info";
  big?: boolean;
  raw?: boolean;
}) {
  const toneClass = {
    neutral: "text-foreground",
    primary: "text-primary",
    info: "text-info",
  }[tone];

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 tabular-nums font-semibold ${big ? "text-2xl" : "text-lg"} ${toneClass}`}>
        {raw ? value : formatCurrency(value as number)}
      </p>
    </div>
  );
}
