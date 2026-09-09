import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bracketTax,
  marginalRate,
  computeSeTax,
  computeQbiDeduction,
  computeSoleProp,
  computeSCorp,
  computeSafeHarborQuarterly,
  annualizeIncome,
  quarterlyDueDates,
  ADDITIONAL_MEDICARE_THRESHOLDS,
  type TaxBracket,
  type TaxYearParams,
} from "./tax";
import { TAX_YEAR_2025_BRACKETS, TAX_YEAR_2025_QBI_PHASEOUT, TAX_YEAR_2025_PARAMETERS } from "@/db/seed-data/tax-2025";

const SINGLE_BRACKETS: TaxBracket[] = TAX_YEAR_2025_BRACKETS.filter(
  (b) => b.filingStatus === "single"
);
const MFJ_BRACKETS: TaxBracket[] = TAX_YEAR_2025_BRACKETS.filter(
  (b) => b.filingStatus === "married_filing_jointly"
);
const SINGLE_QBI = TAX_YEAR_2025_QBI_PHASEOUT.find((q) => q.filingStatus === "single")!;
const MFJ_QBI = TAX_YEAR_2025_QBI_PHASEOUT.find(
  (q) => q.filingStatus === "married_filing_jointly"
)!;
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

// ---------------------------------------------------------------------------
// Additional Medicare Tax (spec §12.6)
// ---------------------------------------------------------------------------

test("computeSoleProp: no Additional Medicare Tax below the single-filer threshold", () => {
  const result = computeSoleProp({
    ordIncome: 150_000,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
    filingStatus: "single",
  });
  assert.equal(result.additionalMedicareTax, 0);
});

test("computeSoleProp: 0.9% Additional Medicare Tax applies above the single-filer threshold", () => {
  const ordIncome = 250_000;
  const result = computeSoleProp({
    ordIncome,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
    filingStatus: "single",
  });
  const expectedSeTaxBase = round2(ordIncome * PARAMS.seTaxableFraction);
  const expected = round2(
    (expectedSeTaxBase - ADDITIONAL_MEDICARE_THRESHOLDS.single) * 0.009
  );
  assert.ok(expected > 0, "test income should be comfortably above the threshold");
  assert.equal(result.additionalMedicareTax, expected);
  assert.equal(result.totalTax, round2(result.incomeTax + result.seTax + expected));
});

test("computeSoleProp: MFJ Additional Medicare Tax threshold is higher than single's", () => {
  const ordIncome = 220_000; // above single's $200k threshold, below MFJ's $250k
  const single = computeSoleProp({
    ordIncome,
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
    filingStatus: "single",
  });
  const mfj = computeSoleProp({
    ordIncome,
    brackets: MFJ_BRACKETS,
    qbiPhaseout: MFJ_QBI,
    taxParams: PARAMS,
    filingStatus: "married_filing_jointly",
  });
  assert.ok(single.additionalMedicareTax > 0, "single filer should owe the surtax here");
  assert.equal(mfj.additionalMedicareTax, 0, "MFJ shouldn't owe it yet at this income");
});

test("computeSCorp: Additional Medicare Tax is based on salary, not total business income", () => {
  const result = computeSCorp({
    ordIncome: 400_000,
    sCorpSalary: 90_000, // well below the $200k single threshold
    brackets: SINGLE_BRACKETS,
    qbiPhaseout: SINGLE_QBI,
    taxParams: PARAMS,
    filingStatus: "single",
  });
  assert.equal(result.additionalMedicareTax, 0);
});

// ---------------------------------------------------------------------------
// Spouse income for MFJ (spec §12.11)
// ---------------------------------------------------------------------------

