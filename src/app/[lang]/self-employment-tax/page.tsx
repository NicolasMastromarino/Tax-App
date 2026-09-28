import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, CheckCircle2, Info } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/locales";
import { absoluteUrl, localizedAlternates } from "@/lib/seo";
import { TAX_YEAR_2026_PARAMETERS } from "@/db/seed-data/tax-2026";
import {
  ADDITIONAL_MEDICARE_THRESHOLDS,
  computeSeTax,
} from "@/lib/calculations/tax";
import { round2 } from "@/lib/calculations/ledger";

/**
 * Public, indexable self-employment tax explainer (EN + ES), aimed at the
 * "self employment tax" / "how to calculate self employment tax" searches.
 * Every figure on the page (wage base, thresholds, the worked example) is
 * derived from the same IRS-sourced parameters and functions the Tax Planner
 * uses, so the page can't drift from the product's own math. When a new tax
 * year's seed file lands, point PARAMS at it.
 */
const PARAMS = TAX_YEAR_2026_PARAMETERS;
const EXAMPLE_PROFIT = 60_000;
const PATH = "/self-employment-tax";

function money(amount: number, locale: string, cents = true) {
  return amount.toLocaleString(locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

function fill(text: string, values: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { title, description } = dict.seo.seTax;
  const alternates = localizedAlternates(locale, PATH);
  return {
    title: { absolute: title },
    description,
    alternates,
    openGraph: {
      title,
      description,
      siteName: "Bookkeeply",
      type: "article",
      locale: locale === "es" ? "es_US" : "en_US",
      url: alternates.canonical as string,
      images: [{ url: "/marketing/og-image.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/marketing/og-image.png"] },
  };
}

export default async function SelfEmploymentTaxPage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.seTaxPage;
  const href = (path: string) => localizedPath(locale, path);

  const seBase = round2(EXAMPLE_PROFIT * PARAMS.seTaxableFraction);
  const seTax = computeSeTax(seBase, PARAMS);
  const values = {
    year: String(PARAMS.taxYear),
    wageBase: money(PARAMS.seWageBase, locale, false),
    threshold: money(ADDITIONAL_MEDICARE_THRESHOLDS.single, locale, false),
    thresholdMfj: money(ADDITIONAL_MEDICARE_THRESHOLDS.married_filing_jointly, locale, false),
    profit: money(EXAMPLE_PROFIT, locale, false),
  };
  const exampleRows = [
    { label: t.exampleRows.profit, value: money(EXAMPLE_PROFIT, locale) },
    { label: t.exampleRows.base, value: money(seBase, locale) },
    { label: t.exampleRows.tax, value: money(seTax, locale), emphasis: true },
    { label: t.exampleRows.deduction, value: money(round2(seTax * PARAMS.seDeductibleFraction), locale) },
    { label: t.exampleRows.monthly, value: money(round2(seTax / 12), locale) },
  ];
  const faq = t.faq.map(({ q, a }) => ({ q, a: fill(a, values) }));
  const url = absoluteUrl(locale, PATH);

  return (
    <div className="flex min-h-full flex-col">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${url}#webpage`,
              url,
              name: dict.seo.seTax.title,
              description: dict.seo.seTax.description,
              inLanguage: locale,
              isPartOf: { "@type": "WebSite", name: "Bookkeeply", url: absoluteUrl(locale, "/") },
            },
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              mainEntity: faq.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ],
        }}
      />
      <SiteHeader />
      <main className="flex-1 bg-background">
        {/* Same gradient hero banner as /blog and /contact. */}
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              {fill(t.eyebrow, values)}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t.heading}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/80">{t.subtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={href("/register")}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-primary shadow-md transition-transform hover:scale-[1.02] sm:w-auto"
              >
                {t.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#example"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/40 px-6 text-base font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                {t.ctaSecondary}
              </a>
            </div>
          </div>
        </section>

        {/* What it is + the three rate components. */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
              {t.whatHeading}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted">{t.whatBody}</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {t.rates.map(({ rate, label, body }) => (
              <div key={label} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <p className="text-3xl font-semibold text-primary">{rate}</p>
                <h3 className="mt-2 text-base font-semibold text-foreground">{label}</h3>
                <p className="mt-2 text-sm text-pretty text-muted">{fill(body, values)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it's calculated. */}
        <section className="border-y border-border bg-surface-muted/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-balance text-3xl font-semibold tracking-tight text-foreground">
              {t.stepsHeading}
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {t.steps.map((step, i) => (
                <div key={step.title} className="text-center sm:text-left">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-pretty text-sm text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Worked example, computed with the Tax Planner's own functions. */}
        <section id="example" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="text-center text-balance text-3xl font-semibold tracking-tight text-foreground">
            {t.exampleHeading}
          </h2>
          <p className="mt-4 text-center text-pretty text-muted">{fill(t.exampleIntro, values)}</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {exampleRows.map(({ label, value, emphasis }) => (
                  <tr key={label} className={emphasis ? "bg-primary/5" : undefined}>
                    <th scope="row" className="px-5 py-4 text-left font-medium text-foreground">
                      {label}
                    </th>
                    <td
                      className={`px-5 py-4 text-right tabular-nums ${emphasis ? "font-semibold text-primary" : "text-foreground"}`}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-pretty text-muted">{t.exampleNote}</p>

          <h2 className="mt-16 text-2xl font-semibold tracking-tight text-foreground">{t.payHeading}</h2>
          <p className="mt-3 text-pretty text-muted">{t.payBody}</p>

          <h2 className="mt-12 text-lg font-semibold text-foreground">{t.relatedHeading}</h2>
          <ul className="mt-4 space-y-3">
            {t.related.map(({ slug, title }) => (
              <li key={slug}>
                <Link
                  href={href(`/blog/${slug}`)}
                  className="inline-flex items-start gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Soft product pitch. */}
        <section className="border-y border-border bg-surface-muted/60">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              {t.plannerEyebrow}
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground">
              {t.plannerHeading}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted">{t.plannerBody}</p>
            <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
              {t.plannerBullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={href("/register")}
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary-hover"
            >
              {t.plannerCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="mt-3 text-sm text-muted">{t.plannerNote}</p>
          </div>
        </section>

        {/* FAQ: same accordion as the homepage; mirrored in FAQPage JSON-LD above. */}
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-balance text-3xl font-semibold tracking-tight text-foreground">
            {t.faqHeading}
          </h2>
          <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faq.map(({ q, a }) => (
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

          <div className="mt-10 flex gap-3 rounded-2xl border border-border bg-surface-muted/60 p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
            <p className="text-sm text-pretty text-muted">
              <strong className="font-semibold text-foreground">{t.disclaimerHeading}</strong>{" "}
              {fill(t.disclaimerBody, values)}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
