import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { friendshipStatusEnum } from "./enums.js";
import { users } from "./users.js";

/**
 * Directed friend request / accepted friendship edge.
 * Canonical pair ordering: `userLowId < userHighId` (UUID text compare) so
 * undirected accepted friendships cannot duplicate in either direction.
 *
 * Application code should set userLowId/userHighId via `min(a,b)` / `max(a,b)`
 * of the two participant UUIDs; requester/addressee preserve request direction.
 */
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Lexicographically smaller participant UUID (pair canonicalization). */
    userLowId: uuid("user_low_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Lexicographically larger participant UUID (pair canonicalization). */
    userHighId: uuid("user_high_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "friendships_distinct_users",
      sql`${table.requesterId} <> ${table.addresseeId}`,
    ),
    check(
      "friendships_pair_ordered",
      sql`${table.userLowId} < ${table.userHighId}`,
    ),
    uniqueIndex("friendships_pair_unique").on(
      table.userLowId,
      table.userHighId,
    ),
    index("friendships_requester_id_idx").on(table.requesterId),
    index("friendships_addressee_id_idx").on(table.addresseeId),
    index("friendships_status_idx").on(table.status),
  ],
);

/**
 * Unilateral block. Blocks affect roster masking and access (Phase 3 authz).
 */
export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "blocks_pk",
      columns: [table.blockerId, table.blockedId],
    }),
    check(
      "blocks_distinct_users",
      sql`${table.blockerId} <> ${table.blockedId}`,
    ),
    index("blocks_blocked_id_idx").on(table.blockedId),
  ],
);
