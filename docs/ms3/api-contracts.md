# SESH Milestone 3 — Shared API Contracts (Planning)

**Status:** Draft for Phase 3 implementation alignment  
**Scope:** Planning only — no route handlers, schema, or frontend wiring in this document's delivery  
**Sources:** `web/MS3.md`, Phase 1 API conventions (`api/src/lib/errors.ts`, `api/src/lib/auth.ts`, `api/src/config/env.ts`), frontend domain types (`web/src/types/domain.ts`), permission projections (`web/src/lib/permissions/policies.ts`), adapter surface (`web/src/lib/data/adapter.ts`)

This document freezes the **HTTP contract shape** Events and Move Groups agents should implement against. Database column names may differ; public JSON must match these viewer-safe projections.

---

## 1. Cross-cutting conventions

### 1.1 Versioning and content type

| Rule | Value |
| --- | --- |
| Application prefix | `/v1` |
| Health / readiness | Outside `/v1` (`GET /health`, `GET /ready`) |
| Content type | `application/json` request and response bodies |
| Timestamps | ISO 8601 UTC strings (e.g. `2026-11-19T02:00:00.000Z`) |
| Resource IDs | Opaque strings in the public API (UUID or prefixed IDs — schema-owned; clients treat as opaque) |
| Request ID | Fastify request id; echoed on every error envelope |

### 1.2 Auth modes and headers

Reuse Phase 1 `AUTH_MODE`:

| Mode | Behavior |
| --- | --- |
| `disabled` | Public GETs allowed where marked public. All mutations and identity-scoped reads that need a user **fail closed** with `UNAUTHENTICATED`. |
| `test` | Trusted **development / CI only** identity via header (below). Never enable in production. |
| `managed` | Future production auth provider. Mutations require a verified session. Demo / header identities rejected. |

**Proposed test-mode identity header (AUTH_MODE=`test` only):**

```http
X-Sesh-Test-User-Id: <user-id>
```

Optional companion for campus context when needed by seeds:

```http
X-Sesh-Test-School-Id: <school-id>
```

Rules:

- Ignore or reject these headers when `AUTH_MODE` is not `test`.
- Do not accept caller-controlled demo user IDs from JSON bodies as authentication.
- Public discovery endpoints must work with no auth headers.
- Production (`managed`) never accepts the test identity mechanism (Phase 5 hard requirement).

`request.authUser` shape (Phase 1):

```ts
{ id: string; schoolId?: string } | null
```

### 1.3 Error envelope

