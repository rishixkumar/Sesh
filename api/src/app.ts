import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

import { type Env, loadEnv } from "./config/env.js";
import { createDb, type Database, type DbHandle } from "./db/client.js";
import { healthRoutes } from "./modules/health/routes.js";
import { systemRoutes } from "./modules/system/routes.js";
import corsPlugin from "./plugins/cors.js";
import errorsPlugin from "./plugins/errors.js";
import securityPlugin from "./plugins/security.js";

declare module "fastify" {
  interface FastifyInstance {
    config: Env;
    db: Database;
    dbHandle: DbHandle;
    checkDatabase: () => Promise<void>;
  }
}

export type BuildAppOptions = {
  env?: Record<string, unknown>;
  logger?: boolean | object;
  /**
   * Override the readiness DB probe (unit tests).
   * When omitted, probes the real postgres connection from DATABASE_URL.
   */
  checkDatabase?: () => Promise<void>;
  /**
   * Skip opening a real postgres pool (unit tests that inject checkDatabase).
   * Production / integration paths should leave this false.
   */
  skipDb?: boolean;
};

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const config = loadEnv({
    ...process.env,
    ...(options.env ?? {}),
  });

  const app = Fastify({
    logger:
      options.logger === undefined
        ? {
            level: config.LOG_LEVEL,
          }
        : options.logger,
    genReqId: (request) => {
      const header = request.headers["x-request-id"];
      if (typeof header === "string" && header.length > 0) {
        return header;
      }
      return randomUUID();
    },
    requestIdHeader: "x-request-id",
    bodyLimit: 1_048_576,
    trustProxy: false,
  });

  app.decorate("config", config);

  const skipDb = options.skipDb === true;
  const dbHandle = skipDb
    ? null
    : createDb(config.DATABASE_URL, {
        // Keep test/dev pools small; production can raise via future config.
        max: config.NODE_ENV === "test" ? 2 : 10,
      });

  if (dbHandle) {
    app.decorate("dbHandle", dbHandle);
    app.decorate("db", dbHandle.db);
    app.addHook("onClose", async () => {
      await dbHandle.close();
    });
  } else {
    // Minimal stubs so decorated properties exist for typed access in tests.
    const unavailable = async (): Promise<never> => {
      throw new Error("Database client was not initialized (skipDb=true)");
    };
    app.decorate("dbHandle", {
      db: null as unknown as Database,
      sql: null as unknown as DbHandle["sql"],
      ping: unavailable,
      close: async () => undefined,
    });
    app.decorate("db", null as unknown as Database);
  }

  const checkDatabase =
    options.checkDatabase ??
    (dbHandle
      ? () => dbHandle.ping()
      : async () => {
          throw new Error("Database client was not initialized (skipDb=true)");
        });

  app.decorate("checkDatabase", checkDatabase);

  await app.register(errorsPlugin);
  await app.register(securityPlugin);
  await app.register(corsPlugin);

  await app.register(healthRoutes);

  await app.register(systemRoutes, { prefix: "/v1" });

  return app;
}
