import type {
  EnrichedJoinRequest,
  EventRecord,
  EventView,
  MaskedMemberEntry,
  MoveGroupOwnerManagementView,
  MoveGroupRecord,
  MoveGroupRosterProjection,
  MoveGroupView,
  PublicEventMetadata,
  PublicUserSummary,
  User,
  ViewerMoveGroupRelation,
  ViewerSession,
} from "@/types/domain";
import type { FriendshipGraph } from "@/lib/social/friendship-graph";
import type { RsvpTally } from "@/lib/events/rsvp-aggregator";

/**
 * PROTOTYPE SECURITY NOTICE:
 * These policies project viewer-safe views inside the Milestone 1 mock data adapter
 * so unauthorized UI components never receive private addresses, hidden member IDs,
 * hidden avatars, or members-only external chat links.
 *
 * Browser-local permission checks are NOT production security. A real backend API
 * must enforce all authentication, authorization, and field projection rules before launch.
 */

export function toPublicUserSummary(user: User): PublicUserSummary {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatar: user.avatar,
    schoolId: user.schoolId,
    verifiedStudent: user.verifiedStudent,
    graduationYear: user.graduationYear,
  };
}

/**
 * Determines whether `viewer` may see an event at all.
 * - CANCELLED events are hidden from lists.
 * - DRAFT events are visible ONLY to their host.
 * - PUBLIC events are visible to everyone (including Guests).
 * - FRIENDS events are visible ONLY to the host or friends of the host.
 * - CUSTOM / INVITE_ONLY events are visible ONLY to the host or explicitly allowed users.
 */
export function canViewEvent(
  event: EventRecord,
  viewer: ViewerSession,
  graph: FriendshipGraph
): boolean {
  if (event.status === "CANCELLED") return false;

  const viewerId = viewer.mode === "MEMBER" ? viewer.user.id : null;

  if (event.status === "DRAFT") {
    return Boolean(viewerId && viewerId === event.hostId);
  }

  switch (event.visibility) {
    case "PUBLIC":
      return true;
    case "FRIENDS": {
      if (!viewerId) return false;
      if (viewerId === event.hostId) return true;
      return graph.areConnected(viewerId, event.hostId);
    }
    case "CUSTOM":
    case "INVITE_ONLY": {
      if (!viewerId) return false;
      if (viewerId === event.hostId) return true;
      return Boolean(event.customAllowedUserIds?.includes(viewerId));
    }
    default:
      return false;
  }
}

/**
 * Determines whether the exact `privateAddress` may be unlocked for `viewer`.
 * Guests NEVER receive exact private addresses.
 */
export function canViewPrivateAddress(params: {
  event: EventRecord;
  viewer: ViewerSession;
  viewerGoing: boolean;
  viewerInApprovedMoveGroup: boolean;
}): boolean {
  const { event, viewer, viewerGoing, viewerInApprovedMoveGroup } = params;
  if (!event.privateAddress) return false;
  if (viewer.mode !== "MEMBER") return false;

  if (viewer.user.id === event.hostId) {
    return true;
  }

  switch (event.addressPrivacy) {
    case "PUBLIC_VENUE":
      return true;
    case "RSVP_GOING_ONLY":
      return viewerGoing || viewerInApprovedMoveGroup;
    case "APPROVED_GROUP_OR_HOST":
      return viewerInApprovedMoveGroup;
    case "HOST_ONLY":
      return false;
    default:
      return false;
  }
}

export function getPrivateAddressHint(event: EventRecord): string | undefined {
  if (!event.privateAddress) return undefined;
  switch (event.addressPrivacy) {
    case "RSVP_GOING_ONLY":
      return "Exact address unlocks for verified GT members who RSVP Going or join an Event Move Group.";
    case "APPROVED_GROUP_OR_HOST":
      return "Exact address is shared only with the host and accepted Move Group members.";
    case "HOST_ONLY":
      return "Exact address is kept private by the host until shared directly.";
    default:
      return undefined;
  }
}

