import "dotenv/config";

import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for versioned SQL migrations (MS3 §2.6).
 *
 * Prefer `npm run db:generate` / `npm run db:migrate` over `drizzle-kit push`.
 */
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://sesh:sesh@127.0.0.1:5433/sesh",
  },
  strict: true,
  verbose: true,
});
