"use server";

import { db } from "@/db";
import { users, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import { signIn } from "@/lib/auth";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    businessName: formData.get("businessName"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password, businessName } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists" } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ name, email: normalizedEmail, passwordHash })
      .returning({ id: users.id });

    await tx.insert(businesses).values({
      userId: user.id,
      businessName,
      taxYear: new Date().getFullYear(),
      businessType: "sole_prop",
      filingStatus: "single",
      isSCorp: false,
      beginningBankBalance: "0",
      homeOfficeUsed: false,
    });
  });

  await signIn("credentials", {
    email: normalizedEmail,
    password,
    redirectTo: "/dashboard",
  });

  return {};
}
