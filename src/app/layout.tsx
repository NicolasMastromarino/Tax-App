import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

// Resolves relative Open Graph/Twitter image URLs (used on the marketing
// landing page) against the real deployed domain instead of localhost.
// Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically in production;
// falls back to bookkeeply.me (the intended production domain — must be
// added as a custom domain in Vercel with DNS pointed at it before this
// fallback resolves for real visitors), then localhost for local dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://bookkeeply.me");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bookkeeply",
    template: "%s | Bookkeeply",
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
