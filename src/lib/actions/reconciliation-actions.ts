"use server";

import { db } from "@/db";
import { reconciliations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/current-business";
import { reconciliationSchema } from "@/lib/validations";
import { listLedgerRows } from "@/lib/data/transactions";
import { reconcile, balanceThrough } from "@/lib/calculations/ledger";
import { firstOfMonthISO } from "@/lib/utils";
import type { ActionState } from "./auth-actions";

export async function saveReconciliationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { business } = await requireBusiness();

  const parsed = reconciliationSchema.safeParse({
    month: formData.get("month"),
    statementEndingBalance: formData.get("statementEndingBalance"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid statement ending balance." };
  }

  const { month, statementEndingBalance } = parsed.data;
  const [year, mo] = month.split("-").map(Number);
  const nextMonth = firstOfMonthISO(mo === 12 ? year + 1 : year, mo === 12 ? 1 : mo + 1);

  const beginningBalance = balanceThrough(
    parseFloat(business.beginningBankBalance),
    (await listLedgerRows(business.id, { before: month })).map((r) => ({
      type: r.type,
      amount: parseFloat(r.amount),
    }))
  );

  const monthRows = (await listLedgerRows(business.id, { from: month, to: nextMonth })).map(
    (r) => ({ type: r.type, amount: parseFloat(r.amount) })
  );

  const result = reconcile({
    beginningBalance,
    transactionsInMonth: monthRows,
    statementEndingBalance,
  });

  const existing = await db
    .select({ id: reconciliations.id })
    .from(reconciliations)
    .where(and(eq(reconciliations.businessId, business.id), eq(reconciliations.month, month)))
    .limit(1);

  const values = {
    beginningBalance: String(result.beginningBalance),
    calculatedEndingBalance: String(result.calculatedEndingBalance),
    statementEndingBalance: String(statementEndingBalance),
    difference: result.difference != null ? String(result.difference) : null,
    status: result.isReconciled ? ("reconciled" as const) : ("unreconciled" as const),
    completedAt: result.isReconciled ? new Date() : null,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await db.update(reconciliations).set(values).where(eq(reconciliations.id, existing[0].id));
  } else {
    await db.insert(reconciliations).values({
      businessId: business.id,
      month,
      ...values,
    });
  }

  revalidatePath("/reconciliation");
  revalidatePath("/dashboard");
  return { success: true };
}
