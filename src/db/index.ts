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

// Cached on `global` in every environment, production included: each
// serverless function instance is reused across invocations while warm, so
// caching here means those invocations share one small pool instead of
// each opening its own. Without this, a warm instance handling back-to-back
// requests would open a fresh pool (and thus fresh connections) every time,
// which is exactly what exhausted Supabase's pooler connection limit
// (EMAXCONNSESSION) in production. `max` is kept low and conservative since
// many concurrent serverless instances can each hold a pool at once.
const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

global.__pgPool = pool;

export const db = drizzle(pool, { schema });
