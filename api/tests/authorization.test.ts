import { describe, expect, it } from "vitest";

import {
  areAcceptedFriends,
  assessJoin,
  canEditEvent,
  canManageGroup,
  canRevealAddress,
  canViewEvent,
  canViewMoveGroup,
  isBlockedPair,
  projectRoster,
  type AuthzSocialGraph,
  type AuthzViewer,
  type EventPolicyRecord,
  type MoveGroupPolicyRecord,
  type PublicUserSummary,
} from "../src/modules/authorization/index.js";

const SCHOOL = "school-1";
const OTHER_SCHOOL = "school-2";

const guest: AuthzViewer = { kind: "guest" };
const host: AuthzViewer = { kind: "member", id: "host", schoolId: SCHOOL };
const friend: AuthzViewer = { kind: "member", id: "friend", schoolId: SCHOOL };
const stranger: AuthzViewer = {
  kind: "member",
  id: "stranger",
  schoolId: SCHOOL,
};
const otherCampus: AuthzViewer = {
  kind: "member",
  id: "host",
  schoolId: OTHER_SCHOOL,
};

function graph(
  friendships: AuthzSocialGraph["friendships"] = [],
  blocks: AuthzSocialGraph["blocks"] = [],
): AuthzSocialGraph {
  return { friendships, blocks };
}

function event(
  overrides: Partial<EventPolicyRecord> = {},
): EventPolicyRecord {
  return {
    schoolId: SCHOOL,
    hostId: "host",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    addressPrivacy: "PUBLIC_VENUE",
    hasPrivateAddress: true,
    audienceUserIds: [],
    ...overrides,
  };
}

function group(
  overrides: Partial<MoveGroupPolicyRecord> = {},
): MoveGroupPolicyRecord {
  return {
    schoolId: SCHOOL,
    creatorId: "host",
    status: "ACTIVE",
    discoverability: "PUBLIC",
    joinMode: "OPEN_JOIN",
    capacity: 3,
    members: [
      { userId: "host", role: "CREATOR", joinedAt: "2026-11-18T00:00:00.000Z" },
    ],
    invitedUserIds: [],
    joinRequests: [],
    ...overrides,
  };
}

const users = new Map<string, PublicUserSummary>([
  [
    "host",
    {
      id: "host",
      displayName: "Host",
      username: "host",
      schoolId: SCHOOL,
      verifiedStudent: true,
    },
  ],
  [
    "friend",
    {
      id: "friend",
      displayName: "Friend",
      username: "friend",
      schoolId: SCHOOL,
      verifiedStudent: true,
    },
  ],
  [
    "stranger",
    {
      id: "stranger",
      displayName: "Stranger",
      username: "stranger",
      schoolId: SCHOOL,
      verifiedStudent: true,
    },
  ],
]);

const accepted = graph([
  { requesterId: "friend", addresseeId: "host", status: "ACCEPTED" },
]);

describe("friendship and blocks", () => {
  it("requires an accepted friendship in either direction", () => {
    expect(areAcceptedFriends("friend", "host", accepted)).toBe(true);
    expect(areAcceptedFriends("host", "friend", accepted)).toBe(true);
    expect(
      areAcceptedFriends(
        "friend",
        "host",
        graph([{ requesterId: "friend", addresseeId: "host", status: "PENDING" }]),
      ),
    ).toBe(false);
    expect(
      areAcceptedFriends(
        "friend",
        "host",
        graph([{ requesterId: "friend", addresseeId: "host", status: "DECLINED" }]),
      ),
    ).toBe(false);
  });

  it("treats a block in either direction as not friends", () => {
    const blocked = graph(accepted.friendships, [
      { blockerId: "host", blockedId: "friend" },
    ]);
    expect(isBlockedPair("friend", "host", blocked.blocks)).toBe(true);
    expect(areAcceptedFriends("friend", "host", blocked)).toBe(false);
  });
});