Unchanged from Phase 1 / MS3:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "requestId": "req-…",
    "details": {}
  }
}
```

| Code | HTTP | Typical use |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Zod / constraint failures on input |
| `UNAUTHENTICATED` | 401 | Missing identity when required; `AUTH_MODE=disabled` on protected ops |
| `FORBIDDEN` | 403 | Authenticated but not permitted (e.g. non-owner edit, invite-only join) |
| `NOT_FOUND` | 404 | Missing resource **or** resource hidden from this viewer (anti-enumeration) |
| `CONFLICT` | 409 | Duplicate membership/request, capacity race loss, stale state |
| `RATE_LIMITED` | 429 | Rate limit |
| `INTERNAL_ERROR` | 500 | Unexpected; no stack traces to clients |

**Capacity races:** Prefer `CONFLICT` with a stable machine-readable `details.reason` of `"CAPACITY_FULL"` rather than inventing a new top-level code before Phase 3 implementation. Frontend mock uses `CAPACITY_FULL`; the Phase 4 adapter will map `CONFLICT` + reason.

**Restricted visibility:** Prefer `NOT_FOUND` over `FORBIDDEN` when an unauthenticated or unauthorized viewer probes a restricted / draft / cancelled event or invite-only group, so existence is not leaked. Use `FORBIDDEN` when the viewer is allowed to know the resource exists but cannot perform the action (e.g. already declined join).

`details` may be included for `VALIDATION_ERROR` outside production only (existing plugin behavior).

### 1.4 Idempotency

- `POST /v1/events` accepts optional header `Idempotency-Key: <client-key>` (max length TBD at implementation, recommend ≤ 128).
- Same authenticated user + key + equivalent body within retention window returns the original created event (`200` or `201` — **deferred**; recommend `200` on replay, `201` on first create).
- Move Group create may adopt the same header later; not required for first Events slice.

### 1.5 Pagination (cursor)

List endpoints that can grow (Events discovery first):

**Query:**

| Param | Meaning |
| --- | --- |
| `limit` | Page size (default `20`, max `50`) |
| `cursor` | Opaque server cursor from prior page |

**Response wrapper:**

```json
{
  "data": [ /* resource views */ ],
  "page": {
    "nextCursor": "opaque-or-null",
    "limit": 20
  }
}
```

Sort default for events: ascending `startAt`, then `id` for stability.

### 1.6 Campus scoping

Every campus-scoped entity carries `schoolId` in stored data. List filters default to the viewer's school when authenticated; public guest discovery requires explicit `schoolId` query (seed campus for GT demos). Cross-campus reads that bypass isolation must return `NOT_FOUND` / `FORBIDDEN` per policy — never other tenants' private rows.

### 1.7 Projection principle

- DB / internal records ≠ public JSON.
- Responses mirror frontend **viewer projections** (`EventView`, `MoveGroupView`, roster masking), not raw records.
- Never return `privateAddress`, hidden member IDs/avatars, or `externalChatLink` unless authorization unlocks them (`unlockedPrivateAddress`, `unlockedExternalChatLink`).

---

## 2. Shared resource shapes (public JSON)

Enums align with `web/src/types/domain.ts` unless noted.

### 2.1 Public user summary

```json
{
  "id": "user-…",
  "displayName": "Alex Kim",
  "username": "alexk",
  "avatar": "https://…",
  "schoolId": "school-gt",
  "verifiedStudent": true,
  "graduationYear": 2027
}
```

### 2.2 Admission

```json
{
  "isFree": false,
  "priceLabel": "$10 cover",
  "amountUsd": 10
}
```

### 2.3 Event view (`EventView`-aligned)

```json
{
  "id": "evt-…",
  "schoolId": "school-gt",
  "title": "…",
  "description": "…",
  "category": "House Parties",
  "startAt": "…Z",
  "endAt": "…Z",
  "venue": "…",
  "publicDisplayLocation": "Home Park near 10th St",
  "addressPrivacy": "RSVP_GOING_ONLY",
  "unlockedPrivateAddress": "123 Fake St",
  "hasPrivateAddress": true,
  "privateAddressUnlockHint": "…",
  "visibility": "PUBLIC",
  "status": "PUBLISHED",
  "hostId": "user-…",
  "host": { /* PublicUserSummary */ },
  "coverImage": "https://…",
  "capacity": 40,
  "admission": { /* Admission */ },
  "createdAt": "…Z",
  "updatedAt": "…Z",
  "source": "API",
  "goingCount": 12,
  "interestedCount": 4,
  "savedCount": 7,
  "friendsGoing": [ /* PublicUserSummary[] */ ],
  "viewerResponse": "GOING",
  "viewerSaved": true,
  "moveGroupCount": 2,
  "canEdit": false
}
```

Notes:

- `unlockedPrivateAddress` omitted (or `null`) when locked; never send the raw private field under another name.
- `viewerResponse` is attendance only: `"GOING" | "INTERESTED" | null` (see §3.2 — saves are separate to match Phase 2 entity split).
- `viewerSaved` is boolean for the authenticated viewer; `false` for guests.
- `source`: frontend today uses `SEED | LOCAL_DEMO`; API responses should use `API` (or seed marker if served from seed rows). Phase 4 maps into view models.
- `customAllowedUserIds` is **write-only / host-edit** input — not echoed on public event views.

### 2.4 Public event metadata (link preview)

```json
{
  "id": "evt-…",
  "title": "…",
  "category": "Bars",
  "publicDisplayLocation": "…",
  "venue": "…",
  "startAt": "…Z",
  "admissionLabel": "Free entry"
}
```

Only for `PUBLISHED` + `PUBLIC` events.

### 2.5 Move Group roster projection

```json
{
  "creator": { /* PublicUserSummary */ },
  "creatorJoinedAt": "…Z",
  "visibleMembers": [
    {
      "id": "…",
      "displayName": "…",
      "username": "…",
      "avatar": "…",
      "schoolId": "…",
      "verifiedStudent": true,
      "graduationYear": 2026,
      "isFriend": true,
      "joinedAt": "…Z"
    }
  ],
  "anonymousMemberCount": 2,
  "totalMemberCount": 5,
  "isFullRosterVisible": false
}
```

Masking rules (server-enforced; same as MS3 §3.2 / frontend policies):

1. Host/creator visible to anyone who can view the group.
2. Accepted members see full non-creator roster (subject to block rules when blocks exist).
3. Non-members see only accepted friends by identity; others counted in `anonymousMemberCount`.
4. Hidden IDs/avatars never appear.
5. Guests never see non-creator identities.

### 2.6 Move Group view (`MoveGroupView`-aligned)

```json
{
  "id": "mg-…",
  "eventId": "evt-…",
  "eventSummary": {
    "id": "evt-…",
    "title": "…",
    "category": "House Parties",
    "startAt": "…Z",
    "endAt": "…Z",
    "publicDisplayLocation": "…"
  },
  "creatorId": "user-…",
  "name": "…",
  "note": "…",
  "capacity": 6,
  "spotsRemaining": 2,
  "isFull": false,
  "discoverability": "PUBLIC",
  "joinMode": "REQUEST_TO_JOIN",
  "meetupTime": "…Z",
  "meetupSpot": "Klaus stairs",
  "unlockedExternalChatLink": "https://…",
  "hasExternalChatLink": true,
  "roster": { /* roster projection */ },
  "viewerRelation": "NONE",
  "canManage": false,
  "canRequestOrJoin": true,
  "joinBlockedReason": null,
  "ownerManagement": null,
  "disbanded": false,
  "createdAt": "…Z",
  "updatedAt": "…Z",
  "source": "API"
}
```

`ownerManagement` present only when `canManage === true`:

```json
{
  "pendingRequests": [
    {
      "id": "jr-…",
      "user": { /* PublicUserSummary */ },
      "status": "PENDING",
      "note": "…",
      "createdAt": "…Z",
      "decidedAt": null
    }
  ],
  "declinedRequests": [],
  "removableMembers": [ /* MaskedMemberEntry[] */ ]
}
```

`viewerRelation`: `CREATOR | MEMBER | PENDING_REQUEST | DECLINED_REQUEST | NONE`.

---

## 3. Events API — routes outline

Base: `/v1/events`

### 3.1 Discovery and CRUD

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/v1/events` | Optional | Campus discovery with filters + cursor pagination |
| `GET` | `/v1/events/:id` | Optional | Viewer-projected event detail |
| `GET` | `/v1/events/:id/public-metadata` | None | Safe OG / link preview metadata |
| `POST` | `/v1/events` | Required | Create event; owner = authenticated user |
| `PATCH` | `/v1/events/:id` | Required | Host-only partial/full update |
| `DELETE` | `/v1/events/:id` | Required | Host-only cancel (soft: status → `CANCELLED`) |

