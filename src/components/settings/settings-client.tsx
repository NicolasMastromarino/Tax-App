"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, FieldError, HelpText } from "@/components/ui/input";
import { updateBusinessSettingsAction } from "@/lib/actions/business-actions";
import type { ActionState } from "@/lib/actions/auth-actions";
import { homeOfficeDeduction, simplifiedHomeOfficeDeduction } from "@/lib/calculations/ledger";
import { formatCurrency } from "@/lib/utils";
import type { businesses } from "@/db/schema";

type Business = typeof businesses.$inferSelect;

const initialState: ActionState = {};

export function SettingsClient({ business }: { business: Business }) {
  const [state, formAction, pending] = useActionState(updateBusinessSettingsAction, initialState);
  const [isSCorp, setIsSCorp] = useState(business.isSCorp);
  const [homeOfficeUsed, setHomeOfficeUsed] = useState(business.homeOfficeUsed);
  const [officeSqFt, setOfficeSqFt] = useState(business.homeOfficeSqFt ?? "");
  const [totalSqFt, setTotalSqFt] = useState(business.totalHomeSqFt ?? "");

  useEffect(() => {
    if (state.success) toast.success("Settings saved");
  }, [state.success]);

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
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">Business, tax, and home office information.</p>
      </div>

      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" name="businessName" defaultValue={business.businessName} required />
              <FieldError>{fieldErrors.businessName}</FieldError>
            </div>
            <div>
              <Label htmlFor="taxYear">Tax Year</Label>
              <Input id="taxYear" name="taxYear" type="number" defaultValue={business.taxYear} required />
              <FieldError>{fieldErrors.taxYear}</FieldError>
            </div>
            <div>
              <Label htmlFor="beginningBankBalance">Beginning Bank Balance</Label>
              <Input
                id="beginningBankBalance"
                name="beginningBankBalance"
                type="number"
                step="0.01"
                defaultValue={business.beginningBankBalance}
                required
              />
              <HelpText>Your bank balance before your first recorded transaction.</HelpText>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="businessType">Business Structure</Label>
              <Select id="businessType" name="businessType" defaultValue={business.businessType}>
                <option value="sole_prop">Sole Proprietor</option>
                <option value="s_corp">S Corporation</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="filingStatus">Filing Status</Label>
              <Select id="filingStatus" name="filingStatus" defaultValue={business.filingStatus}>
                <option value="single">Single</option>
                <option value="married_filing_jointly">Married Filing Jointly</option>
                <option value="married_filing_separately">Married Filing Separately</option>
                <option value="head_of_household">Head of Household</option>
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
                Taxed as an S Corporation
              </Label>
            </div>
            {isSCorp && (
              <div>
                <Label htmlFor="sCorpSalary">S-Corp Reasonable Salary</Label>
                <Input
                  id="sCorpSalary"
                  name="sCorpSalary"
                  type="number"
                  step="0.01"
                  defaultValue={business.sCorpSalary ?? ""}
                />
                <FieldError>{fieldErrors.sCorpSalary}</FieldError>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Home Office</CardTitle>
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
                Do you use a home office?
              </Label>
            </div>
            {homeOfficeUsed && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="homeOfficeSqFt">Home Office Square Footage</Label>
                    <Input
                      id="homeOfficeSqFt"
                      name="homeOfficeSqFt"
                      type="number"
                      step="1"
                      value={officeSqFt}
                      onChange={(e) => setOfficeSqFt(e.target.value)}
                    />
                    <FieldError>{fieldErrors.homeOfficeSqFt}</FieldError>
                  </div>
                  <div>
                    <Label htmlFor="totalHomeSqFt">Total Home Square Footage</Label>
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
                  <p>Business-use percentage: <strong>{(pct * 100).toFixed(1)}%</strong></p>
                  <p className="mt-1 text-xs">
                    This applies automatically when you record home-related bills (utilities,
                    insurance, mortgage interest, property tax) on the Transactions page.
                    Simplified-method alternative (2025 rate): {formatCurrency(simplified)}
                    /year flat (capped at 300 sq ft).
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