/** Public host identity for an event, with a placeholder for unknown hosts. */
export function toEventHostSummary(
  event: EventRecord,
  usersById: Map<string, User>
): PublicUserSummary {
  const hostUser = usersById.get(event.hostId);
  return hostUser
    ? toPublicUserSummary(hostUser)
    : {
        id: event.hostId,
        displayName: "Campus Host",
        username: "gt_host",
        schoolId: event.schoolId,
        verifiedStudent: true,
      };
}

export function projectEventForViewer(params: {
  event: EventRecord;
  viewer: ViewerSession;
  usersById: Map<string, User>;
  graph: FriendshipGraph;
  rsvp: RsvpTally;
  eventMoveGroups: MoveGroupRecord[];
}): EventView | null {
  const { event, viewer, usersById, graph, rsvp, eventMoveGroups } = params;

  if (!canViewEvent(event, viewer, graph)) {
    return null;
  }

  const hostSummary = toEventHostSummary(event, usersById);
  const viewerId = viewer.mode === "MEMBER" ? viewer.user.id : null;
  const viewerResponse = viewerId
    ? (rsvp.responseByUserId.get(viewerId) ?? null)
    : null;

  const activeGroups = eventMoveGroups.filter((g) => !g.disbanded);
  const visibleGroupCount = activeGroups.filter((group) =>
    canViewMoveGroup(group, event, viewer, graph)
  ).length;

  const viewerInApprovedMoveGroup = Boolean(
    viewerId &&
      activeGroups.some((g) => g.members.some((m) => m.userId === viewerId))
  );

  const unlockAddress = canViewPrivateAddress({
    event,
    viewer,
    viewerGoing: viewerResponse === "GOING",
    viewerInApprovedMoveGroup,
  });

  const friendsGoing: PublicUserSummary[] =
    viewer.mode === "MEMBER"
      ? rsvp.goingUserIds
          .filter((userId) => graph.hasEdge(viewer.user.id, userId))
          .map((userId) => usersById.get(userId))
          .filter((u): u is User => Boolean(u))
          .map(toPublicUserSummary)
      : [];

  return {
    id: event.id,
    schoolId: event.schoolId,
    title: event.title,
    description: event.description,
    category: event.category,
    startAt: event.startAt,
    endAt: event.endAt,
    venue: event.venue,
    publicDisplayLocation: event.publicDisplayLocation || event.venue,
    addressPrivacy: event.addressPrivacy,
    unlockedPrivateAddress: unlockAddress ? event.privateAddress : undefined,
    hasPrivateAddress: Boolean(event.privateAddress),
    privateAddressUnlockHint: getPrivateAddressHint(event),
    visibility: event.visibility,
    status: event.status,
    hostId: event.hostId,
    host: hostSummary,
    coverImage: event.coverImage,
    capacity: event.capacity,
    admission: event.admission,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    source: event.source,
    goingCount: rsvp.goingCount,
    interestedCount: rsvp.interestedCount,
    savedCount: rsvp.savedCount,
    friendsGoing,
    viewerResponse,
    moveGroupCount: visibleGroupCount,
    canEdit: Boolean(viewerId && viewerId === event.hostId),
  };
}

/**
 * Produces strictly public metadata safe for OpenGraph / link previews.
 * Restricted or draft events return `null` so sensitive titles/locations never leak.
 */
export function projectPublicEventMetadata(
  event: EventRecord | undefined
): PublicEventMetadata | null {
  if (!event) return null;
  if (event.status !== "PUBLISHED" || event.visibility !== "PUBLIC") {
    return null;
  }
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    publicDisplayLocation: event.publicDisplayLocation || event.venue,
    venue: event.venue,
    startAt: event.startAt,
    admissionLabel: event.admission.isFree
      ? "Free entry"
      : event.admission.priceLabel ?? "Paid entry",
  };
}

export function getViewerMoveGroupRelation(
  group: MoveGroupRecord,
  viewer: ViewerSession
): ViewerMoveGroupRelation {
  if (viewer.mode !== "MEMBER") return "NONE";
  const viewerId = viewer.user.id;
  if (group.creatorId === viewerId) return "CREATOR";
  if (group.members.some((m) => m.userId === viewerId)) return "MEMBER";

  const latestReq = [...group.joinRequests]
    .reverse()
    .find((r) => r.userId === viewerId);
  if (latestReq?.status === "PENDING") return "PENDING_REQUEST";
  if (latestReq?.status === "DECLINED") return "DECLINED_REQUEST";
  return "NONE";
}

