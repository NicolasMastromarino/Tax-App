# Ten Minute Books

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
- Settings: business info, tax profile (filing status, sole prop / S-Corp + salary), home office, beginning bank balance
- Help / Getting Started checklist

### Not yet built (intentionally deferred — see below)

Contractor & 1099 tracking and the full Tax Planner (self-employment tax, QBI deduction, progressive tax brackets, S-Corp vs. Sole Prop comparison, quarterly estimated payments) were scoped out of this pass so the core bookkeeping experience could be built solidly rather than everything half-finished. `docs/WORKBOOK_SPEC.md` §6 has the complete, already-reverse-engineered tax logic (including one real bug found in the original workbook — it computes the QBI and SE-tax deductions but never actually subtracts them before calculating income tax) ready for a follow-up build. The `transactions` table already tracks a `vendorName` per transaction and flags Contract-Labor-category transactions (`categories.isContractLabor`), so a Contractors page can be built on top of existing data without a schema migration for the core linkage.

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

### 5. Run it

```bash
npm run dev
```

Visit http://localhost:3000, click "Create one" to register — this creates your user and your first business automatically.

## Testing

Three layers of tests exist and were run against a real Postgres database while this app was built:

```bash
npm run test        # unit tests for the money math (ledger.ts) — signed amounts,
                     # running balances, reconciliation, home office calculator
npm run test:smoke  # integration test against a real database: creates a
                     # throwaway business, adds transactions, checks dashboard/
                     # P&L/reconciliation/Other-Expenses numbers, cleans up after itself
```

There's also `scripts/e2e-smoke-test.ts`, a headless-Chromium script that registers an account through the real UI, adds a transaction through the Add Transaction modal, and checks it shows up on the dashboard/reports/reconciliation pages. It needs `npm run dev` running in another terminal first, plus a Chromium binary (set `CHROMIUM_PATH` if you don't have Playwright's browsers installed — the default assumes `/opt/pw-browsers/chromium`, which won't exist outside the environment this app was built in):

```bash
npx tsx scripts/e2e-smoke-test.ts
```

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
    seed.ts, migrate.ts
drizzle/                     # generated SQL migrations
docs/WORKBOOK_SPEC.md        # full reverse-engineering of the original Excel workbook
scripts/                     # smoke-test.ts (DB integration) and e2e-smoke-test.ts (browser)
```

## Design decisions worth knowing about

- **One transactions table, not 12 monthly sheets.** Monthly/YTD/custom-range views are all just filtered queries over one table — see `docs/WORKBOOK_SPEC.md` §12.1 for why the original workbook's month-sheet/Transfer-Sheet architecture was intentionally not reproduced.
- **A month is "Complete" once it's reconciled**, not once a manual "Record to Month" macro has run. This replaces the workbook's tab-color system with something that actually reflects whether the books have been checked against reality.
- **Category and Transaction Type can't disagree.** The Add/Edit form filters the category dropdown by the chosen type, and the server action re-validates that match before writing to the database — so the invalid states the original workbook's "Error- Double Entry" flag was trying to catch can't be saved in the first place.
- **Amounts are always stored as positive numbers**, with `type` determining the sign when computing balances (`src/lib/calculations/ledger.ts::signedAmount`). This avoids the workbook's convention of typing into an Inflows column *or* an Outflows column and hoping you picked the right one.
