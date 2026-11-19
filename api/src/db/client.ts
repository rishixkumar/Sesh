import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import * as schema from "./schema/index.js";

export type Database = PostgresJsDatabase<typeof schema>;

export type DbHandle = {
  db: Database;
  sql: Sql;
  /** Lightweight connectivity probe used by `/ready`. */
  ping: () => Promise<void>;
  close: () => Promise<void>;
};

export type CreateDbOptions = {
  /** Max connections in the postgres.js pool (default 10). */
  max?: number;
  /** Idle connection timeout in seconds (default 20). */
  idle_timeout?: number;
  /** Connect timeout in seconds (default 5). */
  connect_timeout?: number;
};

/**
 * Create a Drizzle client backed by postgres.js.
 * Connections are established lazily on first query.
 */
export function createDb(
  connectionString: string,
  options: CreateDbOptions = {},
): DbHandle {
  const sql = postgres(connectionString, {
    max: options.max ?? 10,
    idle_timeout: options.idle_timeout ?? 20,
    connect_timeout: options.connect_timeout ?? 5,
    // Prefer named prepared statements off for short-lived serverless-style
    // connections; fine for local/dev pool as well.
    prepare: false,
  });

  const db = drizzle(sql, { schema });

  return {
    db,
    sql,
    ping: async () => {
      await sql`select 1`;
    },
    close: async () => {
      await sql.end({ timeout: 5 });
    },
  };
}
