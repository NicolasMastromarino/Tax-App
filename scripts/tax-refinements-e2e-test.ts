/**
 * Headless-browser smoke test of this round's additions (requires
 * `npm run dev` already running on localhost:3000): the Settings page's
 * new spouse-income/SSTB fields, the Contractors & 1099 page (vendor list,
 * $600 threshold badge, editable contact info persisting across reload),
 * and the Tax Planner's new Additional Medicare Tax line + safe-harbor
 * basis label.
 *
 * Run with: npx tsx scripts/tax-refinements-e2e-test.ts
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
  const email = `refinements-e2e-${stamp}@example.com`;

  console.log("1. Registering a new account...");
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.fill("#name", "Refinements E2E Tester");
  await page.fill("#businessName", "Refinements E2E Test Co");
  await page.fill("#email", email);
  await page.fill("#password", "test-password-123");
  await page.fill("#confirmPassword", "test-password-123");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
  console.log("   Registered OK");

  console.log("2. Setting tax year 2025, MFJ + spouse income + non-SSTB via Settings...");
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  await page.fill("#taxYear", "2025");
  await page.selectOption("#filingStatus", "married_filing_jointly");
  await page.waitForSelector("#spouseIncome");
  await page.fill("#spouseIncome", "150000");
  await page.uncheck("#isSstb");
  await page.waitForSelector("#w2WagesPaid");
  await page.fill("#w2WagesPaid", "50000");
  await page.getByRole("button", { name: "Save Settings" }).click();
  await page.waitForSelector("text=Settings saved", { timeout: 10000 });
  console.log("   Settings saved OK");

  console.log("3. Reloading Settings to confirm the new fields persisted...");
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
  const spouseIncomeValue = await page.inputValue("#spouseIncome");
  if (spouseIncomeValue !== "150000.00" && spouseIncomeValue !== "150000") {
    throw new Error(`Expected spouseIncome to persist as 150000, got "${spouseIncomeValue}"`);
  }
  const isSstbChecked = await page.isChecked("#isSstb");
  if (isSstbChecked) throw new Error("Expected isSstb to persist as unchecked");
  console.log("   Spouse income + SSTB toggle persisted OK");

  console.log("4. Adding Contract Labor transactions that cross the $600 threshold...");
  async function addContractLaborTx(amount: string, date: string, vendorName: string) {
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Add Transaction", exact: true }).click();
    await page.waitForSelector("text=Search categories...");
    await page.selectOption("#type", "expense");
    await page.click("text=Search categories...");
    await page.fill('input[placeholder="Search..."]', "Contract Labor");
    await page.getByRole("button", { name: /^Contract Labor/ }).click();
    await page.fill("#amount", amount);
    await page.fill("#description", `Payment to ${vendorName}`);
    await page.fill("#date", date);
    await page.fill("#vendorName", vendorName);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add Transaction", exact: true })
      .click();
    await page.waitForSelector("text=Search categories...", { state: "detached", timeout: 10000 });
  }
  await addContractLaborTx("400", "2025-02-01", "Jane Designer");
  await addContractLaborTx("350", "2025-06-01", "Jane Designer");
  await addContractLaborTx("200", "2025-03-01", "Small Job Bob");
  console.log("   Transactions added OK");

  console.log("5. Checking the Contractors & 1099 page...");
  await page.goto(`${BASE_URL}/contractors`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Contractors & 1099s");
  const bodyText = await page.textContent("body");
  if (!bodyText?.includes("Jane Designer") || !bodyText?.includes("$750.00")) {
    throw new Error("Expected Jane Designer's $750 total to render on the Contractors page");
  }
  if (!bodyText?.includes("Small Job Bob") || !bodyText?.includes("$200.00")) {
    throw new Error("Expected Small Job Bob's $200 total to render on the Contractors page");
  }
  const janeRow = page.locator("tr", { hasText: "Jane Designer" });
  const janeRowText = await janeRow.textContent();
  if (!janeRowText?.includes("Yes")) {
    throw new Error("Expected Jane Designer's row to show needs1099 = Yes");
  }
  const bobRow = page.locator("tr", { hasText: "Small Job Bob" });
  const bobRowText = await bobRow.textContent();
  if (!bobRowText?.includes("No")) {
    throw new Error("Expected Small Job Bob's row to show needs1099 = No");
  }
  console.log("   Vendor totals + 1099 badges render correctly OK");

  console.log("6. Saving Jane Designer's contact info through the real form...");
  await janeRow.getByRole("button", { name: "Add Contact Info" }).click();
  await page.fill('input[name="email"]', "jane@example.com");
  await page.fill('input[name="phone"]', "555-1234");
  await page.check('input[name="w9Received"]');
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForSelector("text=Jane Designer saved", { timeout: 10000 });
  console.log("   Vendor contact info saved OK");

  console.log("7. Reloading to confirm the vendor contact info persisted...");
  await page.goto(`${BASE_URL}/contractors`, { waitUntil: "networkidle" });
  const janeRowAfterReload = page.locator("tr", { hasText: "Jane Designer" });
  const janeRowAfterReloadText = await janeRowAfterReload.textContent();
  if (!janeRowAfterReloadText?.includes("On file")) {
    throw new Error("Expected Jane Designer's W-9 'On file' badge to persist after reload");
  }
  console.log("   Vendor contact info persisted across reload OK");

  console.log("8. Checking the Tax Planner shows Additional Medicare Tax + safe-harbor basis...");
  await page.goto(`${BASE_URL}/tax-planner`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Your Tax Estimate", { timeout: 10000 });
  const taxPlannerText = await page.textContent("body");
  if (!taxPlannerText?.includes("Additional Medicare Tax")) {
    throw new Error("Expected 'Additional Medicare Tax' to render on the Tax Planner");
  }
  if (!taxPlannerText?.includes("Currently based on:")) {
    throw new Error("Expected the safe-harbor basis label to render on the Quarterly Payments card");
  }
  console.log("   Additional Medicare Tax + safe-harbor basis label render OK");

  await browser.close();

  if (errors.length > 0) {
    console.error("\nBrowser console errors were captured during the run:");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }

  console.log("\nAll tax-refinements end-to-end checks passed with no console errors.\n");
}

main().catch((err) => {
  console.error("TAX REFINEMENTS E2E TEST FAILED:", err);
  process.exit(1);
});
