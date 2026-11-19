import type { PublicErrorReason } from "../../lib/errors.js";
import type {
  AuthzBlock,
  AuthzJoinRequest,
  AuthzSocialGraph,
  AuthzViewer,
  EventPolicyRecord,
  MoveGroupPolicyRecord,
  PublicUserSummary,
  RosterProjection,
} from "./types.js";

export const JOIN_BLOCKED_REASON = {
  signIn: "Sign in to join or request this Move Group.",
  pending: "Your join request is awaiting host approval.",
  declined: "Your previous request for this Move Group was declined.",
  full: "This Move Group is currently at full capacity.",
  inviteOnly: "This Move Group accepts invited members only.",
} as const;

export type JoinAttempt =
  | { ok: true; action: "OPEN_JOIN" | "REQUEST" }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT";
      reason?: PublicErrorReason;
    };

export type JoinAssessment = {
  canRequestOrJoin: boolean;
  joinBlockedReason?: string;
  attempt: JoinAttempt;
};

export function isBlockedPair(
  userAId: string,
  userBId: string,
  blocks: readonly AuthzBlock[],
): boolean {
  return blocks.some(
    (block) =>
      (block.blockerId === userAId && block.blockedId === userBId) ||
      (block.blockerId === userBId && block.blockedId === userAId),
  );
}

/** Accepted friendships only. Pending, declined, and cancelled grant nothing. A block in either direction cancels the friendship. */
export function areAcceptedFriends(
  userAId: string,
  userBId: string,
  graph: AuthzSocialGraph,
): boolean {
  if (userAId === userBId) return false;
  if (isBlockedPair(userAId, userBId, graph.blocks)) return false;

  return graph.friendships.some(
    (edge) =>
      edge.status === "ACCEPTED" &&
      ((edge.requesterId === userAId && edge.addresseeId === userBId) ||
        (edge.requesterId === userBId && edge.addresseeId === userAId)),
  );
}

export function canViewEvent(
  event: EventPolicyRecord,
  viewer: AuthzViewer,
  graph: AuthzSocialGraph,
  scopedSchoolId: string,
): boolean {
  if (event.schoolId !== scopedSchoolId) return false;
  if (viewer.kind === "member" && viewer.schoolId !== event.schoolId) {
    return false;
  }
  if (event.status === "CANCELLED") return false;

  const viewerId = viewer.kind === "member" ? viewer.id : null;
  if (event.status === "DRAFT") {
    return viewerId === event.hostId;
  }

  switch (event.visibility) {
    case "PUBLIC":
      return true;
    case "FRIENDS": {
      if (!viewerId) return false;
      if (viewerId === event.hostId) return true;
      return areAcceptedFriends(viewerId, event.hostId, graph);
    }
    case "CUSTOM":
    case "INVITE_ONLY": {
      if (!viewerId) return false;
      if (viewerId === event.hostId) return true;
      return event.audienceUserIds.includes(viewerId);
    }
    default:
      return false;
  }
}

export function canEditEvent(
  event: EventPolicyRecord,
  viewer: AuthzViewer,
): boolean {
  return (
    event.status !== "CANCELLED" &&
    viewer.kind === "member" &&
    viewer.id === event.hostId &&
    viewer.schoolId === event.schoolId
  );
}

export function canRevealAddress(input: {
  event: EventPolicyRecord;
  viewer: AuthzViewer;
  graph: AuthzSocialGraph;
  scopedSchoolId: string;
  viewerGoing: boolean;
  viewerInApprovedMoveGroup: boolean;
}): boolean {
  const { event, viewer } = input;
  if (!event.hasPrivateAddress) return false;
  if (
    !canViewEvent(event, viewer, input.graph, input.scopedSchoolId)
  ) {
    return false;
  }
  if (viewer.kind !== "member") return false;
  if (viewer.id === event.hostId) return true;

  switch (event.addressPrivacy) {
    case "PUBLIC_VENUE":
      return true;
    case "RSVP_GOING_ONLY":
      return input.viewerGoing || input.viewerInApprovedMoveGroup;
    case "APPROVED_GROUP_OR_HOST":
      return input.viewerInApprovedMoveGroup;
    case "HOST_ONLY":
      return false;
    default:
      return false;
  }
}

export function canViewMoveGroup(
  group: MoveGroupPolicyRecord,
  event: EventPolicyRecord,
  viewer: AuthzViewer,
  graph: AuthzSocialGraph,
  scopedSchoolId: string,
): boolean {
  if (group.status !== "ACTIVE") return false;
  if (group.schoolId !== event.schoolId) return false;
  if (!canViewEvent(event, viewer, graph, scopedSchoolId)) return false;

  const viewerId = viewer.kind === "member" ? viewer.id : null;
  const isMember =
    viewerId !== null && group.members.some((member) => member.userId === viewerId);
  if (isMember) return true;

  switch (group.discoverability) {
    case "PUBLIC":
      return true;
    case "MY_NETWORK": {
      if (!viewerId) return false;
      if (areAcceptedFriends(viewerId, group.creatorId, graph)) return true;
      return group.members.some((member) =>
        areAcceptedFriends(viewerId, member.userId, graph),
      );
    }
    case "INVITE_ONLY": {
      if (!viewerId) return false;
      if (group.invitedUserIds.includes(viewerId)) return true;
      return group.joinRequests.some((request) => request.userId === viewerId);
    }
    default:
      return false;
  }
}

