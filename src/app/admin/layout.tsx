import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import { requireFounder } from "@/lib/current-business";
import { signOutAction } from "@/lib/actions/session-actions";
import { BrandMark } from "@/components/brand-mark";
import { defaultLocale } from "@/i18n/locales";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireFounder();

  // /admin has no shared ancestor with the [lang] segment (see the Logo
  // comment below), so unlike every other route in the app it doesn't
  // inherit an <html>/<body> shell or globals.css from anywhere -- this
  // layout has to provide its own, the same way [lang]/layout.tsx does.
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif` }}
      >
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Not the shared marketing <Logo/> — that reads the current
                  locale via next/root-params, which only exists under the
                  [lang] segment. /admin is deliberately outside it (internal
                  tool, English-only), so this stays a plain, unprefixed link. */}
              <Link href="/" className="flex items-center gap-2">
                <BrandMark />
                <span className="text-base font-semibold text-foreground">Bookkeeply</span>
              </Link>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Admin
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/blog" className="text-sm font-medium text-muted hover:text-foreground">
                View blog
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-foreground">
                Back to app
              </Link>
              <form action={signOutAction.bind(null, defaultLocale)}>
                <button
                  type="submit"
                  className="text-sm font-medium text-muted hover:text-foreground"
                >
                  Log out
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
