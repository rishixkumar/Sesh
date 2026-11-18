[Root README](../../README.md) · **Data Structures & Algorithms Index**

---

# Data Structures & Algorithms Integration — Technical Reference

```ts
/**
 * @packageDocumentation
 * @track DS/Alg integrations (branch `ds-alg-integrations`)
 * @workspace @sesh/web (`web`)
 * @goal Rebuild Sesh's domain logic on explicit, reusable data structures and algorithms
 *       (hash maps, graphs, aggregation, filter/sort pipelines, search indexes, heaps/queues)
 *       encapsulated in classes and pure modules under `web/src/lib/`.
 * @integrations DS-01 … DS-06 (implemented sequentially; each builds on the previous)
 * @status DS-01 – DS-06 Verified (`npm test` 68/68 · `npm run lint` 0 errors · `tsc` 0 errors · `npm run build` 14/14 routes)
 */
```

---

## Ground Rules

1. **Behavior is preserved.** Every integration must keep existing viewer-facing behavior and the Milestone 1 privacy invariants (`web/src/lib/__tests__/milestone1.test.ts`) passing unchanged.
2. **Records stay behind the projection boundary.** New structures operate on `*Record` data inside the adapter/policies, or on viewer-safe `*View` data in the UI — never leak records to components.
3. **Classes for stateful structures, pure functions for policies.** Graphs, collections, indexes, and queues are classes; visibility/privacy rules remain pure functions.
4. **No persisted-format changes.** `PersistedOverlayState` (`schemaVersion: 1`) in browser storage is not modified.
5. **Every integration ships with tests** and passes `npm test`, `npm run lint`, `npx tsc --noEmit -p web`, and `npm run build`.

---

## Integration Index

| ID | Data Structure Family | Primary Structures / Algorithms | Status |
| --- | --- | --- | --- |
| **`DS-01`** | **Hash Maps & Sets** | `Map` indexes, single-pass `groupBy` / `indexBy`, lazy cache + invalidation | ✅ Done |
| **`DS-02`** | **Graph** | Directed adjacency list `Map<userId, Set<userId>>`, edge checks, set intersection, BFS + FIFO queue | ✅ Done |
| **`DS-03`** | **Aggregation Maps** | Single-pass group-by + count (`Map<eventId, RsvpTally>`), per-friend tallies, shared roster presenter | ✅ Done |
| **`DS-04`** | **Filter Pipeline & Sorting** | Immutable short-circuit predicate pipeline, stable multi-key comparators, `EventCollection` | ✅ Done |
| **`DS-05`** | **Search Index & Trie** | Suffix-trie inverted index, posting-set intersection, exact substring semantics | ✅ Done |
| **`DS-06`** | **Queue & Binary Heap** | Binary-heap priority queue, stable top-K selection, prioritized `ActivityFeed` | ✅ Done |

> **Deferred:** spatial indexing (grid hash / KD-tree) for the Map page — events have no coordinates yet, so there is nothing to index.

---

## DS-01 — Hash Maps & Sets ✅

```ts
/**
 * @module lib/collections
 * @description Generic single-pass hash-map builders reused across the adapter and later integrations.
 */
export function indexBy<T, K>(items: Iterable<T>, keyFn: (item: T) => K): Map<K, T>;   // unique key -> item, last-write-wins
export function groupBy<T, K>(items: Iterable<T>, keyFn: (item: T) => K): Map<K, T[]>; // key -> bucket, input order preserved
```

**Why:** `LocalMockSeshAdapter` resolved almost every lookup with linear `.find` / `.filter` scans, and `getAllEventRecords()` regenerated the full seed dataset on every call.

**Indexes added to `LocalMockSeshAdapter`** (`web/src/lib/data/adapter.ts`):

