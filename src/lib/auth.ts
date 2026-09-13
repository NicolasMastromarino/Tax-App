import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase().trim()))
          .limit(1);

        // No password on file means this account has only ever signed in
        // with Google -- reject rather than compare against nothing.
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    Google,
  ],
  callbacks: {
    // Google verifies the email address itself, so a Google sign-in is
    // linked by email to whatever account (credentials or an earlier
    // Google sign-in) already owns that address -- one account either way,
    // not a separate Google-only identity. A first-time Google sign-in
    // creates the same user + business pair registerAction creates for a
    // credentials sign-up (business name left at its schema default,
    // "My Business", since there's no registration form to collect one
    // from); passwordHash stays null since there's nothing to hash.
    signIn: async ({ user, account }) => {
      if (account?.provider !== "google") return true;
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing) {
        user.id = existing.id;
        return true;
      }

      await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({ name: user.name ?? email, email })
          .returning({ id: users.id });

        await tx.insert(businesses).values({
          userId: created.id,
          taxYear: new Date().getFullYear(),
          businessType: "sole_prop",
          filingStatus: "single",
          isSCorp: false,
          beginningBankBalance: "0",
          homeOfficeUsed: false,
        });

        user.id = created.id;
      });

      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
});
