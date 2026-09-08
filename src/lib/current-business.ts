import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolves the signed-in user's business. The data model supports multiple
 * businesses per user (spec §21), but this MVP's UI always operates on the
 * first/only one — a business is created automatically at registration, so
 * this should never be missing for a logged-in user.
 */
export async function requireBusiness() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .limit(1);

  if (!business) {
    redirect("/login");
  }

  return { session, business };
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}
