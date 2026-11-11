/**
 * Shared frontend domain models for Sesh Milestone 1.
 *
 * SECURITY & ARCHITECTURE NOTE:
 * All types ending in `*Record` represent internal mock database records inside the
 * local adapter and MUST NEVER be passed directly to unauthorized UI components.
 * UI components consume viewer-projected types (`EventView`, `MoveGroupView`, etc.)
 * produced by `SeshDataAdapter`. Browser-local checks are a prototype simulation only;
 * a production backend must enforce all visibility and privacy rules server-side.
 */

export const CAMPUS_SCHOOL_ID = "school-gt";
export const CAMPUS_NAME = "Georgia Tech";
export const CAMPUS_AREA_LABEL = "Georgia Tech & Midtown Atlanta";
export const CAMPUS_TIMEZONE = "America/New_York";

export const EVENT_CATEGORIES = [
  "Bars",
  "Clubs",
  "House Parties",
  "Organization Events",
  "Sports",
  "Concerts",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_VISIBILITIES = [
  "PUBLIC",
  "FRIENDS",
  "CUSTOM",
  "INVITE_ONLY",
] as const;

export type EventVisibility = (typeof EVENT_VISIBILITIES)[number];

export const ADDRESS_PRIVACY_OPTIONS = [
  "PUBLIC_VENUE",
  "RSVP_GOING_ONLY",
  "APPROVED_GROUP_OR_HOST",
  "HOST_ONLY",
] as const;

export type AddressPrivacy = (typeof ADDRESS_PRIVACY_OPTIONS)[number];

export const EVENT_STATUSES = ["PUBLISHED", "DRAFT", "CANCELLED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_RESPONSE_TYPES = ["GOING", "INTERESTED", "SAVED"] as const;
export type EventResponseType = (typeof EVENT_RESPONSE_TYPES)[number];

export const MOVE_GROUP_DISCOVERABILITIES = [
  "PUBLIC",
  "MY_NETWORK",
  "INVITE_ONLY",
] as const;

export type MoveGroupDiscoverability =
  (typeof MOVE_GROUP_DISCOVERABILITIES)[number];

export const MOVE_GROUP_JOIN_MODES = [
  "REQUEST_TO_JOIN",
  "OPEN_JOIN",
  "INVITE_ONLY",
] as const;

export type MoveGroupJoinMode = (typeof MOVE_GROUP_JOIN_MODES)[number];

export interface AdmissionPrice {
  isFree: boolean;
  priceLabel?: string;
  amountUsd?: number;
}

export interface User {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  schoolId: string;
  verifiedStudent: boolean;
  bio?: string;
  graduationYear?: number;
  friendIds: string[];
}

export interface PublicUserSummary {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  schoolId: string;
  verifiedStudent: boolean;
  graduationYear?: number;
}

export interface EventRecord {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  category: EventCategory;
  /** UTC ISO-8601 timestamp */
  startAt: string;
  /** UTC ISO-8601 timestamp */
  endAt: string;
  /** Venue name or general location text */
  venue: string;
  /** Safe public-facing neighborhood or approximate location */
  publicDisplayLocation: string;
  /** Sensitive exact address (e.g. house party street address) — never exposed publicly */
  privateAddress?: string;
  addressPrivacy: AddressPrivacy;
  visibility: EventVisibility;
  customAllowedUserIds?: string[];
  status: EventStatus;
  hostId: string;
  coverImage?: string;
  capacity?: number;
  admission: AdmissionPrice;
  createdAt: string;
  updatedAt: string;
  source: "SEED" | "LOCAL_DEMO";
}

export interface EventResponse {
  userId: string;
  eventId: string;
  response: EventResponseType;
  updatedAt: string;
}

export interface MoveGroupMemberRecord {
  userId: string;
  role: "CREATOR" | "MEMBER";
  joinedAt: string;
}

export type JoinRequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export interface MoveGroupJoinRequest {
  id: string;
  userId: string;
  status: JoinRequestStatus;
  note?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface MoveGroupRecord {
  id: string;
  eventId: string;
  creatorId: string;
  name: string;
  note: string;
  capacity: number;
  discoverability: MoveGroupDiscoverability;
  joinMode: MoveGroupJoinMode;
  /** UTC ISO-8601 timestamp */
  meetupTime: string;
  meetupSpot: string;
  /** Members-only coordination chat link — never exposed to non-members */
  externalChatLink?: string;
  members: MoveGroupMemberRecord[];
  joinRequests: MoveGroupJoinRequest[];
  invitedUserIds?: string[];
  disbanded?: boolean;
  createdAt: string;
  updatedAt: string;
  source: "SEED" | "LOCAL_DEMO";
}

export interface Invitation {
  id: string;
  targetType: "EVENT" | "MOVE_GROUP";
  targetId: string;
  createdById: string;
  token: string;
  expiresAt: string;
  maxUses?: number;
  usedCount: number;
  permission: "VIEW" | "JOIN" | "RSVP";
}

/**
 * Simulated viewer identity for Milestone 1.
 * Guest mode represents an unauthenticated visitor, never a verified student session.
 */
export type ViewerSession =
  | {
      mode: "GUEST";
      user: null;
    }
  | {
      mode: "MEMBER";
      user: User;
    };

/**
 * Safe viewer-projected Event returned by SeshDataAdapter.
 * Sensitive `privateAddress` is stripped unless `canViewPrivateAddress` passes.
 */
export interface EventView {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  category: EventCategory;
  startAt: string;
  endAt: string;
  venue: string;
  publicDisplayLocation: string;
  addressPrivacy: AddressPrivacy;
  /** Populated ONLY when the current viewer satisfies address privacy rules */
  unlockedPrivateAddress?: string;
  /** Indicates a private exact address exists without revealing it */
  hasPrivateAddress: boolean;
  privateAddressUnlockHint?: string;
  visibility: EventVisibility;
  status: EventStatus;
  hostId: string;
  host: PublicUserSummary;
  coverImage?: string;
  capacity?: number;
  admission: AdmissionPrice;
  createdAt: string;
  updatedAt: string;
  source: "SEED" | "LOCAL_DEMO";
  goingCount: number;
  interestedCount: number;
  savedCount: number;
  /** Friends of the signed-in demo member who marked GOING (always [] for Guest) */
  friendsGoing: PublicUserSummary[];
  viewerResponse: EventResponseType | null;
  moveGroupCount: number;
  canEdit: boolean;
}

/**
 * Safe public-only metadata projection for link previews / OpenGraph.
 * Never includes restricted events or private addresses.
 */
export interface PublicEventMetadata {
  id: string;
  title: string;
  category: EventCategory;
  publicDisplayLocation: string;
  venue: string;
  startAt: string;
  admissionLabel: string;
}

export type ViewerMoveGroupRelation =
  | "CREATOR"
  | "MEMBER"
  | "PENDING_REQUEST"
  | "DECLINED_REQUEST"
  | "NONE";

export interface MaskedMemberEntry extends PublicUserSummary {
  isFriend: boolean;
  joinedAt: string;
}

/**
 * Privacy-preserving roster projection:
 * - `creator` is always visible to anyone permitted to view the group.
 * - `visibleMembers` contains all non-creator members ONLY for accepted group members;
 *   for non-members, it contains ONLY accepted friends of the viewer (and [] for Guests).
 * - `anonymousMemberCount` represents accepted non-creator members masked from this viewer.
 * - Hidden member IDs, names, usernames, and avatars are NEVER included in this object.
 */
export interface MoveGroupRosterProjection {
  creator: PublicUserSummary;
  creatorJoinedAt: string;
  visibleMembers: MaskedMemberEntry[];
  anonymousMemberCount: number;
  totalMemberCount: number;
  isFullRosterVisible: boolean;
}

export interface EnrichedJoinRequest {
  id: string;
  user: PublicUserSummary;
  status: JoinRequestStatus;
  note?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface MoveGroupOwnerManagementView {
  pendingRequests: EnrichedJoinRequest[];
  declinedRequests: EnrichedJoinRequest[];
  removableMembers: MaskedMemberEntry[];
}

export interface MoveGroupView {
  id: string;
  eventId: string;
  eventSummary: {
    id: string;
    title: string;
    category: EventCategory;
    startAt: string;
    endAt: string;
    publicDisplayLocation: string;
  };
  creatorId: string;
  name: string;
  note: string;
  capacity: number;
  spotsRemaining: number;
  isFull: boolean;
  discoverability: MoveGroupDiscoverability;
  joinMode: MoveGroupJoinMode;
  meetupTime: string;
  meetupSpot: string;
  /** Present ONLY for accepted members / creator */
  unlockedExternalChatLink?: string;
  hasExternalChatLink: boolean;
  roster: MoveGroupRosterProjection;
  viewerRelation: ViewerMoveGroupRelation;
  canManage: boolean;
  canRequestOrJoin: boolean;
  joinBlockedReason?: string;
  /** Present ONLY when `canManage === true` (group creator) */
  ownerManagement?: MoveGroupOwnerManagementView;
  disbanded: boolean;
  createdAt: string;
  updatedAt: string;
  source: "SEED" | "LOCAL_DEMO";
}

export type TimeWindowFilter =
  | "ALL"
  | "HAPPENING_NOW"
  | "TONIGHT"
  | "THIS_WEEKEND"
  | "UPCOMING";

export type PriceFilter = "ALL" | "FREE" | "PAID";

export interface EventFilterCriteria {
  search?: string;
  category?: "ALL" | EventCategory;
  price?: PriceFilter;
  timeWindow?: TimeWindowFilter;
  includeDraftsOwnedByViewer?: boolean;
}

export interface CreateOrUpdateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  startAt: string;
  endAt: string;
  venue: string;
  publicDisplayLocation?: string;
  privateAddress?: string;
  addressPrivacy: AddressPrivacy;
  visibility: EventVisibility;
  status: "PUBLISHED" | "DRAFT";
  coverImage?: string;
  capacity?: number | null;
  isFree: boolean;
  priceLabel?: string;
  amountUsd?: number | null;
  customAllowedUserIds?: string[];
}

export interface CreateMoveGroupInput {
  eventId: string;
  name: string;
  note: string;
  capacity: number;
  discoverability: MoveGroupDiscoverability;
  joinMode: MoveGroupJoinMode;
  meetupTime: string;
  meetupSpot: string;
  externalChatLink?: string;
}

export interface UpdateMoveGroupInput {
  name: string;
  note: string;
  capacity: number;
  discoverability: MoveGroupDiscoverability;
  joinMode: MoveGroupJoinMode;
  meetupTime: string;
  meetupSpot: string;
  externalChatLink?: string;
}
