"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  createTransactionAction,
  updateTransactionAction,
  type TxActionState,
} from "@/lib/actions/transaction-actions";
import { homeOfficeDeduction } from "@/lib/calculations/ledger";
import { formatCurrency, todayISO } from "@/lib/utils";
import type { CategoryRow } from "@/lib/data/categories";
import type { TransactionRow } from "@/lib/data/transactions";

const TYPE_OPTIONS = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "owner_contribution", label: "Owner Contribution" },
  { value: "owner_distribution", label: "Owner Distribution" },
] as const;

const initialState: TxActionState = {};

export function TransactionModal({
  open,
  onClose,
  categories,
  vendorNames,
  homeOffice,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryRow[];
  vendorNames: string[];
  homeOffice: { used: boolean; officeSqFt: number; totalSqFt: number };
  editing: TransactionRow | null;
}) {
  const action = editing
    ? updateTransactionAction.bind(null, editing.id)
    : createTransactionAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  // Local state initializes from `editing` on mount. The parent remounts
  // this component (via a `key` derived from editing/open) whenever a
  // different transaction is opened, so these initial values are always
  // fresh without needing an effect to re-sync them.
  const [type, setType] = useState<string>(editing?.type ?? "expense");
  const [categoryId, setCategoryId] = useState<string>(editing?.categoryId ?? "");
  const [amount, setAmount] = useState<string>(editing?.amount ?? "");

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.type === type)
        .map((c) => ({ value: c.id, label: c.name, hint: c.description ?? undefined, keywords: c.keywords ?? undefined })),
    [categories, type]
  );

  // Derived, not synced: if the selected category doesn't belong to the
  // currently-chosen type, treat it as unselected for display/submission
  // purposes rather than mutating state from an effect.
  const effectiveCategoryId = categoryOptions.some((o) => o.value === categoryId) ? categoryId : "";

  const selectedCategory = categories.find((c) => c.id === effectiveCategoryId);
  const isOtherExpense = !!selectedCategory?.isOtherExpense;
  const isHomeOfficeEligible = !!selectedCategory?.homeOfficeEligible && homeOffice.used;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit Transaction" : "Add Transaction"}
      description={editing ? undefined : "Record income, an expense, or an owner contribution/distribution."}
    >
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="type">Transaction Type</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Combobox
            name="categoryId"
            value={effectiveCategoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            placeholder="Search categories..."
          />
          <FieldError>{state.fieldErrors?.categoryId}</FieldError>
        </div>

        {isOtherExpense && (
          <div>
            <Label htmlFor="otherExpenseDescription">What was this expense for?</Label>
            <Input
              id="otherExpenseDescription"
              name="otherExpenseDescription"
              defaultValue={editing?.otherExpenseDescription ?? ""}
              placeholder="e.g. Conference registration fee"
              required
            />
            <FieldError>{state.fieldErrors?.otherExpenseDescription}</FieldError>
          </div>
        )}

        {isHomeOfficeEligible && (
          <HomeOfficeHelper homeOffice={homeOffice} onUseAmount={(amt) => setAmount(String(amt))} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={editing?.date ?? todayISO()} required />
            <FieldError>{state.fieldErrors?.date}</FieldError>
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <FieldError>{state.fieldErrors?.amount}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            defaultValue={editing?.description ?? ""}
            placeholder="e.g. Client photography session"
            required
          />
          <FieldError>{state.fieldErrors?.description}</FieldError>
        </div>

        <div>
          <Label htmlFor="vendorName">Vendor / Contractor (optional)</Label>
          <Input
            id="vendorName"
            name="vendorName"
            list="vendor-suggestions"
            defaultValue={editing?.vendorName ?? ""}
            placeholder="e.g. John Smith"
          />
          <datalist id="vendor-suggestions">
            {vendorNames.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
        </div>

        {state.error && <FieldError>{state.error}</FieldError>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : editing ? "Save Changes" : "Add Transaction"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function HomeOfficeHelper({
  homeOffice,
  onUseAmount,
}: {
  homeOffice: { officeSqFt: number; totalSqFt: number };
  onUseAmount: (amount: number) => void;
}) {
  const [bill, setBill] = useState("");
  const billNum = parseFloat(bill) || 0;
  const { businessUsePercentage, deductibleAmount } = homeOfficeDeduction({
    officeSqFt: homeOffice.officeSqFt,
    totalSqFt: homeOffice.totalSqFt,
    billAmount: billNum,
  });

  return (
    <div className="rounded-lg border border-info/30 bg-info-bg p-3">
      <p className="text-sm font-medium text-info">Home Office Calculator</p>
      <p className="mt-0.5 text-xs text-muted">
        Business use: {(businessUsePercentage * 100).toFixed(1)}%. Enter the full bill amount to
        calculate the deductible portion.
      </p>
      <div className="mt-2 flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="homeOfficeBill" className="text-xs">
            Full bill amount
          </Label>
          <Input
            id="homeOfficeBill"
            type="number"
            step="0.01"
            min="0"
            value={bill}
            onChange={(e) => setBill(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onUseAmount(deductibleAmount)}
          disabled={!billNum}
        >
          Use {formatCurrency(deductibleAmount)}
        </Button>
      </div>
    </div>
  );
}
