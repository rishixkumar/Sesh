import { describe, expect, it } from "vitest";
import { LocalMockSeshAdapter, type StorageLike } from "@/lib/data/adapter";
import { SEED_USERS, STATIC_FALLBACK_ANCHOR_ISO } from "@/lib/mock/seed";
import type {
  CreateMoveGroupInput,
  CreateOrUpdateEventInput,
  ViewerSession,
} from "@/types/domain";

class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

const ANCHOR = STATIC_FALLBACK_ANCHOR_ISO;
const MAYA: ViewerSession = {
  mode: "MEMBER",
  user: SEED_USERS.find((u) => u.id === "user-maya")!,
};
const JORDAN: ViewerSession = {
  mode: "MEMBER",
  user: SEED_USERS.find((u) => u.id === "user-jordan")!,
};
const SEED_EVENT_ID = "evt-west-midtown-neon";

function eventInput(
  overrides: Partial<CreateOrUpdateEventInput> = {}
): CreateOrUpdateEventInput {
  return {
    title: "Index Freshness Check",
    description: "Fictional event used to verify adapter index invalidation.",
    category: "Concerts",
    startAt: "2026-11-12T00:00:00.000Z",
    endAt: "2026-11-12T03:00:00.000Z",
    venue: "Klaus Atrium",
    addressPrivacy: "PUBLIC_VENUE",
    visibility: "PUBLIC",
    status: "PUBLISHED",
    isFree: true,
    ...overrides,
  };
}

function groupInput(eventId: string): CreateMoveGroupInput {
  return {
    eventId,
    name: "Index Test Crew",
    note: "Walking over together.",
    capacity: 4,
    discoverability: "PUBLIC",
    joinMode: "OPEN_JOIN",
    meetupTime: "2026-11-11T23:30:00.000Z",
    meetupSpot: "Klaus Front Steps",
  };
}

function findListed(
  adapter: LocalMockSeshAdapter,
  viewer: ViewerSession,
  eventId: string
) {
  return adapter.listEvents(viewer, {}, ANCHOR).find((e) => e.id === eventId);
}

describe("LocalMockSeshAdapter hash indexes stay fresh after mutations", () => {
  it("indexes newly created events", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    const before = adapter.listEvents(MAYA, {}, ANCHOR).length;

    const created = adapter.createEvent(eventInput(), MAYA, ANCHOR);

    expect(adapter.getEvent(created.id, JORDAN).status).toBe("OK");
    expect(adapter.listEvents(MAYA, {}, ANCHOR)).toHaveLength(before + 1);
  });

  it("reflects edits to seeded events in both lookup and listing", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    expect(findListed(adapter, MAYA, SEED_EVENT_ID)).toBeDefined();

    adapter.updateEvent(
      SEED_EVENT_ID,
      eventInput({ title: "Renamed Seed Move" }),
      MAYA,
      ANCHOR
    );

    const lookup = adapter.getEvent(SEED_EVENT_ID, MAYA);
    expect(lookup.status === "OK" && lookup.event.title).toBe(
      "Renamed Seed Move"
    );
    expect(findListed(adapter, MAYA, SEED_EVENT_ID)?.title).toBe(
      "Renamed Seed Move"
    );
  });

  it("updates per-event move group buckets on create and disband", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    const countBefore = findListed(adapter, MAYA, SEED_EVENT_ID)!.moveGroupCount;
    const groupsBefore = adapter.listMoveGroups(MAYA, SEED_EVENT_ID).length;

    const group = adapter.createMoveGroup(groupInput(SEED_EVENT_ID), MAYA, ANCHOR);

    expect(findListed(adapter, MAYA, SEED_EVENT_ID)!.moveGroupCount).toBe(
      countBefore + 1
    );
    expect(adapter.listMoveGroups(MAYA, SEED_EVENT_ID)).toHaveLength(
      groupsBefore + 1
    );

    adapter.disbandMoveGroup(group.id, MAYA);

    expect(adapter.getMoveGroup(group.id, MAYA).status).toBe("DISBANDED");
    expect(findListed(adapter, MAYA, SEED_EVENT_ID)!.moveGroupCount).toBe(
      countBefore
    );
    expect(
      adapter.listMoveGroups(MAYA, SEED_EVENT_ID).some((g) => g.id === group.id)
    ).toBe(false);
  });

  it("reflects membership changes made through the group index", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    const group = adapter.createMoveGroup(groupInput(SEED_EVENT_ID), MAYA, ANCHOR);

    const joined = adapter.requestJoin(group.id, JORDAN, { nowIso: ANCHOR });
    expect(joined.roster.totalMemberCount).toBe(2);

    adapter.leaveMoveGroup(group.id, JORDAN);
    const lookup = adapter.getMoveGroup(group.id, MAYA);
    expect(lookup.status === "OK" && lookup.group.roster.totalMemberCount).toBe(
      1
    );
  });

  it("regroups RSVP responses after setEventResponse", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    const created = adapter.createEvent(eventInput(), MAYA, ANCHOR);
    expect(findListed(adapter, JORDAN, created.id)!.goingCount).toBe(1);

    adapter.setEventResponse(created.id, "GOING", JORDAN, ANCHOR);
    expect(findListed(adapter, JORDAN, created.id)!.goingCount).toBe(2);
    expect(adapter.getEventResponses(created.id, JORDAN).viewerResponse).toBe(
      "GOING"
    );

    adapter.setEventResponse(created.id, null, JORDAN, ANCHOR);
    expect(findListed(adapter, JORDAN, created.id)!.goingCount).toBe(1);
    expect(adapter.getEventResponses(created.id, JORDAN).viewerResponse).toBe(
      null
    );
  });

  it("drops stale indexes on resetDemoData", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    const created = adapter.createEvent(eventInput(), MAYA, ANCHOR);
    expect(adapter.getEvent(created.id, MAYA).status).toBe("OK");

    adapter.resetDemoData(ANCHOR);

    expect(adapter.getEvent(created.id, MAYA).status).toBe("NOT_FOUND");
    expect(findListed(adapter, MAYA, created.id)).toBeUndefined();
  });

  it("rebuilds indexes when browser storage is attached after warm-up", () => {
    const storage = new MemoryStorage();
    const writer = new LocalMockSeshAdapter({ anchorIso: ANCHOR, storage });
    const created = writer.createEvent(eventInput(), MAYA, ANCHOR);

    const reader = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    expect(reader.getEvent(created.id, MAYA).status).toBe("NOT_FOUND");

    reader.attachBrowserStorage(storage, ANCHOR);

    expect(reader.getEvent(created.id, MAYA).status).toBe("OK");
    expect(findListed(reader, MAYA, created.id)).toBeDefined();
  });
});
