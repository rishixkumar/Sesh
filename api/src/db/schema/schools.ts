import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Campus / school tenant root.
 * All campus-scoped entities must reference a school for isolation (MS3 §2.3).
 */
export const schools = pgTable(
  "schools",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Stable public slug, e.g. `georgia-tech`. */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name"),
    areaLabel: text("area_label"),
    /** IANA timezone, e.g. `America/New_York`. */
    timezone: text("timezone").notNull().default("America/New_York"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("schools_slug_unique").on(table.slug),
    uniqueIndex("schools_name_ci_unique").on(sql`lower(${table.name})`),
  ],
);