export function canViewMoveGroup(
  group: MoveGroupRecord,
  event: EventRecord | undefined,
  viewer: ViewerSession,
  graph: FriendshipGraph
): boolean {
  if (group.disbanded) return false;
  if (!event) return false;

  if (!canViewEvent(event, viewer, graph)) return false;

  const viewerId = viewer.mode === "MEMBER" ? viewer.user.id : null;
  const isMemberOrCreator = Boolean(
    viewerId &&
      (group.creatorId === viewerId ||
        group.members.some((m) => m.userId === viewerId))
  );
  if (isMemberOrCreator) return true;

  switch (group.discoverability) {
    case "PUBLIC":
      return true;
    case "MY_NETWORK": {
      if (viewer.mode !== "MEMBER") return false;
      const viewerUserId = viewer.user.id;
      const isFriendWithCreator = graph.areConnected(
        viewerUserId,
        group.creatorId
      );
      const hasFriendInGroup = group.members.some((m) =>
        graph.hasEdge(viewerUserId, m.userId)
      );
      return isFriendWithCreator || hasFriendInGroup;
    }
    case "INVITE_ONLY": {
      if (!viewerId) return false;
      const hasInviteOrRequest =
        Boolean(group.invitedUserIds?.includes(viewerId)) ||
        group.joinRequests.some((r) => r.userId === viewerId);
      return hasInviteOrRequest;
    }
    default:
      return false;
  }
}

/**
 * Enforces the critical Move Group roster masking rule:
 * - Group creator/host is ALWAYS visible to anyone permitted to view the group.
 * - Accepted members see the complete roster.
 * - Non-members see ONLY accepted friends by identity; everyone else is aggregated
 *   into `anonymousMemberCount` with ZERO hidden IDs, usernames, or avatars included.
 */
export function projectMoveGroupRoster(params: {
  group: MoveGroupRecord;
  viewer: ViewerSession;
  usersById: Map<string, User>;
  graph: FriendshipGraph;
}): MoveGroupRosterProjection {
  const { group, viewer, usersById, graph } = params;
  const viewerId = viewer.mode === "MEMBER" ? viewer.user.id : null;
  const creatorUser = usersById.get(group.creatorId);
  const creatorSummary: PublicUserSummary = creatorUser
    ? toPublicUserSummary(creatorUser)
    : {
        id: group.creatorId,
        displayName: "Group Host",
        username: "gt_organizer",
        schoolId: "school-gt",
        verifiedStudent: true,
      };

  const creatorMember = group.members.find((m) => m.userId === group.creatorId);
  const otherMembers = group.members.filter(
    (m) => m.userId !== group.creatorId
  );

  const relation = getViewerMoveGroupRelation(group, viewer);
  const isAcceptedMember = relation === "CREATOR" || relation === "MEMBER";

  const visibleMembers: MaskedMemberEntry[] = [];
  let anonymousMemberCount = 0;

  for (const member of otherMembers) {
    const memberUser = usersById.get(member.userId);
    if (!memberUser) {
      anonymousMemberCount += 1;
      continue;
    }

    const isViewerFriend = Boolean(
      viewerId && graph.hasEdge(viewerId, member.userId)
    );
    const isFriendOrSelf = isViewerFriend || viewerId === member.userId;

    if (isAcceptedMember || isFriendOrSelf) {
      visibleMembers.push({
        ...toPublicUserSummary(memberUser),
        isFriend: isViewerFriend,
        joinedAt: member.joinedAt,
      });
    } else {
      anonymousMemberCount += 1;
    }
  }

  return {
    creator: creatorSummary,
    creatorJoinedAt: creatorMember?.joinedAt ?? group.createdAt,
    visibleMembers,
    anonymousMemberCount,
    totalMemberCount: 1 + otherMembers.length,
    isFullRosterVisible: isAcceptedMember,
  };
}

