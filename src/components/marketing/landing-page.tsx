import Link from "next/link";
import Image from "next/image";
import { Pricing } from "./pricing";
import {
  BookOpen,
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
 * in (see src/app/page.tsx — signed-in visitors are redirected straight to
 * /dashboard instead). Built to be the landing page for Facebook ads, so
 * everything above the fold is optimized for a fast first paint and a
 * clear, single primary action (start a free account).
 *
 * Product screenshots below are from a throwaway demo account with
 * invented numbers/names (Rivera Design Co), not the founder's real
 * business data — see scripts/demo-data-for-marketing.mjs.
 */

const FEATURES = [
  {
    icon: ReceiptText,
    title: "Simple bookkeeping",
    body: "One clean ledger for income and expenses: searchable categories, vendor tracking, and a home office calculator built right into the form.",
  },
  {
    icon: Calculator,
    title: "Real tax estimates",
    body: "Self-employment tax, the QBI deduction, and your income tax, annualized from your actual bookkeeping data, not a guess.",
  },
  {
    icon: Scale,
    title: "Sole Prop vs. S-Corp",
    body: "See both scenarios side by side at your real numbers, with a plain-English callout for how much an S-Corp election could save you.",
  },
  {
    icon: CalendarClock,
    title: "Quarterly payments, done right",
    body: "True IRS safe-harbor calculations, not just an even split, so you know exactly what to send in and when.",
  },
  {
    icon: Users,
    title: "Contractors & 1099s",
    body: "Every contractor payment tracked by vendor, with a live 1099-NEC threshold that's always correct for the current tax year.",
  },
  {
    icon: BarChart3,
    title: "Reports that make sense",
    body: "Profit & Loss by month, quarter, or custom range, plus bank reconciliation so your books actually match your bank account.",
  },
] as const;

const FAQS = [
  {
    q: "Is this tax advice?",
    a: "No. Bookkeeply gives you planning estimates based on the numbers you enter and current IRS figures; it's not a substitute for a licensed CPA or tax advisor, especially for anything beyond a straightforward sole proprietorship or single-owner S-Corp.",
  },
  {
    q: "Do I need to know anything about accounting to use it?",
    a: "No. You categorize each transaction from a plain-English list (\"Advertising,\" \"Contract Labor,\" \"Meals\"), and the app handles the bookkeeping and tax math behind it.",
  },
  {
    q: "How do you keep the tax figures accurate?",
    a: "Tax brackets, self-employment tax, and the QBI deduction are sourced directly from IRS Revenue Procedures and updated as the rules change, including the One Big Beautiful Bill Act changes that took effect for 2026.",
  },
  {
    q: "What kind of business is this built for?",
    a: "Service-based freelancers and solopreneurs: consultants, designers, coaches, photographers, contractors, and similar one-person or small service businesses filing as a sole proprietor or S-Corp.",
  },
  {
    q: "Is my financial data secure?",
    a: "Your data is stored in a private account behind your own login and is never shared or sold. See our Privacy Policy for the full details.",
  },
  {
    q: "What does it cost?",
    a: "Bookkeeply is free to start right now, with no credit card required. Paid plans are on the way. See Pricing below for what's coming.",
  },
] as const;

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

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BookOpen className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold text-foreground">Bookkeeply</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/80 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted hover:text-foreground">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-medium text-muted hover:text-foreground">
            FAQ
          </a>
          <Link href="/blog" className="text-sm font-medium text-muted hover:text-foreground">
            Blog
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            Get Started Free
          </Link>
        </div>

        {/* Mobile nav: a native <details> disclosure needs no client JS. */}
        <details className="relative md:hidden">
          <summary
            className="flex h-9 w-9 list-none items-center justify-center rounded-lg text-foreground hover:bg-surface-muted [&::-webkit-details-marker]:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-11 w-56 rounded-xl border border-border bg-surface p-2 shadow-lg">
            <a href="#features" className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              Features
            </a>
            <a href="#pricing" className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              Pricing
            </a>
            <a href="#faq" className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              FAQ
            </a>
            <Link href="/blog" className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              Blog
            </Link>
            <div className="my-2 border-t border-border" />
            <Link href="/login" className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-muted">
              Log in
            </Link>
            <Link
              href="/register"
              className="mt-1 block rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Get Started Free
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}

