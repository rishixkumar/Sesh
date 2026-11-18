import { describe, expect, it } from "vitest";
import { groupBy, indexBy } from "@/lib/collections";

describe("indexBy", () => {
  it("builds an O(1) lookup map keyed by the selector", () => {
    const items = [
      { id: "a", n: 1 },
      { id: "b", n: 2 },
    ];
    const index = indexBy(items, (i) => i.id);
    expect(index.size).toBe(2);
    expect(index.get("b")).toBe(items[1]);
    expect(index.get("missing")).toBeUndefined();
  });

  it("resolves duplicate keys last-write-wins", () => {
    const index = indexBy(
      [
        { id: "x", v: "first" },
        { id: "x", v: "second" },
      ],
      (i) => i.id
    );
    expect(index.size).toBe(1);
    expect(index.get("x")?.v).toBe("second");
  });

  it("accepts any iterable", () => {
    const index = indexBy(new Set([1, 2, 3]), (n) => n * 10);
    expect([...index.keys()]).toEqual([10, 20, 30]);
  });
});

describe("groupBy", () => {
  it("buckets items in one pass, preserving input order within and across groups", () => {
    const rows = [
      { eventId: "e2", user: "u1" },
      { eventId: "e1", user: "u2" },
      { eventId: "e2", user: "u3" },
    ];
    const groups = groupBy(rows, (r) => r.eventId);
    expect([...groups.keys()]).toEqual(["e2", "e1"]);
    expect(groups.get("e2")?.map((r) => r.user)).toEqual(["u1", "u3"]);
    expect(groups.get("e1")?.map((r) => r.user)).toEqual(["u2"]);
  });

  it("returns an empty map for empty input", () => {
    expect(groupBy([], (x: string) => x).size).toBe(0);
  });
});
