import { sql } from "drizzle-orm";

import { db, pool } from "./index";

/**
 * Truncates every application table and restarts identity sequences, so a
 * reseed produces the same IDs each time. Migration bookkeeping is left alone.
 */
export const TABLES = [
  "notification_preferences",
  "notifications",
  "reports",
  "tasks",
  "expenses",
  "deliveries",
  "payments",
  "order_events",
  "order_items",
  "orders",
  "customers",
  "products",
  "inventory_movements",
  "inventory_items",
  "suppliers",
  "vaccinations",
  "health_events",
  "egg_collections",
  "weight_records",
  "mortality_records",
  "daily_records",
  "house_readings",
  "flocks",
  "houses",
  "farm_settings",
  "login_attempts",
  "sessions",
  "users",
] as const;

export async function resetDatabase() {
  await db.execute(
    sql.raw(
      `truncate table ${TABLES.map((table) => `"${table}"`).join(", ")} restart identity cascade`,
    ),
  );
}

if (process.argv[1]?.includes("reset")) {
  resetDatabase()
    .then(() => console.log(`Cleared ${TABLES.length} tables.`))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
