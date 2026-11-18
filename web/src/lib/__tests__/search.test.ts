import { describe, expect, it } from "vitest";
import { Trie } from "@/lib/search/trie";
import { SearchIndex, tokenize } from "@/lib/search/search-index";
import { LocalMockSeshAdapter } from "@/lib/data/adapter";
import { SEED_USERS, STATIC_FALLBACK_ANCHOR_ISO } from "@/lib/mock/seed";
import type { ViewerSession } from "@/types/domain";

const ANCHOR = STATIC_FALLBACK_ANCHOR_ISO;
const MAYA: ViewerSession = {
  mode: "MEMBER",
  user: SEED_USERS.find((u) => u.id === "user-maya")!,
};

describe("Trie", () => {
  const trie = new Trie<string>();
  trie.insert("tech", "a");
  trie.insert("techno", "b");
  trie.insert("team", "c");

  it("returns every value whose key starts with the prefix", () => {
    expect([...trie.withPrefix("te")].sort()).toEqual(["a", "b", "c"]);
    expect([...trie.withPrefix("tech")].sort()).toEqual(["a", "b"]);
    expect([...trie.withPrefix("techno")]).toEqual(["b"]);
    expect(trie.withPrefix("x").size).toBe(0);
    expect(trie.withPrefix("").size).toBe(3);
  });

  it("walks Unicode code points, not UTF-16 units", () => {
    const emoji = new Trie<number>();
    emoji.insert("🎵beats", 1);
    expect([...emoji.withPrefix("🎵")]).toEqual([1]);
  });
});

describe("SearchIndex", () => {
  const index = new SearchIndex<string>();
  index.add("beltline", "Eastern Indie Show on the BeltLine");
  index.add("square", "Tech Square Rooftop · @gt_ramblinnights");
  index.add("cafe", "Café Señor — late-night tacos");

  it("splits text into letter/digit runs", () => {
    expect(tokenize("tech-square @gt_ramblin 2026")).toEqual([
      "tech",
      "square",
      "gt",
      "ramblin",
      "2026",
    ]);
  });

  it("matches case-insensitive substrings, including mid-word", () => {
    expect([...index.search("beltline")]).toEqual(["beltline"]);
    expect([...index.search("ELTLIN")]).toEqual(["beltline"]);
    expect([...index.search("ramblin")]).toEqual(["square"]);
    expect([...index.search("señor")]).toEqual(["cafe"]);
  });

  it("requires the exact phrase across tokens and punctuation", () => {
    expect([...index.search("tech square")]).toEqual(["square"]);
    expect(index.search("square tech").size).toBe(0);
    expect([...index.search("@gt_")]).toEqual(["square"]);
    expect([...index.search(" · ")]).toEqual(["square"]);
  });

  it("falls back to a scan for queries without letters or digits", () => {
    expect([...index.search("—")]).toEqual(["cafe"]);
    expect(index.search("%%").size).toBe(0);
  });

  it("agrees with String#includes on randomized queries", () => {
    const docs = [
      "Buzz After Dark: Warehouse House & UKG Night",
      "Home Park vinyl kickback — BYOB, 21+",
      "Klaus late-night survivor social",
      "Tech Green Sunset Beats & Mocktails",
    ];
    const randomIndex = new SearchIndex<number>();
    docs.forEach((doc, i) => randomIndex.add(i, doc));

    let seed = 42;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };

    for (let trial = 0; trial < 2000; trial += 1) {
      const doc = docs[Math.floor(random() * docs.length)];
      const start = Math.floor(random() * doc.length);
      const length = 1 + Math.floor(random() * 12);
      let query = doc.slice(start, start + length);
      if (random() < 0.3) query = query.toUpperCase();
      if (random() < 0.2) query += "z";

      const expected = docs
        .map((d, i) => (d.toLowerCase().includes(query.toLowerCase()) ? i : -1))
        .filter((i) => i >= 0);
      expect([...randomIndex.search(query)].sort()).toEqual(expected);
    }
  });
});

describe("adapter event search index", () => {
  const titleSearch = (adapter: LocalMockSeshAdapter, search: string) =>
    adapter.listEvents(MAYA, { search }, ANCHOR).map((e) => e.id);

  it("indexes new events and reindexes edits", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    expect(titleSearch(adapter, "zephyr")).toEqual([]);

    const created = adapter.createEvent(
      {
        title: "Zephyr Rooftop Listening Party",
        description: "Fictional listening session.",
        category: "Concerts",
        startAt: "2026-11-12T00:00:00.000Z",
        endAt: "2026-11-12T03:00:00.000Z",
        venue: "Klaus Atrium",
        addressPrivacy: "PUBLIC_VENUE",
        visibility: "PUBLIC",
        status: "PUBLISHED",
        isFree: true,
      },
      MAYA,
      ANCHOR
    );
    expect(titleSearch(adapter, "zephyr")).toEqual([created.id]);

    adapter.updateEvent(
      created.id,
      {
        title: "Renamed Listening Party",
        description: "Fictional listening session.",
        category: "Concerts",
        startAt: "2026-11-12T00:00:00.000Z",
        endAt: "2026-11-12T03:00:00.000Z",
        venue: "Klaus Atrium",
        addressPrivacy: "PUBLIC_VENUE",
        visibility: "PUBLIC",
        status: "PUBLISHED",
        isFree: true,
      },
      MAYA,
      ANCHOR
    );
    expect(titleSearch(adapter, "zephyr")).toEqual([]);
    expect(titleSearch(adapter, "renamed listening")).toEqual([created.id]);
  });

  it("matches host display names and usernames", () => {
    const adapter = new LocalMockSeshAdapter({ anchorIso: ANCHOR });
    const maya = SEED_USERS.find((u) => u.id === "user-maya")!;
    const hosted = adapter
      .listEvents(MAYA, {}, ANCHOR)
      .filter((e) => e.hostId === maya.id)
      .map((e) => e.id);

    expect(hosted.length).toBeGreaterThan(0);
    expect(titleSearch(adapter, maya.username)).toEqual(
      expect.arrayContaining(hosted)
    );
    expect(titleSearch(adapter, maya.displayName)).toEqual(
      expect.arrayContaining(hosted)
    );
  });
});
