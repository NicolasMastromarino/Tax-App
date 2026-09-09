import "server-only";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { contractorPaymentsReport } from "./transactions";
import { firstOfMonthISO } from "@/lib/utils";

// $600/year Form 1099-NEC filing threshold (spec §7.4/§11). The original
// workbook's exact test was `< -599.49` on a negative (expense-signed)
// running total, i.e. functionally "$600 or more" once you flip the sign —
// preserved here as a plain, positive-amount comparison.
export const FORM_1099_THRESHOLD = 600;

export interface ContractorRow {
  vendorName: string;
  totalPaid: number;
  paymentCount: number;
  needs1099: boolean;
  vendor: {
    id: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    taxId: string | null;
    w9Received: boolean;
    notes: string | null;
  } | null;
}

/**
 * Contract-Labor payments for the business's tax year, grouped by vendor
 * name and merged with that vendor's saved contact/W-9/tax-ID record (if
 * any). This is the 1099 page's data source (spec §7.4/§11): the $600
 * threshold and payment totals are always computed live from transactions,
 * never stored, so they can't drift out of sync with the ledger.
 */
export async function getContractorRows(
  businessId: string,
  taxYear: number
): Promise<ContractorRow[]> {
  const from = firstOfMonthISO(taxYear, 1);
  const to = firstOfMonthISO(taxYear + 1, 1);

  const [payments, vendorRows] = await Promise.all([
    contractorPaymentsReport(businessId, from, to),
    db.select().from(vendors).where(eq(vendors.businessId, businessId)),
  ]);

  const vendorByName = new Map(vendorRows.map((v) => [v.name.trim().toLowerCase(), v]));

  const rows: ContractorRow[] = payments.map((p) => {
    const match = vendorByName.get(p.vendorName.trim().toLowerCase());
    return {
      vendorName: p.vendorName,
      totalPaid: p.total,
      paymentCount: p.count,
      needs1099: p.total >= FORM_1099_THRESHOLD,
      vendor: match
        ? {
            id: match.id,
            email: match.email,
            phone: match.phone,
            address: match.address,
            taxId: match.taxId,
            w9Received: match.w9Received,
            notes: match.notes,
          }
        : null,
    };
  });

  return rows.sort((a, b) => b.totalPaid - a.totalPaid);
}

export async function getVendor(businessId: string, vendorId: string) {
  const [row] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.businessId, businessId), eq(vendors.id, vendorId)))
    .limit(1);
  return row ?? null;
}
