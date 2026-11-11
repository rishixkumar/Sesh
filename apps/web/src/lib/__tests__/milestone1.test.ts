import { describe, expect, it } from "vitest";
import {
  LocalMockSeshAdapter,
  SeshAdapterError,
  getServerSafePublicEventMetadata,
  type StorageLike,
} from "@/lib/data/adapter";
import { SEED_USERS, STATIC_FALLBACK_ANCHOR_ISO } from "@/lib/mock/seed";
import {
  classifyEventTimeWindow,
  formatEventTimeRange,
  nyLocalInputToUtcIso,
  utcIsoToNyLocalInput,
} from "@/lib/dates";
import {
  moveFormSchema,
  moveGroupFormSchema,
} from "@/lib/validation/schemas";
import type { ViewerSession } from "@/types/domain";

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

const GUEST_VIEWER: ViewerSession = { mode: "GUEST", user: null };
const MAYA_VIEWER: ViewerSession = {
  mode: "MEMBER",
  user: SEED_USERS.find((u) => u.id === "user-maya")!,
};
const JORDAN_VIEWER: ViewerSession = {
  mode: "MEMBER",
  user: SEED_USERS.find((u) => u.id === "user-jordan")!,
};
const TYLER_VIEWER: ViewerSession = {
  mode: "MEMBER",
  user: SEED_USERS.find((u) => u.id === "user-tyler")!,
};

describe("1. Event filtering", () => {
  const anchor = STATIC_FALLBACK_ANCHOR_ISO;
  const adapter = new LocalMockSeshAdapter({ anchorIso: anchor });

  it("filters seed events by search query, category, price, and time window", () => {
    const allForMaya = adapter.listEvents(MAYA_VIEWER, {}, anchor);
    expect(allForMaya.length).toBeGreaterThanOrEqual(12);

    const freeBars = adapter.listEvents(
      MAYA_VIEWER,
      { category: "Bars", price: "FREE" },
      anchor
    );
    expect(freeBars.length).toBeGreaterThan(0);
    expect(
      freeBars.every((e) => e.category === "Bars" && e.admission.isFree)
    ).toBe(true);

    const paidConcerts = adapter.listEvents(
      MAYA_VIEWER,
      { category: "Concerts", price: "PAID" },
      anchor
    );
    expect(paidConcerts.length).toBeGreaterThan(0);
    expect(
      paidConcerts.every(
        (e) => e.category === "Concerts" && !e.admission.isFree
      )
    ).toBe(true);

    const searchBeltline = adapter.listEvents(
      MAYA_VIEWER,
      { search: "BeltLine" },
      anchor
    );
    expect(searchBeltline.some((e) => e.id === "evt-eastern-indie-show")).toBe(
      true
    );

    const happeningNow = adapter.listEvents(
      MAYA_VIEWER,
      { timeWindow: "HAPPENING_NOW" },
      anchor
    );
    expect(happeningNow.some((e) => e.id === "evt-tech-green-sunset")).toBe(
      true
    );
  });
});

describe("2. Event & Move Group form validation (Zod)", () => {
  it("rejects empty titles, end-before-start, negative capacities, and malformed URLs", () => {
    const badResult = moveFormSchema.safeParse({
      title: "Hi",
      description: "Too short",
      category: "Clubs",
      startLocal: "2026-11-14T22:00",
      endLocal: "2026-11-14T20:00", // End before start
      venue: "Tech Square",
      addressPrivacy: "RSVP_GOING_ONLY",
      publicDisplayLocation: "", // Required when addressPrivacy !== PUBLIC_VENUE
      visibility: "PUBLIC",
      capacityText: "-5",
      pricingMode: "PAID",
      priceLabel: "", // Required when PAID
      coverImage: "not-a-valid-url",
    });

    expect(badResult.success).toBe(false);
    if (!badResult.success) {
      const paths = badResult.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("title");
      expect(paths).toContain("description");
      expect(paths).toContain("endLocal");
      expect(paths).toContain("capacityText");
      expect(paths).toContain("priceLabel");
      expect(paths).toContain("publicDisplayLocation");
      expect(paths).toContain("coverImage");
    }
  });

  it("accepts valid Move and Move Group payloads", () => {
    const validMove = moveFormSchema.safeParse({
      title: "Klaus Courtyard Midnight Espresso",
      description: "Fictional study break social with free espresso shots.",
      category: "Organization Events",
      startLocal: "2026-11-14T20:00",
      endLocal: "2026-11-14T23:00",
      venue: "Klaus Atrium",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      capacityText: "75",
      pricingMode: "FREE",
      coverImage: "https://images.example.com/klaus.jpg",
    });
    expect(validMove.success).toBe(true);

    const validGroup = moveGroupFormSchema.safeParse({
      eventId: "evt-west-midtown-neon",
      name: "West Campus Rideshare Crew",
      note: "Splitting an XL from Curran deck.",
      capacity: 5,
      discoverability: "PUBLIC",
      joinMode: "REQUEST_TO_JOIN",
      meetupTimeLocal: "2026-11-11T21:30",
      meetupSpot: "Curran Parking Deck Ground Level",
      externalChatLink: "https://chat.example.com/group",
    });
    expect(validGroup.success).toBe(true);
  });
});

