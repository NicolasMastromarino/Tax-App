"use client";

import { openCookiePreferences } from "@/lib/cookie-consent";

export function CookiePreferencesLink({ label }: { label: string }) {
  return (
    <button type="button" onClick={openCookiePreferences} className="text-muted hover:text-foreground">
      {label}
    </button>
  );
}
