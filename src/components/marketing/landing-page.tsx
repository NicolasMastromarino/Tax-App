import Link from "next/link";
import Image from "next/image";
import { Pricing } from "./pricing";
import { BrandMark } from "@/components/brand-mark";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/locales";
import {
  Calculator,
  Scale,
  Users,
  CalendarClock,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Menu,
  ReceiptText,
  Landmark,
} from "lucide-react";

/**
 * Logged-out marketing homepage, shown at "/" for anyone who isn't signed
 * in (see src/app/[lang]/page.tsx — signed-in visitors are redirected
 * straight to /dashboard instead). Built to be the landing page for
 * Facebook ads, so everything above the fold is optimized for a fast first
 * paint and a clear, single primary action (start a free account).
 *
 * Product screenshots below are from a throwaway demo account with
 * invented numbers/names (Rivera Design Co), not the founder's real
 * business data — see scripts/demo-data-for-marketing.mjs.
 *
 * Copy comes from the i18n dictionary (src/i18n/dictionaries) rather than
 * being hardcoded, since this page renders in both English and Spanish —
 * see src/proxy.ts for how the locale is resolved.
 */

const FEATURE_ICONS = [ReceiptText, Calculator, Scale, CalendarClock, Users, BarChart3] as const;
const TRUST_ICONS = [Landmark, ShieldCheck, CheckCircle2] as const;

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <ScreenshotSpotlight />
        <HowItWorks />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

export async function Logo({ className = "" }: { className?: string }) {
  const locale = await getLocale();
  return (
    <Link href={localizedPath(locale, "/")} className={`flex items-center gap-2 ${className}`}>
      <BrandMark />
      <span className="text-base font-semibold text-foreground">Bookkeeply</span>
    </Link>
  );
}

export async function SiteHeader() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.marketing.nav;
  const href = (path: string) => localizedPath(locale, path);
  // Features/Pricing/FAQ are sections on the homepage only. On any other
  // page (blog, privacy, terms) a bare "#faq" just tacks the hash onto the
  // current URL and does nothing — anchor through the homepage instead so
  // the link always lands somewhere real.
  const homeHref = href("/");

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/80 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          <a href={`${homeHref}#features`} className="text-sm font-medium text-muted hover:text-foreground">
            {t.features}
          </a>
          <a href={`${homeHref}#pricing`} className="text-sm font-medium text-muted hover:text-foreground">
            {t.pricing}
          </a>
          <a href={`${homeHref}#faq`} className="text-sm font-medium text-muted hover:text-foreground">
            {t.faq}
          </a>
          <Link href={href("/blog")} className="text-sm font-medium text-muted hover:text-foreground">
            {t.blog}
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link href={href("/login")} className="text-sm font-medium text-muted hover:text-foreground">
            {t.login}
          </Link>
          <Link
            href={href("/register")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            {t.getStarted}
          </Link>
        </div>

        {/* Mobile nav: a native <details> disclosure needs no client JS. */}
        <details className="relative md:hidden">
          <summary
            className="flex h-9 w-9 list-none items-center justify-center rounded-lg text-foreground hover:bg-surface-muted [&::-webkit-details-marker]:hidden"
            aria-label={t.openMenu}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-11 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg">
            <a href={`${homeHref}#features`} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              {t.features}
            </a>
            <a href={`${homeHref}#pricing`} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              {t.pricing}
            </a>
            <a href={`${homeHref}#faq`} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              {t.faq}
            </a>
            <Link href={href("/blog")} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              {t.blog}
            </Link>
            <div className="my-2 border-t border-border" />
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
            <Link href={href("/login")} className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              {t.login}
            </Link>
            <Link
              href={href("/register")}
              className="mt-1 block rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {t.getStarted}
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}

