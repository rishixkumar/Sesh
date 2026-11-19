/**
 * Deterministic Georgia Tech seed dataset (MS3 §2.7).
 *
 * CLI (also wired as `npm run db:seed`):
 *   npx tsx src/db/seeds/index.ts
 *
 * Programmatic / DB tests harness:
 *   await seed({ db })
 */

import { config as loadDotenv } from "dotenv";
import { count } from "drizzle-orm";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDb } from "../client.js";
import {
  events,
  friendships,
  moveGroupJoinRequests,
  moveGroups,
  users,
} from "../schema/index.js";
import { applySeeds, type SeedApplyResult, type SeedDatabase } from "./apply.js";

const here = fileURLToPath(new URL(".", import.meta.url));
loadDotenv({ path: resolve(here, "../../../.env") });

const DEFAULT_URL = "postgres://sesh:sesh@127.0.0.1:5433/sesh";

export { applySeeds, type SeedApplyResult, type SeedDatabase } from "./apply.js";
export {
  SEED_ANCHOR_ISO,
  eventSeeds,
  friendshipSeeds,
  moveGroupJoinRequestSeeds,
  moveGroupSeeds,
  schoolSeed,
  userSeeds,
} from "./data.js";
export {
  SEED_EVENT_IDS,
  SEED_MOVE_GROUP_IDS,
  SEED_SCHOOL_ID,
  SEED_USER_IDS,
} from "./ids.js";

export type SeedOptions = {
  db?: SeedDatabase;
  /** Accepted for harness compatibility; unused (Drizzle uses `db`). */
  sql?: unknown;
};

/**
 * Apply seeds against an injected DB, or open DATABASE_URL when omitted (CLI).
 */
export async function seed(
  options: SeedOptions = {},
): Promise<SeedApplyResult> {
  if (options.db) {
    return applySeeds(options.db);
  }

  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_URL;
  const handle = createDb(databaseUrl, { max: 1 });

  try {
    const beforeUsers = await tableCount(handle.db, users);
    const beforeEvents = await tableCount(handle.db, events);
    const beforeGroups = await tableCount(handle.db, moveGroups);

    const result = await applySeeds(handle.db);

    const counts = {
      users: await tableCount(handle.db, users),
      events: await tableCount(handle.db, events),
      move_groups: await tableCount(handle.db, moveGroups),
      friendships: await tableCount(handle.db, friendships),
      move_group_join_requests: await tableCount(
        handle.db,
        moveGroupJoinRequests,
      ),
    };

    console.log(
      JSON.stringify(
        {
          ok: true,
          databaseUrlHost: new URL(databaseUrl).host,
          applied: result,
          counts,
          delta: {
            users: counts.users - beforeUsers,
            events: counts.events - beforeEvents,
            move_groups: counts.move_groups - beforeGroups,
          },
        },
        null,
        2,
      ),
    );

    return result;
  } finally {
    await handle.close();
  }
}

export const run = seed;
export default seed;

async function tableCount(
  db: SeedDatabase,
  table:
    | typeof users
    | typeof events
    | typeof moveGroups
    | typeof friendships
    | typeof moveGroupJoinRequests,
): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table);
  return Number(row?.value ?? 0);
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(resolve(entry)).href;
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  seed().catch((err: unknown) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  });
}