| Lookup | Before | After |
| --- | --- | --- |
| Seed events | `createSeedDataset()` on every call | Cached per `anchorIso` |
| Event by id | `O(E)` scan | `Map<eventId, EventRecord>` — `O(1)` |
| Move Group by id (8 methods) | `O(G)` scan | `Map<groupId, MoveGroupRecord>` via `findActiveMoveGroup()` — `O(1)` |
| Move Groups per event | `O(G)` filter per event | `groupBy` → `Map<eventId, MoveGroupRecord[]>` |
| RSVP responses per event | `O(R)` filter per event | `groupBy` → `Map<eventId, EventResponse[]>` |
| `listMoveGroups(eventId)` | Filter all groups | Read the event's bucket |

`listEvents` drops from `O(E × (G + R))` to `O(E + G + R)`.

**Cache invalidation:** indexes are built lazily and dropped wholesale by `invalidateIndexes()`:
- `commit()` — called after every mutation (11 write methods): invalidate → persist → notify subscribers.
- `replaceState()` — called whenever state is swapped (`attachBrowserStorage`, `resetDemoData`).

**Sets:** used only where they remove repeated scans. Small allowlists (`invitedUserIds`, `customAllowedUserIds`, `joinRequests`) intentionally stay arrays — converting them per call costs more than scanning. Friend lists become sets in `DS-02`.

**Tests:** `collections.test.ts` (5) + `adapter-indexes.test.ts` (7) covering freshness after create, seed edit, move group create/disband, join/leave, RSVP set/clear, reset, and storage attach. Disabling invalidation fails 6 of the 7 adapter tests.

---

## DS-02 — Graph ✅

```ts
/**
 * @module lib/social/friendship-graph
 * @description Campus social graph as a directed adjacency list. Edge `A -> B` means A lists B in `friendIds`.
 */
export class FriendshipGraph {
  static fromUsers(users: Iterable<Pick<User, "id" | "friendIds">>): FriendshipGraph;
  hasEdge(fromId: string, toId: string): boolean;          // O(1), one direction
  areConnected(userAId: string, userBId: string): boolean;  // O(1), either direction
  friendsOf(userId: string): ReadonlySet<string>;
  degree(userId: string): number;
  mutualFriends(userAId: string, userBId: string): string[];             // set intersection, O(min(deg))
  partition<T extends { id: string }>(viewerId: string, candidates: Iterable<T>): { friends: T[]; others: T[] };
  suggestFriends(userId: string, options?: { maxDepth?: number }): FriendSuggestion[]; // BFS, O(V + E)
}

/** @module lib/collections/queue — FIFO queue, amortized O(1) enqueue/dequeue (head pointer + compaction). */
export class Queue<T> { enqueue(item: T): void; dequeue(): T | undefined; peek(): T | undefined; size: number; isEmpty(): boolean; }
```

**Why:** friendship was checked with `friendIds.includes(...)` scattered across five privacy rules, some checking only the viewer's list and others accepting either direction. The graph centralizes those checks in one structure with `O(1)` set lookups.

**Directed edges preserve each rule's exact semantics:**

| Privacy rule (`web/src/lib/permissions/policies.ts`) | Before | After |
| --- | --- | --- |
| `FRIENDS` event visibility (`canViewEvent`) | viewer lists host **or** host lists viewer | `graph.areConnected(viewer, host)` |
| `MY_NETWORK` group — friend of creator | viewer lists creator **or** creator lists viewer | `graph.areConnected(viewer, creator)` |
| `MY_NETWORK` group — friend in group | viewer lists member | `graph.hasEdge(viewer, member)` |
| Roster reveal + `isFriend` flags | viewer lists member | `graph.hasEdge(viewer, member)` |
| `friendsGoing` on events | viewer lists attendee | `graph.hasEdge(viewer, attendee)` |

`canViewEvent`, `canViewMoveGroup`, `projectEventForViewer`, `projectMoveGroupRoster`, and `projectMoveGroupForViewer` now take a `graph` argument instead of looking up host/creator `User` objects for their friend lists. `LocalMockSeshAdapter` builds one graph at construction and passes it to every projection. The unused `areFriends` helper was removed.

