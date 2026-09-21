import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { ContactForm } from "@/components/marketing/contact-client";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/locales";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: "Contact Us",
    description: "Questions about your bookkeeping or taxes? Send Bookkeeply a message.",
    alternates: localizedAlternates(locale, "/contact"),
  };
}

export default async function ContactPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.contact;
  const faq = dict.marketing.faq;
  const homeHref = localizedPath(locale, "/");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background">
        {/* Same gradient hero banner as /blog, so this reads as part of the site. */}
        <section
          className="relative overflow-hidden py-20 sm:py-24"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t.heading}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/80">{t.subtitle}</p>
          </div>
        </section>

        <div className="relative mx-auto -mt-10 w-full max-w-xl px-4 pb-6 sm:-mt-12 sm:px-6">
          <div className="rounded-2xl border border-border bg-surface p-7 shadow-xl sm:p-9">
            <ContactForm dict={dict} />
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {t.note}{" "}
            <a href="mailto:support@bookkeeply.me" className="font-medium text-primary hover:underline">
              support@bookkeeply.me
            </a>
            .
          </p>
        </div>

        {/* Same accordion as the homepage FAQ, reusing the same content so
            there's a single source of truth for the answers. */}
        <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:px-6 sm:pb-28">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
            {t.faqEyebrow}
          </p>
          <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faq.items.map(({ q, a }) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="shrink-0 text-muted transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-pretty text-muted">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href={`${homeHref}#faq`} className="text-sm font-medium text-primary hover:underline">
              {t.seeFullFaq} →
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
