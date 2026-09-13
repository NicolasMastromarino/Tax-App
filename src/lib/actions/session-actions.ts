"use server";

import { signOut } from "@/lib/auth";
import { localizedPath, type Locale } from "@/i18n/locales";

// Bound to the current locale by its caller (`signOutAction.bind(null, locale)`
// in the Sidebar) — see login-action.ts for why the redirect target must be
// explicitly locale-prefixed rather than a plain "/login".
export async function signOutAction(locale: Locale) {
  await signOut({ redirectTo: localizedPath(locale, "/login") });
}