**Friends page (`web/src/app/(app)/friends/page.tsx`):**
- Friends vs. other campus members → `graph.partition()`.
- Each non-friend shows **"N mutual friends"** → `graph.mutualFriends()` via suggestions.
- Non-friends are **ordered by friend-of-friend BFS** (`suggestFriends`, depth 3): most mutual friends first, then fewest hops. For Maya: Chloe (2 mutual, 2 hops) → Ramblin' Nights (1 mutual, 2 hops) → Tyler (0 mutual, 3 hops).

**Verification:**
- Behavior equivalence: every `listEvents`, `getEvent`, `listMoveGroups`, and `getMoveGroup` result for Guest + all 7 seed users was serialized on `Production` and on this branch — **byte-for-byte identical**.
- `friendship-graph.test.ts` (9): queue FIFO + compaction, directed vs. undirected edges, unknown users, mutual friends, partition, depth-bounded BFS, ranking, and the seed network.

---

## DS-03 — Aggregation Maps ✅

```ts
/** @module lib/events/rsvp-aggregator — one O(R) pass over the RSVP table -> Map<eventId, RsvpTally>. */
export interface RsvpTally {
  goingCount: number; interestedCount: number; savedCount: number;
  goingUserIds: string[];                                   // response-table order
  responseByUserId: ReadonlyMap<string, EventResponseType>; // first row wins on duplicates
}
export class RsvpAggregator {
  static fromResponses(responses: Iterable<EventResponse>): RsvpAggregator;
  forEvent(eventId: string): RsvpTally;                                            // O(1)
  viewerResponse(eventId: string, viewerId: string | null): EventResponseType | null; // O(1)
}

/** @module lib/social/friend-activity — single pass over events for every friend's stats. */
export function tallyFriendActivity(events: Iterable<EventView>, friendIds: Iterable<string>): (friendId: string) => FriendActivity;

/** @module lib/move-groups/roster-presenter — shared roster text from a projected (already masked) roster. */
export function summarizeRoster(roster: MoveGroupRosterProjection): RosterBreakdown;
export function describeRoster(roster: MoveGroupRosterProjection): string;
```

| Feature | Before | After |
| --- | --- | --- |
| RSVP counts + viewer response + friends going (`projectEventForViewer`) | 4 filters + 1 find over the event's responses | Read one precomputed `RsvpTally` |
| `getEventResponses` | Duplicated the same 4 scans | `RsvpAggregator.forEvent` / `viewerResponse` |
| Adapter cache | `Map<eventId, EventResponse[]>` | Cached `RsvpAggregator`, cleared by `invalidateIndexes()` |
| Friends page "Hosting N / Going to N / Next Move" | Two full event scans per friend — `O(F × E)` | `tallyFriendActivity` — `O(E + F)` |
| Roster text on event Move Group cards + group cards | Duplicated inline in two components | `describeRoster` / `summarizeRoster` |

`projectEventForViewer` now takes `rsvp: RsvpTally` instead of a raw response array. The host-summary fallback was extracted to `toEventHostSummary` (reused by the DS-05 search index).

**Tests:** `aggregation.test.ts` (9) — counts, empty tallies, O(1) viewer lookup, duplicate rows, friend activity tally, and every roster text branch.

---

## DS-04 — Filter Pipeline & Sorting ✅

```ts
/** @module lib/collections/comparators */
export type Comparator<T> = (a: T, b: T) => number;
export function compareBy<T>(keyFn: (item: T) => number | string, direction?: "asc" | "desc"): Comparator<T>;
export function thenBy<T>(...comparators: Comparator<T>[]): Comparator<T>; // multi-key, first non-zero wins
export function isoTime(iso: string): number;

/** @module lib/collections/filter-pipeline — immutable, ordered AND-composition with short-circuit. */
export class FilterPipeline<T> {
  static empty<T>(): FilterPipeline<T>;
  where(name: string, test: Predicate<T>): FilterPipeline<T>;
  whereIf(enabled: boolean, name: string, test: Predicate<T>): FilterPipeline<T>;
  test(item: T): boolean;
  apply(items: Iterable<T>): T[];
}

/** @module lib/events/event-collection — immutable, chainable queries over EventView[]. */
export class EventCollection implements Iterable<EventView> {
  static from(events: Iterable<EventView>): EventCollection;
  filter(criteria: EventFilterCriteria, nowIso: string): EventCollection;
  where(predicate: Predicate<EventView>): EventCollection;
  sortBy(...comparators: Comparator<EventView>[]): EventCollection; // stable
  hostedBy(userId: string): EventCollection;
  withViewerResponse(...types: EventResponseType[]): EventCollection;
  groupByTimeSection(nowIso: string): GroupedEventsHubSections;
  toArray(): EventView[]; first(): EventView | undefined; size: number;
}
```