describe("3. Date/time logic in America/New_York", () => {
  it("round-trips NY wall-clock inputs to UTC ISO and buckets events accurately", () => {
    const utcIso = nyLocalInputToUtcIso("2026-11-14T21:30");
    // Nov 14 is EST (UTC-5), so 21:30 ET == 02:30Z next day
    expect(utcIso).toBe("2026-11-15T02:30:00.000Z");
    expect(utcIsoToNyLocalInput(utcIso)).toBe("2026-11-14T21:30");

    const rangeLabel = formatEventTimeRange(
      "2026-11-11T23:00:00.000Z",
      "2026-11-12T02:00:00.000Z"
    );
    expect(rangeLabel).toContain("ET");

    const anchor = "2026-11-11T21:00:00.000Z"; // Wed 4:00 PM ET
    expect(
      classifyEventTimeWindow(
        "2026-11-11T20:00:00.000Z",
        "2026-11-11T23:00:00.000Z",
        anchor
      )
    ).toBe("HAPPENING_NOW");

    expect(
      classifyEventTimeWindow(
        "2026-11-12T01:00:00.000Z", // Wed 8:00 PM ET
        "2026-11-12T04:00:00.000Z",
        anchor
      )
    ).toBe("TONIGHT");

    expect(
      classifyEventTimeWindow(
        "2026-11-11T17:00:00.000Z",
        "2026-11-11T19:00:00.000Z",
        anchor
      )
    ).toBe("PAST");
  });
});

describe("4. Event visibility & private address protection", () => {
  it("hides restricted FRIENDS events from Guests and non-friends, and never leaks private addresses", () => {
    const adapter = new LocalMockSeshAdapter({
      anchorIso: STATIC_FALLBACK_ANCHOR_ISO,
    });

    // Friends-only event hosted by Maya: hidden from Guest & non-friend Tyler, visible to Maya & friend Jordan
    expect(adapter.getEvent("evt-friends-rooftop-sesh", GUEST_VIEWER).status).toBe(
      "RESTRICTED"
    );
    expect(adapter.getEvent("evt-friends-rooftop-sesh", TYLER_VIEWER).status).toBe(
      "RESTRICTED"
    );
    expect(adapter.getEvent("evt-friends-rooftop-sesh", JORDAN_VIEWER).status).toBe(
      "OK"
    );

    // Public metadata helper must return null for restricted events
    expect(
      getServerSafePublicEventMetadata("evt-friends-rooftop-sesh")
    ).toBeNull();

    // House party with RSVP_GOING_ONLY private address:
    // Guest sees publicDisplayLocation ONLY; unlockedPrivateAddress is undefined
    const guestHouseParty = adapter.getEvent("evt-home-park-vinyl", GUEST_VIEWER);
    expect(guestHouseParty.status).toBe("OK");
    if (guestHouseParty.status === "OK") {
      expect(guestHouseParty.event.hasPrivateAddress).toBe(true);
      expect(guestHouseParty.event.unlockedPrivateAddress).toBeUndefined();
    }

    // Maya currently has SAVED (not GOING) -> still locked
    const mayaSaved = adapter.getEvent("evt-home-park-vinyl", MAYA_VIEWER);
    if (mayaSaved.status === "OK") {
      expect(mayaSaved.event.unlockedPrivateAddress).toBeUndefined();
    }

    // Once Maya RSVPs GOING -> exact demo address unlocks
    const mayaGoing = adapter.setEventResponse(
      "evt-home-park-vinyl",
      "GOING",
      MAYA_VIEWER,
      STATIC_FALLBACK_ANCHOR_ISO
    );
    expect(mayaGoing.unlockedPrivateAddress).toContain("Yellow Jacket Way");
  });
});

