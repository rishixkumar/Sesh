import type { MoveGroupRosterProjection } from "@/types/domain";

export interface RosterBreakdown {
  /** First names of visible members who are the viewer's friends. */
  friendFirstNames: string[];
  visibleFriendCount: number;
  anonymousMemberCount: number;
}

/** Splits a projected roster into friend names and the masked member count. */
export function summarizeRoster(
  roster: MoveGroupRosterProjection
): RosterBreakdown {
  const friendFirstNames: string[] = [];
  for (const member of roster.visibleMembers) {
    if (member.isFriend) {
      friendFirstNames.push(member.displayName.split(" ")[0]);
    }
  }
  return {
    friendFirstNames,
    visibleFriendCount: friendFirstNames.length,
    anonymousMemberCount: roster.anonymousMemberCount,
  };
}

/** One-line roster description used on event detail Move Group cards. */
export function describeRoster(roster: MoveGroupRosterProjection): string {
  const names = roster.visibleMembers.map((m) => m.displayName).join(", ");

  if (roster.isFullRosterVisible) {
    return roster.visibleMembers.length === 0
      ? "Just the organizer so far — full member roster unlocked."
      : `With ${names} (full member roster unlocked).`;
  }

  const { visibleFriendCount, anonymousMemberCount } = summarizeRoster(roster);
  const segments: string[] = [];
  if (roster.visibleMembers.length > 0) {
    segments.push(
      visibleFriendCount === 1
        ? `Includes your friend ${names}`
        : `Includes your friends ${names}`
    );
  }

  if (anonymousMemberCount > 0) {
    segments.push(
      `+${anonymousMemberCount} other GT ${
        anonymousMemberCount === 1 ? "student" : "students"
      } (identities hidden until joined)`
    );
  }

  if (segments.length === 0) {
    return "Hosted by organizer — spots open to coordinate heading over together.";
  }

  return segments.join(" · ");
}
