import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  addressPrivacyEnum,
  eventCategoryEnum,
  eventResponseTypeEnum,
  eventStatusEnum,
  eventVisibilityEnum,
} from "./enums.js";
import { schools } from "./schools.js";
import { geographyPoint } from "./types.js";
import { users } from "./users.js";
import { venues } from "./venues.js";

/**
 * Campus events ("Moves").
 * `schoolId` is mandatory for tenant isolation (MS3 §2.3).
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: eventCategoryEnum("category").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    /** Denormalized venue label (matches frontend `EventRecord.venue`). */
    venueName: text("venue_name").notNull(),
    publicDisplayLocation: text("public_display_location").notNull(),
    privateAddress: text("private_address"),
    addressPrivacy: addressPrivacyEnum("address_privacy")
      .notNull()
      .default("PUBLIC_VENUE"),
    visibility: eventVisibilityEnum("visibility").notNull().default("PUBLIC"),
    status: eventStatusEnum("status").notNull().default("DRAFT"),
    coverImageUrl: text("cover_image_url"),
    capacity: integer("capacity"),
    admissionIsFree: boolean("admission_is_free").notNull().default(true),
    admissionPriceLabel: text("admission_price_label"),
    admissionAmountUsd: numeric("admission_amount_usd", {
      precision: 10,
      scale: 2,
    }),
    /** Optional event pin for proximity search when distinct from venue. */
    location: geographyPoint("location"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("events_end_after_start", sql`${table.endAt} > ${table.startAt}`),
    check(
      "events_capacity_positive",
      sql`${table.capacity} IS NULL OR ${table.capacity} > 0`,
    ),
    index("events_school_id_idx").on(table.schoolId),
    index("events_host_id_idx").on(table.hostId),
    index("events_venue_id_idx").on(table.venueId),
    index("events_school_status_start_idx").on(
      table.schoolId,
      table.status,
      table.startAt,
    ),
    index("events_location_gist_idx").using("gist", table.location),
  ],
);

/**
 * Allowed viewers for CUSTOM / INVITE_ONLY events.
 * Host is always allowed and need not appear here.
 */
export const eventAudienceMembers = pgTable(
  "event_audience_members",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "event_audience_members_pk",
      columns: [table.eventId, table.userId],
    }),
    index("event_audience_members_user_id_idx").on(table.userId),
  ],
);

/**
 * Attendance responses: GOING | INTERESTED (one active row per user/event).
 * SAVED is modeled separately in `event_saves` per MS3 §2.2.
 */
export const eventResponses = pgTable(
  "event_responses",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    response: eventResponseTypeEnum("response").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "event_responses_pk",
      columns: [table.eventId, table.userId],
    }),
    index("event_responses_user_id_idx").on(table.userId),
    index("event_responses_event_response_idx").on(
      table.eventId,
      table.response,
    ),
  ],
);

/**
 * Bookmarks / saves — distinct from attendance responses (MS3 §2.2).
 */
export const eventSaves = pgTable(
  "event_saves",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "event_saves_pk",
      columns: [table.eventId, table.userId],
    }),
    index("event_saves_user_id_idx").on(table.userId),
  ],
);
