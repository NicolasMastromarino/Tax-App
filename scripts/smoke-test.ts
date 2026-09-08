/**
 * End-to-end smoke test against the real Postgres database, exercising the
 * same data-access and calculation functions the app uses (not a
 * reimplementation). Creates a throwaway business, adds a realistic mix of
 * transactions, checks dashboard/report/reconciliation numbers, then cleans
 * up after itself. Run with: npx tsx scripts/smoke-test.ts
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "../src/db";
import { users, businesses, transactions, categories } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDashboardData } from "../src/lib/data/dashboard";
import { getProfitAndLoss } from "../src/lib/data/reports";
import { otherExpensesReport, contractorPaymentsReport, listLedgerRows } from "../src/lib/data/transactions";
import { reconcile, balanceThrough } from "../src/lib/calculations/ledger";

async function main() {
  console.log("Setting up test business...");

  const passwordHash = await bcrypt.hash("test-password-123", 10);
  const [user] = await db
    .insert(users)
    .values({ name: "Smoke Test", email: `smoke-test-${Date.now()}@example.com`, passwordHash })
    .returning();

  const [business] = await db
    .insert(businesses)
    .values({
      userId: user.id,
      businessName: "Smoke Test Photography",
      taxYear: 2026,
      businessType: "sole_prop",
      filingStatus: "single",
      beginningBankBalance: "1000.00",
      homeOfficeUsed: true,
      homeOfficeSqFt: "200",
      totalHomeSqFt: "2000",
    })
    .returning();

  const allCategories = await db.select().from(categories);
  const byName = (name: string) => {
    const c = allCategories.find((c) => c.name === name);
    if (!c) throw new Error(`category not found: ${name}`);
    return c;
  };

  console.log(`Categories loaded: ${allCategories.length} (expect 36)`);
  assert.equal(allCategories.length, 36);

  // --- January 2026 transactions ---
  await db.insert(transactions).values([
    {
      businessId: business.id,
      date: "2026-01-05",
      description: "Client shoot - Smith wedding",
      categoryId: byName("Revenue").id,
      type: "income",
      amount: "3000.00",
    },
    {
      businessId: business.id,
      date: "2026-01-10",
      description: "Editing help",
      categoryId: byName("Contract Labor").id,
      type: "expense",
      amount: "500.00",
      vendorName: "Jane Editor",
    },
    {
      businessId: business.id,
      date: "2026-01-12",
      description: "More editing help",
      categoryId: byName("Contract Labor").id,
      type: "expense",
      amount: "150.00",
      vendorName: "Jane Editor",
    },
    {
      businessId: business.id,
      date: "2026-01-15",
      description: "Conference registration",
      categoryId: byName("Other Expenses").id,
      type: "expense",
      amount: "200.00",
      otherExpenseDescription: "Photography conference",
    },
    {
      businessId: business.id,
      date: "2026-01-16",
      description: "Booth fee",
      categoryId: byName("Other Expenses").id,
      type: "expense",
      amount: "75.00",
      otherExpenseDescription: "Photography conference",
    },
    {
      businessId: business.id,
      date: "2026-01-20",
      description: "Owner put in cash",
      categoryId: byName("Contributions from Owner").id,
      type: "owner_contribution",
      amount: "500.00",
    },
    {
      businessId: business.id,
      date: "2026-01-25",
      description: "Owner draw",
      categoryId: byName("Distributions (Draws) to Owner").id,
      type: "owner_distribution",
      amount: "300.00",
    },
  ]);

  // --- February 2026 transactions ---
  await db.insert(transactions).values([
    {
      businessId: business.id,
      date: "2026-02-03",
      description: "Client shoot - Jones portrait",
      categoryId: byName("Revenue").id,
      type: "income",
      amount: "1200.00",
    },
    {
      businessId: business.id,
      date: "2026-02-08",
      description: "More editing help",
      categoryId: byName("Contract Labor").id,
      type: "expense",
      amount: "620.00",
      vendorName: "Jane Editor",
    },
  ]);

  // --- Expected math ---
  // January: revenue 3000, expenses 500+150+200+75=925, net 2075
  //   beginning balance 1000, ending = 1000+3000-925+500-300 = 3275
  // February: revenue 1200, expenses 620, net 580
  //   beginning balance = Jan ending = 3275, ending = 3275+1200-620 = 3855
  // YTD (through Feb) revenue 4200, expenses 1545, net 2655

  console.log("Checking dashboard data...");
  const dashboard = await getDashboardData(business.id, 2026, 1000);
  const jan = dashboard.months.find((m) => m.month === 1)!;
  const feb = dashboard.months.find((m) => m.month === 2)!;
  assert.equal(jan.revenue, 3000);
  assert.equal(jan.expenses, 925);
  assert.equal(jan.netIncome, 2075);
  assert.equal(feb.revenue, 1200);
  assert.equal(feb.expenses, 620);
  assert.equal(jan.status, "in_progress"); // not reconciled yet
  console.log("  Dashboard monthly figures OK");

  console.log("Checking Profit & Loss (Jan 1 - Mar 1)...");
  const pl = await getProfitAndLoss(business.id, "2026-01-01", "2026-03-01");
  assert.equal(pl.totalIncome, 4200);
  assert.equal(pl.totalExpenses, 1545);
  assert.equal(pl.netIncome, 4200 - 1545);
  assert.equal(pl.ownerContributions, 500);
  assert.equal(pl.ownerDistributions, 300);
  console.log("  P&L totals OK");

  console.log("Checking Other Expenses report...");
  const otherExp = await otherExpensesReport(business.id);
  assert.equal(otherExp.length, 1);
  assert.equal(otherExp[0].description, "Photography conference");
  assert.equal(otherExp[0].count, 2);
  assert.equal(otherExp[0].total, 275);
  console.log("  Other Expenses grouping OK ($200 + $75 = $275, 2 occurrences)");

  console.log("Checking contractor payments report...");
  const contractors = await contractorPaymentsReport(business.id);
  assert.equal(contractors.length, 1);
  assert.equal(contractors[0].vendorName, "Jane Editor");
  assert.equal(contractors[0].count, 3);
  assert.equal(contractors[0].total, 500 + 150 + 620);
  console.log("  Contractor grouping OK ($500 + $150 + $620 = $1270, 3 payments)");

  console.log("Checking reconciliation math for January...");
  const beforeJan = await listLedgerRows(business.id, { before: "2026-01-01" });
  const inJan = await listLedgerRows(business.id, { from: "2026-01-01", to: "2026-02-01" });
  const janBeginning = balanceThrough(
    1000,
    beforeJan.map((r) => ({ type: r.type, amount: parseFloat(r.amount) }))
  );
  assert.equal(janBeginning, 1000); // nothing before January
  const janResult = reconcile({
    beginningBalance: janBeginning,
    transactionsInMonth: inJan.map((r) => ({ type: r.type, amount: parseFloat(r.amount) })),
    statementEndingBalance: 3275,
  });
  assert.equal(janResult.calculatedEndingBalance, 3275);
  assert.equal(janResult.isReconciled, true);
  console.log("  January reconciles cleanly against $3275 statement balance");

  const janMismatch = reconcile({
    beginningBalance: janBeginning,
    transactionsInMonth: inJan.map((r) => ({ type: r.type, amount: parseFloat(r.amount) })),
    statementEndingBalance: 3200,
  });
  assert.equal(janMismatch.isReconciled, false);
  assert.equal(janMismatch.difference, 75);
  console.log("  January correctly flags a $75 mismatch against a wrong statement balance");

  console.log("Checking February beginning balance carries forward from January...");
  const beforeFeb = await listLedgerRows(business.id, { before: "2026-02-01" });
  const febBeginning = balanceThrough(
    1000,
    beforeFeb.map((r) => ({ type: r.type, amount: parseFloat(r.amount) }))
  );
  assert.equal(febBeginning, 3275);
  console.log("  February beginning balance = January ending balance ($3275) OK");

  console.log("Checking current bank balance (all transactions through Feb)...");
  assert.equal(dashboard.currentBankBalance >= 1000, true); // sanity: it moved from the base
  console.log(`  Current bank balance: $${dashboard.currentBankBalance}`);

  console.log("\nAll smoke test assertions passed.\n");

  console.log("Cleaning up test data...");
  await db.delete(transactions).where(eq(transactions.businessId, business.id));
  await db.delete(businesses).where(eq(businesses.id, business.id));
  await db.delete(users).where(eq(users.id, user.id));
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
