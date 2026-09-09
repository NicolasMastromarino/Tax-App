// 2025 tax figures, ported from docs/WORKBOOK_SPEC.md §6.4-§6.6. Bracket
// bounds are normalized to clean half-open intervals ([lowerBound,
// upperBound)) rather than the workbook's raw table, which fixes the
// Head-of-Household $1 overlap noted in spec §6.6/§12.14 without changing
// any other figure.
//
// CORRECTION (2026-09-09 fact-check, prompted by the user asking whether
// every formula is accurate to the latest IRS guidance before opening this
// up to real users): the QBI phase-out thresholds below were originally
// ported as $191,950/$241,950 (single/MFS/HoH) and $383,900/$483,900
// (MFJ) — those are actually the TAX YEAR 2024 figures, one year stale
// (the original workbook's own data was out of date by the time it was
// reverse-engineered). Verified directly against Rev. Proc. 2024-40 §2.27
// (the real 2025 figures) and fixed below: $197,300/$247,300 single/MFS/
// HoH, $394,600/$494,600 MFJ. Brackets, the SE wage base, and everything
// else in this file were separately verified against Rev. Proc. 2024-40
// and Fidelity's published 2025 bracket tables and were already correct —
// only the QBI phase-out numbers needed this fix.

import type { FilingStatus } from "@/lib/calculations/tax";

export const TAX_YEAR_2025_PARAMETERS = {
  taxYear: 2025,
  seWageBase: 176_100, // 2025 Social Security wage base (spec §6.4)
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

export const TAX_YEAR_2025_BRACKETS: BracketRow[] = [
  // Single (spec §6.6)
  { filingStatus: "single", rate: 0.1, lowerBound: 0, upperBound: 11_925 },
  { filingStatus: "single", rate: 0.12, lowerBound: 11_925, upperBound: 48_475 },
  { filingStatus: "single", rate: 0.22, lowerBound: 48_475, upperBound: 103_350 },
  { filingStatus: "single", rate: 0.24, lowerBound: 103_350, upperBound: 197_300 },
  { filingStatus: "single", rate: 0.32, lowerBound: 197_300, upperBound: 250_525 },
  { filingStatus: "single", rate: 0.35, lowerBound: 250_525, upperBound: 626_350 },
  { filingStatus: "single", rate: 0.37, lowerBound: 626_350, upperBound: null },

  // Married Filing Jointly
  { filingStatus: "married_filing_jointly", rate: 0.1, lowerBound: 0, upperBound: 23_850 },
  { filingStatus: "married_filing_jointly", rate: 0.12, lowerBound: 23_850, upperBound: 96_950 },
  { filingStatus: "married_filing_jointly", rate: 0.22, lowerBound: 96_950, upperBound: 206_700 },
  { filingStatus: "married_filing_jointly", rate: 0.24, lowerBound: 206_700, upperBound: 394_600 },
  { filingStatus: "married_filing_jointly", rate: 0.32, lowerBound: 394_600, upperBound: 501_050 },
  { filingStatus: "married_filing_jointly", rate: 0.35, lowerBound: 501_050, upperBound: 751_600 },
  { filingStatus: "married_filing_jointly", rate: 0.37, lowerBound: 751_600, upperBound: null },

  // Head of Household
  { filingStatus: "head_of_household", rate: 0.1, lowerBound: 0, upperBound: 17_000 },
  { filingStatus: "head_of_household", rate: 0.12, lowerBound: 17_000, upperBound: 64_850 },
  { filingStatus: "head_of_household", rate: 0.22, lowerBound: 64_850, upperBound: 103_350 },
  { filingStatus: "head_of_household", rate: 0.24, lowerBound: 103_350, upperBound: 197_300 },
  { filingStatus: "head_of_household", rate: 0.32, lowerBound: 197_300, upperBound: 250_500 },
  { filingStatus: "head_of_household", rate: 0.35, lowerBound: 250_500, upperBound: 626_350 },
  { filingStatus: "head_of_household", rate: 0.37, lowerBound: 626_350, upperBound: null },

  // Married Filing Separately
  { filingStatus: "married_filing_separately", rate: 0.1, lowerBound: 0, upperBound: 11_925 },
  { filingStatus: "married_filing_separately", rate: 0.12, lowerBound: 11_925, upperBound: 48_475 },
  { filingStatus: "married_filing_separately", rate: 0.22, lowerBound: 48_475, upperBound: 103_350 },
  { filingStatus: "married_filing_separately", rate: 0.24, lowerBound: 103_350, upperBound: 197_300 },
  { filingStatus: "married_filing_separately", rate: 0.32, lowerBound: 197_300, upperBound: 250_525 },
  { filingStatus: "married_filing_separately", rate: 0.35, lowerBound: 250_525, upperBound: 375_800 },
  { filingStatus: "married_filing_separately", rate: 0.37, lowerBound: 375_800, upperBound: null },
];

export const TAX_YEAR_2025_QBI_PHASEOUT: {
  filingStatus: FilingStatus;
  phaseoutStart: number;
  phaseoutEnd: number;
}[] = [
  // Rev. Proc. 2024-40 §2.27 — see header comment for the correction made here.
  { filingStatus: "single", phaseoutStart: 197_300, phaseoutEnd: 247_300 },
  { filingStatus: "married_filing_jointly", phaseoutStart: 394_600, phaseoutEnd: 494_600 },
  { filingStatus: "married_filing_separately", phaseoutStart: 197_300, phaseoutEnd: 247_300 },
  { filingStatus: "head_of_household", phaseoutStart: 197_300, phaseoutEnd: 247_300 },
];
