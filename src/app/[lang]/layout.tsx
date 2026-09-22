import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { AnalyticsGate } from "@/components/cookie-consent/analytics-gate";
import { CookieConsentBanner } from "@/components/cookie-consent/cookie-consent-banner";
import { isLocale, defaultLocale } from "@/i18n/locales";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bookkeeply",
    template: "%s | Bookkeeply",
  },
  description: "Simple bookkeeping and tax planning for service-based businesses.",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;

  return (
    <html lang={locale} className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif` }}
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
        <Analytics />
        <AnalyticsGate gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
