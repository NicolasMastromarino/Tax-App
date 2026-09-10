import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Bookkeeply collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p>
            Bookkeeply (&quot;we,&quot; &quot;us&quot;) provides bookkeeping and tax-planning
            software for service-based businesses. This policy explains what information we
            collect when you use the app, how we use it, and the choices you have.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
              <li>
                <span className="text-foreground">Account information</span> — your name, email
                address, and a securely hashed password when you register.
              </li>
              <li>
                <span className="text-foreground">Business & bookkeeping data</span> — anything you
                enter into the app, including your business name, tax profile, transactions,
                vendor/contractor information, and bank reconciliation records.
              </li>
              <li>
                <span className="text-foreground">Usage data</span> — basic technical information
                like browser type and log data, used only to keep the app running reliably and
                securely.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">How we use your information</h2>
            <p className="mt-3 text-muted">
              We use the information above solely to operate the app for you: authenticating your
              account, running the bookkeeping and tax-estimate calculations you see on screen, and
              improving the product. We do not sell your personal or financial information, and we
              do not use your bookkeeping data to train third-party advertising or AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Sharing</h2>
            <p className="mt-3 text-muted">
              We don&apos;t share your data with third parties except: (1) service providers that
              help us run the app (for example, our hosting and database providers), bound to keep
              it confidential; (2) if required by law; or (3) with your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Data retention & deletion</h2>
            <p className="mt-3 text-muted">
              We keep your data for as long as your account is active. You can request deletion of
              your account and associated data at any time by contacting us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <p className="mt-3 text-muted">
              We use industry-standard measures — including encrypted connections and hashed
              passwords — to protect your information. No method of transmission or storage is
              perfectly secure, so we can&apos;t guarantee absolute security, but protecting your
              data is something we take seriously given its sensitivity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Children&apos;s privacy</h2>
            <p className="mt-3 text-muted">
              Bookkeeply is intended for business owners and is not directed to children
              under 13, and we do not knowingly collect information from them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Changes to this policy</h2>
            <p className="mt-3 text-muted">
              If we make material changes to this policy, we&apos;ll update the date at the top of
              this page and, where appropriate, notify you directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact us</h2>
            <p className="mt-3 text-muted">
              Questions about this policy or your data? Email us at{" "}
              <a href="mailto:nicolas.mastromarino@gmail.com" className="text-primary hover:underline">
                nicolas.mastromarino@gmail.com
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
