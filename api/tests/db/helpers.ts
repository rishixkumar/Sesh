/**
 * Shared helpers for Phase 2 database integration tests.
 *
 * Requires the separate PostGIS test database (`sesh_test` on port 5433).
 *
 *   DATABASE_URL_TEST=postgres://sesh:sesh@127.0.0.1:5433/sesh_test \
 *     npm test -- --project db
 *
 * Suites skip when DATABASE_URL_TEST / TEST_DATABASE_URL is unset or
 * migrations are missing, so unit `npm test` stays green without Docker.
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe } from "vitest";
import {
  createDb,
  events,
  moveGroupJoinRequests,
  moveGroupMembers,
  moveGroups,
  schools,
  users,
  venues,
  type Database,
  type DbHandle,
} from "../../src/db/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const migrationsFolder = path.resolve(
  __dirname,
  "../../src/db/migrations",
);

export const seedsFolder = path.resolve(__dirname, "../../src/db/seeds");

export type TestDb = Database;
export type TestSql = DbHandle["sql"];

export type DbHarness = {
  sql: TestSql;
  db: TestDb;
  url: string;
  close: () => Promise<void>;
};

/** Prefer DATABASE_URL_TEST / TEST_DATABASE_URL; never fall back to the dev DB. */
export function resolveTestDatabaseUrl(): string | undefined {
  const explicit =
    process.env.DATABASE_URL_TEST?.trim() ||
    process.env.TEST_DATABASE_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const fallback = process.env.DATABASE_URL?.trim();
  if (!fallback) {
    return undefined;
  }

  if (/(_test|\/test\b|sesh_test)/i.test(fallback)) {
    return fallback;
  }

  return undefined;
}

export function hasSqlMigrations(): boolean {
  if (!existsSync(migrationsFolder)) {
    return false;
  }
  return readdirSync(migrationsFolder).some((name) => name.endsWith(".sql"));
}

export function hasSeedModules(): boolean {
  if (!existsSync(seedsFolder)) {
    return false;
  }
  return readdirSync(seedsFolder).some(
    (name) =>
      (name.endsWith(".ts") || name.endsWith(".js")) && name !== ".gitkeep",
  );
}

export function isDbIntegrationEnabled(): boolean {
  if (process.env.RUN_DB_TESTS === "0") {
    return false;
  }
  return Boolean(resolveTestDatabaseUrl()) && hasSqlMigrations();
}

export const describeDb = isDbIntegrationEnabled()
  ? describe
  : describe.skip;

export async function createHarness(): Promise<DbHarness> {
  const url = resolveTestDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL_TEST (or TEST_DATABASE_URL) is required for " +
        "database integration tests.",
    );
  }

  const handle = createDb(url, { max: 1, connect_timeout: 10 });
  return {
    sql: handle.sql,
    db: handle.db,
    url,
    close: handle.close,
  };
}

/** Serialize migrate across callers (CREATE EXTENSION races otherwise). */
const MIGRATE_LOCK_KEY = 728_150_01;

export async function migrateHarness(harness: DbHarness): Promise<void> {
  if (!hasSqlMigrations()) {
    throw new Error(
      `No SQL migrations found under ${migrationsFolder}. ` +
        "Wait for the migrations agent to generate them.",
    );
  }
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");

  await harness.sql`SELECT pg_advisory_lock(${MIGRATE_LOCK_KEY})`;
  try {
    await migrate(harness.db, { migrationsFolder });
  } finally {
    await harness.sql`SELECT pg_advisory_unlock(${MIGRATE_LOCK_KEY})`;
  }
}

/** Truncate all app tables between tests (keeps extensions / schema). */
export async function resetData(harness: DbHarness): Promise<void> {
  await harness.sql`
    TRUNCATE TABLE
      audit_logs,
      blocks,
      friendships,
      move_group_invites,
      move_group_join_requests,
      move_group_members,
      move_groups,
      event_saves,
      event_responses,
      event_audience_members,
      events,
      venues,
      external_auth_identities,
      consent_records,
      school_affiliations,
      user_profiles,
      users,
      schools
    RESTART IDENTITY CASCADE
  `;
}

export async function closeHarness(harness: DbHarness): Promise<void> {
  await harness.close();
}

export function isPgError(
  error: unknown,
): error is { code: string; constraint?: string; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/** Unwrap Drizzle "Failed query" Error.cause to the underlying PostgresError. */
export function unwrapPgError(error: unknown): {
  code: string;
  constraint?: string;
  message: string;
} | null {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (isPgError(current)) {
      return current;
    }
    if (current instanceof Error && current.cause) {
      current = current.cause;
      continue;
    }
    break;
  }
  return null;
}

export async function expectPgError(
  action: () => Promise<unknown>,
  expectedCode: string,
  constraintSubstring?: string,
): Promise<void> {
  try {
    await action();
    throw new Error(
      `Expected Postgres error ${expectedCode}${
        constraintSubstring ? ` (${constraintSubstring})` : ""
      }, but the operation succeeded`,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Expected Postgres error")
    ) {
      throw error;
    }
    const pgError = unwrapPgError(error);
    if (!pgError) {
      throw error;
    }
    if (pgError.code !== expectedCode) {
      throw new Error(
        `Expected SQLSTATE ${expectedCode}, got ${pgError.code}: ${pgError.message}`,
        { cause: error },
      );
    }
    if (
      constraintSubstring &&
      !(
        pgError.constraint?.includes(constraintSubstring) ||
        pgError.message.includes(constraintSubstring)
      )
    ) {
      throw new Error(
        `Expected constraint mentioning "${constraintSubstring}", got constraint=${
          pgError.constraint ?? "(none)"
        } message=${pgError.message}`,
        { cause: error },
      );
    }
  }
}

