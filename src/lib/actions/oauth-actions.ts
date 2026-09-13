"use server";

import { signIn } from "@/lib/auth";
import { localizedPath, type Locale } from "@/i18n/locales";

// Bound to the current locale by its caller, same pattern as
// signOutAction/deleteAccountAction -- see login-action.ts for why the
// post-auth redirect target must be explicitly locale-prefixed.
export async function signInWithGoogleAction(locale: Locale) {
  await signIn("google", { redirectTo: localizedPath(locale, "/dashboard") });
}