export function projectMoveGroupForViewer(params: {
  group: MoveGroupRecord;
  event: EventRecord | undefined;
  viewer: ViewerSession;
  usersById: Map<string, User>;
  graph: FriendshipGraph;
}): MoveGroupView | null {
  const { group, event, viewer, usersById, graph } = params;
  if (!event || !canViewMoveGroup(group, event, viewer, graph)) {
    return null;
  }

  const roster = projectMoveGroupRoster({ group, viewer, usersById, graph });
  const relation = getViewerMoveGroupRelation(group, viewer);
  const isAcceptedMember = relation === "CREATOR" || relation === "MEMBER";
  const canManage =
    viewer.mode === "MEMBER" && viewer.user.id === group.creatorId;

  const spotsRemaining = Math.max(0, group.capacity - roster.totalMemberCount);
  const isFull = spotsRemaining <= 0;

  let canRequestOrJoin = false;
  let joinBlockedReason: string | undefined;

  if (isAcceptedMember) {
    canRequestOrJoin = false;
  } else if (viewer.mode === "GUEST") {
    canRequestOrJoin = false;
    joinBlockedReason = "Switch to a Demo Member identity to join or request.";
  } else if (relation === "PENDING_REQUEST") {
    canRequestOrJoin = false;
    joinBlockedReason = "Your join request is awaiting host approval.";
  } else if (relation === "DECLINED_REQUEST") {
    canRequestOrJoin = false;
    joinBlockedReason = "Your previous request for this Move Group was declined.";
  } else if (isFull) {
    canRequestOrJoin = false;
    joinBlockedReason = "This Move Group is currently at full capacity.";
  } else if (
    group.joinMode === "INVITE_ONLY" &&
    !group.invitedUserIds?.includes(viewer.user.id)
  ) {
    canRequestOrJoin = false;
    joinBlockedReason = "This Move Group accepts invited members only.";
  } else {
    canRequestOrJoin = true;
  }

  let ownerManagement: MoveGroupOwnerManagementView | undefined;
  if (canManage) {
    const enrichRequest = (
      req: MoveGroupRecord["joinRequests"][number]
    ): EnrichedJoinRequest | null => {
      const u = usersById.get(req.userId);
      if (!u) return null;
      return {
        id: req.id,
        user: toPublicUserSummary(u),
        status: req.status,
        note: req.note,
        createdAt: req.createdAt,
        decidedAt: req.decidedAt,
      };
    };

    ownerManagement = {
      pendingRequests: group.joinRequests
        .filter((r) => r.status === "PENDING")
        .map(enrichRequest)
        .filter((r): r is EnrichedJoinRequest => Boolean(r)),
      declinedRequests: group.joinRequests
        .filter((r) => r.status === "DECLINED")
        .map(enrichRequest)
        .filter((r): r is EnrichedJoinRequest => Boolean(r)),
      removableMembers: group.members
        .filter((m) => m.userId !== group.creatorId)
        .map((m) => {
          const u = usersById.get(m.userId);
          if (!u) return null;
          return {
            ...toPublicUserSummary(u),
            isFriend: graph.hasEdge(viewer.user.id, m.userId),
            joinedAt: m.joinedAt,
          };
        })
        .filter((m): m is MaskedMemberEntry => Boolean(m)),
    };
  }

  return {
    id: group.id,
    eventId: group.eventId,
    eventSummary: {
      id: event.id,
      title: event.title,
      category: event.category,
      startAt: event.startAt,
      endAt: event.endAt,
      publicDisplayLocation: event.publicDisplayLocation || event.venue,
    },
    creatorId: group.creatorId,
    name: group.name,
    note: group.note,
    capacity: group.capacity,
    spotsRemaining,
    isFull,
    discoverability: group.discoverability,
    joinMode: group.joinMode,
    meetupTime: group.meetupTime,
    meetupSpot: group.meetupSpot,
    unlockedExternalChatLink: isAcceptedMember
      ? group.externalChatLink
      : undefined,
    hasExternalChatLink: Boolean(group.externalChatLink),
    roster,
    viewerRelation: relation,
    canManage,
    canRequestOrJoin,
    joinBlockedReason,
    ownerManagement,
    disbanded: Boolean(group.disbanded),
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    source: group.source,
  };
}
