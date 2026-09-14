"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select, FieldError, HelpText } from "@/components/ui/input";
import { BillingCard } from "@/components/billing/billing-card";
import { updateBusinessSettingsAction } from "@/lib/actions/business-actions";
import { deleteAccountAction } from "@/lib/actions/account-actions";
import { noResetSubmit } from "@/lib/no-reset-form-action";
import type { ActionState } from "@/lib/actions/auth-actions";
import type { SubscriptionSummary } from "@/lib/data/subscription";
import { homeOfficeDeduction, simplifiedHomeOfficeDeduction } from "@/lib/calculations/ledger";
import { formatCurrency } from "@/lib/utils";
import type { businesses } from "@/db/schema";
import { useLocale } from "@/i18n/use-locale";
import { translateMessage } from "@/i18n/translate-message";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";

type Business = typeof businesses.$inferSelect;

const initialState: ActionState = {};
const DICTIONARIES = { en: en_, es: es_ };

export function SettingsClient({
  business,
  subscription,
  email,
}: {
  business: Business;
  subscription: SubscriptionSummary;
  email: string;
}) {
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(updateBusinessSettingsAction, initialState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAccountAction.bind(null, locale),
    initialState
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isSCorp, setIsSCorp] = useState(business.isSCorp);
  const [homeOfficeUsed, setHomeOfficeUsed] = useState(business.homeOfficeUsed);
  const [officeSqFt, setOfficeSqFt] = useState(business.homeOfficeSqFt ?? "");
  const [totalSqFt, setTotalSqFt] = useState(business.totalHomeSqFt ?? "");
  const [filingStatus, setFilingStatus] = useState(business.filingStatus);
  const [isSstb, setIsSstb] = useState(business.isSstb);
  const searchParams = useSearchParams();
  const dict = DICTIONARIES[locale];
  const t = dict.settings;

  useEffect(() => {
    if (state.success) toast.success(t.savedToast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      toast.success(t.upgradedToast);
    }
    // Only fire once on mount for whatever query string loaded the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fieldErrors = state.fieldErrors ?? {};
  const pct = homeOfficeDeduction({
    officeSqFt: parseFloat(officeSqFt || "0") || 0,
    totalSqFt: parseFloat(totalSqFt || "0") || 0,
    billAmount: 0,
  }).businessUsePercentage;
  const simplified = simplifiedHomeOfficeDeduction(parseFloat(officeSqFt || "0") || 0);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
      </div>

      <form onSubmit={noResetSubmit(formAction)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.business.heading}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="businessName">{t.business.businessName}</Label>
              <Input id="businessName" name="businessName" defaultValue={business.businessName} required />
              <FieldError>{translateMessage(dict, fieldErrors.businessName)}</FieldError>
            </div>
            <div>
              <Label htmlFor="taxYear">{t.business.taxYear}</Label>
              <Input id="taxYear" name="taxYear" type="number" defaultValue={business.taxYear} required />
              <FieldError>{translateMessage(dict, fieldErrors.taxYear)}</FieldError>
            </div>
            <div>
              <Label htmlFor="beginningBankBalance">{t.business.beginningBankBalance}</Label>
              <Input
                id="beginningBankBalance"
                name="beginningBankBalance"
                type="number"
                step="0.01"
                defaultValue={business.beginningBankBalance}
                required
              />
              <HelpText>{t.business.beginningBankBalanceHelp}</HelpText>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.taxProfile.heading}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="businessType">{t.taxProfile.businessStructure}</Label>
              <Select id="businessType" name="businessType" defaultValue={business.businessType}>
                <option value="sole_prop">{t.taxProfile.soleProp}</option>
                <option value="s_corp">{t.taxProfile.sCorp}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="filingStatus">{t.taxProfile.filingStatus}</Label>
              <Select
                id="filingStatus"
                name="filingStatus"
                defaultValue={business.filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as typeof filingStatus)}
              >
                <option value="single">{t.taxProfile.single}</option>
                <option value="married_filing_jointly">{t.taxProfile.marriedJointly}</option>
                <option value="married_filing_separately">{t.taxProfile.marriedSeparately}</option>
                <option value="head_of_household">{t.taxProfile.headOfHousehold}</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="isSCorp"
                name="isSCorp"
                type="checkbox"
                defaultChecked={business.isSCorp}
                onChange={(e) => setIsSCorp(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isSCorp" className="mb-0">
                {t.taxProfile.taxedAsSCorp}
              </Label>
            </div>
            {isSCorp && (
              <div>
                <Label htmlFor="sCorpSalary">{t.taxProfile.sCorpSalary}</Label>
                <Input
                  id="sCorpSalary"
                  name="sCorpSalary"
                  type="number"
                  step="0.01"
                  defaultValue={business.sCorpSalary ?? ""}
                />
                <FieldError>{translateMessage(dict, fieldErrors.sCorpSalary)}</FieldError>
              </div>
            )}
            {filingStatus === "married_filing_jointly" && (
              <div>
                <Label htmlFor="spouseIncome">{t.taxProfile.spouseIncome}</Label>
                <Input
                  id="spouseIncome"
                  name="spouseIncome"
                  type="number"
                  step="0.01"
                  defaultValue={business.spouseIncome ?? ""}
                />
                <HelpText>{t.taxProfile.spouseIncomeHelp}</HelpText>
                <FieldError>{translateMessage(dict, fieldErrors.spouseIncome)}</FieldError>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.qbi.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="isSstb"
                name="isSstb"
                type="checkbox"
                defaultChecked={business.isSstb}
                onChange={(e) => setIsSstb(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isSstb" className="mb-0">
                {t.qbi.sstbLabel}
              </Label>
            </div>
            <HelpText>{t.qbi.sstbHelp}</HelpText>
            {!isSstb && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="w2WagesPaid">{t.qbi.w2Wages}</Label>
                  <Input
                    id="w2WagesPaid"
                    name="w2WagesPaid"
                    type="number"
                    step="0.01"
                    defaultValue={business.w2WagesPaid}
                  />
                  <HelpText>{t.qbi.w2WagesHelp}</HelpText>
                </div>
                <div>
                  <Label htmlFor="ubiaQualifiedProperty">{t.qbi.ubia}</Label>
                  <Input
                    id="ubiaQualifiedProperty"
                    name="ubiaQualifiedProperty"
                    type="number"
                    step="0.01"
                    defaultValue={business.ubiaQualifiedProperty}
                  />
                  <HelpText>{t.qbi.ubiaHelp}</HelpText>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.homeOffice.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                id="homeOfficeUsed"
                name="homeOfficeUsed"
                type="checkbox"
                defaultChecked={business.homeOfficeUsed}
                onChange={(e) => setHomeOfficeUsed(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="homeOfficeUsed" className="mb-0">
                {t.homeOffice.usesHomeOffice}
              </Label>
            </div>
            {homeOfficeUsed && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="homeOfficeSqFt">{t.homeOffice.officeSqFt}</Label>
                    <Input
                      id="homeOfficeSqFt"
                      name="homeOfficeSqFt"
                      type="number"
                      step="1"
                      value={officeSqFt}
                      onChange={(e) => setOfficeSqFt(e.target.value)}
                    />
                    <FieldError>{translateMessage(dict, fieldErrors.homeOfficeSqFt)}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="totalHomeSqFt">{t.homeOffice.totalSqFt}</Label>
                    <Input
                      id="totalHomeSqFt"
                      name="totalHomeSqFt"
                      type="number"
                      step="1"
                      value={totalSqFt}
                      onChange={(e) => setTotalSqFt(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-info-bg p-3 text-sm text-info">
                  <p>
                    {t.homeOffice.businessUsePercentage} <strong>{(pct * 100).toFixed(1)}%</strong>
                  </p>
                  <p className="mt-1 text-xs">
                    {t.homeOffice.applyNote.replace("{amount}", formatCurrency(simplified))}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {state.error && <p className="text-sm text-danger">{translateMessage(dict, state.error)}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? t.saving : t.save}
        </Button>
      </form>

      <div id="billing">
        <BillingCard summary={subscription} businessId={business.id} email={email} />
      </div>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger">{t.dangerZone.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">{t.dangerZone.body}</p>
          <Button
            type="button"
            variant="danger"
            className="mt-4"
            onClick={() => {
              setConfirmEmail("");
              setDeleteDialogOpen(true);
            }}
          >
            {t.dangerZone.deleteButton}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={t.dangerZone.dialogTitle}
      >
        <form onSubmit={noResetSubmit(deleteFormAction)} className="space-y-4">
          <p className="text-sm text-muted">{t.dangerZone.dialogBody}</p>
          <div>
            <Label htmlFor="confirmEmail">{t.dangerZone.confirmLabel.replace("{email}", email)}</Label>
            <Input
              id="confirmEmail"
              name="confirmEmail"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
              required
            />
            <FieldError>{translateMessage(dict, deleteState.fieldErrors?.confirmEmail)}</FieldError>
          </div>
          {deleteState.error && (
            <p className="text-sm text-danger">{translateMessage(dict, deleteState.error)}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.dangerZone.cancel}
            </Button>
            <Button type="submit" variant="danger" disabled={deletePending || confirmEmail.trim().toLowerCase() !== email.toLowerCase()}>
              {deletePending ? t.dangerZone.deleting : t.dangerZone.confirmDelete}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
