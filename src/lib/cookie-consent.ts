// Client-only helpers for the cookie consent banner. Never imported for its
// side effects at module scope -- every browser API call happens inside a
// function, so this file is safe to import from a Server Component too (the
// functions just never get called there).

export type ConsentStatus = "accepted" | "rejected";

const STORAGE_KEY = "cookie_consent";

// Fired whenever the stored consent changes, so already-mounted components
// (like the analytics gate) can react without a page reload.
export const CONSENT_CHANGE_EVENT = "cookieconsentchange";

// Fired by the footer's "Cookie preferences" link to re-open the banner
// even after a decision was already made.
export const OPEN_PREFERENCES_EVENT = "cookieconsentopen";

export function getStoredConsent(): ConsentStatus | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(status: ConsentStatus) {
  try {
    localStorage.setItem(STORAGE_KEY, status);
  } catch {
    // Private browsing / storage disabled -- the choice just won't persist
    // across visits, which is an acceptable degradation here.
  }
  // No payload -- subscribers (useSyncExternalStore) just re-read
  // getStoredConsent() themselves when this fires.
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

export function subscribeToConsentChange(callback: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}