**`filterEvents` rebuilt on `buildEventFilterPipeline`:** stages run cheapest first — `timeWindow` (always on: even "All times" excludes past events) → `category` → `price` → `search`. Inactive filters add no stage. Drafts bypass the pipeline exactly as before (listed only for their host when requested). Sorting uses the stable `byStartTime` comparator; the adapter's Move Group list uses `byMeetupTime`.

| Call site | Change |
| --- | --- |
| `events-hub.tsx` | `EventCollection…groupByTimeSection`, `hasActiveEventFilters(criteria)`, and a `TIME_WINDOW_SECTION_KEY` lookup replacing the `switch` |
| `profile/page.tsx` | `hostedBy(userId)` and `withViewerResponse()` replace inline filters |
| `events-filter.ts` | `groupEventsByTimeSection` uses `TIME_WINDOW_SECTION_KEY` instead of a `switch` |
| `adapter.ts` | `listMoveGroups` sorts with `compareBy(isoTime(meetupTime))` |

**Tests:** `filter-sort.test.ts` (11) — numeric/string/desc keys, stability, multi-key ties, short-circuit order, `whereIf` immutability, active stages per criteria, active-filter detection, and `EventCollection` parity with the adapter.

---

## DS-05 — Search Index & Trie ✅

```ts
/** @module lib/search/trie — code-point trie; each node stores the values of every key beneath it. */
export class Trie<V> {
  insert(key: string, value: V): void;          // O(key length)
  withPrefix(prefix: string): ReadonlySet<V>;   // O(prefix length), no subtree walk
}

/** @module lib/search/search-index — suffix-trie inverted index with exact substring semantics. */
export function tokenize(text: string): string[]; // maximal runs of \p{L}\p{N}
export class SearchIndex<Id> {
  add(id: Id, text: string): void;   // inserts every suffix of every token
  search(query: string): Set<Id>;    // posting-set intersection, then full-text verification
}
```

**Algorithm:** every suffix of every token is inserted into the trie, which makes it a **suffix trie** — a query token occurs inside a document token exactly when it is a prefix of one of that token's suffixes. `search` tokenizes the query, intersects the posting sets smallest-first, then confirms each candidate with `text.includes(query)`. Because every letter/digit run of a matching query must sit inside a token of the document, the candidate set is always a superset of the true matches, so results are **identical** to the previous linear substring search — including mid-word queries (`"eltline"`), multi-word phrases, and punctuation. Queries with no letters or digits fall back to a scan.

| Feature | Before | After |
| --- | --- | --- |
| Events Hub / header / Map `?q=` search | Rebuild and scan a lowercase haystack for every event on every keystroke | Adapter caches a `SearchIndex` over event records (cleared by `invalidateIndexes()`); `filterEvents` receives `searchMatches` and the pipeline's search stage becomes an O(1) set lookup |
| Friends page | No search | New **people search** (name or `@username`) over a `SearchIndex` of campus members; filters both friend and non-friend lists |

The index text is built with the same `eventSearchText` + `toEventHostSummary` used by the viewer projection, so indexed fields match what users see.

**Tests:** `search.test.ts` (9) — trie prefixes and code points, tokenizer, mid-word / phrase / punctuation / no-token queries, **2,000 randomized queries checked against `String#includes`**, and adapter reindexing after create and edit.

---

## DS-03 – DS-05 Verification

