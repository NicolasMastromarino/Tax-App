"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/lib/auth";
import { localizedPath, type Locale } from "@/i18n/locales";
import type { ActionState } from "@/lib/actions/auth-actions";

// Bound to the current locale by its caller, same pattern as signOutAction
// (session-actions.ts) — see login-action.ts for why the post-auth redirect
// target must be explicitly locale-prefixed rather than a plain path.
//
// Requires the signed-in user to retype their own email as a confirmation
// step (no separate "are you sure" dialog step to skip past by habit).
// Deleting the `users` row cascades to businesses/transactions/
// reconciliations/tax payments/vendors via the FK `onDelete: "cascade"`
// constraints in schema.ts — there's nothing else to clean up separately.
export async function deleteAccountAction(
  locale: Locale,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "Enter your email and password." };
  }

  const confirmEmail = formData.get("confirmEmail");
  if (
    typeof confirmEmail !== "string" ||
    confirmEmail.trim().toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return { fieldErrors: { confirmEmail: "Type your email exactly to confirm." } };
  }

  await db.delete(users).where(eq(users.id, session.user.id));

  await signOut({ redirectTo: localizedPath(locale, "/") });
  return {}; // unreachable — signOut's redirect throws — but keeps the return type honest
}
