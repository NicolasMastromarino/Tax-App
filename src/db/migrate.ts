// Applies SQL migrations from ./drizzle to the database at DATABASE_URL.
// Use this for production deploys; `drizzle-kit push` (used in local dev)
// syncs the schema directly without a migration history.
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in this shell session.");
  }
  // Log only the host/db name (never the password) so it's obvious which
  // database this run actually targeted — this printed line is the proof.
  const safeTarget = url.replace(/:\/\/([^:]+):[^@]+@/, "://$1:***@");
  console.log("Connecting to:", safeTarget);

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