#### `GET /v1/events` query params

| Param | Values / notes |
| --- | --- |
| `schoolId` | Required for guests; default viewer school when authed |
| `category` | `ALL` or domain category |
| `price` | `ALL \| FREE \| PAID` |
| `timeWindow` | `ALL \| HAPPENING_NOW \| TONIGHT \| THIS_WEEKEND \| UPCOMING` |
| `search` | Optional text; server-side filter (not full-table dump) |
| `includeDraftsOwnedByViewer` | `true` only meaningful when authenticated |
| `limit`, `cursor` | Pagination |

Response: `{ data: EventView[], page }` — only events `canViewEvent` allows for the viewer. Cancelled excluded. Drafts only for host when flag set.

#### `POST /v1/events` body (create)

Align with `CreateOrUpdateEventInput`:

```json
{
  "title": "…",
  "description": "…",
  "category": "Clubs",
  "startAt": "…Z",
  "endAt": "…Z",
  "venue": "…",
  "publicDisplayLocation": "…",
  "privateAddress": "…",
  "addressPrivacy": "PUBLIC_VENUE",
  "visibility": "PUBLIC",
  "status": "PUBLISHED",
  "coverImage": "https://…",
  "capacity": 100,
  "isFree": true,
  "priceLabel": "Free",
  "amountUsd": null,
  "customAllowedUserIds": []
}
```

