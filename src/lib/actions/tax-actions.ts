"use server";

import { db } from "@/db";
import { taxPayments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/current-business";
import { taxPaymentSchema } from "@/lib/validations";
import type { ActionState } from "./auth-actions";

/**
 * Upserts a single quarter's estimated-tax payment (spec §6.8: Amount
 * Paid, Date Paid). One row per business/taxYear/quarter.
 */
export async function saveTaxPaymentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { business } = await requireBusiness();

  const parsed = taxPaymentSchema.safeParse({
    taxYear: formData.get("taxYear"),
    quarter: formData.get("quarter"),
    amountPaid: formData.get("amountPaid"),
    datePaid: formData.get("datePaid") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid amount." };
  }

  const { taxYear, quarter, amountPaid, datePaid } = parsed.data;

  const existing = await db
    .select({ id: taxPayments.id })
    .from(taxPayments)
    .where(
      and(
        eq(taxPayments.businessId, business.id),
        eq(taxPayments.taxYear, taxYear),
        eq(taxPayments.quarter, quarter)
      )
    )
    .limit(1);

  const values = {
    amountPaid: String(amountPaid),
    datePaid: datePaid ? datePaid : null,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await db.update(taxPayments).set(values).where(eq(taxPayments.id, existing[0].id));
  } else {
    await db.insert(taxPayments).values({
      businessId: business.id,
      taxYear,
      quarter,
      ...values,
    });
  }

  revalidatePath("/tax-planner");
  return { success: true };
}
