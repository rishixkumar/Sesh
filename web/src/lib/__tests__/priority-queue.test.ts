import { describe, expect, it } from "vitest";
import { compareBy, thenBy } from "@/lib/collections/comparators";
import { PriorityQueue, topK } from "@/lib/collections/priority-queue";
import {
  ActivityFeed,
  type ActivityItem,
} from "@/lib/notifications/activity-feed";
import { LocalMockSeshAdapter } from "@/lib/data/adapter";
import { SEED_USERS, STATIC_FALLBACK_ANCHOR_ISO } from "@/lib/mock/seed";
import type { EventView, MoveGroupView, ViewerSession } from "@/types/domain";

const byNumber = compareBy((n: number) => n);

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

describe("PriorityQueue", () => {
  it("pops in comparator order and reports size/peek", () => {
    const queue = new PriorityQueue(byNumber);
    for (const n of [5, 1, 4, 1, 5, 9, 2, 6]) queue.push(n);
    expect(queue.size).toBe(8);
    expect(queue.peek()).toBe(1);
    expect(queue.drain()).toEqual([1, 1, 2, 4, 5, 5, 6, 9]);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.pop()).toBeUndefined();
    expect(queue.peek()).toBeUndefined();
  });

  it("heapifies in bulk and supports a max-heap comparator", () => {
    expect(PriorityQueue.from([3, 7, 1, 8], byNumber).drain()).toEqual([
      1, 3, 7, 8,
    ]);
    const maxHeap = PriorityQueue.from(
      [3, 7, 1, 8],
      compareBy((n: number) => n, "desc")
    );
    expect(maxHeap.drain()).toEqual([8, 7, 3, 1]);
  });

  it("replaceTop swaps the root in one sift", () => {
    const queue = PriorityQueue.from([2, 4, 6], byNumber);
    expect(queue.replaceTop(5)).toBe(2);
    expect(queue.drain()).toEqual([4, 5, 6]);
    expect(queue.replaceTop(1)).toBeUndefined();
    expect(queue.drain()).toEqual([1]);
  });

  it("matches toSorted on randomized push/pop/heapify workloads", () => {
    const random = seeded(7);
    for (let trial = 0; trial < 300; trial++) {
      const values = Array.from({ length: Math.floor(random() * 60) }, () =>
        Math.floor(random() * 25)
      );
      const expected = values.toSorted(byNumber);

      expect(PriorityQueue.from(values, byNumber).drain()).toEqual(expected);

      const queue = new PriorityQueue(byNumber);
      const popped: number[] = [];
      const reference: number[] = [];
      for (const value of values) {
        queue.push(value);
        reference.push(value);
        if (random() < 0.3) {
          reference.sort(byNumber);
          popped.push(queue.pop() as number);
          expect(popped.at(-1)).toBe(reference.shift());
        }
      }
      expect(queue.drain()).toEqual(reference.toSorted(byNumber));
    }
  });
});

describe("topK", () => {
  it("equals a stable sort + slice, including ties", () => {
    const random = seeded(11);
    const byKey = compareBy((row: { key: number; id: number }) => row.key);
    for (let trial = 0; trial < 500; trial++) {
      const rows = Array.from(
        { length: Math.floor(random() * 40) },
        (_, id) => ({ key: Math.floor(random() * 6), id })
      );
      const k = Math.floor(random() * 10);
      expect(topK(rows, k, byKey)).toEqual(rows.toSorted(byKey).slice(0, k));
    }
  });

  it("handles k <= 0 and k larger than the input", () => {
    expect(topK([3, 1, 2], 0, byNumber)).toEqual([]);
    expect(topK([3, 1, 2], -1, byNumber)).toEqual([]);
    expect(topK([3, 1, 2], 10, byNumber)).toEqual([1, 2, 3]);
  });

  it("composes with thenBy for multi-key ranking", () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 0, b: 9 },
      { a: 1, b: 1 },
      { a: 0, b: 3 },
    ];
    const rank = thenBy(
      compareBy((r: (typeof rows)[number]) => r.a),
      compareBy((r: (typeof rows)[number]) => r.b, "desc")
    );
    expect(topK(rows, 3, rank)).toEqual([rows[1], rows[3], rows[0]]);
  });
});

