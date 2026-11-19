import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    service: "sesh-api",
  }));

  app.get("/ready", async () => ({
    status: "ready",
    service: "sesh-api",
  }));
}
