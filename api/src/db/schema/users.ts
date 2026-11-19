import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  authProviderEnum,
  consentTypeEnum,
  schoolAffiliationStatusEnum,
  userAccountStatusEnum,
} from "./enums.js";
import { schools } from "./schools.js";

/**
 * Core user account (auth/identity root).
 * Profile presentation fields live in `user_profiles` (MS3 §2.2).
 *
 * Email/username uniqueness is case-insensitive via functional unique indexes.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    status: userAccountStatusEnum("status").notNull().default("ACTIVE"),
    /**
     * Convenience home campus. Authoritative multi-campus membership is
     * `school_affiliations`; this column must match a verified affiliation.
     */
    primarySchoolId: uuid("primary_school_id").references(() => schools.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_ci_unique").on(sql`lower(${table.email})`),
    uniqueIndex("users_username_ci_unique").on(sql`lower(${table.username})`),
  ],
);

/**
 * Mutable presentation profile for a user.
 * 1:1 with `users` — cascade delete with the account.
 */
export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  graduationYear: integer("graduation_year"),
  verifiedStudent: boolean("verified_student").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * User ↔ school membership for campus isolation.
 * A user may affiliate with multiple schools; verified rows gate campus data.
 */
export const schoolAffiliations = pgTable(
  "school_affiliations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    status: schoolAffiliationStatusEnum("status").notNull().default("PENDING"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("school_affiliations_user_school_unique").on(
      table.userId,
      table.schoolId,
    ),
  ],
);

/**
 * Versioned consent grants (ToS, privacy, location, etc.).
 */
export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    consentType: consentTypeEnum("consent_type").notNull(),
    /** Document / policy version string, e.g. `2026-11-01`. */
    version: text("version").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("consent_records_user_type_version_unique").on(
      table.userId,
      table.consentType,
      table.version,
    ),
  ],
);

/**
 * Links a Sesh user to an external identity provider subject.
 */
export const externalAuthIdentities = pgTable(
  "external_auth_identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProviderEnum("provider").notNull(),
    providerSubject: text("provider_subject").notNull(),
    emailAtProvider: text("email_at_provider"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("external_auth_provider_subject_unique").on(
      table.provider,
      table.providerSubject,
    ),
  ],
);