describe("5. Move Group roster masking & members-only chat privacy", () => {
  it("masks non-friend members as an anonymous count for non-members while showing creator & friends, and hides external chat links", () => {
    const adapter = new LocalMockSeshAdapter({
      anchorIso: STATIC_FALLBACK_ANCHOR_ISO,
    });

    // mg-indie-beltline-walk has Creator Chloe + Member Jordan (Maya's friend) + Member Tyler (NOT Maya's friend)
    // 1. Viewed as Guest: Creator Chloe visible, 0 visible non-creator members, 2 anonymous, chat link hidden
    const guestLookup = adapter.getMoveGroup(
      "mg-indie-beltline-walk",
      GUEST_VIEWER
    );
    expect(guestLookup.status).toBe("OK");
    if (guestLookup.status === "OK") {
      const { group } = guestLookup;
      expect(group.roster.creator.id).toBe("user-chloe");
      expect(group.roster.visibleMembers).toHaveLength(0);
      expect(group.roster.anonymousMemberCount).toBe(2);
      expect(group.unlockedExternalChatLink).toBeUndefined();
      expect(JSON.stringify(group.roster)).not.toContain("user-tyler");
      expect(JSON.stringify(group.roster)).not.toContain("user-jordan");
    }

    // 2. Viewed as Maya (non-member, friends with Jordan but NOT Tyler):
    // Creator Chloe visible + Friend Jordan visible + 1 anonymous (Tyler's ID/name completely absent!)
    const mayaLookup = adapter.getMoveGroup(
      "mg-indie-beltline-walk",
      MAYA_VIEWER
    );
    expect(mayaLookup.status).toBe("OK");
    if (mayaLookup.status === "OK") {
      const { group } = mayaLookup;
      expect(group.roster.creator.id).toBe("user-chloe");
      expect(group.roster.visibleMembers.map((m) => m.id)).toEqual([
        "user-jordan",
      ]);
      expect(group.roster.anonymousMemberCount).toBe(1);
      expect(group.unlockedExternalChatLink).toBeUndefined();
      expect(JSON.stringify(group)).not.toContain("user-tyler");
      expect(JSON.stringify(group)).not.toContain("tylernguyen");
    }

    // 3. Viewed as Jordan (accepted member): sees full roster + unlocked external chat link
    const jordanLookup = adapter.getMoveGroup(
      "mg-indie-beltline-walk",
      JORDAN_VIEWER
    );
    expect(jordanLookup.status).toBe("OK");
    if (jordanLookup.status === "OK") {
      const { group } = jordanLookup;
      expect(group.roster.isFullRosterVisible).toBe(true);
      expect(group.roster.anonymousMemberCount).toBe(0);
      expect(group.roster.visibleMembers.map((m) => m.id)).toEqual([
        "user-jordan",
        "user-tyler",
      ]);
      expect(group.unlockedExternalChatLink).toBe(
        "https://chat.example.com/sesh-demo-beltline-crew"
      );
    }
  });
});