test("computeSoleProp: spouse income raises taxable income and bracket tax but not the business's own SE tax", () => {
  const withoutSpouse = computeSoleProp({
    ordIncome: 80_000,
    brackets: MFJ_BRACKETS,
    qbiPhaseout: MFJ_QBI,
    taxParams: PARAMS,
    filingStatus: "married_filing_jointly",
  });
  const withSpouse = computeSoleProp({
    ordIncome: 80_000,
    brackets: MFJ_BRACKETS,
    qbiPhaseout: MFJ_QBI,
    taxParams: PARAMS,
    filingStatus: "married_filing_jointly",
    spouseIncome: 60_000,
  });
  // SE tax is computed off the business's own income only.
  assert.equal(withSpouse.seTax, withoutSpouse.seTax);
  assert.equal(withSpouse.seTaxBase, withoutSpouse.seTaxBase);
  // But household AGI/taxable income/tax should all be higher.
  assert.equal(withSpouse.agi, round2(withoutSpouse.agi + 60_000));
  assert.ok(withSpouse.taxableIncome > withoutSpouse.taxableIncome);
  assert.ok(withSpouse.incomeTax > withoutSpouse.incomeTax);
});

test("computeSoleProp: spouse income can push QBI further into its phaseout band", () => {
  // Business income alone is well below the MFJ QBI phaseout start, but
  // combined household income pushes past it.
  const businessIncome = 350_000;
  const withoutSpouse = computeSoleProp({
    ordIncome: businessIncome,
    brackets: MFJ_BRACKETS,
    qbiPhaseout: MFJ_QBI,
    taxParams: PARAMS,
    filingStatus: "married_filing_jointly",
  });
  const withSpouse = computeSoleProp({
    ordIncome: businessIncome,
    brackets: MFJ_BRACKETS,
    qbiPhaseout: MFJ_QBI,
    taxParams: PARAMS,
    filingStatus: "married_filing_jointly",
    spouseIncome: 100_000, // 350k + 100k = 450k, inside the MFJ phaseout band
  });
  assert.ok(businessIncome < MFJ_QBI.phaseoutStart);
  assert.ok(businessIncome + 100_000 > MFJ_QBI.phaseoutStart);
  assert.ok(
    withSpouse.qbiDeduction < withoutSpouse.qbiDeduction,
    "QBI deduction should shrink once household income enters the phaseout band"
  );
});

// ---------------------------------------------------------------------------
// SSTB vs. non-SSTB QBI wage/UBIA limitation (spec §12.5)
// ---------------------------------------------------------------------------

test("computeQbiDeduction: SSTB tapers to zero at the phaseout end regardless of wages", () => {
  const d = computeQbiDeduction({
    ordIncome: SINGLE_QBI.phaseoutEnd,
    qbiBase: 300_000,
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
    isSstb: true,
    w2WagesPaid: 100_000, // irrelevant for an SSTB
  });
  assert.equal(d, 0);
});

test("computeQbiDeduction: non-SSTB with no wages/UBIA also tapers to zero (no safe harbor to fall back on)", () => {
  const d = computeQbiDeduction({
    ordIncome: SINGLE_QBI.phaseoutEnd,
    qbiBase: 300_000,
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
    isSstb: false,
    w2WagesPaid: 0,
    ubiaQualifiedProperty: 0,
  });
  assert.equal(d, 0);
});

test("computeQbiDeduction: non-SSTB with enough W-2 wages is floored at the wage-limited amount, not zero", () => {
  const d = computeQbiDeduction({
    ordIncome: SINGLE_QBI.phaseoutEnd, // fully phased in
    qbiBase: 300_000, // full deduction would be $60,000
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
    isSstb: false,
    w2WagesPaid: 50_000, // 50% of wages = $25,000, well above $0
  });
  assert.equal(d, 25_000); // 50% * 50,000
});

test("computeQbiDeduction: non-SSTB uses the greater of the two wage/UBIA formulas", () => {
  // 25% of wages + 2.5% of UBIA should exceed 50% of wages here.
  const d = computeQbiDeduction({
    ordIncome: SINGLE_QBI.phaseoutEnd,
    qbiBase: 300_000,
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
    isSstb: false,
    w2WagesPaid: 20_000, // 50% = 10,000
    ubiaQualifiedProperty: 800_000, // 25%*20,000 + 2.5%*800,000 = 5,000 + 20,000 = 25,000
  });
  assert.equal(d, 25_000);
});

