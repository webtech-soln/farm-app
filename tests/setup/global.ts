import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { Pool } from "pg";

const run = promisify(execFile);

/** Set when the database could not be prepared, so integration tests can skip. */
export const INTEGRATION_FLAG = "FARM_TEST_DB_READY";

/**
 * Creates the test database if it is missing and brings it up to the current
 * migration, once per run.
 *
 * A missing or unreachable Postgres is not treated as a failure: the unit
 * suite has no use for one, and a contributor should be able to run it without
 * standing up a server. The integration tests read the flag this sets and skip
 * themselves with a visible message instead of failing obscurely.
 */
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL was not set by the Vitest config.");

  const database = new URL(url).pathname.slice(1);
  const admin = new URL(url);
  admin.pathname = "/postgres";

  const pool = new Pool({
    connectionString: admin.toString(),
    connectionTimeoutMillis: 3_000,
  });

  try {
    const { rows } = await pool.query(
      "select 1 from pg_database where datname = $1",
      [database],
    );
    if (rows.length === 0) {
      // Identifiers cannot be bound; this one comes from our own config.
      await pool.query(`create database "${database.replace(/"/g, '""')}"`);
      console.log(`[tests] created database ${database}`);
    }
  } catch (error) {
    console.warn(
      `\n[tests] no test database reachable (${(error as Error).message}).` +
        `\n[tests] unit tests will run; integration tests will skip.` +
        `\n[tests] set TEST_DATABASE_URL to enable them.\n`,
    );
    process.env[INTEGRATION_FLAG] = "false";
    return;
  } finally {
    await pool.end();
  }

  await run(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "migrate"], {
    env: { ...process.env, DATABASE_URL: url },
  });

  process.env[INTEGRATION_FLAG] = "true";
  console.log(`[tests] ${database} ready`);
}
