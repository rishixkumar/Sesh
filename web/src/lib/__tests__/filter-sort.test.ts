import { describe, expect, it } from "vitest";
import { compareBy, thenBy } from "@/lib/collections/comparators";
import { FilterPipeline } from "@/lib/collections/filter-pipeline";
import { EventCollection } from "@/lib/events/event-collection";
import {
  buildEventFilterPipeline,
  byStartTime,
  hasActiveEventFilters,
} from "@/lib/events-filter";
import { LocalMockSeshAdapter } from "@/lib/data/adapter";
import { SEED_USERS, STATIC_FALLBACK_ANCHOR_ISO } from "@/lib/mock/seed";
import type { ViewerSession } from "@/types/domain";

const ANCHOR = STATIC_FALLBACK_ANCHOR_ISO;
const MAYA: ViewerSession = {
  mode: "MEMBER",
  user: SEED_USERS.find((u) => u.id === "user-maya")!,
};

describe("comparators", () => {
  const rows = [
    { name: "b", n: 2 },
    { name: "a", n: 1 },
    { name: "c", n: 2 },
    { name: "a", n: 3 },
  ];

  it("sorts by numeric and string keys in either direction", () => {
    expect(rows.toSorted(compareBy((r) => r.n)).map((r) => r.n)).toEqual([
      1, 2, 2, 3,
    ]);
    expect(
      rows.toSorted(compareBy((r) => r.name, "desc")).map((r) => r.name)
    ).toEqual(["c", "b", "a", "a"]);
  });

  it("is stable for equal keys", () => {
    expect(
      rows.toSorted(compareBy((r) => r.n)).map((r) => r.name)
    ).toEqual(["a", "b", "c", "a"]);
  });

  it("breaks ties with later comparators in thenBy", () => {
    const sorted = rows.toSorted(
      thenBy(
        compareBy((r) => r.name),
        compareBy((r) => r.n, "desc")
      )
    );
    expect(sorted.map((r) => `${r.name}${r.n}`)).toEqual([
      "a3",
      "a1",
      "b2",
      "c2",
    ]);
  });
});

describe("FilterPipeline", () => {
  it("AND-composes stages in order and short-circuits on rejection", () => {
    const calls: string[] = [];
    const pipeline = FilterPipeline.empty<number>()
      .where("even", (n) => {
        calls.push(`even:${n}`);
        return n % 2 === 0;
      })
      .where("big", (n) => {
        calls.push(`big:${n}`);
        return n > 2;
      });

    expect(pipeline.apply([1, 2, 4])).toEqual([4]);
    expect(calls).toEqual(["even:1", "even:2", "big:2", "even:4", "big:4"]);
  });

  it("skips disabled stages and never mutates the original pipeline", () => {
    const base = FilterPipeline.empty<number>().where("positive", (n) => n > 0);
    const extended = base.whereIf(false, "never", () => false);
    const narrowed = base.whereIf(true, "small", (n) => n < 5);

    expect(extended).toBe(base);
    expect(base.stageNames).toEqual(["positive"]);
    expect(narrowed.stageNames).toEqual(["positive", "small"]);
    expect(narrowed.apply([-1, 3, 7])).toEqual([3]);
  });

  it("only adds event stages for active criteria", () => {
    expect(buildEventFilterPipeline({}, ANCHOR).stageNames).toEqual([
      "timeWindow",
    ]);
    expect(
      buildEventFilterPipeline(
        { category: "Bars", price: "FREE", search: " Bar " },
        ANCHOR
      ).stageNames
    ).toEqual(["timeWindow", "category", "price", "search"]);
  });

  it("detects active hub filters", () => {
    expect(hasActiveEventFilters({})).toBe(false);
    expect(hasActiveEventFilters({ search: "   " })).toBe(false);
    expect(hasActiveEventFilters({ price: "PAID" })).toBe(true);
    expect(hasActiveEventFilters({ timeWindow: "TONIGHT" })).toBe(true);
  });
});

describe("EventCollection", () => {
  const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
  const all = adapter.listEvents(
    MAYA,
    { includeDraftsOwnedByViewer: true },
    ANCHOR
  );
  const events = EventCollection.from(all);

  it("filters with the same results as the adapter", () => {
    const criteria = { category: "Concerts" as const, price: "PAID" as const };
    expect(events.filter(criteria, ANCHOR).toArray()).toEqual(
      adapter.listEvents(MAYA, criteria, ANCHOR)
    );
  });

  it("answers profile queries", () => {
    expect(events.hostedBy("user-maya").size).toBe(
      all.filter((e) => e.hostId === "user-maya").length
    );
    expect(events.hostedBy("user-maya").size).toBeGreaterThan(0);
    expect(
      events.withViewerResponse().toArray().every((e) => e.viewerResponse)
    ).toBe(true);
    expect(
      events
        .withViewerResponse("GOING")
        .toArray()
        .every((e) => e.viewerResponse === "GOING")
    ).toBe(true);
  });

  it("sorts without mutating and chains queries", () => {
    const newestFirst = events.sortBy((a, b) => byStartTime(b, a));
    expect(newestFirst.first()?.id).toBe(all.at(-1)?.id);
    expect(events.first()?.id).toBe(all[0]?.id);
    expect([...events].length).toBe(all.length);
  });

  it("groups into hub time sections", () => {
    const sections = events.groupByTimeSection(ANCHOR);
    const sectioned =
      sections.happeningNow.length +
      sections.tonight.length +
      sections.thisWeekend.length +
      sections.upcoming.length +
      sections.drafts.length;
    expect(sectioned).toBe(all.length);
  });
});