async function Hero() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.marketing.hero;

  return (
    <section className="marketing-dot-grid relative overflow-hidden">
      {/* Soft gradient blobs for depth — purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-0 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--marketing-accent) 70%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-20 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-muted shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {t.badge}
          </div>

          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t.titleLine1}{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right in oklch, var(--primary), var(--marketing-accent))",
              }}
            >
              {t.titleLine2}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted">{t.subtitle}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={localizedPath(locale, "/register")}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary-hover sm:w-auto"
            >
              {t.ctaPrimary}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-6 text-base font-medium text-foreground transition-colors hover:bg-surface-muted sm:w-auto"
            >
              {t.ctaSecondary}
            </a>
          </div>

          <p className="mt-4 text-sm text-muted">{t.note}</p>
        </div>

        {/* Product screenshot, floating in a browser-style frame. */}
        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" aria-hidden="true" />
            </div>
            <Image
              src="/marketing/hero-dashboard.png"
              alt={t.dashboardImageAlt}
              width={1170}
              height={745}
              priority
              fetchPriority="high"
              sizes="(max-width: 896px) 100vw, 896px"
              className="w-full"
            />
          </div>

          {/* Floating stat callout for visual interest. */}
          <div className="absolute -bottom-6 -left-4 hidden w-56 rounded-xl border border-border bg-surface p-4 shadow-xl sm:block lg:-left-10">
            <p className="text-xs font-medium text-muted">{t.statLabel}</p>
            <p className="mt-1 text-2xl font-semibold text-primary">$3,629.10</p>
            <p className="mt-1 text-xs text-success">✓ {t.statNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

async function TrustStrip() {
  const dict = await getDictionary();
  const items = dict.marketing.trust.map((text, i) => ({ icon: TRUST_ICONS[i], text }));
  return (
    <section className="border-y border-border bg-surface-muted/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

async function Features() {
  const dict = await getDictionary();
  const t = dict.marketing.features;
  const items = t.items.map((item, i) => ({ ...item, icon: FEATURE_ICONS[i] }));

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t.heading}
        </h2>
        <p className="mt-4 text-pretty text-lg text-muted">{t.subheading}</p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-pretty text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

async function ScreenshotSpotlight() {
  const dict = await getDictionary();
  const { taxPlanner, contractors } = dict.marketing.screenshotSpotlight;

  return (
    <section className="border-y border-border bg-surface-muted/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              {taxPlanner.eyebrow}
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground">
              {taxPlanner.heading}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted">{taxPlanner.body}</p>
            <ul className="mt-6 space-y-3">
              {taxPlanner.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl lg:order-2">
            <Image
              src="/marketing/feature-tax-planner.png"
              alt={taxPlanner.imageAlt}
              width={1170}
              height={500}
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 560px"
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <Image
              src="/marketing/feature-contractors.png"
              alt={contractors.imageAlt}
              width={1170}
              height={330}
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 560px"
              className="w-full"
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {contractors.eyebrow}
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground">
              {contractors.heading}
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted">{contractors.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

async function HowItWorks() {
  const dict = await getDictionary();
  const t = dict.marketing.howItWorks;

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t.heading}
        </h2>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
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
    </section>
  );
}

async function Faq() {
  const dict = await getDictionary();
  const t = dict.marketing.faq;

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t.heading}
        </h2>
      </div>
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
        {t.items.map(({ q, a }) => (
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
    </section>
  );
}

async function FinalCta() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.marketing.finalCta;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right in oklch, var(--primary), var(--marketing-accent))",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {t.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/90">{t.body}</p>
        <Link
          href={localizedPath(locale, "/register")}
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-primary shadow-md transition-transform hover:scale-[1.02]"
        >
          {t.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export async function SiteFooter() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const t = dict.marketing.footer;
  const href = (path: string) => localizedPath(locale, path);

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted">{t.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t.product}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href={`${href("/")}#features`} className="text-muted hover:text-foreground">{dict.marketing.nav.features}</a></li>
                <li><a href={`${href("/")}#pricing`} className="text-muted hover:text-foreground">{dict.marketing.nav.pricing}</a></li>
                <li><a href={`${href("/")}#faq`} className="text-muted hover:text-foreground">{dict.marketing.nav.faq}</a></li>
                <li><Link href={href("/blog")} className="text-muted hover:text-foreground">{dict.marketing.nav.blog}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t.account}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href={href("/login")} className="text-muted hover:text-foreground">{dict.marketing.nav.login}</Link></li>
                <li><Link href={href("/register")} className="text-muted hover:text-foreground">{dict.marketing.nav.signup}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t.legal}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href={href("/privacy")} className="text-muted hover:text-foreground">{t.privacy}</Link></li>
                <li><Link href={href("/terms")} className="text-muted hover:text-foreground">{t.terms}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted">{t.disclaimer.replace("{year}", String(new Date().getFullYear()))}</p>
        </div>
      </div>
    </footer>
  );
}