export async function insertSchool(
  db: TestDb,
  overrides: Partial<typeof schools.$inferInsert> = {},
) {
  const [row] = await db
    .insert(schools)
    .values({
      slug: overrides.slug ?? `school-${crypto.randomUUID().slice(0, 8)}`,
      name: overrides.name ?? `School ${crypto.randomUUID().slice(0, 8)}`,
      shortName: overrides.shortName ?? "TST",
      areaLabel: overrides.areaLabel ?? "Test Area",
      timezone: overrides.timezone ?? "America/New_York",
      ...overrides,
    })
    .returning();
  return row;
}

export async function insertUser(
  db: TestDb,
  overrides: Partial<typeof users.$inferInsert> = {},
) {
  const suffix = crypto.randomUUID().slice(0, 8);
  const [row] = await db
    .insert(users)
    .values({
      email: overrides.email ?? `user-${suffix}@example.com`,
      username: overrides.username ?? `user_${suffix}`,
      status: overrides.status ?? "ACTIVE",
      primarySchoolId: overrides.primarySchoolId,
      ...overrides,
    })
    .returning();
  return row;
}

export async function insertVenue(
  db: TestDb,
  input: {
    schoolId: string;
  } & Partial<typeof venues.$inferInsert>,
) {
  const [row] = await db
    .insert(venues)
    .values({
      schoolId: input.schoolId,
      name: input.name ?? "Test Venue",
      publicDisplayLocation: input.publicDisplayLocation ?? "Somewhere",
      privateAddress: input.privateAddress,
      location: input.location,
    })
    .returning();
  return row;
}

export async function insertEvent(
  db: TestDb,
  input: {
    schoolId: string;
    hostId: string;
  } & Partial<typeof events.$inferInsert>,
) {
  const startAt = input.startAt ?? new Date("2030-01-01T20:00:00.000Z");
  const endAt =
    input.endAt ?? new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

  const [row] = await db
    .insert(events)
    .values({
      schoolId: input.schoolId,
      hostId: input.hostId,
      venueId: input.venueId,
      title: input.title ?? "Test Event",
      description: input.description ?? "A fictional test event.",
      category: input.category ?? "Other",
      startAt,
      endAt,
      venueName: input.venueName ?? "Test Hall",
      publicDisplayLocation: input.publicDisplayLocation ?? "Campus",
      privateAddress: input.privateAddress,
      addressPrivacy: input.addressPrivacy ?? "PUBLIC_VENUE",
      visibility: input.visibility ?? "PUBLIC",
      status: input.status ?? "PUBLISHED",
      coverImageUrl: input.coverImageUrl,
      capacity: input.capacity,
      admissionIsFree: input.admissionIsFree ?? true,
      admissionPriceLabel: input.admissionPriceLabel,
      admissionAmountUsd: input.admissionAmountUsd,
      location: input.location,
    })
    .returning();
  return row;
}

export async function insertMoveGroup(
  db: TestDb,
  input: {
    eventId: string;
    schoolId: string;
    creatorId: string;
  } & Partial<typeof moveGroups.$inferInsert>,
) {
  const [row] = await db
    .insert(moveGroups)
    .values({
      eventId: input.eventId,
      schoolId: input.schoolId,
      creatorId: input.creatorId,
      name: input.name ?? "Test Move Group",
      note: input.note ?? "",
      capacity: input.capacity ?? 4,
      discoverability: input.discoverability ?? "PUBLIC",
      joinMode: input.joinMode ?? "REQUEST_TO_JOIN",
      meetupTime:
        input.meetupTime ?? new Date("2030-01-01T19:30:00.000Z"),
      meetupSpot: input.meetupSpot ?? "Front steps",
      meetupLocation: input.meetupLocation,
      externalChatLink: input.externalChatLink,
      status: input.status ?? "ACTIVE",
    })
    .returning();
  return row;
}

export async function insertActiveMember(
  db: TestDb,
  input: {
    moveGroupId: string;
    userId: string;
  } & Partial<typeof moveGroupMembers.$inferInsert>,
) {
  const [row] = await db
    .insert(moveGroupMembers)
    .values({
      moveGroupId: input.moveGroupId,
      userId: input.userId,
      role: input.role ?? "MEMBER",
      leftAt: input.leftAt ?? null,
    })
    .returning();
  return row;
}

export async function insertJoinRequest(
  db: TestDb,
  input: {
    moveGroupId: string;
    userId: string;
  } & Partial<typeof moveGroupJoinRequests.$inferInsert>,
) {
  const [row] = await db
    .insert(moveGroupJoinRequests)
    .values({
      moveGroupId: input.moveGroupId,
      userId: input.userId,
      status: input.status ?? "PENDING",
      note: input.note,
      decidedByUserId: input.decidedByUserId,
      decidedAt: input.decidedAt,
    })
    .returning();
  return row;
}
