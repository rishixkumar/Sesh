/**
 * Phase 2 database integration suite (single file to avoid cross-file
 * migrate/truncate deadlocks under Vitest parallelism).
 */
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { applySeeds } from "../../src/db/seeds/apply.js";
import { SEED_SCHOOL_ID, SEED_USER_IDS } from "../../src/db/seeds/ids.js";
import {
  closeHarness,
  createHarness,
  describeDb,
  expectPgError,
  hasSeedModules,
  insertActiveMember,
  insertEvent,
  insertJoinRequest,
  insertMoveGroup,
  insertSchool,
  insertUser,
  insertVenue,
  migrateHarness,
  resetData,
  type DbHarness,
} from "./helpers.js";

// Seeds load dotenv — import lazily inside the seed smoke test so the
// describeDb skip gate is not forced on by api/.env during unit-only runs.

describeDb("Phase 2 database integration", () => {
  let harness: DbHarness;

  beforeAll(async () => {
    harness = await createHarness();
    await migrateHarness(harness);
  }, 60_000);

  beforeEach(async () => {
    await resetData(harness);
  });

  afterAll(async () => {
    if (harness) {
      await closeHarness(harness);
    }
  });

  // --- Migrations ---

  it("has core tables after migrate", async () => {
    const tables = await harness.sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const names = tables.map((row) => String(row.table_name));
    expect(names).toEqual(
      expect.arrayContaining([
        "schools",
        "users",
        "user_profiles",
        "school_affiliations",
        "venues",
        "events",
        "move_groups",
        "move_group_members",
        "move_group_join_requests",
        "friendships",
        "blocks",
        "audit_logs",
      ]),
    );
  });

  it("migrate is idempotent", async () => {
    await migrateHarness(harness);
    const [{ count }] = await harness.sql`
      SELECT count(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'events'
    `;
    expect(count).toBe(1);
  });

  // --- Constraints (MS3 §2.4) ---

  it("rejects duplicate emails case-insensitively", async () => {
    await insertUser(harness.db, {
      email: "Alice@Example.com",
      username: "alice_one",
    });

    await expectPgError(
      () =>
        insertUser(harness.db, {
          email: "alice@example.com",
          username: "alice_two",
        }),
      "23505",
      "users_email_ci_unique",
    );
  });

  it("rejects duplicate usernames case-insensitively", async () => {
    await insertUser(harness.db, {
      email: "one@example.com",
      username: "BuzzBuzz",
    });

    await expectPgError(
      () =>
        insertUser(harness.db, {
          email: "two@example.com",
          username: "buzzbuzz",
        }),
      "23505",
      "users_username_ci_unique",
    );
  });

  it("rejects events where end_at is not after start_at", async () => {
    const school = await insertSchool(harness.db);
    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const startAt = new Date("2030-06-01T22:00:00.000Z");

    await expectPgError(
      () =>
        insertEvent(harness.db, {
          schoolId: school.id,
          hostId: host.id,
          startAt,
          endAt: startAt,
        }),
      "23514",
      "events_end_after_start",
    );

    await expectPgError(
      () =>
        insertEvent(harness.db, {
          schoolId: school.id,
          hostId: host.id,
          startAt,
          endAt: new Date(startAt.getTime() - 60_000),
        }),
      "23514",
      "events_end_after_start",
    );
  });

  it("rejects non-positive event capacity", async () => {
    const school = await insertSchool(harness.db);
    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });

    await expectPgError(
      () =>
        insertEvent(harness.db, {
          schoolId: school.id,
          hostId: host.id,
          capacity: 0,
        }),
      "23514",
      "events_capacity_positive",
    );

    await expectPgError(
      () =>
        insertEvent(harness.db, {
          schoolId: school.id,
          hostId: host.id,
          capacity: -3,
        }),
      "23514",
      "events_capacity_positive",
    );
  });

  it("rejects move group capacity below 2", async () => {
    const school = await insertSchool(harness.db);
    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const event = await insertEvent(harness.db, {
      schoolId: school.id,
      hostId: host.id,
    });

    await expectPgError(
      () =>
        insertMoveGroup(harness.db, {
          eventId: event.id,
          schoolId: school.id,
          creatorId: host.id,
          capacity: 1,
        }),
      "23514",
      "move_groups_capacity",
    );
  });

  it("rejects duplicate active move group memberships", async () => {
    const school = await insertSchool(harness.db);
    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const member = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const event = await insertEvent(harness.db, {
      schoolId: school.id,
      hostId: host.id,
    });
    const group = await insertMoveGroup(harness.db, {
      eventId: event.id,
      schoolId: school.id,
      creatorId: host.id,
    });

    await insertActiveMember(harness.db, {
      moveGroupId: group.id,
      userId: member.id,
    });

    await expectPgError(
      () =>
        insertActiveMember(harness.db, {
          moveGroupId: group.id,
          userId: member.id,
        }),
      "23505",
      "move_group_members_active_unique",
    );
  });

  it("allows re-joining after leaving (active unique is partial)", async () => {
    const school = await insertSchool(harness.db);
    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const member = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const event = await insertEvent(harness.db, {
      schoolId: school.id,
      hostId: host.id,
    });
    const group = await insertMoveGroup(harness.db, {
      eventId: event.id,
      schoolId: school.id,
      creatorId: host.id,
    });

    await insertActiveMember(harness.db, {
      moveGroupId: group.id,
      userId: member.id,
      leftAt: new Date("2030-01-02T00:00:00.000Z"),
    });

    const active = await insertActiveMember(harness.db, {
      moveGroupId: group.id,
      userId: member.id,
      leftAt: null,
    });
    expect(active.leftAt).toBeNull();
  });

  it("rejects duplicate pending join requests", async () => {
    const school = await insertSchool(harness.db);
    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const requester = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const event = await insertEvent(harness.db, {
      schoolId: school.id,
      hostId: host.id,
    });
    const group = await insertMoveGroup(harness.db, {
      eventId: event.id,
      schoolId: school.id,
      creatorId: host.id,
    });

    await insertJoinRequest(harness.db, {
      moveGroupId: group.id,
      userId: requester.id,
      status: "PENDING",
    });

    await expectPgError(
      () =>
        insertJoinRequest(harness.db, {
          moveGroupId: group.id,
          userId: requester.id,
          status: "PENDING",
        }),
      "23505",
      "move_group_join_requests_pending_unique",
    );
  });

  it("rejects foreign key violations", async () => {
    const missingSchoolId = "00000000-0000-4000-8000-000000000001";
    const missingUserId = "00000000-0000-4000-8000-000000000002";

    await expectPgError(
      () =>
        insertUser(harness.db, {
          primarySchoolId: missingSchoolId,
        }),
      "23503",
    );

    const school = await insertSchool(harness.db);
    await expectPgError(
      () =>
        insertEvent(harness.db, {
          schoolId: school.id,
          hostId: missingUserId,
        }),
      "23503",
    );

    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    await expectPgError(
      () =>
        insertEvent(harness.db, {
          schoolId: missingSchoolId,
          hostId: host.id,
        }),
      "23503",
    );
  });

  // --- Campus isolation (MS3 §2.3) ---

  it("requires NOT NULL school_id on campus-scoped tables", async () => {
    const columns = await harness.sql`
      SELECT table_name, column_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'school_id'
        AND table_name IN (
          'venues',
          'events',
          'move_groups',
          'school_affiliations'
        )
      ORDER BY table_name
    `;

    expect(columns.length).toBe(4);
    for (const col of columns) {
      expect(col.is_nullable).toBe("NO");
    }
  });

  it("rejects inserts missing school_id on venues, events, and move groups", async () => {
    const school = await insertSchool(harness.db);
    const host = await insertUser(harness.db, {
      primarySchoolId: school.id,
    });
    const event = await insertEvent(harness.db, {
      schoolId: school.id,
      hostId: host.id,
    });

    await expectPgError(
      () =>
        harness.sql`
          INSERT INTO venues (name, public_display_location)
          VALUES ('No Campus Venue', 'Nowhere')
        `,
      "23502",
    );

    await expectPgError(
      () =>
        harness.sql`
          INSERT INTO events (
            host_id, title, description, category,
            start_at, end_at, venue_name, public_display_location
          ) VALUES (
            ${host.id}::uuid,
            'No Campus Event',
            'Missing school',
            'Other',
            ${"2030-01-01T20:00:00.000Z"}::timestamptz,
            ${"2030-01-01T22:00:00.000Z"}::timestamptz,
            'Hall',
            'Campus'
          )
        `,
      "23502",
    );

    await expectPgError(
      () =>
        harness.sql`
          INSERT INTO move_groups (
            event_id, creator_id, name, capacity,
            meetup_time, meetup_spot
          ) VALUES (
            ${event.id}::uuid,
            ${host.id}::uuid,
            'No Campus Group',
            4,
            ${"2030-01-01T19:30:00.000Z"}::timestamptz,
            'Steps'
          )
        `,
      "23502",
    );
  });

  it("keeps venues and events scoped to their school_id", async () => {
    const gt = await insertSchool(harness.db, {
      slug: "georgia-tech",
      name: "Georgia Institute of Technology",
    });
    const other = await insertSchool(harness.db, {
      slug: "other-u",
      name: "Other University",
    });
    const host = await insertUser(harness.db, {
      primarySchoolId: gt.id,
    });

    const venue = await insertVenue(harness.db, {
      schoolId: gt.id,
      name: "CRC",
    });
    const event = await insertEvent(harness.db, {
      schoolId: gt.id,
      hostId: host.id,
      venueId: venue.id,
    });
    const group = await insertMoveGroup(harness.db, {
      eventId: event.id,
      schoolId: gt.id,
      creatorId: host.id,
    });

    expect(venue.schoolId).toBe(gt.id);
    expect(event.schoolId).toBe(gt.id);
    expect(group.schoolId).toBe(gt.id);
    expect(venue.schoolId).not.toBe(other.id);
  });

  // --- PostGIS (MS3 §2.5) ---

  it("has the postgis extension enabled", async () => {
    const rows = await harness.sql`
      SELECT extname FROM pg_extension WHERE extname = 'postgis'
    `;
    expect(rows.length).toBe(1);
  });

  it("stores location columns as geography_point (Point,4326 domain)", async () => {
    const columns = await harness.sql`
      SELECT
        c.relname AS table_name,
        a.attname AS column_name,
        t.typname AS type_name
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_type t ON t.oid = a.atttypid
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND (
          (c.relname = 'venues' AND a.attname = 'location')
          OR (c.relname = 'events' AND a.attname = 'location')
          OR (c.relname = 'move_groups' AND a.attname = 'meetup_location')
        )
      ORDER BY c.relname, a.attname
    `;

    expect(columns.length).toBe(3);
    for (const col of columns) {
      expect(String(col.type_name)).toBe("geography_point");
    }

    const domain = await harness.sql`
      SELECT pg_catalog.format_type(t.typbasetype, t.typtypmod) AS base_type
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'geography_point'
    `;
    expect(domain.length).toBe(1);
    expect(String(domain[0]?.base_type).toLowerCase()).toContain("geography");
    expect(String(domain[0]?.base_type)).toMatch(/Point/i);
    expect(String(domain[0]?.base_type)).toMatch(/4326/);
  });

  it("has GIST spatial indexes on geography columns", async () => {
    const indexes = await harness.sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'venues_location_gist_idx',
          'events_location_gist_idx',
          'move_groups_meetup_location_gist_idx'
        )
      ORDER BY indexname
    `;

    expect(indexes.map((row) => String(row.indexname))).toEqual([
      "events_location_gist_idx",
      "move_groups_meetup_location_gist_idx",
      "venues_location_gist_idx",
    ]);

    for (const idx of indexes) {
      expect(String(idx.indexdef).toUpperCase()).toContain("USING GIST");
    }
  });

  it("accepts a WGS84 geography point insert (smoke)", async () => {
    const school = await insertSchool(harness.db, {
      slug: `postgis-${crypto.randomUUID().slice(0, 8)}`,
      name: `PostGIS School ${crypto.randomUUID().slice(0, 8)}`,
    });

    const [{ id }] = await harness.sql`
      INSERT INTO venues (school_id, name, public_display_location, location)
      VALUES (
        ${school.id}::uuid,
        'Tech Tower',
        'Georgia Tech',
        ST_GeogFromText('SRID=4326;POINT(-84.3963 33.7725)')
      )
      RETURNING id
    `;

    const [{ lon, lat }] = await harness.sql`
      SELECT
        ST_X(location::geometry) AS lon,
        ST_Y(location::geometry) AS lat
      FROM venues
      WHERE id = ${id}
    `;

    expect(Number(lon)).toBeCloseTo(-84.3963, 4);
    expect(Number(lat)).toBeCloseTo(33.7725, 4);
  });

  // --- Seeds smoke (optional) ---

  it.runIf(hasSeedModules())(
    "loads deterministic seeds without throwing",
    async () => {
      const { applySeeds } = await import("../../src/db/seeds/index.js");
      const result = await applySeeds(harness.db);

      expect(result.schoolId).toBeTruthy();
      expect(result.userCount).toBeGreaterThan(0);
      expect(result.eventCount).toBeGreaterThan(0);
      expect(result.moveGroupCount).toBeGreaterThan(0);

      const [{ schools }] = await harness.sql`
        SELECT count(*)::int AS schools FROM schools
      `;
      expect(schools).toBeGreaterThan(0);

      const again = await applySeeds(harness.db);
      expect(again.schoolId).toBe(result.schoolId);

      const [{ users }] = await harness.sql`
        SELECT count(*)::int AS users FROM users
      `;
      expect(users).toBe(result.userCount);
    },
    30_000,
  );

  // --- AUTH_MODE=test identity (same file so truncate stays serialized) ---

  async function withTestAuthApp(
    run: (app: Awaited<ReturnType<typeof buildApp>>) => Promise<void>,
  ): Promise<void> {
    const app = await buildApp({
      env: {
        NODE_ENV: "test",
        LOG_LEVEL: "silent",
        HOST: "127.0.0.1",
        PORT: "4000",
        WEB_ORIGIN: "http://localhost:3000",
        AUTH_MODE: "test",
        DATABASE_URL: harness.url,
      },
      logger: false,
    });
    try {
      await run(app);
    } finally {
      await app.close();
    }
  }

  it("sets test identity from the seeded user's primary school", async () => {
    await applySeeds(harness.db);

    await withTestAuthApp(async (app) => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/protected",
        headers: {
          "x-sesh-test-user-id": SEED_USER_IDS.maya,
          "x-sesh-test-school-id": "00000000-0000-4000-8000-000000000099",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        userId: SEED_USER_IDS.maya,
        schoolId: SEED_SCHOOL_ID,
      });
    });
  });

  it("returns 401 for an unknown test user", async () => {
    await withTestAuthApp(async (app) => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/session",
        headers: {
          "x-sesh-test-user-id": "ffffffff-ffff-4fff-8fff-ffffffffffff",
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");
    });
  });

  it("returns 401 when the test user has no primary school", async () => {
    const user = await insertUser(harness.db, { primarySchoolId: null });

    await withTestAuthApp(async (app) => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/protected",
        headers: { "x-sesh-test-user-id": user.id },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");
    });
  });

  it("returns 401 for an inactive test user", async () => {
    const school = await insertSchool(harness.db);
    const user = await insertUser(harness.db, {
      primarySchoolId: school.id,
      status: "SUSPENDED",
    });

    await withTestAuthApp(async (app) => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/protected",
        headers: { "x-sesh-test-user-id": user.id },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe("UNAUTHENTICATED");
    });
  });
});
