import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __pgPool: Pool | undefined;
}

// Temporary diagnostic: log only the host/username (never the password) so
// we can confirm which database this deployment is actually targeting.
// Safe to remove once the production DB mismatch is confirmed fixed.
if (process.env.DATABASE_URL) {
  const safeTarget = process.env.DATABASE_URL.replace(
    /:\/\/([^:]+):[^@]+@/,
    "://$1:***@"
  );
  console.log("[db] Connecting to:", safeTarget);
} else {
  console.log("[db] DATABASE_URL is not set at runtime.");
}

const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export const db = drizzle(pool, { schema });
