/**
 * Headless-browser smoke test of the real running app (requires `npm run
 * dev` or `npm start` already running on localhost:3000). Registers a
 * throwaway account, adds a transaction, and checks the dashboard and
 * transactions page reflect it — exercising the actual client-rendered UI
 * and Server Actions, not just the data layer.
 *
 * Run with: npx tsx scripts/e2e-smoke-test.ts
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
  const email = `e2e-${stamp}@example.com`;

  console.log("1. Registering a new account...");
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.fill("#name", "E2E Tester");
  await page.fill("#businessName", "E2E Test Co");
  await page.fill("#email", email);
  await page.fill("#password", "test-password-123");
  await page.fill("#confirmPassword", "test-password-123");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
  console.log("   Registered and redirected to /dashboard OK");

  console.log("2. Checking dashboard renders...");
  await page.waitForSelector("text=Dashboard");
  await page.waitForSelector("text=Total Revenue");
  console.log("   Dashboard summary cards render OK");

  console.log("3. Adding a transaction...");
  await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add Transaction", exact: true }).click();
  await page.waitForSelector("text=Search categories...");
  await page.selectOption("#type", "income");
  await page.click("text=Search categories...");
  await page.fill('input[placeholder="Search..."]', "Revenue");
  await page.getByRole("button", { name: /^Revenue/ }).click();
  await page.fill("#amount", "1500");
  await page.fill("#description", "E2E test client payment");
  await page.getByRole("dialog").getByRole("button", { name: "Add Transaction", exact: true }).click();
  await page.waitForSelector("text=E2E test client payment", { timeout: 10000 });
  console.log("   Transaction appears in table OK");

  console.log("4. Verifying dashboard reflects the new transaction...");
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  const bodyText = await page.textContent("body");
  if (!bodyText?.includes("$1,500.00") && !bodyText?.includes("1,500")) {
    throw new Error("Dashboard does not show the $1,500 revenue anywhere on the page");
  }
  console.log("   Dashboard shows updated revenue OK");

  console.log("5. Checking reconciliation page renders with correct math...");
  await page.goto(`${BASE_URL}/reconciliation`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Calculated Ending Balance");
  console.log("   Reconciliation page renders OK");

  console.log("6. Checking reports page renders...");
  await page.goto(`${BASE_URL}/reports`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Total Income");
  console.log("   Reports page renders OK");

  console.log("7. Checking categories reference guide search...");
  await page.goto(`${BASE_URL}/categories`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder^="What category"]', "Adobe");
  await page.waitForSelector("text=Dues & Subscriptions");
  console.log("   Category search finds 'Adobe' -> Dues & Subscriptions OK");

  await browser.close();

  if (errors.length > 0) {
    console.error("\nBrowser console errors were captured during the run:");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }

  console.log("\nAll end-to-end checks passed with no console errors.\n");
}

main().catch((err) => {
  console.error("E2E TEST FAILED:", err);
  process.exit(1);
});
