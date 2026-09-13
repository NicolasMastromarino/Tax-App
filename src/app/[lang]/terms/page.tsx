import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Bookkeeply.",
};

export default async function TermsPage() {
  const dict = await getDictionary();
  const t = dict.legal.terms;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{dict.legal.lastUpdated}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p>{t.intro}</p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.notAdvice.heading}</h2>
            <p className="mt-3 text-muted">{t.notAdvice.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.account.heading}</h2>
            <p className="mt-3 text-muted">{t.account.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.acceptableUse.heading}</h2>
            <p className="mt-3 text-muted">{t.acceptableUse.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.pricing.heading}</h2>
            <p className="mt-3 text-muted">{t.pricing.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.warranties.heading}</h2>
            <p className="mt-3 text-muted">{t.warranties.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.liability.heading}</h2>
            <p className="mt-3 text-muted">{t.liability.body}</p>
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
