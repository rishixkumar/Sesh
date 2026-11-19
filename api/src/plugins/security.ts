import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function securityPlugin(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
  });

  app.addHook("onRequest", async (request) => {
    request.authUser = null;
  });
}

export default fp(securityPlugin, {
  name: "sesh-security",
});
