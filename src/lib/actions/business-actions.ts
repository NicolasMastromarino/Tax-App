"use server";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/current-business";
import { businessSettingsSchema } from "@/lib/validations";
import type { ActionState } from "./auth-actions";

export async function updateBusinessSettingsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { business } = await requireBusiness();

  const parsed = businessSettingsSchema.safeParse({
    businessName: formData.get("businessName"),
    taxYear: formData.get("taxYear"),
    businessType: formData.get("businessType"),
    filingStatus: formData.get("filingStatus"),
    isSCorp: formData.get("isSCorp") === "on",
    sCorpSalary: formData.get("sCorpSalary") || null,
    beginningBankBalance: formData.get("beginningBankBalance"),
    homeOfficeUsed: formData.get("homeOfficeUsed") === "on",
    homeOfficeSqFt: formData.get("homeOfficeSqFt") || null,
    totalHomeSqFt: formData.get("totalHomeSqFt") || null,
    spouseIncome: formData.get("spouseIncome") || null,
    isSstb: formData.get("isSstb") === "on",
    w2WagesPaid: formData.get("w2WagesPaid") || 0,
    ubiaQualifiedProperty: formData.get("ubiaQualifiedProperty") || 0,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const d = parsed.data;

  if (d.isSCorp && (d.sCorpSalary == null || Number.isNaN(d.sCorpSalary))) {
    return { fieldErrors: { sCorpSalary: "Enter the S-Corp salary amount" } };
  }
  if (d.homeOfficeUsed && (!d.homeOfficeSqFt || !d.totalHomeSqFt)) {
    return {
      fieldErrors: {
        homeOfficeSqFt: "Enter both office and total home square footage",
      },
    };
  }

  await db
    .update(businesses)
    .set({
      businessName: d.businessName,
      taxYear: d.taxYear,
      businessType: d.businessType,
      filingStatus: d.filingStatus,
      isSCorp: d.isSCorp,
      sCorpSalary: d.isSCorp ? String(d.sCorpSalary) : null,
      beginningBankBalance: String(d.beginningBankBalance),
      homeOfficeUsed: d.homeOfficeUsed,
      homeOfficeSqFt: d.homeOfficeUsed ? String(d.homeOfficeSqFt) : null,
      totalHomeSqFt: d.homeOfficeUsed ? String(d.totalHomeSqFt) : null,
      // Spouse income only matters (and is only shown in the UI) for a
      // Married Filing Jointly return — clear it otherwise so a stale value
      // can't linger after a filing-status change (spec §12.11).
      spouseIncome:
        d.filingStatus === "married_filing_jointly" && d.spouseIncome != null
          ? String(d.spouseIncome)
          : null,
      isSstb: d.isSstb,
      w2WagesPaid: String(d.w2WagesPaid ?? 0),
      ubiaQualifiedProperty: String(d.ubiaQualifiedProperty ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, business.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/reconciliation");
  revalidatePath("/tax-planner");
  return { success: true };
}
