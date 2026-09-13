"use server";

import { randomBytes, createHash } from "crypto";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";
import { sendSystemEmail } from "@/lib/email";
import { passwordResetRequestEmail, googleOnlyAccountEmail, passwordChangedEmail } from "@/lib/email-templates";
import type { ActionState } from "@/lib/actions/auth-actions";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0]?.message ?? "Enter a valid email address" } };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always report success, whether or not the account exists (or has a
  // password), so this form can't be used to check which emails are
  // registered. The two branches below both send *something* when the
  // account is real -- neither leaks anything to the requester either way.
  if (user && !user.passwordHash) {
    await sendSystemEmail({ to: user.email, ...googleOnlyAccountEmail() });
  } else if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    const resetUrl = `https://bookkeeply.me/reset-password?token=${rawToken}`;
    await sendSystemEmail({ to: user.email, ...passwordResetRequestEmail(resetUrl) });
  }

  return { success: true };
}

export async function resetPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id));
  });

  const [user] = await db.select().from(users).where(eq(users.id, record.userId)).limit(1);
  if (user) {
    await sendSystemEmail({ to: user.email, ...passwordChangedEmail() });
  }

  return { success: true };
}
