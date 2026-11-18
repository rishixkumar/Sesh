import { describe, expect, it } from "vitest";
import { RsvpAggregator } from "@/lib/events/rsvp-aggregator";
import { tallyFriendActivity } from "@/lib/social/friend-activity";
import {
  describeRoster,
  summarizeRoster,
} from "@/lib/move-groups/roster-presenter";
import type {
  EventResponse,
  EventResponseType,
  EventView,
  MaskedMemberEntry,
  MoveGroupRosterProjection,
  PublicUserSummary,
} from "@/types/domain";

const row = (
  eventId: string,
  userId: string,
  response: EventResponseType
): EventResponse => ({ eventId, userId, response, updatedAt: "" });

const person = (id: string, displayName: string): PublicUserSummary => ({
  id,
  displayName,
  username: id,
  schoolId: "school-gt",
  verifiedStudent: true,
});

describe("RsvpAggregator", () => {
  const aggregator = RsvpAggregator.fromResponses([
    row("e1", "u1", "GOING"),
    row("e1", "u2", "INTERESTED"),
    row("e2", "u1", "SAVED"),
    row("e1", "u3", "GOING"),
    row("e1", "u4", "SAVED"),
  ]);

  it("counts each response type per event in one pass", () => {
    const tally = aggregator.forEvent("e1");
    expect([tally.goingCount, tally.interestedCount, tally.savedCount]).toEqual(
      [2, 1, 1]
    );
    expect(tally.goingUserIds).toEqual(["u1", "u3"]);
    expect(aggregator.forEvent("e2").savedCount).toBe(1);
  });

  it("returns an empty tally for events without responses", () => {
    const tally = aggregator.forEvent("missing");
    expect(tally.goingCount).toBe(0);
    expect(tally.goingUserIds).toEqual([]);
  });

  it("looks up the viewer's response in O(1), and null for guests", () => {
    expect(aggregator.viewerResponse("e1", "u2")).toBe("INTERESTED");
    expect(aggregator.viewerResponse("e2", "u2")).toBeNull();
    expect(aggregator.viewerResponse("e1", null)).toBeNull();
  });

  it("keeps the first row when a user has duplicate responses", () => {
    const dup = RsvpAggregator.fromResponses([
      row("e1", "u1", "SAVED"),
      row("e1", "u1", "GOING"),
    ]);
    expect(dup.viewerResponse("e1", "u1")).toBe("SAVED");
    expect(dup.forEvent("e1").goingCount).toBe(1);
  });
});

describe("tallyFriendActivity", () => {
  const event = (id: string, hostId: string, going: string[]) =>
    ({
      id,
      hostId,
      friendsGoing: going.map((g) => person(g, g)),
    }) as unknown as EventView;

  const events = [
    event("e1", "f1", ["f2"]),
    event("e2", "f2", ["f1", "f2"]),
    event("e3", "stranger", ["f1"]),
  ];

  it("tallies hosted counts and going events for each friend in one pass", () => {
    const activityFor = tallyFriendActivity(events, ["f1", "f2"]);
    expect(activityFor("f1").hostedCount).toBe(1);
    expect(activityFor("f1").goingEvents.map((e) => e.id)).toEqual(["e2", "e3"]);
    expect(activityFor("f2").hostedCount).toBe(1);
    expect(activityFor("f2").goingEvents.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("ignores non-friends and returns empty activity for unknown ids", () => {
    const activityFor = tallyFriendActivity(events, ["f1"]);
    expect(activityFor("stranger")).toEqual({ hostedCount: 0, goingEvents: [] });
  });
});

describe("roster presenter", () => {
  const member = (
    id: string,
    displayName: string,
    isFriend: boolean
  ): MaskedMemberEntry => ({ ...person(id, displayName), isFriend, joinedAt: "" });

  const roster = (
    overrides: Partial<MoveGroupRosterProjection>
  ): MoveGroupRosterProjection => ({
    creator: person("c", "Chloe Kim"),
    creatorJoinedAt: "",
    visibleMembers: [],
    anonymousMemberCount: 0,
    totalMemberCount: 1,
    isFullRosterVisible: false,
    ...overrides,
  });

  it("summarizes friend first names and the masked count", () => {
    const breakdown = summarizeRoster(
      roster({
        visibleMembers: [
          member("j", "Jordan Lee", true),
          member("t", "Tyler Nguyen", false),
        ],
        anonymousMemberCount: 2,
      })
    );
    expect(breakdown).toEqual({
      friendFirstNames: ["Jordan"],
      visibleFriendCount: 1,
      anonymousMemberCount: 2,
    });
  });

  it("describes masked rosters for non-members", () => {
    expect(
      describeRoster(
        roster({
          visibleMembers: [member("j", "Jordan Lee", true)],
          anonymousMemberCount: 1,
        })
      )
    ).toBe(
      "Includes your friend Jordan Lee · +1 other GT student (identities hidden until joined)"
    );
    expect(describeRoster(roster({ anonymousMemberCount: 3 }))).toBe(
      "+3 other GT students (identities hidden until joined)"
    );
    expect(describeRoster(roster({}))).toBe(
      "Hosted by organizer — spots open to coordinate heading over together."
    );
  });

  it("describes full rosters for accepted members", () => {
    expect(describeRoster(roster({ isFullRosterVisible: true }))).toBe(
      "Just the organizer so far — full member roster unlocked."
    );
    expect(
      describeRoster(
        roster({
          isFullRosterVisible: true,
          visibleMembers: [
            member("j", "Jordan Lee", true),
            member("t", "Tyler Nguyen", false),
          ],
        })
      )
    ).toBe("With Jordan Lee, Tyler Nguyen (full member roster unlocked).");
  });
});
