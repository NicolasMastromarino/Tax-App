"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { isLocale, localizedPath } from "@/i18n/locales";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const rawLocale = formData.get("locale");
  const locale = typeof rawLocale === "string" && isLocale(rawLocale) ? rawLocale : "en";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      // Explicit locale-prefixed target: a Server Action's built-in
      // redirect renders the destination using the *current* route's
      // already-resolved [lang] param rather than re-running proxy.ts for
      // a plain "/dashboard", so an unprefixed target silently inherited
      // whatever locale the login page happened to be on while the URL
      // bar and client components (which read the real URL) showed
      // English — a mismatched, sometimes-crashing render. Spelling out
      // the target avoids relying on that inference entirely.
      redirectTo: localizedPath(locale, "/dashboard"),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}
