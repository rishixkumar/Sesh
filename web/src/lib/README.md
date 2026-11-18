# `web/src/lib/` — domain logic, data & tests

Everything that isn't UI. Components read data through the adapter and the React context; they never touch storage or seed data directly.

## Data & state

| Path | Role |
| --- | --- |
| [`data/adapter.ts`](./data/adapter.ts) | `SeshDataAdapter` and the browser-local mock implementation (indexes, mutations, persistence) |
| [`context/sesh-provider.tsx`](./context/sesh-provider.tsx) | React provider: adapter, demo viewer identity, clock, sign-in prompt |
| [`mock/seed.ts`](./mock/seed.ts) | Fictional Georgia Tech seed users, events, and Move Groups |
| [`permissions/policies.ts`](./permissions/policies.ts) | Viewer privacy projections: address unlocking, roster masking, audience checks |
| [`validation/schemas.ts`](./validation/schemas.ts) | Zod v4 schemas for forms |

## Features

| Path | Role |
| --- | --- |
| [`events/`](./events/) | Event collection queries and RSVP aggregation |
| [`events-filter.ts`](./events-filter.ts) | Hub filters and time-window sections |
| [`move-groups/`](./move-groups/) | Roster presentation for Move Groups |
| [`social/`](./social/) | Friendship graph (BFS suggestions) and friend activity |
| [`notifications/`](./notifications/) | Priority-ordered `ActivityFeed` |
| [`search/`](./search/) | Suffix-trie search index |
| [`landing/`](./landing/) | `/welcome` copy, sample data, and constants |

## Shared utilities

| Path | Role |
| --- | --- |
| [`collections/`](./collections/) | Reusable data structures: queue, binary-heap priority queue, filter pipeline, comparators, `groupBy`/`indexBy` |
| [`dates.ts`](./dates.ts) | `America/New_York` date and time-window helpers |
| [`utils.ts`](./utils.ts) | `cn()` class-name helper |

## Tests

[`__tests__/`](./__tests__/) holds the Vitest suites (run with `npm test` from `web/`). They cover the adapter indexes, aggregation, collections, filter/sort, the friendship graph, the priority queue, search, and the Milestone 1 regression suite.

Design notes for the data structures are in [`docs/ds-algorithms/`](../../../docs/ds-algorithms/README.md).
