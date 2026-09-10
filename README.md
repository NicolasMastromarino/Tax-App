# Bookkeeply

A modern bookkeeping web application for service-based businesses, built to replace the "10 Minute Bookkeeping for Service-Based Businesses" Excel workbook. It preserves the workbook's business logic (categories, reconciliation math, home office deduction, double-entry validation) while replacing its Excel-specific mechanics (12 monthly tabs, manual "Transfer" macros, pivot tables that need manual refreshing) with a normal web app backed by one transactions database.

See [`docs/WORKBOOK_SPEC.md`](./docs/WORKBOOK_SPEC.md) for the full analysis of the original workbook's formulas, VBA macros, and business rules that this app is built from.

## What's built (v1 — core bookkeeping)

- Email/password authentication (one business per account; the data model supports more later)
- Dashboard: revenue/expenses/net income by Current Month / YTD / Full Year, a monthly chart, current bank balance, and a monthly bookkeeping status grid (Not Started / In Progress / Complete)
- Transactions: a single normalized ledger with month filtering, category/type/vendor/search filters, sortable columns, and an Add/Edit modal with a searchable category dropdown
- Category-vs-type validation at the form and server-action level (replaces the workbook's after-the-fact "Error- Double Entry" flag with validation that prevents the bad state from being saved at all)
- Home Office Calculator built into the transaction form for home-office-eligible categories (Insurance, Interest, Property Taxes, Utilities, Water/Sewer/Trash), plus a Simplified Method estimate shown in Settings
- Bank Reconciliation: beginning balance → income/expenses/contributions/distributions → calculated ending balance, compared against your bank statement, with reconciliation history and a month is only "Complete" on the dashboard once it's reconciled
- Reports: Profit & Loss (Monthly / YTD / Full Year / Custom range) and an itemized Other Expenses report (grouped by description, with count/total/date range)
- Expense Category Guide: all 36 categories from the original workbook, searchable ("what category should I use for Adobe?")
- Settings: business info, tax profile (filing status, sole prop / S-Corp + salary, spouse income for MFJ, SSTB/wage/UBIA fields for the QBI deduction), home office, beginning bank balance
- Help / Getting Started checklist

## Tax Planner (v1.2)

- **Tax Estimate**: annualizes year-to-date net income based on how many months actually have bookkeeping data, then computes self-employment tax, the QBI deduction, taxable income, income tax (progressive brackets), the Additional Medicare Tax, total estimated tax, the per-quarter amount, and your marginal rate. The Quarterly Payments table and its inline edit form are responsive — a table on tablet/desktop, stacked cards on phone widths, so nothing gets clipped off-screen.
- **Sole Proprietor vs. S-Corp comparison**: both scenarios computed side by side from the same projected income, with a callout for how much the S-Corp election could save (or cost) at the salary you've set.
- **Quarterly Estimated Payments tracker**: the four standard IRS due dates, computed from your tax year, each with an editable amount paid / date paid and an over/underpaid badge against a true IRS **safe-harbor** recommended amount (see below) — not just an even split.
- **The one deliberate fix vs. the original workbook** (spec §12.3): the workbook computes the QBI deduction and the deductible half of SE tax but never actually subtracts them from income before running the tax-bracket calculation, which overstates projected tax. This app actually subtracts both first. See the header comment in `src/lib/calculations/tax.ts` for the full explanation.
- **Additional Medicare Tax** (spec §12.6): a flat 0.9% surtax on Medicare wages/SE income above statutory (not inflation-indexed) thresholds — $200k Single/HoH, $250k MFJ, $125k MFS.
- **Spouse income for Married Filing Jointly** (spec §12.11): an optional Settings field that blends a spouse's income into household AGI, the QBI phaseout position, and the Additional Medicare Tax threshold check — but not into this business's own self-employment tax base.
- **SSTB vs. non-SSTB QBI deduction** (spec §12.5): a Settings toggle for whether your business is a Specified Service Trade or Business. SSTB (the default — law, health, consulting, financial services, most real estate agents) still tapers the QBI deduction straight to $0 across the phaseout range. A non-SSTB instead keeps a wage/UBIA-limited floor (the greater of 50% of W-2 wages, or 25% of W-2 wages + 2.5% of qualified property basis) — with two more Settings fields to enter those.
- **True IRS safe-harbor quarterly calculation** (spec §12.8): the recommended quarterly amount is the smaller of 90% of this year's projected tax or 100%/110% of last year's actual tax (110% if last year's household AGI was above $150k, or $75k filing separately) — computed from your actual prior-year transactions when that tax year is seeded, falling back to the 90%-of-current-year test otherwise. The Quarterly Payments card shows which basis is currently in effect.
- **2025 and 2026 tax figures are seeded** (`src/db/seed-data/tax-2025.ts`, `src/db/seed-data/tax-2026.ts`). Tax brackets, the QBI phaseout table, and SE-tax parameters are all versioned by tax year in the database (`tax_parameters`/`tax_brackets`/`qbi_phaseout_parameters` tables) so a future year's figures can be added without a code change — see either file's shape for the pattern. If your business's Tax Year (Settings) isn't seeded yet, the Tax Planner says so plainly instead of guessing. The 2026 file's header comment documents exactly which figures came from a direct IRS.gov/IRS Pub 505 fetch (Single, MFJ, the SE wage base) versus a cross-checked secondary source (Head of Household, the QBI phase-out range) versus a statutory derivation (Married Filing Separately) — worth reading before relying on it for an actual filing.
- **QBI minimum deduction (2026+)** (One Big Beautiful Bill Act §70105, verified against Rev. Proc. 2025-32 §4.26): if your aggregate QBI is at least $1,000, your QBI deduction is the greater of the regular 20% calculation or a $400 floor — applied after the phaseout/SSTB taper, not instead of it. See `computeQbiDeduction`'s `minimumDeduction` param in `src/lib/calculations/tax.ts`. Both the $1,000 threshold and the $400 floor are inflation-indexed starting 2027, so a future year's seed file will need its own values.
- **Known simplifications still disclosed in the Tax Planner's own disclaimer**: no standard deduction modeled, no state taxes.

## Contractors & 1099s (v1.2)

- A dedicated **Contractors & 1099s** page groups your Contract-Labor-category transactions by vendor name for the selected tax year, flags anyone paid at or above the Form 1099-NEC filing threshold as likely needing one (spec §7.4/§11), and lets you attach and edit each vendor's contact info, tax ID, and W-9-received status — separate from the payment total, which is always computed live from your transactions so it can't drift out of sync with the ledger. The threshold itself is year-dependent: **$600** for tax years through 2025 (the statutory amount since 1954), and **$2,000** for tax year 2026 and later (One Big Beautiful Bill Act §90402) — see `get1099Threshold` in `src/lib/data/contractors.ts`.
- Backed by a new `vendors` table (email, phone, address, tax ID, W-9 received, notes), matched to transactions by vendor name — see `src/lib/data/contractors.ts` and `src/lib/actions/contractor-actions.ts`.
- Doesn't generate or file the actual 1099-NEC — that's flagged plainly in the page's own disclaimer.

## Tax accuracy fact-check pass (v1.3)

Prompted by real users signing up and a direct ask of "are all formulas accurate to the latest IRS statements," every dollar figure and formula in the Tax Planner and Contractors pages was re-verified against primary IRS sources (irs.gov, Rev. Proc. 2024-40 for 2025 figures, Rev. Proc. 2025-32 for 2026 figures) rather than relying on secondary summaries. This surfaced the **One Big Beautiful Bill Act** (OBBBA, H.R.1, signed July 4, 2025) as a real, previously-unaccounted-for change affecting tax years 2026 and later, plus two pre-existing data bugs:

- **Fixed: 2025 QBI phaseout thresholds were one year stale.** `tax-2025.ts` had 2024's figures ($191,950 Single / $383,900 MFJ) instead of 2025's actual Rev. Proc. 2024-40 figures ($197,300 Single / $394,600 MFJ).
- **Fixed: 2026 Single/Head-of-Household QBI phaseout was off by $25.** `tax-2026.ts` had $201,775/$276,775 — which is actually the ordinary 24%→32% tax-*bracket* breakpoint, a close and easy mix-up. The real QBI figures from Rev. Proc. 2025-32 §4.26 are $201,750/$276,750.
- **Added: the OBBBA-raised 1099-NEC threshold** ($600 → $2,000 for tax year 2026+, described above).
- **Added: the new OBBBA QBI minimum deduction** ($400 floor for 2026+, described above) — a feature that didn't exist in this app at all before this pass, since the law introducing it postdates the original workbook.
- **Fixed: stale "$600 or more" wording in the Expense Category Guide's Contract Labor tax guidance** — that per-category reference text is static and not tax-year-aware, so it now points to the Contractors & 1099s page (which computes the correct year-specific figure) instead of asserting a fixed dollar amount.

Tested via 55 unit tests (`src/lib/calculations/tax.test.ts`, including regression tests pinned to the corrected phaseout figures and new floor behavior), the `tax-refinements-smoke-test.ts` DB integration script (two new scenarios covering both OBBBA changes), and a manual end-to-end pass through the real UI as a freshly-registered test account on a local sandbox database — a 2026 business with a deliberately low annualized income exercising the new $400 QBI floor, and a Contract Labor vendor paid $1,850 (between the old and new 1099 thresholds) confirmed as correctly *not* flagged for a 1099 under 2026 rules. This was done against a local sandbox, not the production database, to avoid touching real user data.

## Tech stack

- **Next.js 16** (App Router, Turbopack, React 19, Server Actions) — see `AGENTS.md` / `node_modules/next/dist/docs` for this version's specifics if you're used to older Next.js
- **TypeScript**
- **Drizzle ORM** + **PostgreSQL** (chosen over Prisma specifically because Prisma's CLI needs to download engine binaries from `binaries.prisma.sh`, which isn't reachable from every environment — Drizzle is pure TypeScript/SQL with no such dependency)
- **NextAuth (Auth.js) v5**, credentials provider, JWT sessions, bcrypt password hashing
- **Tailwind CSS v4**
- **Recharts** for the dashboard chart
- **Zod** for validation

## Getting started

### 1. Prerequisites

- Node.js 20.9+ (Next.js 16 requirement)
- A PostgreSQL database (local install, Docker, or a hosted service like [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- `DATABASE_URL` — your Postgres connection string
- `AUTH_SECRET` — a random secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev; your deployed URL in production

### 4. Set up the database

For local development (syncs the schema directly, no migration files needed):

```bash
npm run db:push
```

For production (uses the versioned SQL files in `drizzle/`, generated with `npm run db:generate`):

```bash
npm run db:migrate
```

Then seed the 36 expense/income categories (safe to re-run; it upserts by name):

```bash
npm run db:seed
```

Updating an **existing** deployment to this version: `npm run db:push` (local) or `npm run db:migrate` (applies `drizzle/0002_remarkable_mach_iv.sql`, generated with `npm run db:generate`) adds the new `vendors` table and four new nullable/defaulted `businesses` columns (`spouse_income`, `is_sstb`, `w2_wages_paid`, `ubia_qualified_property`) — all additive, with defaults chosen to reproduce prior behavior exactly, so no backfill or downtime is required.

### 5. Run it

```bash
npm run dev
```

Visit http://localhost:3000, click "Create one" to register — this creates your user and your first business automatically.

## Testing

Three layers of tests exist and were run against a real Postgres database while this app was built:

```bash
npm run test        # unit tests for the money math (ledger.ts) and tax math (tax.ts) —
                     # signed amounts, running balances, reconciliation, home office
                     # calculator, SE tax, QBI deduction/phaseout, bracket tax, the
                     # QBI-subtraction bug fix, Sole-Prop-vs-S-Corp comparison
npm run test:smoke  # integration test against a real database: creates a
                     # throwaway business, adds transactions, checks dashboard/
                     # P&L/reconciliation/Other-Expenses numbers, cleans up after itself
```

There's also `scripts/e2e-smoke-test.ts`, a headless-Chromium script that registers an account through the real UI, adds a transaction through the Add Transaction modal, and checks it shows up on the dashboard/reports/reconciliation pages. It needs `npm run dev` running in another terminal first, plus a Chromium binary (set `CHROMIUM_PATH` if you don't have Playwright's browsers installed — the default assumes `/opt/pw-browsers/chromium`, which won't exist outside the environment this app was built in):

```bash
npx tsx scripts/e2e-smoke-test.ts
```

Two more scripts cover the Tax Planner specifically: `npx tsx scripts/tax-planner-smoke-test.ts` (DB integration — needs `NODE_OPTIONS=--conditions=react-server`, same as `test:smoke`) and `npx tsx scripts/tax-planner-e2e-test.ts` (browser walkthrough — needs `npm run dev` running, same as the e2e script above; sets tax year to 2025 via Settings first, since that's the only seeded year).

Two more after that cover this round's additions (Additional Medicare Tax, spouse income, SSTB toggle, safe harbor, Contractors & 1099s): `npx tsx scripts/tax-refinements-smoke-test.ts` (DB integration, same `NODE_OPTIONS` requirement — also covers the OBBBA 1099-threshold change and the QBI minimum-deduction floor, added during the v1.3 fact-check pass) and `npx tsx scripts/tax-refinements-e2e-test.ts` (browser walkthrough — registers, sets tax year 2025, MFJ + spouse income + non-SSTB via Settings, adds Contract-Labor transactions across two vendors, checks the (2025) $600 1099 threshold badge and vendor-contact-info save/reload on the Contractors page, and checks the Tax Planner renders the new Additional Medicare Tax line and safe-harbor basis label).

## Deploying

This app has no framework-specific lock-in beyond "Next.js app + Postgres":

1. Provision a Postgres database (Neon, Supabase, Railway, RDS, etc.)
2. Run `npm run db:generate && npm run db:migrate` against it (or just `db:migrate` if you commit the `drizzle/` folder as-is, which you should)
3. Run `npm run db:seed` once to load the category reference data
4. Deploy the Next.js app anywhere that supports it (Vercel is the path of least resistance for Next.js specifically) with `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` set as environment variables

## Project structure

```
src/
  app/                      # Next.js App Router pages
    (app)/                  # authenticated app shell (sidebar layout) + all main pages
    login/, register/       # auth pages
    api/auth/[...nextauth]/ # NextAuth route handler
  components/                # UI, grouped by feature area (transactions/, dashboard/, ...)
  lib/
    actions/                 # Server Actions (mutations) — the only way data is written
    data/                    # read-side data-access functions, one file per feature area
    calculations/ledger.ts   # the money math — pure functions, unit tested
    auth.ts, current-business.ts, validations.ts, utils.ts
  db/
    schema.ts                # Drizzle schema (source of truth for the DB shape)
    seed-data/categories.ts  # the 36 categories, ported from the original workbook
    seed-data/tax-2025.ts, tax-2026.ts
    seed.ts, migrate.ts
drizzle/                     # generated SQL migrations
docs/WORKBOOK_SPEC.md        # full reverse-engineering of the original Excel workbook
scripts/                     # smoke-test.ts / e2e-smoke-test.ts (core app), tax-planner-*
                              # and tax-refinements-* smoke + e2e tests (Tax Planner, Contractors)
```

## Design decisions worth knowing about

- **One transactions table, not 12 monthly sheets.** Monthly/YTD/custom-range views are all just filtered queries over one table — see `docs/WORKBOOK_SPEC.md` §12.1 for why the original workbook's month-sheet/Transfer-Sheet architecture was intentionally not reproduced.
- **A month is "Complete" once it's reconciled**, not once a manual "Record to Month" macro has run. This replaces the workbook's tab-color system with something that actually reflects whether the books have been checked against reality.
- **Category and Transaction Type can't disagree.** The Add/Edit form filters the category dropdown by the chosen type, and the server action re-validates that match before writing to the database — so the invalid states the original workbook's "Error- Double Entry" flag was trying to catch can't be saved in the first place.
- **Amounts are always stored as positive numbers**, with `type` determining the sign when computing balances (`src/lib/calculations/ledger.ts::signedAmount`). This avoids the workbook's convention of typing into an Inflows column *or* an Outflows column and hoping you picked the right one.
