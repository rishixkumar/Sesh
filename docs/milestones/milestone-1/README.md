[Root README](../../../README.md) · **Milestone 1 Index**

---

# Milestone 1 — Core MVP Frontend Technical Reference

```ts
/**
 * @packageDocumentation
 * @milestone 1 — Core Sesh MVP Frontend
 * @workspace @sesh/web (`apps/web`)
 * @framework Next.js 16.4.6 (App Router · `cacheComponents: true` · `partialPrefetching: true`)
 * @timezone America/New_York (UTC ISO-8601 storage -> Eastern Time presentation)
 * @tracks 1.01, 1.02, 1.03, 1.04, 1.05
 * @status Verified (`npm test` 8/8 · `npm run lint` 0 errors · `npm run build` 14/14 routes)
 */
```

---

## Sub-Iteration Manuals Directory (`1.01` – `1.05`)

Each Milestone 1 feature track has its own dedicated folder and exhaustive **TSDoc / Javadoc-style** technical manual containing sub-iteration changelogs (`1.0X.1`–`1.0X.4`), real TypeScript/TSX implementations, privacy/hydration edge cases, formal component/function API blocks, and indexed regression checklists for future debugging:

| Track ID | Agent Track | Sub-Iterations | Dedicated Manual & Folder |
| --- | --- | --- | --- |
| **`1.01`** | **App Shell & Navigation** | `1.01.1` – `1.01.4` | [`1.01-app-shell/README.md`](./1.01-app-shell/README.md) |
| **`1.02`** | **Events Hub** | `1.02.1` – `1.02.4` | [`1.02-events-hub/README.md`](./1.02-events-hub/README.md) |
| **`1.03`** | **Event Detail** | `1.03.1` – `1.03.4` | [`1.03-event-detail/README.md`](./1.03-event-detail/README.md) |
| **`1.04`** | **Create & Edit a Move** | `1.04.1` – `1.04.4` | [`1.04-create-edit-move/README.md`](./1.04-create-edit-move/README.md) |
| **`1.05`** | **Move Groups** | `1.05.1` – `1.05.4` | [`1.05-move-groups/README.md`](./1.05-move-groups/README.md) |

---

## Shared Foundation Layer Reference (Managing Agent Contracts)

Before dispatching Agents `01`–`05` in parallel, the managing agent established the shared domain, validation, timezone, privacy-projection, mock seed, and adapter contracts so all five tracks compiled against identical interfaces with zero cross-feature drift.

### 1. Domain & Viewer-Projected Models (`apps/web/src/types/domain.ts`)

```ts
/**
 * @module types/domain
 * @description Separates internal persistence records (`*Record`) from viewer-safe
 * projections (`EventView`, `MoveGroupView`, `MoveGroupRosterProjection`, `PublicEventMetadata`).
 *
 * @security Internal `*Record` interfaces (`EventRecord`, `MoveGroupRecord`) hold sensitive
 * fields (`privateAddress`, full `members` userIds, `externalChatLink`) inside the adapter
 * and MUST NEVER be passed directly into unauthorized UI components.
 *
 * @constant CAMPUS_SCHOOL_ID `"school-gt"`
 * @constant CAMPUS_NAME `"Georgia Tech"`
 * @constant CAMPUS_TIMEZONE `"America/New_York"`
 */
```

Key architectural separation:

| Internal Adapter Record | Viewer-Projected UI Contract | Stripped / Masked Sensitive Fields |
| --- | --- | --- |
| `EventRecord` | `EventView` | `privateAddress` omitted unless `canViewPrivateAddress(...) === true`; `RESTRICTED` events return `null`. |
| `EventRecord` | `PublicEventMetadata` | Returns `null` for `DRAFT` or non-`PUBLIC` events so `<head>` / OpenGraph tags never leak restricted Moves. |
| `MoveGroupRecord` | `MoveGroupView` | `externalChatLink` omitted unless viewer is `CREATOR` or accepted `MEMBER`; `ownerManagement` omitted unless `canManage === true`. |
| `MoveGroupMemberRecord[]` | `MoveGroupRosterProjection` | Non-members receive `creator` + friend `MaskedMemberEntry[]` + scalar `anonymousMemberCount` only (zero hidden user IDs, usernames, or avatars). |

---

### 2. Centralized Data Adapter (`apps/web/src/lib/data/adapter.ts`)

