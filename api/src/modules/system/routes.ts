import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { requireAuth } from "../../lib/auth.js";
import { parseOrThrow } from "../../lib/validate.js";

const echoBodySchema = z.object({
  message: z.string().min(1).max(200),
});

/**
 * Minimal /v1 routes that establish versioned API conventions for later phases.
 * Echo and protected probe endpoints exist for validation and auth fail-closed tests.
 */
export async function systemRoutes(app: FastifyInstance): Promise<void> {
  app.post("/echo", async (request) => {
    const body = parseOrThrow(echoBodySchema, request.body);
    return {
      message: body.message,
      receivedAt: new Date().toISOString(),
    };
  });

  app.get(
    "/protected",
    { preHandler: requireAuth },
    async (request) => ({
      userId: request.authUser?.id ?? null,
    }),
  );
}
