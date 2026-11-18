import type { EventResponse, EventResponseType } from "@/types/domain";

export interface RsvpTally {
  goingCount: number;
  interestedCount: number;
  savedCount: number;
  /** Users who responded GOING, in response-table order. */
  goingUserIds: string[];
  /** Each user's response; the first row wins if a user has duplicates. */
  responseByUserId: ReadonlyMap<string, EventResponseType>;
}

const EMPTY_TALLY: RsvpTally = {
  goingCount: 0,
  interestedCount: 0,
  savedCount: 0,
  goingUserIds: [],
  responseByUserId: new Map(),
};

/**
 * Group-by-and-count over the RSVP response table: one O(R) pass builds a
 * `Map<eventId, RsvpTally>`, after which every per-event count, attendee list,
 * and viewer response lookup is O(1).
 */
export class RsvpAggregator {
  private constructor(private readonly tallies: Map<string, RsvpTally>) {}

  static fromResponses(responses: Iterable<EventResponse>): RsvpAggregator {
    const tallies = new Map<
      string,
      RsvpTally & { responseByUserId: Map<string, EventResponseType> }
    >();

    for (const row of responses) {
      let tally = tallies.get(row.eventId);
      if (!tally) {
        tally = {
          goingCount: 0,
          interestedCount: 0,
          savedCount: 0,
          goingUserIds: [],
          responseByUserId: new Map(),
        };
        tallies.set(row.eventId, tally);
      }

      switch (row.response) {
        case "GOING":
          tally.goingCount += 1;
          tally.goingUserIds.push(row.userId);
          break;
        case "INTERESTED":
          tally.interestedCount += 1;
          break;
        case "SAVED":
          tally.savedCount += 1;
          break;
      }

      if (!tally.responseByUserId.has(row.userId)) {
        tally.responseByUserId.set(row.userId, row.response);
      }
    }

    return new RsvpAggregator(tallies);
  }

  forEvent(eventId: string): RsvpTally {
    return this.tallies.get(eventId) ?? EMPTY_TALLY;
  }

  viewerResponse(
    eventId: string,
    viewerId: string | null
  ): EventResponseType | null {
    if (!viewerId) return null;
    return this.forEvent(eventId).responseByUserId.get(viewerId) ?? null;
  }
}
