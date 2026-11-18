import { compareBy, thenBy } from "@/lib/collections/comparators";
import { PriorityQueue, topK } from "@/lib/collections/priority-queue";
import { byStartTime } from "@/lib/events-filter";
import type {
  EnrichedJoinRequest,
  EventView,
  MoveGroupView,
} from "@/types/domain";

export type ActivityItem =
  | {
      kind: "HOST_REQUEST";
      key: string;
      group: MoveGroupView;
      request: EnrichedJoinRequest;
    }
  | { kind: "PENDING_JOIN"; key: string; group: MoveGroupView }
  | { kind: "UPCOMING_GOING"; key: string; event: EventView };

export type ActivityKind = ActivityItem["kind"];

/** Lower is served first: actions the viewer owes, then waits, then plans. */
export const ACTIVITY_PRIORITY: Record<ActivityKind, number> = {
  HOST_REQUEST: 0,
  PENDING_JOIN: 1,
  UPCOMING_GOING: 2,
};

export const UPCOMING_GOING_LIMIT = 3;

type Ranked = { item: ActivityItem; priority: number; seq: number };

const byPriority = thenBy<Ranked>(
  compareBy((entry) => entry.priority),
  compareBy((entry) => entry.seq)
);

/**
 * The viewer's activity stream. Items are classified from viewer-safe
 * projections, prioritized with a binary heap (kind first, then arrival
 * order), and upcoming RSVPs are trimmed with top-K selection.
 */
export class ActivityFeed {
  private constructor(
    readonly items: readonly ActivityItem[],
    private readonly counts: ReadonlyMap<ActivityKind, number>
  ) {}

  static empty(): ActivityFeed {
    return new ActivityFeed([], new Map());
  }

  /**
   * @param moveGroups Viewer-visible groups, in the order requests should
   *   surface within each kind (the adapter returns them by meetup time).
   * @param events Viewer-visible events that have not ended.
   */
  static build({
    moveGroups,
    events,
    upcomingLimit = UPCOMING_GOING_LIMIT,
  }: {
    moveGroups: readonly MoveGroupView[];
    events: readonly EventView[];
    upcomingLimit?: number;
  }): ActivityFeed {
    const entries: Ranked[] = [];
    const counts = new Map<ActivityKind, number>();
    const add = (item: ActivityItem) => {
      entries.push({
        item,
        priority: ACTIVITY_PRIORITY[item.kind],
        seq: entries.length,
      });
      counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
    };

    for (const group of moveGroups) {
      for (const request of group.ownerManagement?.pendingRequests ?? []) {
        add({ kind: "HOST_REQUEST", key: request.id, group, request });
      }
    }
    for (const group of moveGroups) {
      if (group.viewerRelation === "PENDING_REQUEST") {
        add({ kind: "PENDING_JOIN", key: group.id, group });
      }
    }
    const going = events.filter((event) => event.viewerResponse === "GOING");
    for (const event of topK(going, upcomingLimit, byStartTime)) {
      add({ kind: "UPCOMING_GOING", key: event.id, event });
    }

    const ordered = PriorityQueue.from(entries, byPriority)
      .drain()
      .map((entry) => entry.item);
    return new ActivityFeed(ordered, counts);
  }

  get size(): number {
    return this.items.length;
  }

  countOf(kind: ActivityKind): number {
    return this.counts.get(kind) ?? 0;
  }
}