test("computeQbiDeduction: non-SSTB with ample wages isn't reduced at all if wage-limit exceeds the full deduction", () => {
  const d = computeQbiDeduction({
    ordIncome: SINGLE_QBI.phaseoutEnd,
    qbiBase: 50_000, // full deduction = $10,000
    phaseout: SINGLE_QBI,
    qbiRate: 0.2,
    isSstb: false,
    w2WagesPaid: 200_000, // 50% = $100,000, well above the $10,000 full deduction
  });
  assert.equal(d, 10_000);
});

test("computeSCorp: the owner's own salary counts as W-2 wages for the non-SSTB wage limitation", () => {
  const result = computeSCorp({
    ordIncome: MFJ_QBI.phaseoutEnd, // fully phased in, single-equivalent scale via MFJ table
    sCorpSalary: 100_000, // 50% = $50,000 wage-limited floor
    brackets: MFJ_BRACKETS,
    qbiPhaseout: MFJ_QBI,
    taxParams: PARAMS,
    isSstb: false,
  });
  assert.ok(result.qbiDeduction > 0, "wage limitation should keep a nonzero deduction alive");
});

// ---------------------------------------------------------------------------
// Safe-harbor quarterly estimate (spec §12.8)
// ---------------------------------------------------------------------------

test("computeSafeHarborQuarterly: no prior year data -> 90% of current year projection", () => {
  const result = computeSafeHarborQuarterly({
    currentYearProjectedTotalTax: 40_000,
    priorYear: null,
    filingStatus: "single",
  });
  assert.equal(result.requiredAnnualPayment, 36_000);
  assert.equal(result.basis, "current-year-90pct");
});

test("computeSafeHarborQuarterly: prior year (not high income) caps at 100% of prior year if lower than 90% of current", () => {
  const result = computeSafeHarborQuarterly({
    currentYearProjectedTotalTax: 40_000, // 90% = 36,000
    priorYear: { totalTax: 20_000, agi: 100_000 }, // below $150k -> 100% multiplier -> floor = 20,000
    filingStatus: "single",
  });
  assert.equal(result.requiredAnnualPayment, 20_000);
  assert.equal(result.basis, "prior-year-100pct");
});

test("computeSafeHarborQuarterly: high prior-year AGI uses the 110% multiplier", () => {
  const result = computeSafeHarborQuarterly({
    currentYearProjectedTotalTax: 100_000, // 90% = 90,000
    priorYear: { totalTax: 30_000, agi: 200_000 }, // above $150k -> 110% -> floor = 33,000
    filingStatus: "single",
  });
  assert.equal(result.requiredAnnualPayment, 33_000);
  assert.equal(result.basis, "prior-year-110pct");
});

test("computeSafeHarborQuarterly: MFS uses the lower $75k high-income threshold", () => {
  const result = computeSafeHarborQuarterly({
    currentYearProjectedTotalTax: 100_000,
    priorYear: { totalTax: 30_000, agi: 80_000 }, // above $75k MFS threshold -> 110%
    filingStatus: "married_filing_separately",
  });
  assert.equal(result.basis, "prior-year-110pct");
});

test("computeSafeHarborQuarterly: picks the smaller of the two applicable tests", () => {
  const result = computeSafeHarborQuarterly({
    currentYearProjectedTotalTax: 10_000, // 90% = 9,000 -- smaller than prior-year floor
    priorYear: { totalTax: 50_000, agi: 200_000 }, // 110% = 55,000
    filingStatus: "single",
  });
  assert.equal(result.requiredAnnualPayment, 9_000);
  assert.equal(result.basis, "current-year-90pct");
});
