import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Two suites, separated by what they need rather than by what they test.
 *
 * `tests/unit` is pure: schemas, formatters, permission tables. It runs
 * anywhere, in milliseconds, and needs no database at all.
 *
 * `tests/integration` drives the real Server Actions against a real Postgres,
 * because the defects worth catching in this app — a stock-out race, a payment
 * that exceeds its order — only exist once a database is involved. Those tests
 * skip themselves, loudly, when no test database can be reached.
 */

/*
 * Resolved here rather than in `test.env` because the global setup runs in this
 * process, before workers exist, and needs the same value. Pointing the app's
 * own `db` module at the test database matters: without it the suite would
 * truncate whatever `DATABASE_URL` happens to be — which, run locally, is the
 * developer's working data.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://localhost:5432/farm_app_test";

process.env.DATABASE_URL = TEST_DATABASE_URL;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/setup/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // A shared database cannot take parallel writers truncating under it.
    fileParallelism: false,
    globalSetup: ["tests/setup/global.ts"],
    setupFiles: ["tests/setup/next-mocks.ts"],
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      SESSION_IDLE_MINUTES: "60",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/db/seed.ts", "lib/db/reset.ts", "lib/db/migrations/**"],
      reporter: ["text-summary", "html"],
    },
  },
});
