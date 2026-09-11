import type { Metadata } from "next";
import Link from "next/link";
import { requireFounder } from "@/lib/current-business";
import { signOutAction } from "@/lib/actions/session-actions";
import { Logo } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireFounder();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
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
            <form action={signOutAction}>
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
    </div>
  );
}
