"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/use-locale";
import { localizedPath } from "@/i18n/locales";
import { en as en_ } from "@/i18n/dictionaries/en";
import { es as es_ } from "@/i18n/dictionaries/es";
import {
  getStoredConsent,
  setStoredConsent,
  subscribeToConsentChange,
  OPEN_PREFERENCES_EVENT,
  type ConsentStatus,
} from "@/lib/cookie-consent";

const DICTIONARIES = { en: en_, es: es_ };

function getHasConsentSnapshot() {
  return getStoredConsent() !== null;
}

// Assume "already decided" on the server/first paint so the banner never
// flashes before hydration can check localStorage for real.
function getHasConsentServerSnapshot() {
  return true;
}

export function CookieConsentBanner() {
  const hasConsent = useSyncExternalStore(subscribeToConsentChange, getHasConsentSnapshot, getHasConsentServerSnapshot);
  const [forceOpen, setForceOpen] = useState(false);
  const locale = useLocale();
  const t = DICTIONARIES[locale].cookieConsent;

  useEffect(() => {
    const onOpen = () => setForceOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, onOpen);
  }, []);

  const visible = forceOpen || !hasConsent;
  if (!visible) return null;

  function choose(status: ConsentStatus) {
    setStoredConsent(status);
    setForceOpen(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-4 shadow-lg sm:p-5">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {t.body}{" "}
          <Link href={localizedPath(locale, "/privacy")} className="font-medium text-primary hover:underline">
            {t.learnMore}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            {t.reject}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
