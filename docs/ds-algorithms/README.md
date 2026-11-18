[Root README](../../README.md) · **Data Structures & Algorithms Index**

---

# Data Structures & Algorithms Integration — Technical Reference

```ts
/**
 * @packageDocumentation
 * @track DS/Alg integrations (branch `ds-alg-integrations`)
 * @workspace @sesh/web (`apps/web`)
 * @goal Rebuild Sesh's domain logic on explicit, reusable data structures and algorithms
 *       (hash maps, graphs, aggregation, filter/sort pipelines, search indexes, heaps/queues)
 *       encapsulated in classes and pure modules under `apps/web/src/lib/`.
 * @integrations DS-01 … DS-06 (implemented sequentially; each builds on the previous)
 * @status DS-01, DS-02 Verified (`npm test` 29/29 · `npm run lint` 0 errors · `tsc` 0 errors · `npm run build` 14/14 routes)
 */
```

---

## Ground Rules

1. **Behavior is preserved.** Every integration must keep existing viewer-facing behavior and the Milestone 1 privacy invariants (`apps/web/src/lib/__tests__/milestone1.test.ts`) passing unchanged.
2. **Records stay behind the projection boundary.** New structures operate on `*Record` data inside the adapter/policies, or on viewer-safe `*View` data in the UI — never leak records to components.
3. **Classes for stateful structures, pure functions for policies.** Graphs, collections, indexes, and queues are classes; visibility/privacy rules remain pure functions.
4. **No persisted-format changes.** `PersistedOverlayState` (`schemaVersion: 1`) in browser storage is not modified.
5. **Every integration ships with tests** and passes `npm test`, `npm run lint`, `npx tsc --noEmit -p apps/web`, and `npm run build`.

---

## Integration Index

| ID | Data Structure Family | Primary Structures / Algorithms | Status |
| --- | --- | --- | --- |
| **`DS-01`** | **Hash Maps & Sets** | `Map` indexes, single-pass `groupBy` / `indexBy`, lazy cache + invalidation | ✅ Done |
| **`DS-02`** | **Graph** | Directed adjacency list `Map<userId, Set<userId>>`, edge checks, set intersection, BFS + FIFO queue | ✅ Done |
| **`DS-03`** | **Aggregation Maps** | Group-by + count (`Map<eventId, counts>`), mask-and-count partitions | ⏳ Planned |
| **`DS-04`** | **Filter Pipeline & Sorting** | Composable predicate pipeline, stable multi-key comparators | ⏳ Planned |
| **`DS-05`** | **Search Index & Trie** | Inverted index (`Map<token, Set<id>>`), prefix trie, posting-list intersection | ⏳ Planned |
| **`DS-06`** | **Queue & Binary Heap** | Binary-heap priority queue, top-K selection (reuses the `DS-02` FIFO `Queue`) | ⏳ Planned |

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

**Indexes added to `LocalMockSeshAdapter`** (`apps/web/src/lib/data/adapter.ts`):

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

| Privacy rule (`apps/web/src/lib/permissions/policies.ts`) | Before | After |
| --- | --- | --- |
| `FRIENDS` event visibility (`canViewEvent`) | viewer lists host **or** host lists viewer | `graph.areConnected(viewer, host)` |
| `MY_NETWORK` group — friend of creator | viewer lists creator **or** creator lists viewer | `graph.areConnected(viewer, creator)` |
| `MY_NETWORK` group — friend in group | viewer lists member | `graph.hasEdge(viewer, member)` |
| Roster reveal + `isFriend` flags | viewer lists member | `graph.hasEdge(viewer, member)` |
| `friendsGoing` on events | viewer lists attendee | `graph.hasEdge(viewer, attendee)` |

`canViewEvent`, `canViewMoveGroup`, `projectEventForViewer`, `projectMoveGroupRoster`, and `projectMoveGroupForViewer` now take a `graph` argument instead of looking up host/creator `User` objects for their friend lists. `LocalMockSeshAdapter` builds one graph at construction and passes it to every projection. The unused `areFriends` helper was removed.

**Friends page (`apps/web/src/app/friends/page.tsx`):**
- Friends vs. other campus members → `graph.partition()`.
- Each non-friend shows **"N mutual friends"** → `graph.mutualFriends()` via suggestions.
- Non-friends are **ordered by friend-of-friend BFS** (`suggestFriends`, depth 3): most mutual friends first, then fewest hops. For Maya: Chloe (2 mutual, 2 hops) → Ramblin' Nights (1 mutual, 2 hops) → Tyler (0 mutual, 3 hops).

**Verification:**
- Behavior equivalence: every `listEvents`, `getEvent`, `listMoveGroups`, and `getMoveGroup` result for Guest + all 7 seed users was serialized on `Production` and on this branch — **byte-for-byte identical**.
- `friendship-graph.test.ts` (9): queue FIFO + compaction, directed vs. undirected edges, unknown users, mutual friends, partition, depth-bounded BFS, ranking, and the seed network.

---

## DS-03 — Aggregation Maps ⏳

| Feature | Structure | Algorithm |
| --- | --- | --- |
| `RsvpAggregator` | `Map<eventId, Record<response, count>>` + friend set | Single-pass group-by count; dedupes `projectEventForViewer` and `getEventResponses` |
| Friends page "Hosting N / Going to N" | `Map<userId, stats>` | One pass over events instead of filtering per friend |
| `RosterPresenter` | Visible list + anonymous counter | Shared roster summary text for move-group cards and the event section |

---

## DS-04 — Filter Pipeline & Sorting ⏳

| Feature | Structure | Algorithm |
| --- | --- | --- |
| `FilterPipeline` | Ordered list of predicates | AND-composition; time window, category, price, drafts |
| `EventCollection` | Wrapper over `EventView[]` | Chainable `filter` / `sort` / `groupByTimeSection` / `hostedBy` queries for Hub, Profile, Friends |
| Comparators | Comparator functions | Stable multi-key sort (default chronological; opt-in "friends going first") |

---

## DS-05 — Search Index & Trie ⏳

| Feature | Structure | Algorithm |
| --- | --- | --- |
| `SearchIndex` | Inverted index `Map<token, Set<eventId>>` | Tokenize → posting-list lookup → intersection; must match everything the current substring search matches |
| Prefix matching | Trie | Prefix walk for partial words / `@username` |
| Friends page people search | Trie + user index | Prefix search over display names and usernames |

---

## DS-06 — Queue & Binary Heap ⏳

| Feature | Structure | Algorithm |
| --- | --- | --- |
| `PriorityQueue` | Binary min/max heap | `O(log n)` push/pop; top-K selection |
| `ActivityFeed` | Priority queue + FIFO queue | Classify → prioritize (pending host requests > my pending joins > upcoming Going) → order |
| Notifications page | `ActivityFeed` | Replaces inline aggregation in `app/notifications/page.tsx` |

---

[Root README](../../README.md) · **Data Structures & Algorithms Index**