export function canManageGroup(
  group: MoveGroupPolicyRecord,
  viewer: AuthzViewer,
): boolean {
  return (
    group.status === "ACTIVE" &&
    viewer.kind === "member" &&
    viewer.id === group.creatorId &&
    viewer.schoolId === group.schoolId
  );
}

export function projectRoster(input: {
  group: MoveGroupPolicyRecord;
  viewer: AuthzViewer;
  usersById: ReadonlyMap<string, PublicUserSummary>;
  graph: AuthzSocialGraph;
}): RosterProjection {
  const { group, viewer, usersById, graph } = input;
  const viewerId = viewer.kind === "member" ? viewer.id : null;
  const creatorUser = usersById.get(group.creatorId);
  const creator: PublicUserSummary = creatorUser ?? {
    id: group.creatorId,
    displayName: "Campus Host",
    username: "group_host",
    schoolId: group.schoolId,
    verifiedStudent: false,
  };
  const creatorMember = group.members.find(
    (member) => member.userId === group.creatorId,
  );
  const others = group.members.filter(
    (member) => member.userId !== group.creatorId,
  );
  const isAcceptedMember =
    viewerId !== null &&
    group.members.some((member) => member.userId === viewerId);

  const visibleMembers: RosterProjection["visibleMembers"] = [];
  let anonymousMemberCount = 0;

  for (const member of others) {
    const user = usersById.get(member.userId);
    const blocked =
      viewerId !== null &&
      isBlockedPair(viewerId, member.userId, graph.blocks);
    if (!user || blocked) {
      anonymousMemberCount += 1;
      continue;
    }

    const isFriend = areAcceptedFriends(viewerId ?? "", member.userId, graph);
    if (isAcceptedMember || isFriend) {
      visibleMembers.push({
        ...user,
        isFriend,
        joinedAt: member.joinedAt,
      });
    } else {
      anonymousMemberCount += 1;
    }
  }

  return {
    creator,
    creatorJoinedAt: creatorMember?.joinedAt ?? "",
    visibleMembers,
    anonymousMemberCount,
    totalMemberCount: group.members.length,
    isFullRosterVisible: isAcceptedMember && anonymousMemberCount === 0,
  };
}

function latestRequest(
  group: MoveGroupPolicyRecord,
  userId: string,
): AuthzJoinRequest | undefined {
  let found: AuthzJoinRequest | undefined;
  for (const request of group.joinRequests) {
    if (request.userId === userId) found = request;
  }
  return found;
}

export function assessJoin(
  group: MoveGroupPolicyRecord,
  event: EventPolicyRecord,
  viewer: AuthzViewer,
  graph: AuthzSocialGraph,
  scopedSchoolId: string,
): JoinAssessment {
  if (!canViewMoveGroup(group, event, viewer, graph, scopedSchoolId)) {
    return {
      canRequestOrJoin: false,
      attempt: { ok: false, code: "NOT_FOUND" },
    };
  }

  if (viewer.kind !== "member") {
    return {
      canRequestOrJoin: false,
      joinBlockedReason: JOIN_BLOCKED_REASON.signIn,
      attempt: { ok: false, code: "UNAUTHENTICATED" },
    };
  }

  if (group.members.some((member) => member.userId === viewer.id)) {
    return {
      canRequestOrJoin: false,
      attempt: {
        ok: false,
        code: "CONFLICT",
        reason: "DUPLICATE_MEMBERSHIP",
      },
    };
  }

  const request = latestRequest(group, viewer.id);
  if (request?.status === "PENDING") {
    return {
      canRequestOrJoin: false,
      joinBlockedReason: JOIN_BLOCKED_REASON.pending,
      attempt: { ok: false, code: "CONFLICT", reason: "DUPLICATE_REQUEST" },
    };
  }
  if (request?.status === "DECLINED") {
    return {
      canRequestOrJoin: false,
      joinBlockedReason: JOIN_BLOCKED_REASON.declined,
      attempt: { ok: false, code: "FORBIDDEN", reason: "JOIN_DECLINED" },
    };
  }
  if (group.members.length >= group.capacity) {
    return {
      canRequestOrJoin: false,
      joinBlockedReason: JOIN_BLOCKED_REASON.full,
      attempt: { ok: false, code: "CONFLICT", reason: "CAPACITY_FULL" },
    };
  }
  if (
    group.joinMode === "INVITE_ONLY" &&
    !group.invitedUserIds.includes(viewer.id)
  ) {
    return {
      canRequestOrJoin: false,
      joinBlockedReason: JOIN_BLOCKED_REASON.inviteOnly,
      attempt: { ok: false, code: "FORBIDDEN", reason: "INVITE_ONLY" },
    };
  }

  return {
    canRequestOrJoin: true,
    attempt: {
      ok: true,
      action: group.joinMode === "OPEN_JOIN" ? "OPEN_JOIN" : "REQUEST",
    },
  };
}
