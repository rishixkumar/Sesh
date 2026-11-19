import { pgEnum } from "drizzle-orm/pg-core";

/** Aligns with web/src/types/domain.ts EVENT_CATEGORIES */
export const eventCategoryEnum = pgEnum("event_category", [
  "Bars",
  "Clubs",
  "House Parties",
  "Organization Events",
  "Sports",
  "Concerts",
  "Other",
]);

/** Aligns with EVENT_VISIBILITIES */
export const eventVisibilityEnum = pgEnum("event_visibility", [
  "PUBLIC",
  "FRIENDS",
  "CUSTOM",
  "INVITE_ONLY",
]);

/** Aligns with ADDRESS_PRIVACY_OPTIONS */
export const addressPrivacyEnum = pgEnum("address_privacy", [
  "PUBLIC_VENUE",
  "RSVP_GOING_ONLY",
  "APPROVED_GROUP_OR_HOST",
  "HOST_ONLY",
]);

/** Aligns with EVENT_STATUSES */
export const eventStatusEnum = pgEnum("event_status", [
  "PUBLISHED",
  "DRAFT",
  "CANCELLED",
]);

/** Attendance responses only — saves live in `event_saves` (MS3 §2.2). */
export const eventResponseTypeEnum = pgEnum("event_response_type", [
  "GOING",
  "INTERESTED",
]);

/** Aligns with MOVE_GROUP_DISCOVERABILITIES */
export const moveGroupDiscoverabilityEnum = pgEnum(
  "move_group_discoverability",
  ["PUBLIC", "MY_NETWORK", "INVITE_ONLY"],
);

/** Aligns with MOVE_GROUP_JOIN_MODES */
export const moveGroupJoinModeEnum = pgEnum("move_group_join_mode", [
  "REQUEST_TO_JOIN",
  "OPEN_JOIN",
  "INVITE_ONLY",
]);

export const moveGroupMemberRoleEnum = pgEnum("move_group_member_role", [
  "CREATOR",
  "MEMBER",
]);

export const moveGroupStatusEnum = pgEnum("move_group_status", [
  "ACTIVE",
  "DISBANDED",
]);

export const joinRequestStatusEnum = pgEnum("join_request_status", [
  "PENDING",
  "APPROVED",
  "DECLINED",
  "CANCELLED",
]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
]);

export const schoolAffiliationStatusEnum = pgEnum(
  "school_affiliation_status",
  ["PENDING", "VERIFIED", "REJECTED", "REVOKED"],
);

export const consentTypeEnum = pgEnum("consent_type", [
  "TERMS_OF_SERVICE",
  "PRIVACY_POLICY",
  "LOCATION_SHARING",
  "MARKETING",
  "AGE_CONFIRMATION",
]);

/**
 * Provider identifiers for external IdP linkage.
 * Concrete managed auth provider is Phase 5+/auth phase — keep extensible.
 */
export const authProviderEnum = pgEnum("auth_provider", [
  "DEV_TEST",
  "CLERK",
  "AUTH0",
  "GOOGLE",
  "APPLE",
  "OTHER",
]);

export const userAccountStatusEnum = pgEnum("user_account_status", [
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);
