import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Bookkeeply.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted">Last updated: September 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of Bookkeeply (the
            &quot;Service&quot;). By creating an account, you agree to these Terms.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Not tax, legal, or financial advice</h2>
            <p className="mt-3 text-muted">
              Bookkeeply is a bookkeeping and tax-planning tool. Every figure it shows you —
              including tax estimates, quarterly payment amounts, and the 1099 filing threshold —
              is a planning estimate based on the information you enter and current IRS figures. It
              is not tax, legal, or financial advice, does not file anything on your behalf, and is
              not a substitute for a licensed CPA, enrolled agent, or attorney. You&apos;re
              responsible for verifying your own tax obligations before relying on any number the
              Service shows you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Your account</h2>
            <p className="mt-3 text-muted">
              You&apos;re responsible for keeping your login credentials confidential and for all
              activity under your account. You must provide accurate information and are
              responsible for the accuracy of the bookkeeping data you enter — the Service can only
              calculate estimates from what you give it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
            <p className="mt-3 text-muted">
              Don&apos;t use the Service for anything unlawful, to store data you don&apos;t have
              the right to store, or to attempt to disrupt or gain unauthorized access to the
              Service or other users&apos; accounts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Pricing & billing</h2>
            <p className="mt-3 text-muted">
              The Service is currently free to use during early access. If and when we introduce
              paid plans, we&apos;ll notify existing users in advance of any change that affects
              them, and you won&apos;t be charged without clear notice and your consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Disclaimer of warranties</h2>
            <p className="mt-3 text-muted">
              The Service is provided &quot;as is&quot; without warranties of any kind, express or
              implied. We work to keep tax figures accurate and current, but we don&apos;t
              guarantee the Service is error-free, uninterrupted, or that any estimate exactly
              matches your eventual tax liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Limitation of liability</h2>
            <p className="mt-3 text-muted">
              To the fullest extent permitted by law, Bookkeeply is not liable for indirect,
              incidental, or consequential damages arising from your use of the Service, including
              any tax, penalty, or interest consequences of relying on an estimate it provided.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Changes to these Terms</h2>
            <p className="mt-3 text-muted">
              We may update these Terms from time to time. If we make material changes, we&apos;ll
              update the date above and, where appropriate, notify you directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact us</h2>
            <p className="mt-3 text-muted">
              Questions about these Terms? Email{" "}
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
