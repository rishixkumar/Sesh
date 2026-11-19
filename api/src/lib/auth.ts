import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "./errors.js";

export type AuthUser = {
  id: string;
  schoolId?: string;
};

declare module "fastify" {
  interface FastifyRequest {
    authUser: AuthUser | null;
  }
}

/**
 * Authentication is intentionally fail-closed until a trusted mode is configured.
 * Public routes should not use this hook.
 */
export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const { AUTH_MODE } = request.server.config;

  if (AUTH_MODE === "disabled") {
    throw new AppError(
      "UNAUTHENTICATED",
      "Authentication is not available in the current configuration.",
    );
  }

  if (!request.authUser) {
    throw new AppError(
      "UNAUTHENTICATED",
      "Authentication is required for this resource.",
    );
  }
}
