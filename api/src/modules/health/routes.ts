import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    service: "sesh-api",
  }));

  app.get("/ready", async (_request, reply) => {
    try {
      await app.checkDatabase();
      return {
        status: "ready",
        service: "sesh-api",
      };
    } catch {
      return reply.code(503).send({
        status: "not_ready",
        service: "sesh-api",
      });
    }
  });
}
