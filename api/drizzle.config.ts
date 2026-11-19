import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for future migration generation.
 *
 * DO NOT run `drizzle-kit generate` / `migrate` / `push` until the managing
 * agent approves `src/db/schema/` (see SCHEMA_NOTES.md).
 *
 * Migrations agent owns: enabling PostGIS, generating SQL under
 * `src/db/migrations/`, Docker Compose, and DATABASE_URL wiring.
 */
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Placeholder — migrations agent must wire real credentials via env.
    url: process.env.DATABASE_URL ?? "postgres://sesh:sesh@127.0.0.1:5432/sesh",
  },
  strict: true,
  verbose: true,
});
