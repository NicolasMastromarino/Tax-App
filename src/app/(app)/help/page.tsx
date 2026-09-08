import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { requireBusiness } from "@/lib/current-business";
import { db } from "@/db";
import { transactions, reconciliations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function HelpPage() {
  const { business } = await requireBusiness();

  const [txCount, reconciledCount] = await Promise.all([
    db.$count(transactions, eq(transactions.businessId, business.id)),
    db.$count(
      reconciliations,
      eq(reconciliations.businessId, business.id)
    ),
  ]);

  const hasBeginningBalance = parseFloat(business.beginningBankBalance) !== 0;
  const hasReconciled = reconciledCount > 0;

  const checklist = [
    { label: "Create your business", done: true, href: "/settings" },
    { label: "Configure tax settings (filing status, business type)", done: true, href: "/settings" },
    {
      label: "Configure your home office (if applicable)",
      done: business.homeOfficeUsed,
      href: "/settings",
      optional: true,
    },
    { label: "Enter your beginning bank balance", done: hasBeginningBalance, href: "/settings" },
    { label: "Add your first transaction", done: txCount > 0, href: "/transactions" },
    { label: "Reconcile your first month", done: hasReconciled, href: "/reconciliation" },
    { label: "Review your Profit & Loss report", done: txCount > 0, href: "/reports" },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Help &amp; Getting Started</h1>
        <p className="mt-1 text-sm text-muted">
          A quick walkthrough to get your bookkeeping set up.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                >
                  <span className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-muted" />
                    )}
                    <span className={cn("text-sm", item.done && "text-muted line-through")}>
                      {item.label}
                      {item.optional && !item.done && (
                        <span className="ml-1.5 text-xs text-muted no-underline">(optional)</span>
                      )}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Bookkeeping Works Here</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Concept
            title="Everything is one list of transactions"
            body="Record income, expenses, owner contributions, and owner distributions as they happen. Your dashboard, reports, and reconciliation all update automatically — there's no separate step to 'close the books' each month."
          />
          <Concept
            title="Reconciling means checking your bank statement"
            body="Once a month, compare your calculated ending balance to your real bank statement. If they match, mark the month reconciled — that's what turns a month's status from 'In Progress' to 'Complete' on your dashboard."
          />
          <Concept
            title="Owner contributions/distributions aren't income or expenses"
            body="Money you put into or take out of the business affects your bank balance, but it isn't revenue or a deductible expense — it's tracked separately from your Net Income."
          />
          <Concept
            title={'"Other Expenses" needs a description'}
            body="If nothing else fits, use the Other Expenses category, but always add a short description — your accountant will want to know what it was for at tax time. See the Other Expenses report to review everything you've itemized."
          />
          <Concept
            title="Home office deduction"
            body="Set your office and total home square footage once in Settings. When you record a home-related bill (utilities, insurance, mortgage interest, property taxes) on the Transactions page, the Home Office Calculator figures the deductible business portion for you."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Contractor &amp; 1099 tracking and the full Tax Planner (self-employment tax, QBI
            deduction, S-Corp comparison, and quarterly estimated payments) are on the roadmap for
            a follow-up release. Core bookkeeping — transactions, reconciliation, and Profit &amp;
            Loss — is fully functional today.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Concept({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-muted">{body}</p>
    </div>
  );
}
