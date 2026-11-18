import type { EventView } from "@/types/domain";

export interface FriendActivity {
  hostedCount: number;
  /** Events the friend is going to, in input order. */
  goingEvents: EventView[];
}

const NO_ACTIVITY: FriendActivity = { hostedCount: 0, goingEvents: [] };

/**
 * Single pass over `events` that tallies, for every user in `friendIds`, how
 * many events they host and which events they are going to: O(E + F)
 * instead of re-filtering the event list once per friend.
 */
export function tallyFriendActivity(
  events: Iterable<EventView>,
  friendIds: Iterable<string>
): (friendId: string) => FriendActivity {
  const activity = new Map<string, FriendActivity>();
  for (const id of friendIds) {
    activity.set(id, { hostedCount: 0, goingEvents: [] });
  }

  for (const event of events) {
    const host = activity.get(event.hostId);
    if (host) host.hostedCount += 1;

    for (const friend of event.friendsGoing) {
      const going = activity.get(friend.id)?.goingEvents;
      if (going && going.at(-1) !== event) going.push(event);
    }
  }

  return (friendId) => activity.get(friendId) ?? NO_ACTIVITY;
}
