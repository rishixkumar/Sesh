import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";

import type { Database } from "../db/client.js";
import { users } from "../db/schema/users.js";
import { AppError } from "./errors.js";

export const TEST_USER_HEADER = "x-sesh-test-user-id";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AuthUser = {
  id: string;
  schoolId: string;
};

declare module "fastify" {
  interface FastifyRequest {
    authUser: AuthUser | null;
  }
}

/**
 * Load an ACTIVE user and their primary school.
 * Returns null when the id is not a UUID, the database is unavailable,
 * the user does not exist, the account is not ACTIVE, or primary school is unset.
 * Never reads school id from a request body or header.
 */
export async function resolveTestAuthUser(
  db: Database | null,
  rawUserId: string,
): Promise<AuthUser | null> {
  const userId = rawUserId.trim();
  if (db == null || !UUID_PATTERN.test(userId)) {
    return null;
  }

  const [row] = await db
    .select({
      id: users.id,
      status: users.status,
      primarySchoolId: users.primarySchoolId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || row.status !== "ACTIVE" || !row.primarySchoolId) {
    return null;
  }

  return {
    id: row.id,
    schoolId: row.primarySchoolId,
  };
}

/**
 * Authentication is fail-closed unless AUTH_MODE=test has already
 * populated request.authUser from the database.
 * Public routes should not use this hook.
 */
export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const { AUTH_MODE } = request.server.config;

  if (AUTH_MODE === "disabled" || AUTH_MODE === "managed") {
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
