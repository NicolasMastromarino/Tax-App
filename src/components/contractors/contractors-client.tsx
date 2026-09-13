"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, HelpText } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { saveVendorAction } from "@/lib/actions/contractor-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { formatCurrency } from "@/lib/utils";
import type { ContractorRow } from "@/lib/data/contractors";
import { useLocale } from "@/i18n/use-locale";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import type { Dictionary } from "@/i18n/dictionaries/en";

const initialState: ActionState = {};
const DICTIONARIES = { en: en_, es: es_ };

export function ContractorsClient({
  taxYear,
  threshold,
  rows,
}: {
  taxYear: number;
  threshold: number;
  rows: ContractorRow[];
}) {
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const needing1099 = rows.filter((r) => r.needs1099);
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.contractors;
  const thresholdFmt = formatCurrency(threshold);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.subtitle.replace("{taxYear}", String(taxYear)).replace("{threshold}", thresholdFmt)}
        </p>
      </div>

      {needing1099.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning-bg p-4 text-sm text-warning">
          <strong>{needing1099.length}</strong>{" "}
          {(needing1099.length === 1 ? t.thresholdWarningOne : t.thresholdWarningMany).replace(
            "{threshold}",
            thresholdFmt
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.vendors}</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">
              {t.emptyState.replace("{taxYear}", String(taxYear))}
            </p>
          ) : (
            <>
              {/* Table for tablet/desktop — mirrors the Quarterly Payments
                  responsive pattern: hidden below sm, replaced by stacked
                  cards so nothing gets clipped on a phone screen. */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3">{t.table.vendor}</th>
                      <th className="py-2 pr-3">{t.table.payments}</th>
                      <th className="py-2 pr-3">{t.table.totalPaid}</th>
                      <th className="py-2 pr-3">{t.table.needs1099}</th>
                      <th className="py-2 pr-3">{t.table.w9OnFile}</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <VendorRow
                        key={`table-${row.vendorName}-${editingVendor === row.vendorName}`}
                        variant="table"
                        row={row}
                        editing={editingVendor === row.vendorName}
                        onStartEdit={() => setEditingVendor(row.vendorName)}
                        onSaved={() => setEditingVendor(null)}
                        onCancel={() => setEditingVendor(null)}
                        dict={dict}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 sm:hidden">
                {rows.map((row) => (
                  <VendorRow
                    key={`card-${row.vendorName}-${editingVendor === row.vendorName}`}
                    variant="card"
                    row={row}
                    editing={editingVendor === row.vendorName}
                    onStartEdit={() => setEditingVendor(row.vendorName)}
                    onSaved={() => setEditingVendor(null)}
                    onCancel={() => setEditingVendor(null)}
                    dict={dict}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 text-xs text-muted">
          <p className="font-medium text-foreground">{t.disclaimer.heading}</p>
          <p className="mt-1">{t.disclaimer.body.replace("{threshold}", thresholdFmt)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function VendorRow({
  variant,
  row,
  editing,
  onStartEdit,
  onSaved,
  onCancel,
  dict,
}: {
  variant: "table" | "card";
  row: ContractorRow;
  editing: boolean;
  onStartEdit: () => void;
  onSaved: () => void;
  onCancel: () => void;
  dict: Dictionary;
}) {
  const t = dict.contractors;
  const [state, formAction, pending] = useActionState(saveVendorAction, initialState);
  const [email, setEmail] = useState(row.vendor?.email ?? "");
  const [phone, setPhone] = useState(row.vendor?.phone ?? "");
  const [address, setAddress] = useState(row.vendor?.address ?? "");
  const [taxId, setTaxId] = useState(row.vendor?.taxId ?? "");
  const [w9Received, setW9Received] = useState(row.vendor?.w9Received ?? false);

  useEffect(() => {
    if (state.success) {
      toast.success(t.savedToast.replace("{vendorName}", row.vendorName));
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, row.vendorName, onSaved]);

  const needsBadge = row.needs1099 ? (
    <Badge tone="warning">{t.yes}</Badge>
  ) : (
    <Badge tone="neutral">{t.no}</Badge>
  );
  const w9Badge = row.vendor?.w9Received ? (
    <Badge tone="success">{t.onFile}</Badge>
  ) : (
    <Badge tone="neutral">{t.notOnFile}</Badge>
  );

  const editForm = (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="name" value={row.vendorName} />
      <div>
        <Label htmlFor={`email-${row.vendorName}`}>{t.email}</Label>
        <Input
          id={`email-${row.vendorName}`}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`phone-${row.vendorName}`}>{t.phone}</Label>
        <Input
          id={`phone-${row.vendorName}`}
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`address-${row.vendorName}`}>{t.address}</Label>
        <Input
          id={`address-${row.vendorName}`}
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`taxId-${row.vendorName}`}>{t.taxId}</Label>
        <Input
          id={`taxId-${row.vendorName}`}
          name="taxId"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
        />
        <HelpText>{t.taxIdHelp}</HelpText>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`w9-${row.vendorName}`}
          name="w9Received"
          type="checkbox"
          checked={w9Received}
          onChange={(e) => setW9Received(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor={`w9-${row.vendorName}`} className="mb-0">
          {t.w9Received}
        </Label>
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t.saving : t.save}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t.cancel}
        </Button>
        {state.error && <p className="text-xs text-danger">{translateMessage(dict, state.error)}</p>}
      </div>
    </form>
  );

  const editButton = (
    <Button size="sm" variant="outline" onClick={onStartEdit}>
      {row.vendor ? t.edit : t.addContactInfo}
    </Button>
  );

  if (variant === "card") {
    return (
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <p className="font-medium">{row.vendorName}</p>
          {needsBadge}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted">{t.table.totalPaid}</dt>
            <dd className="tabular-nums">{formatCurrency(row.totalPaid)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t.table.payments}</dt>
            <dd className="tabular-nums">{row.paymentCount}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted">W-9</dt>
            <dd>{w9Badge}</dd>
          </div>
        </dl>
        <div className="mt-3">{editing ? editForm : editButton}</div>
      </div>
    );
  }

  if (editing) {
    return (
      <tr className="border-b border-border/60">
        <td className="py-2 pr-3 font-medium">{row.vendorName}</td>
        <td colSpan={5} className="py-3">
          {editForm}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/60">
      <td className="py-2 pr-3 font-medium">{row.vendorName}</td>
      <td className="py-2 pr-3 tabular-nums text-muted">{row.paymentCount}</td>
      <td className="py-2 pr-3 tabular-nums">{formatCurrency(row.totalPaid)}</td>
      <td className="py-2 pr-3">{needsBadge}</td>
      <td className="py-2 pr-3">{w9Badge}</td>
      <td className="py-2 text-right">{editButton}</td>
    </tr>
  );
}
