/**
 * Database module entrypoint.
 *
 * Re-exports the authoritative Drizzle schema and the connection helper.
 */
export * from "./schema/index.js";
export { createDb, type Database, type DbHandle, type CreateDbOptions } from "./client.js";
