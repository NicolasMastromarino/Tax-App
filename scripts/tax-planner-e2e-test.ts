/**
 * Headless-browser smoke test of the Tax Planner page specifically
 * (requires `npm run dev` already running on localhost:3000). Registers a
 * throwaway account, sets tax year to 2025 (the only year currently
 * seeded) with an S-Corp salary via Settings, adds a transaction, then
 * checks the Tax Planner page renders real numbers and the quarterly
 * payment inline-edit flow actually works end-to-end in the browser (not
 * just the underlying data layer).
 *
 * Run with: npx tsx scripts/tax-planner-e2e-test.ts
 */
import { chromium } from "playwright-core";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH, headless: true });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  const stamp = Date.now();
  const email = `tax-e2e-${stamp}@example.com`;

  console.log("1. Registering a new account...");
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.fill("#name", "Tax E2E Tester");
  await page.fill("#businessName", "Tax E2E Test Co");
  await page.fill("#email", email);
  await page.fill("#password", "test-password-123");
  await page.fill("#confirmPassword", "test-password-123");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
  console.log("   Registered OK");

  console.log("2. Setting tax year to 2025 + S-Corp salary via Settings...");
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  await page.fill("#taxYear", "2025");
  await page.check("#isSCorp");
  await page.fill("#sCorpSalary", "90000");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await page.waitForSelector("text=Settings saved", { timeout: 10000 });
  console.log("   Settings saved OK");

  console.log("3. Adding a 2025 income transaction...");
  await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add Transaction", exact: true }).click();
  await page.waitForSelector("text=Search categories...");
  await page.selectOption("#type", "income");
  await page.click("text=Search categories...");
  await page.fill('input[placeholder="Search..."]', "Revenue");
  await page.getByRole("button", { name: /^Revenue/ }).click();
  await page.fill("#amount", "20000");
  await page.fill("#description", "Tax planner e2e client payment");
  await page.fill("#date", "2025-03-15");
  await page.getByRole("dialog").getByRole("button", { name: "Add Transaction", exact: true }).click();
  // The transactions table defaults to filtering by the current month, so a
  // March-dated transaction won't visibly appear there — wait for the
  // Add-Transaction dialog to close instead, which confirms the submit
  // succeeded.
  await page.waitForSelector("text=Search categories...", { state: "detached", timeout: 10000 });
  console.log("   Transaction added OK");

  console.log("4. Checking Tax Planner page renders a real estimate...");
  await page.goto(`${BASE_URL}/tax-planner`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Your Tax Estimate", { timeout: 10000 });
  await page.waitForSelector("text=Total Estimated Tax");
  await page.waitForSelector("text=Sole Proprietor vs. S-Corp");
  await page.waitForSelector("text=Quarterly Estimated Payments");
  const bodyText = await page.textContent("body");
  if (bodyText?.includes("aren't available yet")) {
    throw new Error("Tax Planner shows 'not available' message unexpectedly");
  }
  if (bodyText?.includes("Add some income and expense transactions")) {
    throw new Error("Tax Planner shows empty-data message despite having a transaction");
  }
  console.log("   Tax estimate + comparison + quarterly tracker all render OK");

  console.log("5. Recording a Q1 payment through the real UI...");
  const q1Row = page.locator("tr", { hasText: "Q1" });
  await q1Row.getByRole("button", { name: /Record Payment/ }).click();
  await q1Row.locator('input[name="amountPaid"]').fill("5000");
  await q1Row.locator('input[name="datePaid"]').fill("2025-04-10");
  await q1Row.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForSelector("text=payment saved", { timeout: 10000 });
  await page.waitForSelector("text=$5,000.00");
  console.log("   Quarterly payment recorded through the real UI OK");

  console.log("6. Reloading to confirm the payment persisted...");
  await page.goto(`${BASE_URL}/tax-planner`, { waitUntil: "networkidle" });
  const bodyText2 = await page.textContent("body");
  if (!bodyText2?.includes("$5,000.00")) {
    throw new Error("Recorded Q1 payment did not persist after reload");
  }
  console.log("   Payment persisted across reload OK");

  await browser.close();

  if (errors.length > 0) {
    console.error("\nBrowser console errors were captured during the run:");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }

  console.log("\nAll Tax Planner end-to-end checks passed with no console errors.\n");
}

main().catch((err) => {
  console.error("TAX PLANNER E2E TEST FAILED:", err);
  process.exit(1);
});
