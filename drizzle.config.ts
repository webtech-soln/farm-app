import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit runs outside Next.js, so it does not get `.env` loaded for it.
 * `--env-file=.env` is passed by the npm scripts in package.json.
 */
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.DATABASE_SSL === "true" ? "require" : false,
  },
  strict: true,
  verbose: true,
});
