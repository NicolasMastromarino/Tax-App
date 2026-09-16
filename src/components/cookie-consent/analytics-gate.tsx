"use client";

import { useSyncExternalStore } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Contentsquare } from "@/app/[lang]/contentsquare";
import { getStoredConsent, subscribeToConsentChange } from "@/lib/cookie-consent";

function getSnapshot() {
  return getStoredConsent() === "accepted";
}

// Nothing is accepted until the client has actually checked localStorage,
// so SSR/first paint renders neither script -- matches the pre-hydration
// state and avoids a flash of trackers loading before consent is known.
function getServerSnapshot() {
  return false;
}

// Keeps Google Analytics and Contentsquare from loading at all until the
// visitor has accepted cookies -- both are non-essential/tracking cookies
// under GDPR, so they can't fire unconditionally the way they did before.
export function AnalyticsGate({ gaId }: { gaId?: string }) {
  const accepted = useSyncExternalStore(subscribeToConsentChange, getSnapshot, getServerSnapshot);

  if (!accepted) return null;

  return (
    <>
      {gaId && <GoogleAnalytics gaId={gaId} />}
      <Contentsquare />
    </>
  );
}