describe("event visibility", () => {
  it("hides cancelled events and shows drafts only to the host", () => {
    expect(canViewEvent(event({ status: "CANCELLED" }), host, graph(), SCHOOL)).toBe(
      false,
    );
    expect(canViewEvent(event({ status: "DRAFT" }), host, graph(), SCHOOL)).toBe(
      true,
    );
    expect(canViewEvent(event({ status: "DRAFT" }), friend, graph(), SCHOOL)).toBe(
      false,
    );
  });

  it("scopes public events to the requested campus", () => {
    expect(canViewEvent(event(), guest, graph(), SCHOOL)).toBe(true);
    expect(canViewEvent(event(), stranger, graph(), OTHER_SCHOOL)).toBe(false);
    expect(canViewEvent(event(), otherCampus, graph(), SCHOOL)).toBe(false);
  });

  it("allows friends-only events for accepted friends and the host", () => {
    const friendsEvent = event({ visibility: "FRIENDS" });
    expect(canViewEvent(friendsEvent, host, graph(), SCHOOL)).toBe(true);
    expect(canViewEvent(friendsEvent, friend, accepted, SCHOOL)).toBe(true);
    expect(canViewEvent(friendsEvent, friend, graph(), SCHOOL)).toBe(false);
    expect(canViewEvent(friendsEvent, guest, accepted, SCHOOL)).toBe(false);
    expect(
      canViewEvent(
        friendsEvent,
        friend,
        graph(accepted.friendships, [
          { blockerId: "friend", blockedId: "host" },
        ]),
        SCHOOL,
      ),
    ).toBe(false);
  });

  it("limits custom and invite-only events to the audience", () => {
    const custom = event({
      visibility: "CUSTOM",
      audienceUserIds: ["friend"],
    });
    expect(canViewEvent(custom, friend, graph(), SCHOOL)).toBe(true);
    expect(canViewEvent(custom, stranger, graph(), SCHOOL)).toBe(false);
    expect(canViewEvent(custom, guest, graph(), SCHOOL)).toBe(false);
  });
});

describe("address reveal and edit", () => {
  const base = {
    graph: graph(),
    scopedSchoolId: SCHOOL,
    viewerGoing: false,
    viewerInApprovedMoveGroup: false,
  };

  it("never reveals an address to a guest, even for a public venue", () => {
    expect(
      canRevealAddress({ ...base, event: event(), viewer: guest }),
    ).toBe(false);
  });

  it("follows the address privacy matrix for members", () => {
    expect(
      canRevealAddress({ ...base, event: event(), viewer: stranger }),
    ).toBe(true);
    expect(
      canRevealAddress({
        ...base,
        event: event({ addressPrivacy: "RSVP_GOING_ONLY" }),
        viewer: stranger,
        viewerGoing: true,
      }),
    ).toBe(true);
    expect(
      canRevealAddress({
        ...base,
        event: event({ addressPrivacy: "RSVP_GOING_ONLY" }),
        viewer: stranger,
      }),
    ).toBe(false);
    expect(
      canRevealAddress({
        ...base,
        event: event({ addressPrivacy: "APPROVED_GROUP_OR_HOST" }),
        viewer: stranger,
        viewerInApprovedMoveGroup: true,
      }),
    ).toBe(true);
    expect(
      canRevealAddress({
        ...base,
        event: event({ addressPrivacy: "HOST_ONLY" }),
        viewer: stranger,
        viewerGoing: true,
      }),
    ).toBe(false);
    expect(
      canRevealAddress({
        ...base,
        event: event({ addressPrivacy: "HOST_ONLY" }),
        viewer: host,
      }),
    ).toBe(true);
    expect(
      canRevealAddress({
        ...base,
        event: event({ hasPrivateAddress: false }),
        viewer: host,
      }),
    ).toBe(false);
  });

  it("lets only the same-campus host edit a non-cancelled event", () => {
    expect(canEditEvent(event(), host)).toBe(true);
    expect(canEditEvent(event(), stranger)).toBe(false);
    expect(canEditEvent(event(), otherCampus)).toBe(false);
    expect(canEditEvent(event({ status: "CANCELLED" }), host)).toBe(false);
  });
});

