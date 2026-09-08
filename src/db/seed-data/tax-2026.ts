// 2026 tax figures, added because the Tax Planner shipped with only 2025
// data seeded (see PROJECT_STATUS.md) — new businesses default their Tax
// Year to the current calendar year, which is 2026, so without this file
// the Tax Planner showed "Tax figures for 2026 aren't available yet" for
// every real (non-workaround) user. Bracket bounds are normalized to clean
// half-open intervals ([lowerBound, upperBound)), same convention as
// tax-2025.ts.
//
// Sourcing / confidence, since this is a tax-calculation tool and figures
// were NOT allowed to be guessed:
// - Single and Married Filing Jointly brackets, and the Social Security
//   wage base ($184,500), are copied directly from official IRS sources
//   fetched this session: irs.gov's "IRS releases tax inflation
//   adjustments for tax year 2026" newsroom release, and IRS Publication
//   505 (2026), which explicitly states "the annual limit is $184,500 in
//   2026."
// - Head of Household brackets and the QBI (section 199A) phase-out
//   thresholds are from Tax Foundation's 2026 federal tax bracket tables
//   (a nonpartisan, tax-data-focused source), cross-checked for internal
//   consistency: HoH matches Single exactly at the 24%/35%/37% brackets
//   (the same structural relationship 2025's official data already has),
//   and the QBI phase-out range width ($75,000 for Single/HoH/MFS,
//   $150,000 for MFJ) matches IRS Publication 505's own text: "the
//   phase-in range for taxpayers who are married filing jointly will
//   increase to $150,000 and to $75,000 for all other filing statuses."
// - Married Filing Separately brackets are derived, not independently
//   sourced: by statute (the TCJA-era unified rate schedule), MFS brackets
//   equal exactly half of MFJ's dollar amounts at the top two brackets,
//   and equal Single's at the lower brackets — this is the exact pattern
//   already present in this app's official 2025 data (compare
//   tax-2025.ts: MFS matches Single through 32%, then breaks off from
//   Single and hits exactly half of MFJ at 35%/37%). The same derivation
//   is applied here to the IRS-confirmed 2026 Single/MFJ numbers.
//
// Bottom line: Single, MFJ, and the SE wage base are straight from the
// IRS. HoH and the QBI phase-out are from a secondary source cross-checked
// against IRS text. MFS is derived via the codified statutory rule. None
// of it is a blind guess, but this hasn't been checked against the full
// text of the underlying Revenue Procedure line-by-line — worth a
// once-over before relying on it for an actual filing (the app's existing
// "Not tax advice" disclaimer already covers this).

import type { FilingStatus } from "@/lib/calculations/tax";

export const TAX_YEAR_2026_PARAMETERS = {
  taxYear: 2026,
  seWageBase: 184_500, // 2026 Social Security wage base (IRS Pub 505)
  seTaxableFraction: 0.9235,
  seFullRate: 0.153,
  seMedicareOnlyRate: 0.029,
  seDeductibleFraction: 0.5,
  qbiRate: 0.2,
};

interface BracketRow {
  filingStatus: FilingStatus;
  rate: number;
  lowerBound: number;
  upperBound: number | null;
}

export const TAX_YEAR_2026_BRACKETS: BracketRow[] = [
  // Single (irs.gov, 2026 inflation-adjustment release)
  { filingStatus: "single", rate: 0.1, lowerBound: 0, upperBound: 12_400 },
  { filingStatus: "single", rate: 0.12, lowerBound: 12_400, upperBound: 50_400 },
  { filingStatus: "single", rate: 0.22, lowerBound: 50_400, upperBound: 105_700 },
  { filingStatus: "single", rate: 0.24, lowerBound: 105_700, upperBound: 201_775 },
  { filingStatus: "single", rate: 0.32, lowerBound: 201_775, upperBound: 256_225 },
  { filingStatus: "single", rate: 0.35, lowerBound: 256_225, upperBound: 640_600 },
  { filingStatus: "single", rate: 0.37, lowerBound: 640_600, upperBound: null },

  // Married Filing Jointly (irs.gov, 2026 inflation-adjustment release)
  { filingStatus: "married_filing_jointly", rate: 0.1, lowerBound: 0, upperBound: 24_800 },
  { filingStatus: "married_filing_jointly", rate: 0.12, lowerBound: 24_800, upperBound: 100_800 },
  { filingStatus: "married_filing_jointly", rate: 0.22, lowerBound: 100_800, upperBound: 211_400 },
  { filingStatus: "married_filing_jointly", rate: 0.24, lowerBound: 211_400, upperBound: 403_550 },
  { filingStatus: "married_filing_jointly", rate: 0.32, lowerBound: 403_550, upperBound: 512_450 },
  { filingStatus: "married_filing_jointly", rate: 0.35, lowerBound: 512_450, upperBound: 768_700 },
  { filingStatus: "married_filing_jointly", rate: 0.37, lowerBound: 768_700, upperBound: null },

  // Head of Household (Tax Foundation, cross-checked vs. Single at 24/35/37%)
  { filingStatus: "head_of_household", rate: 0.1, lowerBound: 0, upperBound: 17_700 },
  { filingStatus: "head_of_household", rate: 0.12, lowerBound: 17_700, upperBound: 67_450 },
  { filingStatus: "head_of_household", rate: 0.22, lowerBound: 67_450, upperBound: 105_700 },
  { filingStatus: "head_of_household", rate: 0.24, lowerBound: 105_700, upperBound: 201_775 },
  { filingStatus: "head_of_household", rate: 0.32, lowerBound: 201_775, upperBound: 256_200 },
  { filingStatus: "head_of_household", rate: 0.35, lowerBound: 256_200, upperBound: 640_600 },
  { filingStatus: "head_of_household", rate: 0.37, lowerBound: 640_600, upperBound: null },

  // Married Filing Separately (derived: matches Single through 32%, then
  // exactly half of MFJ at 35%/37% — see file header comment)
  { filingStatus: "married_filing_separately", rate: 0.1, lowerBound: 0, upperBound: 12_400 },
  { filingStatus: "married_filing_separately", rate: 0.12, lowerBound: 12_400, upperBound: 50_400 },
  { filingStatus: "married_filing_separately", rate: 0.22, lowerBound: 50_400, upperBound: 105_700 },
  { filingStatus: "married_filing_separately", rate: 0.24, lowerBound: 105_700, upperBound: 201_775 },
  { filingStatus: "married_filing_separately", rate: 0.32, lowerBound: 201_775, upperBound: 256_225 },
  { filingStatus: "married_filing_separately", rate: 0.35, lowerBound: 256_225, upperBound: 384_350 },
  { filingStatus: "married_filing_separately", rate: 0.37, lowerBound: 384_350, upperBound: null },
];

export const TAX_YEAR_2026_QBI_PHASEOUT: {
  filingStatus: FilingStatus;
  phaseoutStart: number;
  phaseoutEnd: number;
}[] = [
  { filingStatus: "single", phaseoutStart: 201_775, phaseoutEnd: 276_775 },
  { filingStatus: "married_filing_jointly", phaseoutStart: 403_500, phaseoutEnd: 553_500 },
  { filingStatus: "married_filing_separately", phaseoutStart: 201_775, phaseoutEnd: 276_775 },
  { filingStatus: "head_of_household", phaseoutStart: 201_775, phaseoutEnd: 276_775 },
];
