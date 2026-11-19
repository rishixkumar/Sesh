/**
 * Policy inputs for Phase 3. These are not database rows and not HTTP DTOs.
 * Events and Move Groups map their records into these shapes, then call the
 * functions in ./policies.ts. Do not pass raw rows to clients.
 */

export type AuthzViewer =
  | { kind: "guest" }
  | { kind: "member"; id: string; schoolId: string };

export type FriendshipStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export type AuthzFriendship = {
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
};

export type AuthzBlock = {
  blockerId: string;
  blockedId: string;
};

export type AuthzSocialGraph = {
  friendships: readonly AuthzFriendship[];
  blocks: readonly AuthzBlock[];
};

export type EventVisibility = "PUBLIC" | "FRIENDS" | "CUSTOM" | "INVITE_ONLY";

export type AddressPrivacy =
  | "PUBLIC_VENUE"
  | "RSVP_GOING_ONLY"
  | "APPROVED_GROUP_OR_HOST"
  | "HOST_ONLY";

export type EventStatus = "PUBLISHED" | "DRAFT" | "CANCELLED";

export type EventPolicyRecord = {
  schoolId: string;
  hostId: string;
  status: EventStatus;
  visibility: EventVisibility;
  addressPrivacy: AddressPrivacy;
  hasPrivateAddress: boolean;
  audienceUserIds: readonly string[];
};

export type MoveGroupDiscoverability = "PUBLIC" | "MY_NETWORK" | "INVITE_ONLY";

export type MoveGroupJoinMode = "OPEN_JOIN" | "REQUEST_TO_JOIN" | "INVITE_ONLY";

export type AuthzMember = {
  userId: string;
  role: "CREATOR" | "MEMBER";
  joinedAt: string;
};

export type AuthzJoinRequest = {
  userId: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
};

/** `members` and `joinRequests` are the rows the caller wants considered. Pass active members only (`left_at` is null). */
export type MoveGroupPolicyRecord = {
  schoolId: string;
  creatorId: string;
  status: "ACTIVE" | "DISBANDED";
  discoverability: MoveGroupDiscoverability;
  joinMode: MoveGroupJoinMode;
  capacity: number;
  members: readonly AuthzMember[];
  invitedUserIds: readonly string[];
  joinRequests: readonly AuthzJoinRequest[];
};

export type PublicUserSummary = {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  schoolId: string;
  verifiedStudent: boolean;
  graduationYear?: number;
};

export type RosterMember = PublicUserSummary & {
  isFriend: boolean;
  joinedAt: string;
};

export type RosterProjection = {
  creator: PublicUserSummary;
  creatorJoinedAt: string;
  visibleMembers: RosterMember[];
  anonymousMemberCount: number;
  totalMemberCount: number;
  isFullRosterVisible: boolean;
};