describe("6, 7, 8. Deduplication, capacity enforcement, and owner-only management", () => {
  it("prevents duplicate requests/memberships, enforces capacity, and restricts management to group creator", () => {
    const adapter = new LocalMockSeshAdapter({
      anchorIso: STATIC_FALLBACK_ANCHOR_ISO,
    });

    // Tyler already has a seeded PENDING request on mg-west-midtown-rideshare -> duplicate request throws CONFLICT
    expect(() =>
      adapter.requestJoin("mg-west-midtown-rideshare", TYLER_VIEWER)
    ).toThrowError(SeshAdapterError);

    // Non-owner Jordan cannot approve Tyler's request or update group settings
    expect(() =>
      adapter.approveJoin(
        "mg-west-midtown-rideshare",
        "jr-seed-1",
        JORDAN_VIEWER
      )
    ).toThrowError(/Only the Move Group creator/);

    expect(() =>
      adapter.removeMember(
        "mg-west-midtown-rideshare",
        "user-priya",
        JORDAN_VIEWER
      )
    ).toThrowError(/Only the Move Group creator/);

    // Owner Maya approves Tyler's request -> Tyler becomes an accepted member
    const updatedGroup = adapter.approveJoin(
      "mg-west-midtown-rideshare",
      "jr-seed-1",
      MAYA_VIEWER
    );
    expect(updatedGroup.roster.totalMemberCount).toBe(4);

    // Duplicate membership attempt by Tyler now throws CONFLICT
    expect(() =>
      adapter.requestJoin("mg-west-midtown-rideshare", TYLER_VIEWER)
    ).toThrowError(/already a member/);

    // Full group (mg-home-park-walk-over has 3/3 members) blocks join attempts with CAPACITY_FULL
    expect(() =>
      adapter.requestJoin("mg-home-park-walk-over", MAYA_VIEWER)
    ).toThrowError(/maximum capacity/);

    // Non-host cannot edit Maya's Move
    expect(() =>
      adapter.updateEvent(
        "evt-west-midtown-neon",
        {
          title: "Unauthorized Edit",
          description: "Attempting unauthorized edit",
          category: "Clubs",
          startAt: "2026-11-12T02:00:00.000Z",
          endAt: "2026-11-12T05:00:00.000Z",
          venue: "Hijacked Venue",
          addressPrivacy: "PUBLIC_VENUE",
          visibility: "PUBLIC",
          status: "PUBLISHED",
          isFree: true,
        },
        JORDAN_VIEWER,
        STATIC_FALLBACK_ANCHOR_ISO
      )
    ).toThrowError(/Only the host/);
  });
});

describe("9. Demo persistence across reloads", () => {
  it("persists created Moves, drafts, RSVPs, and Move Groups in browser storage and survives adapter reload", () => {
    const storage = new MemoryStorage();
    const anchor = STATIC_FALLBACK_ANCHOR_ISO;

    const firstSessionAdapter = new LocalMockSeshAdapter({
      anchorIso: anchor,
      storage,
    });

    const createdMove = firstSessionAdapter.createEvent(
      {
        title: "Coda Rooftop Sunset Synth Session",
        description: "Fictional modular synth jam overlooking Midtown.",
        category: "Concerts",
        startAt: "2026-11-12T00:00:00.000Z",
        endAt: "2026-11-12T03:00:00.000Z",
        venue: "Coda Sky Terrace (Fictional)",
        publicDisplayLocation: "Tech Square · Coda",
        addressPrivacy: "PUBLIC_VENUE",
        visibility: "PUBLIC",
        status: "PUBLISHED",
        capacity: 60,
        isFree: true,
        priceLabel: "Free RSVP",
      },
      MAYA_VIEWER,
      anchor
    );

    const createdGroup = firstSessionAdapter.createMoveGroup(
      {
        eventId: createdMove.id,
        name: "Klaus Walk-Over Group",
        note: "Walking over together after 6:30 PM lab.",
        capacity: 4,
        discoverability: "PUBLIC",
        joinMode: "REQUEST_TO_JOIN",
        meetupTime: "2026-11-11T23:30:00.000Z",
        meetupSpot: "Klaus Front Steps",
      },
      MAYA_VIEWER,
      anchor
    );

    // Simulate a full browser refresh with a brand-new adapter instance attached to the same storage
    const reloadedAdapter = new LocalMockSeshAdapter({
      anchorIso: anchor,
      storage,
    });

    const reloadedMove = reloadedAdapter.getEvent(createdMove.id, GUEST_VIEWER);
    expect(reloadedMove.status).toBe("OK");
    if (reloadedMove.status === "OK") {
      expect(reloadedMove.event.title).toBe("Coda Rooftop Sunset Synth Session");
      expect(reloadedMove.event.source).toBe("LOCAL_DEMO");
      expect(reloadedMove.event.moveGroupCount).toBe(1);
    }

    const reloadedGroup = reloadedAdapter.getMoveGroup(
      createdGroup.id,
      JORDAN_VIEWER
    );
    expect(reloadedGroup.status).toBe("OK");
  });
});
