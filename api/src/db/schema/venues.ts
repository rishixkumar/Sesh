import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { schools } from "./schools.js";
import { geographyPoint } from "./types.js";

/**
 * Campus-scoped venue / place records for reuse and proximity search.
 * Events may reference a venue and/or store denormalized venue text.
 */
export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    publicDisplayLocation: text("public_display_location").notNull(),
    privateAddress: text("private_address"),
    /** WGS84 point for proximity queries (MS3 §2.5). */
    location: geographyPoint("location"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("venues_school_id_idx").on(table.schoolId),
    // GIST spatial index is declared for migrations agent; Drizzle cannot emit
    // usingMethod('gist') reliably across kit versions — see SCHEMA_NOTES.md.
    index("venues_location_gist_idx").using("gist", table.location),
  ],
);
