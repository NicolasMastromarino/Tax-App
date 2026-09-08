import "dotenv/config";
import { db } from "./index";
import { categories } from "./schema";
import { CATEGORY_SEED } from "./seed-data/categories";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding categories...");
  for (let i = 0; i < CATEGORY_SEED.length; i++) {
    const c = CATEGORY_SEED[i];
    await db
      .insert(categories)
      .values({
        name: c.name,
        type: c.type,
        description: c.description,
        taxGuidance: c.taxGuidance,
        keywords: c.keywords,
        sortOrder: i,
        isOtherExpense: c.isOtherExpense ?? false,
        isContractLabor: c.isContractLabor ?? false,
        homeOfficeEligible: c.homeOfficeEligible ?? false,
      })
      .onConflictDoUpdate({
        target: categories.name,
        set: {
          type: c.type,
          description: c.description,
          taxGuidance: c.taxGuidance,
          keywords: c.keywords,
          sortOrder: i,
          isOtherExpense: c.isOtherExpense ?? false,
          isContractLabor: c.isContractLabor ?? false,
          homeOfficeEligible: c.homeOfficeEligible ?? false,
        },
      });
  }
  const count = await db.execute(sql`select count(*) from categories`);
  console.log(`Done. ${count.rows[0].count} categories in database.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