Validation highlights (mirror frontend + DB constraints):

- `endAt` > `startAt`
- Capacity positive integer when present
- Title/description/venue length bounds per Zod form schemas
- `schoolId` taken from authenticated user affiliation, not trusted from body

On publish, host may be auto-marked `GOING` (current mock behavior) — **confirm in implementation**.

#### `PATCH /v1/events/:id`

Same fields as create (partial patch allowed). Host-only. Preserve consistent state on cancel/edit.

#### `DELETE /v1/events/:id`

Soft-cancel: set `CANCELLED`. Subsequent GETs behave as not found for non-hosts (and typically hosts too for hub lists). Hard delete deferred.

### 3.2 Attendance and saves

Phase 2 models **responses** and **saves** as separate relations. Public contract:

| Method | Path | Auth | Body / notes |
| --- | --- | --- | --- |
| `PUT` | `/v1/events/:id/attendance` | Required | `{ "response": "GOING" \| "INTERESTED" \| null }` — `null` removes RSVP |
| `PUT` | `/v1/events/:id/save` | Required | `{ "saved": true \| false }` |

Responses return updated `EventView` for the viewer.

Shortcut aliases (optional; pick one style in implementation — prefer the table above):

- Going / Interested / Remove RSVP → attendance `PUT`
- Save / Remove save → save `PUT`

Viewer must be allowed to view the event to mutate attendance/save; otherwise `NOT_FOUND`.

---

## 4. Move Groups API — routes outline

