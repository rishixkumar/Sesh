/**
 * Database module entrypoint.
 *
 * Phase 2 schema-only: re-exports the authoritative Drizzle schema.
 * Client (`drizzle(...)`), connection pool, and readiness probes are owned by
 * the migrations / DB foundation follow-up after schema approval.
 */
export * from "./schema/index.js";
