/**
 * End-to-end smoke test for the Tax Planner against the real Postgres
 * database. Creates a throwaway business (tax year 2025, since that's the
 * only year currently seeded), adds transactions, exercises
 * getTaxProjection/getQuarterlyPayments, sanity-checks the numbers, then
 * cleans up. Run with: NODE_OPTIONS=--conditions=react-server npx tsx scripts/tax-planner-smoke-test.ts
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "../src/db";
import { users, businesses, transactions, categories, taxPayments } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getTaxProjection, getQuarterlyPayments } from "../src/lib/data/tax";

async function main() {
  console.log("Setting up test business (tax year 2025)...");

  const passwordHash = await bcrypt.hash("test-password-123", 10);
  const [user] = await db
    .insert(users)
    .values({
      name: "Tax Smoke Test",
      email: `tax-smoke-test-${Date.now()}@example.com`,
      passwordHash,
    })
    .returning();

  const [business] = await db
    .insert(businesses)
    .values({
      userId: user.id,
      businessName: "Smoke Test Consulting",
      taxYear: 2025,
      businessType: "sole_prop",
      filingStatus: "single",
      isSCorp: false,
      beginningBankBalance: "0",
    })
    .returning();

  const allCategories = await db.select().from(categories);
  const revenue = allCategories.find((c) => c.name === "Revenue");
  const otherExpense = allCategories.find((c) => c.isOtherExpense);
  if (!revenue || !otherExpense) throw new Error("expected categories missing");

  // 6 months of activity (Jan-Jun), ~$20k/mo revenue, ~$5k/mo expenses ->
  // $90k YTD net income over 6 active months -> annualized to $180k.
  const rows = [];
  for (let m = 1; m <= 6; m++) {
    rows.push({
      businessId: business.id,
      date: `2025-0${m}-10`,
      description: `Client invoice #${m}`,
      categoryId: revenue.id,
      type: "income" as const,
      amount: "20000.00",
    });
    rows.push({
      businessId: business.id,
      date: `2025-0${m}-15`,
      description: `Misc expense ${m}`,
      categoryId: otherExpense.id,
      type: "expense" as const,
      amount: "5000.00",
      otherExpenseDescription: "Software & supplies",
    });
  }
  await db.insert(transactions).values(rows);

  console.log("Projecting tax estimate (no S-Corp salary set)...");
  const projectionNoSCorp = await getTaxProjection({
    id: business.id,
    taxYear: business.taxYear,
    filingStatus: business.filingStatus,
    isSCorp: business.isSCorp,
    sCorpSalary: business.sCorpSalary,
  });

  assert.ok(projectionNoSCorp, "expected a projection for tax year 2025");
  assert.equal(projectionNoSCorp!.activeMonths, 6, "expected 6 active months (Jan-Jun)");
  assert.equal(projectionNoSCorp!.ytdNetIncome, 90_000, "expected $90k YTD net income");
  assert.equal(
    projectionNoSCorp!.annualizedIncome,
    180_000,
    "expected $180k annualized (90k / (6/12))"
  );
  assert.equal(projectionNoSCorp!.sCorp, null, "expected no S-Corp scenario without a salary set");
  assert.ok(
    projectionNoSCorp!.soleProp.qbiDeduction > 0,
    "expected a nonzero QBI deduction at $180k single"
  );
  assert.ok(
    projectionNoSCorp!.soleProp.taxableIncome < projectionNoSCorp!.soleProp.agi,
    "taxableIncome should be less than AGI (QBI deduction actually applied - the bug fix)"
  );
  assert.equal(
    projectionNoSCorp!.soleProp.totalTax,
    Math.round((projectionNoSCorp!.soleProp.incomeTax + projectionNoSCorp!.soleProp.seTax) * 100) /
      100
  );
  console.log(
    `  OK: annualized $${projectionNoSCorp!.annualizedIncome}, SE tax $${projectionNoSCorp!.soleProp.seTax}, QBI ded $${projectionNoSCorp!.soleProp.qbiDeduction}, taxable income $${projectionNoSCorp!.soleProp.taxableIncome}, total tax $${projectionNoSCorp!.soleProp.totalTax}`
  );

  console.log("Setting S-Corp salary and re-projecting (comparison scenario)...");
  await db
    .update(businesses)
    .set({ sCorpSalary: "90000.00" })
    .where(eq(businesses.id, business.id));

  const projectionWithSCorp = await getTaxProjection({
    id: business.id,
    taxYear: business.taxYear,
    filingStatus: business.filingStatus,
    isSCorp: business.isSCorp,
    sCorpSalary: "90000.00",
  });
  assert.ok(projectionWithSCorp!.sCorp, "expected an S-Corp scenario once salary is set");
  assert.equal(
    projectionWithSCorp!.sCorpSavings,
    Math.round(
      (projectionWithSCorp!.soleProp.totalTax - projectionWithSCorp!.sCorp!.totalTax) * 100
    ) / 100
  );
  console.log(
    `  OK: sole prop total $${projectionWithSCorp!.soleProp.totalTax} vs S-Corp total $${projectionWithSCorp!.sCorp!.totalTax}, savings $${projectionWithSCorp!.sCorpSavings}`
  );

  console.log("Testing quarterly payment tracker...");
  const quarterlyBefore = await getQuarterlyPayments(
    business.id,
    business.taxYear,
    projectionWithSCorp!.currentScenario.quarterlyTax
  );
  assert.equal(quarterlyBefore.rows.length, 4);
  assert.equal(quarterlyBefore.totalPaid, 0);
  assert.equal(quarterlyBefore.rows[0].dueDate, "2025-04-15");
  assert.equal(quarterlyBefore.rows[3].dueDate, "2026-01-15");

  await db.insert(taxPayments).values({
    businessId: business.id,
    taxYear: business.taxYear,
    quarter: 1,
    amountPaid: "5000.00",
    datePaid: "2025-04-10",
  });
  const quarterlyAfter = await getQuarterlyPayments(
    business.id,
    business.taxYear,
    projectionWithSCorp!.currentScenario.quarterlyTax
  );
  assert.equal(quarterlyAfter.totalPaid, 5000);
  assert.equal(quarterlyAfter.rows[0].amountPaid, 5000);
  assert.equal(quarterlyAfter.rows[0].datePaid, "2025-04-10");
  console.log(`  OK: recorded Q1 payment, totalPaid=$${quarterlyAfter.totalPaid}`);

  console.log("Testing empty-data case (business with zero transactions)...");
  const [emptyBusiness] = await db
    .insert(businesses)
    .values({
      userId: user.id,
      businessName: "Empty Test Business",
      taxYear: 2025,
      businessType: "sole_prop",
      filingStatus: "single",
      beginningBankBalance: "0",
    })
    .returning();
  const emptyProjection = await getTaxProjection({
    id: emptyBusiness.id,
    taxYear: emptyBusiness.taxYear,
    filingStatus: emptyBusiness.filingStatus,
    isSCorp: emptyBusiness.isSCorp,
    sCorpSalary: emptyBusiness.sCorpSalary,
  });
  assert.ok(emptyProjection, "expected a non-null projection shell even with no data");
  assert.equal(emptyProjection!.dataAvailable, false, "expected dataAvailable=false with no transactions");
  console.log("  OK: zero-transaction business handled without crashing");

  console.log("Testing unsupported tax year (2099) returns null cleanly...");
  const [futureBusiness] = await db
    .insert(businesses)
    .values({
      userId: user.id,
      businessName: "Future Test Business",
      taxYear: 2099,
      businessType: "sole_prop",
      filingStatus: "single",
      beginningBankBalance: "0",
    })
    .returning();
  const futureProjection = await getTaxProjection({
    id: futureBusiness.id,
    taxYear: futureBusiness.taxYear,
    filingStatus: futureBusiness.filingStatus,
    isSCorp: futureBusiness.isSCorp,
    sCorpSalary: futureBusiness.sCorpSalary,
  });
  assert.equal(futureProjection, null, "expected null projection for an unseeded tax year");
  console.log("  OK: unsupported tax year returns null instead of crashing/wrong numbers");

  console.log("Cleaning up...");
  await db.delete(users).where(eq(users.id, user.id)); // cascades businesses/transactions/taxPayments

  console.log("\nAll Tax Planner smoke tests passed.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
