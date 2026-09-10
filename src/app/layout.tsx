import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

// Resolves relative Open Graph/Twitter image URLs (used on the marketing
// landing page) against the real deployed domain instead of localhost.
// Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically in production;
// falls back to the known production domain, then localhost for local dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://tax-app-coral-six.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ten Minute Books",
    template: "%s | Ten Minute Books",
  },
  description: "Simple bookkeeping and tax planning for service-based businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif` }}
      >
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
