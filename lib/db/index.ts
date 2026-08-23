import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * `pg` hands back `numeric`/`bigint` columns as strings to avoid precision
 * loss. Every numeric column in this schema is an `integer` or
 * `double precision`, so parsing counts returned by `count(*)` (OID 20) as a
 * JS number is safe and keeps call sites free of `Number(...)` noise.
 */
import pgTypes from "pg";
pgTypes.types.setTypeParser(pgTypes.types.builtins.INT8, (value) =>
  Number.parseInt(value, 10),
);

function connectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at your PostgreSQL instance.",
    );
  }
  return url;
}

/**
 * Next.js recreates modules on every hot reload in development, which would
 * leak a connection pool per reload. Caching the pool on `globalThis` keeps a
 * single pool alive across reloads.
 */
const globalForDb = globalThis as unknown as { farmPool?: Pool };

export const pool =
  globalForDb.farmPool ??
  new Pool({
    connectionString: connectionString(),
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.farmPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;

export { schema };
