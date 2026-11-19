import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { events } from "./events.js";
import {
  joinRequestStatusEnum,
  moveGroupDiscoverabilityEnum,
  moveGroupJoinModeEnum,
  moveGroupMemberRoleEnum,
  moveGroupStatusEnum,
} from "./enums.js";
import { schools } from "./schools.js";
import { geographyPoint } from "./types.js";
import { users } from "./users.js";

/**
 * Move Groups attached to an event.
 * `schoolId` is denormalized from the parent event for campus isolation queries
 * without joining events on every list (MS3 §2.3).
 */
export const moveGroups = pgTable(
  "move_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    note: text("note").notNull().default(""),
    capacity: integer("capacity").notNull(),
    discoverability: moveGroupDiscoverabilityEnum("discoverability")
      .notNull()
      .default("PUBLIC"),
    joinMode: moveGroupJoinModeEnum("join_mode")
      .notNull()
      .default("REQUEST_TO_JOIN"),
    meetupTime: timestamp("meetup_time", { withTimezone: true }).notNull(),
    meetupSpot: text("meetup_spot").notNull(),
    meetupLocation: geographyPoint("meetup_location"),
    /** Members-only; never expose to non-members at API layer. */
    externalChatLink: text("external_chat_link"),
    status: moveGroupStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("move_groups_capacity_positive", sql`${table.capacity} > 0`),
    check("move_groups_capacity_min_two", sql`${table.capacity} >= 2`),
    index("move_groups_event_id_idx").on(table.eventId),
    index("move_groups_school_id_idx").on(table.schoolId),
    index("move_groups_creator_id_idx").on(table.creatorId),
    index("move_groups_event_status_idx").on(table.eventId, table.status),
    index("move_groups_meetup_location_gist_idx").using(
      "gist",
      table.meetupLocation,
    ),
  ],
);

/**
 * Active and historical memberships.
 * Unique active membership: partial unique index where `left_at IS NULL`.
 */
export const moveGroupMembers = pgTable(
  "move_group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    moveGroupId: uuid("move_group_id")
      .notNull()
      .references(() => moveGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: moveGroupMemberRoleEnum("role").notNull().default("MEMBER"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Soft leave — null means currently active member. */
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("move_group_members_active_unique")
      .on(table.moveGroupId, table.userId)
      .where(sql`${table.leftAt} IS NULL`),
    index("move_group_members_user_id_idx").on(table.userId),
    index("move_group_members_group_id_idx").on(table.moveGroupId),
  ],
);

/**
 * Join requests for REQUEST_TO_JOIN / INVITE_ONLY flows.
 * Unique pending request per (group, user).
 */
export const moveGroupJoinRequests = pgTable(
  "move_group_join_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    moveGroupId: uuid("move_group_id")
      .notNull()
      .references(() => moveGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: joinRequestStatusEnum("status").notNull().default("PENDING"),
    note: text("note"),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("move_group_join_requests_pending_unique")
      .on(table.moveGroupId, table.userId)
      .where(sql`${table.status} = 'PENDING'`),
    index("move_group_join_requests_user_id_idx").on(table.userId),
    index("move_group_join_requests_group_status_idx").on(
      table.moveGroupId,
      table.status,
    ),
  ],
);

/**
 * Explicit invites for INVITE_ONLY discoverability/joinMode.
 */
export const moveGroupInvites = pgTable(
  "move_group_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    moveGroupId: uuid("move_group_id")
      .notNull()
      .references(() => moveGroups.id, { onDelete: "cascade" }),
    invitedUserId: uuid("invited_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("move_group_invites_group_user_unique").on(
      table.moveGroupId,
      table.invitedUserId,
    ),
    index("move_group_invites_invited_user_id_idx").on(table.invitedUserId),
  ],
);
