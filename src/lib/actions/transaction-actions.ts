"use server";

import { db } from "@/db";
import { transactions, categories } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/current-business";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import type { ZodError } from "zod";

export interface TxActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

function parseForm(formData: FormData) {
  return transactionSchema.safeParse({
    date: formData.get("date"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    vendorName: formData.get("vendorName") ?? "",
    notes: formData.get("notes") ?? "",
    otherExpenseDescription: formData.get("otherExpenseDescription") ?? "",
  });
}

function fieldErrorsFrom(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/**
 * Cross-checks category/type consistency server-side even though the UI
 * already filters the category dropdown by the chosen type — this is the
 * app-level replacement for the workbook's "Error- Double Entry" check
 * (spec §6/§27): invalid combinations are rejected outright, not merely
 * flagged after the fact.
 */
async function validateCategoryMatchesType(data: TransactionInput) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, data.categoryId))
    .limit(1);

  if (!category) {
    return { ok: false as const, message: "That category no longer exists." };
  }
  if (category.type !== data.type) {
    return {
      ok: false as const,
      message: `"${category.name}" is a ${category.type.replace("_", " ")} category and can't be used with transaction type "${data.type.replace("_", " ")}".`,
    };
  }
  if (category.isOtherExpense && !data.otherExpenseDescription?.trim()) {
    return {
      ok: false as const,
      message: "Please describe this \"Other Expense\" so your accountant knows what it was.",
      field: "otherExpenseDescription",
    };
  }
  return { ok: true as const, category };
}

export async function createTransactionAction(
  _prevState: TxActionState,
  formData: FormData
): Promise<TxActionState> {
  const { business } = await requireBusiness();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const check = await validateCategoryMatchesType(parsed.data);
  if (!check.ok) {
    return check.field
      ? { fieldErrors: { [check.field]: check.message } }
      : { error: check.message };
  }

  await db.insert(transactions).values({
    businessId: business.id,
    date: parsed.data.date,
    description: parsed.data.description,
    categoryId: parsed.data.categoryId,
    type: parsed.data.type,
    amount: parsed.data.amount.toFixed(2),
    vendorName: parsed.data.vendorName || null,
    notes: parsed.data.notes || null,
    otherExpenseDescription: parsed.data.otherExpenseDescription || null,
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reconciliation");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateTransactionAction(
  id: string,
  _prevState: TxActionState,
  formData: FormData
): Promise<TxActionState> {
  const { business } = await requireBusiness();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const check = await validateCategoryMatchesType(parsed.data);
  if (!check.ok) {
    return check.field
      ? { fieldErrors: { [check.field]: check.message } }
      : { error: check.message };
  }

  await db
    .update(transactions)
    .set({
      date: parsed.data.date,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      type: parsed.data.type,
      amount: parsed.data.amount.toFixed(2),
      vendorName: parsed.data.vendorName || null,
      notes: parsed.data.notes || null,
      otherExpenseDescription: parsed.data.otherExpenseDescription || null,
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.businessId, business.id)));

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reconciliation");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteTransactionAction(id: string): Promise<TxActionState> {
  const { business } = await requireBusiness();
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.businessId, business.id)));

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reconciliation");
  revalidatePath("/reports");
  return { success: true };
}