function Hero() {
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
            Built for freelancers &amp; service businesses
          </div>

          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Bookkeeping and taxes,{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right in oklch, var(--primary), var(--marketing-accent))",
              }}
            >
              without the dread.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted">
            Track your income and expenses in minutes a day, then see exactly what you&apos;ll owe:
            self-employment tax, the QBI deduction, and quarterly payments, sourced straight from
            the IRS, not guesswork.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary-hover sm:w-auto"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-6 text-base font-medium text-foreground transition-colors hover:bg-surface-muted sm:w-auto"
            >
              See how it works
            </a>
          </div>

          <p className="mt-4 text-sm text-muted">
            No credit card required &middot; Free to start &middot; Set up in under 10 minutes
          </p>
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
              alt="Bookkeeply dashboard showing year-to-date revenue, expenses, net income, and a monthly revenue chart"
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
            <p className="text-xs font-medium text-muted">Est. Quarterly Tax</p>
            <p className="mt-1 text-2xl font-semibold text-primary">$3,629.10</p>
            <p className="mt-1 text-xs text-success">✓ IRS safe-harbor amount</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: Landmark, text: "IRS-sourced tax figures, updated for 2026" },
    { icon: ShieldCheck, text: "Your data stays private, never sold" },
    { icon: CheckCircle2, text: "No spreadsheets, no dread" },
  ];
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

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything your service business needs, nothing it doesn&apos;t
        </h2>
        <p className="mt-4 text-pretty text-lg text-muted">
          Built from the ground up for one-person and small service businesses, not a stripped-down
          version of accounting software made for someone else.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
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

function ScreenshotSpotlight() {
  return (
    <section className="border-y border-border bg-surface-muted/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              Tax Planner
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground">
              Know your tax bill before you file, not after.
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted">
              Your Tax Estimate updates automatically as you add income and expenses: self-employment
              tax, the QBI deduction, your marginal rate, and a true IRS safe-harbor quarterly
              payment schedule, all in one place.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Sole Proprietor vs. S-Corp compared side by side",
                "Quarterly estimated payments with over/underpaid tracking",
                "Updated for the 2026 One Big Beautiful Bill Act changes",
              ].map((item) => (
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
              alt="Tax Planner screen showing total estimated tax, quarterly payment amount, QBI deduction, and other tax figures"
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
              alt="Contractors and 1099s screen showing a vendor payment total and whether a 1099-NEC is needed"
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
              Contractors &amp; 1099s
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground">
              Never miss a 1099 again.
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted">
              Every Contract Labor payment is tracked by vendor automatically, with the current-year
              1099-NEC filing threshold applied for you, so you know exactly who needs one by
              January 31.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Add your income & expenses",
      body: "Enter transactions as they happen, or catch up in one sitting; a searchable category list makes it fast either way.",
    },
    {
      n: "2",
      title: "We do the math",
      body: "Self-employment tax, the QBI deduction, and your progressive tax brackets are calculated automatically from your real numbers.",
    },
    {
      n: "3",
      title: "See what you owe",
      body: "Your Tax Estimate and quarterly payment schedule update instantly. No more surprises in April.",
    },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Ten minutes a week is all it takes
        </h2>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.n} className="text-center sm:text-left">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
              {step.n}
            </span>
            <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-pretty text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
      </div>
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
        {FAQS.map(({ q, a }) => (
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

function FinalCta() {
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
          Stop guessing what you&apos;ll owe.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/90">
          Set up your first month of bookkeeping in under 10 minutes, free, no credit card
          required.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-primary shadow-md transition-transform hover:scale-[1.02]"
        >
          Get Started Free
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted">
              Simple bookkeeping and tax planning for service-based businesses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Product</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#features" className="text-muted hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="text-muted hover:text-foreground">Pricing</a></li>
                <li><a href="#faq" className="text-muted hover:text-foreground">FAQ</a></li>
                <li><Link href="/blog" className="text-muted hover:text-foreground">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Account</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/login" className="text-muted hover:text-foreground">Log in</Link></li>
                <li><Link href="/register" className="text-muted hover:text-foreground">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Bookkeeply. Not affiliated with the IRS. Tax
            estimates are for planning purposes only and are not tax, legal, or financial advice.
            Talk to a licensed professional about your specific situation.
          </p>
        </div>
      </div>
    </footer>
  );
}