- **Behavior equivalence vs. `Production`:** for 3 reference clocks × Guest + 7 seed users, every `listEvents`, `getEvent`, `getEventResponses`, `listMoveGroups` (all and per event), and `getMoveGroup` result, plus `listEvents` for **6,720 filter combinations per viewer** (28 search strings incl. mid-word, punctuation, whitespace, and no-match queries × 5 time windows × 3 prices × 8 categories × drafts on/off), was serialized on `Production` and on this branch after each integration — **byte-for-byte identical** after DS-03, DS-04, and DS-05.
- **Browser:** Hub `?q=eltline` returns both BeltLine events; Friends people search (`@ki` → Chloe Kim) and per-friend stats render; event detail roster text and RSVP counts render unchanged.

---

## DS-06 — Queue & Binary Heap ✅

```ts
/** @module lib/collections/priority-queue — array-backed binary heap. */
export class PriorityQueue<T> {
  constructor(compare: Comparator<T>);                                  // compare(a, b) < 0 => a served first
  static from<T>(items: Iterable<T>, compare: Comparator<T>): PriorityQueue<T>; // bottom-up heapify, O(n)
  push(item: T): void;              // O(log n) sift-up
  pop(): T | undefined;             // O(log n) sift-down
  replaceTop(item: T): T | undefined; // pop + push in one sift
  peek(): T | undefined; size: number; isEmpty(): boolean;
  drain(): T[];                     // heap sort, O(n log n)
}

/** Stable top-K: equals `toSorted(compare).slice(0, k)` in O(n log k) time, O(k) space. */
export function topK<T>(items: Iterable<T>, k: number, compare: Comparator<T>): T[];

/** @module lib/notifications/activity-feed — classify -> prioritize -> order. */
export class ActivityFeed {
  static build(input: { moveGroups: readonly MoveGroupView[]; events: readonly EventView[]; upcomingLimit?: number }): ActivityFeed;
  static empty(): ActivityFeed;
  readonly items: readonly ActivityItem[]; // HOST_REQUEST | PENDING_JOIN | UPCOMING_GOING
  size: number;
  countOf(kind: ActivityKind): number;
}
```

**Algorithms:**
- **Top-K:** a bounded *max*-heap of size `k` keeps the worst retained item at the root. Each new item is compared with the root in O(1) and replaces it in O(log k) only if it ranks better. A hidden sequence number breaks ties, so results match a stable sort.
- **Feed ordering:** every item is ranked `(kind priority, arrival sequence)` — pending host requests → my pending joins → upcoming Going RSVPs (capped at 3 via `topK` by start time) — and heapified then drained.

| Feature | Before | After |
| --- | --- | --- |
| Notifications page (`app/notifications/page.tsx`) | Three inline arrays (`flatMap` / `filter` / `filter + slice`) rendered in three separate blocks | One `ActivityFeed`; the page renders `feed.items` with a `switch` on `kind` (card markup unchanged) |
| Upcoming Going list | Filter all events, then `slice(0, 3)` | `topK(going, 3, byStartTime)` |
| Header bell badge (`site-header.tsx`) | Its own `reduce` over pending requests | `ActivityFeed.countOf("HOST_REQUEST")` — same classification as the page |

The FIFO `Queue` from DS-02 was not needed here: all feed items are known up front, so a heap alone handles the ordering.

**Tests:** `priority-queue.test.ts` (10):
- Heap order, `peek` / `size`, heapify, max-heap comparators, and `replaceTop`.
- 300 randomized push/pop/heapify workloads checked against `toSorted`.
- 500 randomized `topK` runs checked against a stable `toSorted().slice()`, including ties and edge-case `k` values.
- `ActivityFeed` output matched a copy of the old inline page logic for all 7 seed members × 3 clocks, on seed data and again after every member sends join requests.

Mutation check: breaking the heap's sift-down failed 6 tests, and removing `topK`'s tie-break failed 1.

**Browser:** `/notifications` as Maya Patel shows 4 items (1 host request, then 3 Going RSVPs in start-time order), and the header badge reads 1.

---

[Root README](../../README.md) · **Data Structures & Algorithms Index**
