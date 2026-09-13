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
import { noResetSubmit } from "@/lib/no-reset-form-action";
import type { CategoryRow } from "@/lib/data/categories";
import type { TransactionRow } from "@/lib/data/transactions";
import { useLocale } from "@/i18n/use-locale";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import type { Dictionary } from "@/i18n/dictionaries/en";

const initialState: TxActionState = {};
const DICTIONARIES = { en: en_, es: es_ };

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
  const locale = useLocale();
  const dict = DICTIONARIES[locale];
  const t = dict.transactions.modal;

  const TYPE_OPTIONS = [
    { value: "income", label: dict.transactions.types.income },
    { value: "expense", label: dict.transactions.types.expense },
    { value: "owner_contribution", label: dict.transactions.types.owner_contribution },
    { value: "owner_distribution", label: dict.transactions.types.owner_distribution },
  ] as const;

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
      title={editing ? t.editTitle : t.addTitle}
      description={editing ? undefined : t.addDescription}
    >
      <form onSubmit={noResetSubmit(formAction)} className="space-y-4">
        <div>
          <Label htmlFor="type">{t.transactionType}</Label>
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
          <Label htmlFor="categoryId">{t.category}</Label>
          <Combobox
            name="categoryId"
            value={effectiveCategoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            placeholder={t.searchCategories}
          />
          {/* Once a category is actually selected, the error from the last
              failed submission no longer applies -- state.fieldErrors is a
              snapshot from that submission and doesn't clear on its own as
              the user keeps editing. */}
          {!effectiveCategoryId && (
            <FieldError>{translateMessage(dict, state.fieldErrors?.categoryId)}</FieldError>
          )}
        </div>

        {isOtherExpense && (
          <div>
            <Label htmlFor="otherExpenseDescription">{t.otherExpenseLabel}</Label>
            <Input
              id="otherExpenseDescription"
              name="otherExpenseDescription"
              defaultValue={editing?.otherExpenseDescription ?? ""}
              placeholder={t.otherExpensePlaceholder}
              required
            />
            <FieldError>{translateMessage(dict, state.fieldErrors?.otherExpenseDescription)}</FieldError>
          </div>
        )}

        {isHomeOfficeEligible && (
          <HomeOfficeHelper homeOffice={homeOffice} onUseAmount={(amt) => setAmount(String(amt))} t={t} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">{t.date}</Label>
            <Input id="date" name="date" type="date" defaultValue={editing?.date ?? todayISO()} required />
            <FieldError>{translateMessage(dict, state.fieldErrors?.date)}</FieldError>
          </div>
          <div>
            <Label htmlFor="amount">{t.amount}</Label>
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
            <FieldError>{translateMessage(dict, state.fieldErrors?.amount)}</FieldError>
          </div>
        </div>

        <div>
          <Label htmlFor="description">{t.description}</Label>
          <Input
            id="description"
            name="description"
            defaultValue={editing?.description ?? ""}
            placeholder={t.descriptionPlaceholder}
            required
          />
          <FieldError>{translateMessage(dict, state.fieldErrors?.description)}</FieldError>
        </div>

        <div>
          <Label htmlFor="vendorName">{t.vendor}</Label>
          <Input
            id="vendorName"
            name="vendorName"
            list="vendor-suggestions"
            defaultValue={editing?.vendorName ?? ""}
            placeholder={t.vendorPlaceholder}
          />
          <datalist id="vendor-suggestions">
            {vendorNames.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div>
          <Label htmlFor="notes">{t.notes}</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
        </div>

        {state.error && <FieldError>{translateMessage(dict, state.error)}</FieldError>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t.saving : editing ? t.saveChanges : t.addTitle}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function HomeOfficeHelper({
  homeOffice,
  onUseAmount,
  t,
}: {
  homeOffice: { officeSqFt: number; totalSqFt: number };
  onUseAmount: (amount: number) => void;
  t: Dictionary["transactions"]["modal"];
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
      <p className="text-sm font-medium text-info">{t.homeOffice.heading}</p>
      <p className="mt-0.5 text-xs text-muted">
        {t.homeOffice.body.replace("{percentage}", (businessUsePercentage * 100).toFixed(1))}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="homeOfficeBill" className="text-xs">
            {t.homeOffice.billLabel}
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
          {t.homeOffice.useAmount.replace("{amount}", formatCurrency(deductibleAmount))}
        </Button>
      </div>
    </div>
  );
}
