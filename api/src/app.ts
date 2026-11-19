import Fastify, { type FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

import { type Env, loadEnv } from "./config/env.js";
import { healthRoutes } from "./modules/health/routes.js";
import { systemRoutes } from "./modules/system/routes.js";
import corsPlugin from "./plugins/cors.js";
import errorsPlugin from "./plugins/errors.js";
import securityPlugin from "./plugins/security.js";

declare module "fastify" {
  interface FastifyInstance {
    config: Env;
  }
}

export type BuildAppOptions = {
  env?: Record<string, unknown>;
  logger?: boolean | object;
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

  await app.register(errorsPlugin);
  await app.register(securityPlugin);
  await app.register(corsPlugin);

  await app.register(healthRoutes);

  await app.register(systemRoutes, { prefix: "/v1" });

  return app;
}