Prefer **event-nested create/list** + **group-id for lifecycle** (matches UI: groups live under an event, detail routes use group id).

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/v1/events/:eventId/move-groups` | Optional | List groups viewer may see for event |
| `POST` | `/v1/events/:eventId/move-groups` | Required | Create group on published event |
| `GET` | `/v1/move-groups/:id` | Optional | Group detail + roster projection |
| `PATCH` | `/v1/move-groups/:id` | Required | Owner settings update |
| `POST` | `/v1/move-groups/:id/join` | Required | Open join **or** create join request (by `joinMode`) |
| `POST` | `/v1/move-groups/:id/leave` | Required | Non-owner leave |
| `POST` | `/v1/move-groups/:id/join-requests/:requestId/approve` | Required | Owner approve (transactional) |
| `POST` | `/v1/move-groups/:id/join-requests/:requestId/decline` | Required | Owner decline |
| `DELETE` | `/v1/move-groups/:id/members/:userId` | Required | Owner remove member |
| `POST` | `/v1/move-groups/:id/transfer-ownership` | Required | Owner transfer (`{ "newOwnerUserId": "…" }`) |
| `POST` | `/v1/move-groups/:id/disband` | Required | Owner disband (soft) |

### 4.1 Create / update bodies

Create (`CreateMoveGroupInput`-aligned):

```json
{
  "name": "…",
  "note": "…",
  "capacity": 6,
  "discoverability": "PUBLIC",
  "joinMode": "REQUEST_TO_JOIN",
  "meetupTime": "…Z",
  "meetupSpot": "…",
  "externalChatLink": "https://…"
}
```

`eventId` comes from the path. Creator becomes sole initial member with role `CREATOR`. Capacity ≥ 2. Parent event must be `PUBLISHED` and visible to creator.

Update: same fields; capacity cannot drop below current member count.

### 4.2 Join semantics

`POST .../join` optional body: `{ "note": "…" }`.

| `joinMode` | Behavior |
| --- | --- |
| `OPEN_JOIN` | Atomic insert membership if capacity remains |
| `REQUEST_TO_JOIN` | Create pending request if none pending/declined-blocking |
| `INVITE_ONLY` | Only invited users; else `FORBIDDEN` |

Concurrency: approve/open-join must use DB transactions + row locks so one remaining slot cannot admit two users. Failed race → `CONFLICT` / `CAPACITY_FULL` reason.

Duplicate active membership or duplicate pending request → `CONFLICT`.

### 4.3 Transfer ownership

Not present in the Milestone 1 mock adapter; required by MS3. Proposed rules (finalize at implementation):

- Caller must be current creator/owner.
- Target must already be an accepted member (or allow any campus user — **deferred**).
- Atomically reassign creator role; previous owner becomes `MEMBER`.

### 4.4 Disband

Soft-disband; `GET` returns `NOT_FOUND` (or a dedicated disbanded signal). Prefer `NOT_FOUND` for parity with restricted hiding unless product wants an explicit UI state (frontend mock has `DISBANDED` lookup — Phase 4 may map `404` + code/details).

---

## 5. Authorization service (contract-level)

Centralize decisions (MS3 §3.3); routes call shared functions, not inline copies of frontend policies.

Minimum decision API (names illustrative):

| Decision | Inputs (conceptual) |
| --- | --- |
| `canViewEvent` | event, viewer, friendships |
| `canEditEvent` | event, viewer |
| `canRevealAddress` | event, viewer, attendance, group membership |
| `canViewMoveGroup` | group, event, viewer, friendships |
| `projectRoster` | group, viewer, friendships, blocks |
| `canJoinOrRequest` | group, viewer |
| `canManageGroup` | group, viewer |
| `isBlockedPair` | viewer, other user |

Blocking: when Phase 2 block rows exist, blocked users must not appear in friend-visible roster slots and must not gain access via friendship edges. Exact interaction with event visibility is **deferred** to auth + schema owners with a privacy matrix in tests.

Development identities: only via `AUTH_MODE=test` headers. Production mutations unavailable until managed auth is configured.

---

## 6. Mapping to frontend adapter (Phase 4 note — no wiring now)

| Adapter method | HTTP |
| --- | --- |
| `listEvents` | `GET /v1/events` |
| `getEvent` | `GET /v1/events/:id` → map 404 to `NOT_FOUND` / restricted UX |
| `createEvent` / `updateEvent` | `POST` / `PATCH /v1/events` |
| `setEventResponse` | Split into attendance + save calls |
| `listMoveGroups` | `GET /v1/events/:eventId/move-groups` |
| `getMoveGroup` | `GET /v1/move-groups/:id` |
| `createMoveGroup` / `updateMoveGroup` | `POST` nested / `PATCH` |
| `requestJoin` | `POST .../join` |
| `approveJoin` / `declineJoin` | approve/decline routes |
| `leaveMoveGroup` / `removeMember` / `disbandMoveGroup` | leave / delete member / disband |
| *(new)* transfer ownership | `POST .../transfer-ownership` |

Adapter becomes async; mock mode remains sync-compatible via wrappers (Phase 4).

---

## 7. Out of scope for this contract draft

- Exact Drizzle table/column names and migration SQL
- Map / PostGIS query endpoints
- Production OAuth / managed session cookies
- Friends, notifications, profile, invitations token APIs (beyond fields already on event/group)
- Implementing any of the routes above

---

## 8. Open decisions (see also deferred list in delivery summary)

Tracked for schema + Phase 3 kickoff:

1. Public ID format (UUID vs prefixed strings).
2. Idempotent create replay status code (`200` vs `201`).
3. Whether cancelled/disbanded resources ever return a typed body vs always `NOT_FOUND`.
4. Transfer-ownership eligibility rules.
5. Whether `CAPACITY_FULL` becomes a first-class `error.code` or stays under `CONFLICT`.
6. Auto-GOING on publish / on Move Group create (mock does both).
7. Block-policy matrix against event visibility and join paths.
8. Exact cursor encoding and retention for idempotency keys.
