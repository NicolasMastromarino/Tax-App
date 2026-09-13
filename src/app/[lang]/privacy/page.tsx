import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getDictionary } from "@/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Bookkeeply collects, uses, and protects your information.",
};

export default async function PrivacyPage() {
  const dict = await getDictionary();
  const t = dict.legal.privacy;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{dict.legal.lastUpdated}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p>{t.intro}</p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.collect.heading}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
              {t.collect.items.map((item) => (
                <li key={item.label}>
                  <span className="text-foreground">{item.label}</span>: {item.body}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.usage.heading}</h2>
            <p className="mt-3 text-muted">{t.usage.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.sharing.heading}</h2>
            <p className="mt-3 text-muted">{t.sharing.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.retention.heading}</h2>
            <p className="mt-3 text-muted">{t.retention.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.security.heading}</h2>
            <p className="mt-3 text-muted">{t.security.body}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">{t.children.heading}</h2>
            <p className="mt-3 text-muted">{t.children.body}</p>
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
