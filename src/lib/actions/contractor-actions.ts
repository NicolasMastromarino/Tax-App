"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireBusiness } from "@/lib/current-business";
import { vendorSchema } from "@/lib/validations";
import type { ActionState } from "./auth-actions";

/**
 * Upserts a vendor's contact/W-9/tax-ID record, matched by (business, exact
 * name) — same name string the Contract-Labor transactions use, so it lines
 * up with the live-computed payment totals in `getContractorRows` (spec
 * §7.4/§11).
 */
export async function saveVendorAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { business } = await requireBusiness();

  const parsed = vendorSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    taxId: formData.get("taxId") || "",
    w9DocumentUrl: formData.get("w9DocumentUrl") || "",
    notes: formData.get("notes") || "",
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
  const values = {
    email: d.email || null,
    phone: d.phone || null,
    address: d.address || null,
    taxId: d.taxId || null,
    w9DocumentUrl: d.w9DocumentUrl || null,
    notes: d.notes || null,
    updatedAt: new Date(),
  };

  const existing = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(and(eq(vendors.businessId, business.id), eq(vendors.name, d.name)))
    .limit(1);

  if (existing[0]) {
    await db.update(vendors).set(values).where(eq(vendors.id, existing[0].id));
  } else {
    await db.insert(vendors).values({ businessId: business.id, name: d.name, ...values });
  }

  revalidatePath("/contractors");
  return { success: true };
}

/**
 * Called by the vendor form's W-9 field when the user removes or replaces
 * an uploaded W-9, same reasoning as deleteReceiptAction: best-effort, the
 * vendor row is the source of truth either way.
 */
export async function deleteW9DocumentAction(url: string): Promise<void> {
  await requireBusiness();
  await del(url);
}
