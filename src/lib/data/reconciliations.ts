import "server-only";
import { db } from "@/db";
import { reconciliations } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function listReconciliations(businessId: string) {
  return db
    .select()
    .from(reconciliations)
    .where(eq(reconciliations.businessId, businessId))
    .orderBy(desc(reconciliations.month));
}

export async function getReconciliation(businessId: string, month: string) {
  const [row] = await db
    .select()
    .from(reconciliations)
    .where(and(eq(reconciliations.businessId, businessId), eq(reconciliations.month, month)))
    .limit(1);
  return row ?? null;
}

export async function isMonthReconciled(businessId: string, month: string) {
  const row = await getReconciliation(businessId, month);
  return row?.status === "reconciled";
}
