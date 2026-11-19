import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { resolveTestAuthUser, TEST_USER_HEADER } from "../lib/auth.js";
import { AppError } from "../lib/errors.js";

/**
 * Establishes request.authUser before any route handler.
 *
 * Feature agents register routes after this plugin. They must not replace it
 * or read X-Sesh-Test-User-Id themselves. Campus is the user's primary school.
 * X-Sesh-Test-School-Id is intentionally ignored.
 */
async function authPlugin(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request) => {
    request.authUser = null;

    const { AUTH_MODE, NODE_ENV } = request.server.config;
    if (AUTH_MODE !== "test" || NODE_ENV === "production") {
      return;
    }

    const header = request.headers[TEST_USER_HEADER];
    if (header === undefined) {
      return;
    }

    if (Array.isArray(header) || header.trim().length === 0) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required for this resource.",
      );
    }

    const authUser = await resolveTestAuthUser(request.server.db, header);
    if (!authUser) {
      throw new AppError(
        "UNAUTHENTICATED",
        "Authentication is required for this resource.",
      );
    }

    request.authUser = authUser;
  });
}

export default fp(authPlugin, {
  name: "sesh-auth",
  dependencies: ["sesh-errors"],
});