describe("move group visibility, roster, and join", () => {
  const parent = event();

  it("hides disbanded and cross-campus groups", () => {
    expect(
      canViewMoveGroup(group({ status: "DISBANDED" }), parent, guest, graph(), SCHOOL),
    ).toBe(false);
    expect(
      canViewMoveGroup(group(), parent, stranger, graph(), OTHER_SCHOOL),
    ).toBe(false);
  });

  it("shows network groups only to accepted friends", () => {
    const network = group({ discoverability: "MY_NETWORK" });
    expect(canViewMoveGroup(network, parent, guest, accepted, SCHOOL)).toBe(false);
    expect(canViewMoveGroup(network, parent, friend, accepted, SCHOOL)).toBe(true);
    expect(canViewMoveGroup(network, parent, friend, graph(), SCHOOL)).toBe(false);
    expect(canViewMoveGroup(network, parent, stranger, accepted, SCHOOL)).toBe(
      false,
    );
  });

  it("masks roster identities for guests, non-friends, and blocks", () => {
    const rosterGroup = group({
      members: [
        { userId: "host", role: "CREATOR", joinedAt: "t0" },
        { userId: "friend", role: "MEMBER", joinedAt: "t1" },
        { userId: "stranger", role: "MEMBER", joinedAt: "t2" },
      ],
    });

    const guestRoster = projectRoster({
      group: rosterGroup,
      viewer: guest,
      usersById: users,
      graph: accepted,
    });
    expect(guestRoster.visibleMembers).toEqual([]);
    expect(guestRoster.anonymousMemberCount).toBe(2);
    expect(guestRoster.creator.id).toBe("host");
    expect(JSON.stringify(guestRoster)).not.toContain("stranger");

    const nonMember: AuthzViewer = {
      kind: "member",
      id: "viewer",
      schoolId: SCHOOL,
    };
    const nonMemberRoster = projectRoster({
      group: rosterGroup,
      viewer: nonMember,
      usersById: users,
      graph: graph([
        { requesterId: "viewer", addresseeId: "friend", status: "ACCEPTED" },
      ]),
    });
    expect(nonMemberRoster.visibleMembers.map((member) => member.id)).toEqual([
      "friend",
    ]);
    expect(nonMemberRoster.visibleMembers[0]?.isFriend).toBe(true);
    expect(nonMemberRoster.anonymousMemberCount).toBe(1);
    expect(nonMemberRoster.isFullRosterVisible).toBe(false);

    const memberRoster = projectRoster({
      group: rosterGroup,
      viewer: friend,
      usersById: users,
      graph: accepted,
    });
    // friend is a member in this group, so the full unblocked roster is visible
    expect(memberRoster.isFullRosterVisible).toBe(true);
    expect(memberRoster.visibleMembers.map((member) => member.id)).toEqual([
      "friend",
      "stranger",
    ]);

    const blockedRoster = projectRoster({
      group: rosterGroup,
      viewer: friend,
      usersById: users,
      graph: graph(accepted.friendships, [
        { blockerId: "stranger", blockedId: "friend" },
      ]),
    });
    expect(blockedRoster.visibleMembers.map((member) => member.id)).toEqual([
      "friend",
    ]);
    expect(blockedRoster.anonymousMemberCount).toBe(1);
    expect(blockedRoster.isFullRosterVisible).toBe(false);
    expect(blockedRoster.creator.id).toBe("host");
  });

  it("chooses join, request, or a frozen denial", () => {
    expect(
      assessJoin(group(), parent, guest, graph(), SCHOOL).attempt,
    ).toEqual({ ok: false, code: "UNAUTHENTICATED" });

    expect(
      assessJoin(group(), parent, stranger, graph(), SCHOOL).attempt,
    ).toEqual({ ok: true, action: "OPEN_JOIN" });

    expect(
      assessJoin(
        group({ joinMode: "REQUEST_TO_JOIN" }),
        parent,
        stranger,
        graph(),
        SCHOOL,
      ).attempt,
    ).toEqual({ ok: true, action: "REQUEST" });

    expect(
      assessJoin(
        group({
          members: [
            { userId: "host", role: "CREATOR", joinedAt: "t0" },
            { userId: "stranger", role: "MEMBER", joinedAt: "t1" },
          ],
        }),
        parent,
        stranger,
        graph(),
        SCHOOL,
      ).attempt,
    ).toEqual({
      ok: false,
      code: "CONFLICT",
      reason: "DUPLICATE_MEMBERSHIP",
    });

    expect(
      assessJoin(
        group({
          joinRequests: [{ userId: "stranger", status: "PENDING" }],
        }),
        parent,
        stranger,
        graph(),
        SCHOOL,
      ).attempt,
    ).toEqual({ ok: false, code: "CONFLICT", reason: "DUPLICATE_REQUEST" });

    expect(
      assessJoin(
        group({
          joinRequests: [{ userId: "stranger", status: "DECLINED" }],
        }),
        parent,
        stranger,
        graph(),
        SCHOOL,
      ).attempt,
    ).toEqual({ ok: false, code: "FORBIDDEN", reason: "JOIN_DECLINED" });

    expect(
      assessJoin(
        group({ capacity: 1 }),
        parent,
        stranger,
        graph(),
        SCHOOL,
      ).attempt,
    ).toEqual({ ok: false, code: "CONFLICT", reason: "CAPACITY_FULL" });

    expect(
      assessJoin(
        group({ joinMode: "INVITE_ONLY" }),
        parent,
        stranger,
        graph(),
        SCHOOL,
      ).attempt,
    ).toEqual({ ok: false, code: "FORBIDDEN", reason: "INVITE_ONLY" });

    expect(
      assessJoin(
        group({
          joinMode: "INVITE_ONLY",
          invitedUserIds: ["stranger"],
        }),
        parent,
        stranger,
        graph(),
        SCHOOL,
      ).attempt,
    ).toEqual({ ok: true, action: "REQUEST" });

    expect(canManageGroup(group(), host)).toBe(true);
    expect(canManageGroup(group(), stranger)).toBe(false);
    expect(canManageGroup(group(), otherCampus)).toBe(false);
  });
});
