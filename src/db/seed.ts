import "dotenv/config";
import { db } from "./index";
import { categories, taxParameters, taxBrackets, qbiPhaseoutParameters } from "./schema";
import { CATEGORY_SEED } from "./seed-data/categories";
import {
  TAX_YEAR_2025_PARAMETERS,
  TAX_YEAR_2025_BRACKETS,
  TAX_YEAR_2025_QBI_PHASEOUT,
} from "./seed-data/tax-2025";
import { eq, sql } from "drizzle-orm";

async function seedTaxYear(
  taxYear: number,
  params: typeof TAX_YEAR_2025_PARAMETERS,
  brackets: typeof TAX_YEAR_2025_BRACKETS,
  qbiPhaseout: typeof TAX_YEAR_2025_QBI_PHASEOUT
) {
  await db
    .insert(taxParameters)
    .values({
      taxYear,
      seWageBase: String(params.seWageBase),
      seTaxableFraction: String(params.seTaxableFraction),
      seFullRate: String(params.seFullRate),
      seMedicareOnlyRate: String(params.seMedicareOnlyRate),
      seDeductibleFraction: String(params.seDeductibleFraction),
      qbiRate: String(params.qbiRate),
    })
    .onConflictDoUpdate({
      target: taxParameters.taxYear,
      set: {
        seWageBase: String(params.seWageBase),
        seTaxableFraction: String(params.seTaxableFraction),
        seFullRate: String(params.seFullRate),
        seMedicareOnlyRate: String(params.seMedicareOnlyRate),
        seDeductibleFraction: String(params.seDeductibleFraction),
        qbiRate: String(params.qbiRate),
      },
    });

  // Brackets/QBI-phaseout rows don't have a natural unique key to upsert
  // against cleanly (multiple rows per year+status), so replace the year's
  // rows wholesale — safe to re-run.
  await db.delete(taxBrackets).where(eq(taxBrackets.taxYear, taxYear));
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    await db.insert(taxBrackets).values({
      taxYear,
      filingStatus: b.filingStatus,
      rate: String(b.rate),
      lowerBound: String(b.lowerBound),
      upperBound: b.upperBound == null ? null : String(b.upperBound),
      sortOrder: i,
    });
  }

  for (const q of qbiPhaseout) {
    await db
      .insert(qbiPhaseoutParameters)
      .values({
        taxYear,
        filingStatus: q.filingStatus,
        phaseoutStart: String(q.phaseoutStart),
        phaseoutEnd: String(q.phaseoutEnd),
      })
      .onConflictDoUpdate({
        target: [qbiPhaseoutParameters.taxYear, qbiPhaseoutParameters.filingStatus],
        set: {
          phaseoutStart: String(q.phaseoutStart),
          phaseoutEnd: String(q.phaseoutEnd),
        },
      });
  }
}

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

  console.log("Seeding 2025 tax parameters/brackets/QBI phaseout...");
  await seedTaxYear(
    2025,
    TAX_YEAR_2025_PARAMETERS,
    TAX_YEAR_2025_BRACKETS,
    TAX_YEAR_2025_QBI_PHASEOUT
  );
  console.log("Done seeding tax data.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
