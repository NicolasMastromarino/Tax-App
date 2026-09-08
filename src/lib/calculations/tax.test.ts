import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bracketTax,
  marginalRate,
  computeSeTax,
  computeQbiDeduction,
  computeSoleProp,
  computeSCorp,
  annualizeIncome,
  quarterlyDueDates,
  type TaxBracket,
  type TaxYearParams,
} from "./tax";
import { TAX_YEAR_2025_BRACKETS, TAX_YEAR_2025_QBI_PHASEOUT, TAX_YEAR_2025_PARAMETERS } from "@/db/seed-data/tax-2025";

const SINGLE_BRACKETS: TaxBracket[] = TAX_YEAR_2025_BRACKETS.filter(
  (b) => b.filingStatus === "single"
);
const SINGLE_QBI = TAX_YEAR_2025_QBI_PHASEOUT.find((q) => q.filingStatus === "single")!;
const PARAMS: TaxYearParams = TAX_YEAR_2025_PARAMETERS;

test("bracketTax: zero income owes zero tax", () => {
  assert.equal(bracketTax(0, SINGLE_BRACKETS), 0);
  assert.equal(bracketTax(-100, SINGLE_BRACKETS), 0);
});

test("bracketTax: income within the first bracket is taxed at 10% flat", () => {
  assert.equal(bracketTax(10_000, SINGLE_BRACKETS), 1000);
});

test("bracketTax: income spanning multiple brackets is taxed progressively", () => {
  // $60,000 single: 10% of 11,925 + 12% of (48,475-11,925) + 22% of (60,000-48,475)
  const expected =
    0.1 * 11_925 + 0.12 * (48_475 - 11_925) + 0.22 * (60_000 - 48_475);
  assert.equal(bracketTax(60_000, SINGLE_BRACKETS), Math.round(expected * 100) / 100);
});

test("bracketTax: income above the top bracket's lower bound still taxes correctly (no upper cap)", () => {
  const tax = bracketTax(1_000_000, SINGLE_BRACKETS);
  assert.ok(tax > 300_000, `expected substantial tax on $1M income, got ${tax}`);
});

test("marginalRate finds the correct bracket", () => {
  assert.equal(marginalRate(5000, SINGLE_BRACKETS), 0.1);
  assert.equal(marginalRate(60_000, SINGLE_BRACKETS), 0.22);
  assert.equal(marginalRate(1_000_000, SINGLE_BRACKETS), 0.37);
});

test("computeSeTax: below wage base uses full 15.3% rate", () => {
  assert.equal(computeSeTax(50_000, PARAMS), round2(50_000 * 0.153));
});

test("computeSeTax: above wage base splits full-rate and Medicare-only portions", () => {
  const base = 200_000;
  const expected =
    0.153 * PARAMS.seWageBase + 0.029 * (base - PARAMS.seWageBase);
  assert.equal(computeSeTax(base, PARAMS), round2(expected));
});

test("computeSeTax: zero or negative base owes zero", () => {
  assert.equal(computeSeTax(0, PARAMS), 0);
  assert.equal(computeSeTax(-500, PARAMS), 0);
});

test("computeQbiDeduction: full 20% deduction below phaseout start", () => {
  const d = computeQbiDeduction({
    ordIncome: 100_000,
    qbiBase: 100_000,
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
  });
  assert.equal(d, 20_000);
});

test("computeQbiDeduction: zero deduction at/above phaseout end", () => {
  const d = computeQbiDeduction({
    ordIncome: 300_000,
    qbiBase: 300_000,
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
  });
  assert.equal(d, 0);
});

test("computeQbiDeduction: linearly phases out midway through the band", () => {
  const midpoint = (SINGLE_QBI.phaseoutStart + SINGLE_QBI.phaseoutEnd) / 2;
  const d = computeQbiDeduction({
    ordIncome: midpoint,
    qbiBase: midpoint,
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
  });
  // halfway through the phaseout band -> half the full deduction
  assert.equal(d, round2(0.2 * midpoint * 0.5));
});

test("computeSoleProp: QBI deduction is actually subtracted before bracket tax (the bug fix)", () => {
  const result = computeSoleProp({
    ordIncome: 100_000,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
  });
  // taxableIncome must be strictly less than AGI, since QBI deduction > 0
  assert.ok(result.qbiDeduction > 0, "expected a nonzero QBI deduction at this income");
  assert.equal(result.taxableIncome, round2(result.agi - result.qbiDeduction));
  assert.ok(
    result.taxableIncome < result.agi,
    "taxableIncome should be less than AGI once QBI deduction is subtracted"
  );
  // Sanity: income tax computed on the (lower) taxable income, not on raw ordIncome
  assert.ok(result.incomeTax < bracketTax(result.ordIncome, SINGLE_BRACKETS));
});

test("computeSoleProp: totalTax = incomeTax + seTax, quarterlyTax = totalTax / 4", () => {
  const result = computeSoleProp({
    ordIncome: 80_000,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
  });
  assert.equal(result.totalTax, round2(result.incomeTax + result.seTax));
  assert.equal(result.quarterlyTax, round2(result.totalTax / 4));
});

test("computeSoleProp: zero income produces zero tax across the board", () => {
  const result = computeSoleProp({
    ordIncome: 0,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
  });
  assert.equal(result.seTax, 0);
  assert.equal(result.incomeTax, 0);
  assert.equal(result.totalTax, 0);
});

test("computeSCorp: SE-tax-equivalent line is a flat 15.3% of salary only", () => {
  const result = computeSCorp({
    ordIncome: 150_000,
    sCorpSalary: 60_000,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
  });
  assert.equal(result.seTax, round2(0.153 * 60_000));
  assert.equal(result.seDeductible, 0);
});

test("computeSCorp: QBI base is income minus salary, floored at zero", () => {
  const result = computeSCorp({
    ordIncome: 50_000,
    sCorpSalary: 60_000, // salary exceeds income
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
  });
  assert.equal(result.qbiDeduction, 0);
});

test("S-Corp election can reduce total tax vs sole prop at higher income (the headline comparison)", () => {
  const ordIncome = 200_000;
  const soleProp = computeSoleProp({
    ordIncome,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
  });
  const sCorp = computeSCorp({
    ordIncome,
    sCorpSalary: 90_000, // a "reasonable" salary below full income
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
  });
  // The whole point of the S-Corp election is lower payroll-tax-equivalent
  // exposure on the income above the reasonable salary.
  assert.ok(
    sCorp.totalTax < soleProp.totalTax,
    `expected S-Corp total (${sCorp.totalTax}) < sole prop total (${soleProp.totalTax})`
  );
});

test("annualizeIncome projects a partial year forward", () => {
  assert.equal(annualizeIncome(30_000, 6), 60_000); // 6 months in -> double it
  assert.equal(annualizeIncome(10_000, 12), 10_000); // full year -> unchanged
  assert.equal(annualizeIncome(10_000, 0), 0); // no data -> 0, not Infinity/NaN
});

test("quarterlyDueDates computes standard IRS dates from the tax year", () => {
  const dates = quarterlyDueDates(2025);
  assert.equal(dates.length, 4);
  assert.equal(dates[0].dueDate, "2025-04-15");
  assert.equal(dates[1].dueDate, "2025-06-15");
  assert.equal(dates[2].dueDate, "2025-09-15");
  assert.equal(dates[3].dueDate, "2026-01-15"); // rolls into the following year
});

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
