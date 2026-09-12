"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Scale,
  FileBarChart,
  Calculator,
  Users,
  BookOpen,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import { signOutAction } from "@/lib/actions/session-actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, paid: false },
  { href: "/transactions", label: "Transactions", icon: Receipt, paid: false },
  { href: "/reconciliation", label: "Reconciliation", icon: Scale, paid: false },
  { href: "/reports", label: "Reports", icon: FileBarChart, paid: false },
  { href: "/tax-planner", label: "Tax Planner", icon: Calculator, paid: true },
  { href: "/contractors", label: "Contractors & 1099s", icon: Users, paid: true },
  { href: "/categories", label: "Expense Categories", icon: BookOpen, paid: false },
  { href: "/settings", label: "Settings", icon: Settings, paid: false },
  { href: "/help", label: "Help / Getting Started", icon: HelpCircle, paid: false },
];

export function Sidebar({ businessName, subscribed }: { businessName: string; subscribed: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.paid && !subscribed && (
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Paid feature" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <BrandMark className="h-7 w-7" />
          {businessName}
        </span>
        <button onClick={() => setMobileOpen((o) => !o)} className="p-1">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop sidebar. Sticky + its own viewport height so it stays put
          as the main column scrolls, instead of stretching to match a tall
          page (the default flex cross-axis stretch) and pushing Sign out
          off the bottom of the screen. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-5">
          <BrandMark />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Business</p>
            <p className="mt-0.5 truncate text-sm font-semibold">{businessName}</p>
          </div>
        </div>
        {nav}
        <div className="border-t border-border p-3">
          <form action={signOutAction}>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-surface-muted">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-surface pt-4">
            {nav}
            <div className="border-t border-border p-3">
              <form action={signOutAction}>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-surface-muted">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
