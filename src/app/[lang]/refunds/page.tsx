import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: "Refund Policy",
    description: "Bookkeeply's refund policy for paid plans.",
    alternates: localizedAlternates(locale, "/refunds"),
  };
}

export default async function RefundsPage() {
  const dict = await getDictionary();
  const t = dict.legal.refunds;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{dict.legal.lastUpdated}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p>{t.intro}</p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.trial.heading}</h2>
            <p className="mt-3 text-muted">{t.trial.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.renewals.heading}</h2>
            <p className="mt-3 text-muted">{t.renewals.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.howTo.heading}</h2>
            <p className="mt-3 text-muted">{t.howTo.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.changes.heading}</h2>
            <p className="mt-3 text-muted">{t.changes.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.contact.heading}</h2>
            <p className="mt-3 text-muted">
              {t.contact.body}{" "}
              <a href="mailto:support@bookkeeply.me" className="text-primary hover:underline">
                support@bookkeeply.me
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
