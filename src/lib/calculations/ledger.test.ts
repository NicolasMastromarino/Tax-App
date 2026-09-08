import { test } from "node:test";
import assert from "node:assert/strict";
import {
  signedAmount,
  sumSigned,
  balanceThrough,
  summarizePeriod,
  reconcile,
  homeOfficeDeduction,
  simplifiedHomeOfficeDeduction,
} from "./ledger";

test("signedAmount: income and contributions are inflows", () => {
  assert.equal(signedAmount({ type: "income", amount: 500 }), 500);
  assert.equal(signedAmount({ type: "owner_contribution", amount: 500 }), 500);
});

test("signedAmount: expenses and distributions are outflows", () => {
  assert.equal(signedAmount({ type: "expense", amount: 500 }), -500);
  assert.equal(signedAmount({ type: "owner_distribution", amount: 500 }), -500);
});

test("sumSigned mixes types correctly", () => {
  const total = sumSigned([
    { type: "income", amount: 1000 },
    { type: "expense", amount: 300 },
    { type: "owner_contribution", amount: 200 },
    { type: "owner_distribution", amount: 100 },
  ]);
  assert.equal(total, 1000 - 300 + 200 - 100);
});

test("balanceThrough adds signed transactions to beginning balance", () => {
  const bal = balanceThrough(1000, [
    { type: "income", amount: 250 },
    { type: "expense", amount: 75 },
  ]);
  assert.equal(bal, 1175);
});

test("summarizePeriod matches the workbook's Net Operating Income convention (excludes owner equity)", () => {
  const summary = summarizePeriod({
    businessBeginningBalance: 5000,
    transactionsBeforePeriod: [],
    transactionsInPeriod: [
      { type: "income", amount: 10000 },
      { type: "expense", amount: 4000 },
      { type: "owner_contribution", amount: 1000 },
      { type: "owner_distribution", amount: 2000 },
    ],
  });
  assert.equal(summary.revenue, 10000);
  assert.equal(summary.expenses, 4000);
  assert.equal(summary.netIncome, 6000); // NOT affected by contributions/distributions
  assert.equal(summary.ownerContributions, 1000);
  assert.equal(summary.ownerDistributions, 2000);
  assert.equal(summary.beginningBalance, 5000);
  // ending balance DOES include owner equity movements (it's a real bank balance)
  assert.equal(summary.endingBalance, 5000 + 10000 - 4000 + 1000 - 2000);
});

test("summarizePeriod carries forward beginning balance from prior transactions", () => {
  const summary = summarizePeriod({
    businessBeginningBalance: 0,
    transactionsBeforePeriod: [
      { type: "income", amount: 2000 },
      { type: "expense", amount: 500 },
    ],
    transactionsInPeriod: [{ type: "income", amount: 100 }],
  });
  assert.equal(summary.beginningBalance, 1500);
  assert.equal(summary.endingBalance, 1600);
});

test("reconcile: zero difference reports reconciled", () => {
  const result = reconcile({
    beginningBalance: 1000,
    transactionsInMonth: [
      { type: "income", amount: 500 },
      { type: "expense", amount: 200 },
    ],
    statementEndingBalance: 1300,
  });
  assert.equal(result.calculatedEndingBalance, 1300);
  assert.equal(result.difference, 0);
  assert.equal(result.isReconciled, true);
});

test("reconcile: non-zero difference reports NOT reconciled", () => {
  const result = reconcile({
    beginningBalance: 1000,
    transactionsInMonth: [{ type: "income", amount: 500 }],
    statementEndingBalance: 1400,
  });
  assert.equal(result.calculatedEndingBalance, 1500);
  assert.equal(result.difference, 100); // calculated - statement
  assert.equal(result.isReconciled, false);
});

test("reconcile: null statement balance leaves difference null / not reconciled", () => {
  const result = reconcile({
    beginningBalance: 1000,
    transactionsInMonth: [],
    statementEndingBalance: null,
  });
  assert.equal(result.difference, null);
  assert.equal(result.isReconciled, false);
});

test("homeOfficeDeduction computes business-use percentage and deductible amount", () => {
  const { businessUsePercentage, deductibleAmount } = homeOfficeDeduction({
    officeSqFt: 200,
    totalSqFt: 2000,
    billAmount: 300,
  });
  assert.equal(businessUsePercentage, 0.1);
  assert.equal(deductibleAmount, 30);
});

test("homeOfficeDeduction guards against divide-by-zero", () => {
  const { businessUsePercentage, deductibleAmount } = homeOfficeDeduction({
    officeSqFt: 200,
    totalSqFt: 0,
    billAmount: 300,
  });
  assert.equal(businessUsePercentage, 0);
  assert.equal(deductibleAmount, 0);
});

test("simplifiedHomeOfficeDeduction caps at 300 sq ft", () => {
  assert.equal(simplifiedHomeOfficeDeduction(150), 750);
  assert.equal(simplifiedHomeOfficeDeduction(500), 1500); // capped
});
