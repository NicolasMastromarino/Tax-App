import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { requireBusiness } from "@/lib/current-business";
import { db } from "@/db";
import { transactions, reconciliations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/locales";

export default async function HelpPage() {
  const { business } = await requireBusiness();
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.help;

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
    { label: t.checklist.items[0], done: true, href: "/settings" },
    { label: t.checklist.items[1], done: true, href: "/settings" },
    {
      label: t.checklist.items[2],
      done: business.homeOfficeUsed,
      href: "/settings",
      optional: true,
    },
    { label: t.checklist.items[3], done: hasBeginningBalance, href: "/settings" },
    { label: t.checklist.items[4], done: txCount > 0, href: "/transactions" },
    { label: t.checklist.items[5], done: hasReconciled, href: "/reconciliation" },
    { label: t.checklist.items[6], done: txCount > 0, href: "/reports" },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.checklist.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  href={localizedPath(locale, item.href)}
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
                        <span className="ml-1.5 text-xs text-muted no-underline">{t.checklist.optional}</span>
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
          <CardTitle>{t.howItWorks.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {t.howItWorks.concepts.map((concept) => (
            <Concept key={concept.title} title={concept.title} body={concept.body} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.comingSoon.heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">{t.comingSoon.body}</p>
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