```ts
/**
 * @interface SeshDataAdapter
 * @description Transport-agnostic frontend data contract for Milestone 1.
 * Implemented by `LocalMockSeshAdapter` (deterministic seed + browser `localStorage` overlay)
 * and designed to swap cleanly to an authenticated REST client in Milestone 2/5.
 *
 * @throws {SeshAdapterError} Typed domain errors with `code`:
 * - `"UNAUTHENTICATED"` — Guest attempted a member-only mutation
 * - `"FORBIDDEN"` — Non-host / non-creator / declined / invite-only violation
 * - `"NOT_FOUND"` — Missing or cancelled target entity
 * - `"VALIDATION_ERROR"` — Invalid time ordering, capacity, or creator self-leave
 * - `"CONFLICT"` — Duplicate membership or duplicate pending join request
 * - `"CAPACITY_FULL"` — Group has reached `group.capacity`
 */
export interface SeshDataAdapter {
  listEvents(viewer: ViewerSession, criteria?: EventFilterCriteria, nowIso?: string): EventView[];
  getEvent(eventId: string, viewer: ViewerSession): EventLookupResult;
  createEvent(input: CreateOrUpdateEventInput, viewer: ViewerSession, nowIso: string): EventView;
  updateEvent(eventId: string, input: CreateOrUpdateEventInput, viewer: ViewerSession, nowIso: string): EventView;
  listMoveGroups(viewer: ViewerSession, eventId?: string): MoveGroupView[];
  getMoveGroup(groupId: string, viewer: ViewerSession): MoveGroupLookupResult;
  createMoveGroup(input: CreateMoveGroupInput, viewer: ViewerSession, nowIso: string): MoveGroupView;
  requestJoin(groupId: string, viewer: ViewerSession, options?: { note?: string; nowIso?: string }): MoveGroupView;
  approveJoin(groupId: string, requestId: string, viewer: ViewerSession, nowIso?: string): MoveGroupView;
  declineJoin(groupId: string, requestId: string, viewer: ViewerSession, nowIso?: string): MoveGroupView;
  leaveMoveGroup(groupId: string, viewer: ViewerSession): MoveGroupView | null;
  removeMember(groupId: string, memberUserId: string, viewer: ViewerSession): MoveGroupView;
  disbandMoveGroup(groupId: string, viewer: ViewerSession): void;
  updateMoveGroup(groupId: string, input: UpdateMoveGroupInput, viewer: ViewerSession, nowIso?: string): MoveGroupView;
  getEventResponses(eventId: string, viewer: ViewerSession): {
    goingCount: number;
    interestedCount: number;
    savedCount: number;
    viewerResponse: EventResponseType | null;
  };
  setEventResponse(eventId: string, response: EventResponseType | null, viewer: ViewerSession, nowIso?: string): EventView;
  resetDemoData(anchorIso: string): void;
  subscribe(listener: () => void): () => void;
  getAnchorIso(): string;
}
```

---

### 3. Reactive Hydration-Safe Store (`apps/web/src/lib/context/sesh-provider.tsx`)

```ts
/**
 * @function SeshProvider
 * @description Synchronizes `LocalMockSeshAdapter`, simulated `ViewerSession` personas,
 * and the campus reference clock (`nowIso`) via React 19 `useSyncExternalStore`.
 *
 * @invariants
 * 1. `getServerSnapshot` returns deterministic `STATIC_FALLBACK_ANCHOR_ISO` and `isHydrated: false`
 *    so Next.js 16 Partial Prerendering never reads `window`, `localStorage`, or `new Date()`.
 * 2. After client mount, `ensureInitializedOnClient()` attaches `window.localStorage`
 *    (`sesh.m1.demo-store.v1` and `sesh.m1.demo-viewer.v1`) and flips `isHydrated: true`
 *    without synchronous `setState` inside `useEffect` (satisfying React Compiler lint rules).
 */
```

---

### 4. Eastern Time (`America/New_York`) Utilities (`apps/web/src/lib/dates.ts`)

| Function | Signature | Purpose |
| --- | --- | --- |
| `formatEventTimeRange` | `(startIso: string, endIso: string) => string` | Formats single-day or overnight spans in `America/New_York` (`ET`). |
| `utcIsoToNyLocalInput` | `(iso: string) => string` | Converts UTC ISO-8601 into `YYYY-MM-DDTHH:mm` wall-clock ET for `<input type="datetime-local" />`. |
| `nyLocalInputToUtcIso` | `(localValue: string) => string` | Iteratively aligns EST/EDT wall-clock input back into exact UTC ISO-8601 across DST transitions. |
| `classifyEventTimeWindow` | `(startIso: string, endIso: string, nowIso: string) => EventTimeBucket` | Classifies events into `HAPPENING_NOW`, `TONIGHT`, `THIS_WEEKEND`, `UPCOMING`, or `PAST`. |

---

### 5. Automated Unit Test Suite (`apps/web/src/lib/__tests__/milestone1.test.ts`)

Run via `npm test` from the repository root (`vitest run`):

1. **Event filtering** — Search queries, category pills, free/paid filters, and dynamic time-window buckets.
2. **Form validation** — `moveFormSchema` and `moveGroupFormSchema` cross-field Zod v4 refinements.
3. **Timezone logic** — `America/New_York` <-> UTC round-trips and time-window classification.
4. **Event visibility & private addresses** — Guest/non-friend restriction and conditional `RSVP_GOING_ONLY` exact-address unlocking.
5. **Move Group roster masking** — Verifies `JSON.stringify(group)` contains zero hidden member IDs/usernames and masks `externalChatLink` for non-members.
6. **Join deduplication, capacity & owner-only guards** — Verifies `CONFLICT`, `CAPACITY_FULL`, and `FORBIDDEN` enforcement.
7. **Browser storage persistence** — Verifies locally created Moves and Move Groups survive full adapter re-instantiation across page refreshes.

---

[Root README](../../../README.md) · **Milestone 1 Index**