/** The Notifications page's pre-DS-06 inline aggregation, kept as an oracle. */
function legacyFeed(groups: MoveGroupView[], events: EventView[]) {
  const hostRequests = groups.flatMap((group) =>
    (group.ownerManagement?.pendingRequests ?? []).map((request) => ({
      group,
      request,
    }))
  );
  const viewerPending = groups.filter(
    (group) => group.viewerRelation === "PENDING_REQUEST"
  );
  const going = events
    .filter((event) => event.viewerResponse === "GOING")
    .slice(0, 3);
  return [
    ...hostRequests.map(({ group, request }) => `HOST:${group.id}:${request.id}`),
    ...viewerPending.map((group) => `PENDING:${group.id}`),
    ...going.map((event) => `GOING:${event.id}`),
  ];
}

function describeItem(item: ActivityItem): string {
  switch (item.kind) {
    case "HOST_REQUEST":
      return `HOST:${item.group.id}:${item.request.id}`;
    case "PENDING_JOIN":
      return `PENDING:${item.group.id}`;
    case "UPCOMING_GOING":
      return `GOING:${item.event.id}`;
  }
}

const MEMBERS: ViewerSession[] = SEED_USERS.map((user) => ({
  mode: "MEMBER",
  user,
}));
const DAY_MS = 24 * 60 * 60 * 1000;
const NOWS = [0, 1, 5].map((days) =>
  new Date(Date.parse(STATIC_FALLBACK_ANCHOR_ISO) + days * DAY_MS).toISOString()
);

function expectFeedMatchesLegacy(adapter: LocalMockSeshAdapter) {
  let checkedItems = 0;
  for (const viewer of MEMBERS) {
    for (const nowIso of NOWS) {
      const groups = adapter.listMoveGroups(viewer);
      const events = adapter.listEvents(viewer, {}, nowIso);
      const feed = ActivityFeed.build({ moveGroups: groups, events });
      const legacy = legacyFeed(groups, events);

      expect(feed.items.map(describeItem)).toEqual(legacy);
      expect(feed.size).toBe(legacy.length);
      expect(feed.countOf("HOST_REQUEST")).toBe(
        groups.reduce(
          (sum, g) => sum + (g.ownerManagement?.pendingRequests.length ?? 0),
          0
        )
      );
      checkedItems += legacy.length;
    }
  }
  return checkedItems;
}

describe("ActivityFeed", () => {
  it("matches the legacy notification ordering for every seed viewer", () => {
    const adapter = new LocalMockSeshAdapter({
      anchorIso: STATIC_FALLBACK_ANCHOR_ISO,
    });
    expect(expectFeedMatchesLegacy(adapter)).toBeGreaterThan(0);
  });

  it("stays equivalent after join requests create host and pending items", () => {
    const adapter = new LocalMockSeshAdapter({
      anchorIso: STATIC_FALLBACK_ANCHOR_ISO,
    });
    const pendingJoins = () =>
      MEMBERS.reduce(
        (sum, viewer) =>
          sum +
          ActivityFeed.build({
            moveGroups: adapter.listMoveGroups(viewer),
            events: [],
          }).countOf("PENDING_JOIN"),
        0
      );
    const before = pendingJoins();

    for (const viewer of MEMBERS) {
      for (const group of adapter.listMoveGroups(viewer)) {
        if (group.viewerRelation !== "NONE") continue;
        try {
          adapter.requestJoin(group.id, viewer, {
            nowIso: STATIC_FALLBACK_ANCHOR_ISO,
          });
        } catch {
          // Capacity or policy rejections are fine; we only need some to land.
        }
      }
    }

    expect(pendingJoins()).toBeGreaterThan(before);
    expectFeedMatchesLegacy(adapter);
  });

  it("orders by kind priority and caps upcoming RSVPs", () => {
    const adapter = new LocalMockSeshAdapter({
      anchorIso: STATIC_FALLBACK_ANCHOR_ISO,
    });
    for (const viewer of MEMBERS) {
      const feed = ActivityFeed.build({
        moveGroups: adapter.listMoveGroups(viewer),
        events: adapter.listEvents(viewer, {}, STATIC_FALLBACK_ANCHOR_ISO),
        upcomingLimit: 1,
      });
      const ranks = feed.items.map((item) =>
        ["HOST_REQUEST", "PENDING_JOIN", "UPCOMING_GOING"].indexOf(item.kind)
      );
      expect(ranks).toEqual(ranks.toSorted((a, b) => a - b));
      expect(feed.countOf("UPCOMING_GOING")).toBeLessThanOrEqual(1);
    }
    expect(ActivityFeed.empty().size).toBe(0);
  });
});
