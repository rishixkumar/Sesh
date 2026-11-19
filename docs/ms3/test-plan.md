# SESH Milestone 3 — Test Plan (Planning)

**Status:** Draft covering Phases 2–5 verification  
**Scope:** Planning only — no new test implementations in this delivery  
**Depends on:** `docs/ms3/api-contracts.md`, `web/MS3.md`, Phase 1 Vitest + Fastify inject patterns in `api/tests/`

Tests should prefer Fastify `inject`, disposable Postgres, and Playwright for browser E2E. Do not rely on a manually running `npm run dev` server except for explicit smoke checks.

---

## 1. Goals and layers

| Layer | Owner phase | Purpose |
| --- | --- | --- |
| DB constraint & migration tests | Phase 2 | Schema integrity, PostGIS, seeds |
| DB transaction / concurrency tests | Phase 2–3 | Capacity and membership races |
| API route + authz tests | Phase 3 | Contracts, privacy projections, fail-closed auth |
| Frontend adapter mode tests | Phase 4 | Mock vs API-dev vs production boundaries |
| Security + E2E + CI | Phase 5 | Cross-stack workflows and hardening |

**Privacy principle:** Assert not only status codes but **response field absence** (no private addresses, hidden member IDs, chat links for unauthorized viewers).

---

## 2. Phase 2 — Database tests

### 2.1 Migration and connectivity

- Clean database applies all migrations successfully.
- PostGIS extension enabled; geography columns use SRID 4326; spatial indexes exist.
- `/ready` returns 503 when DB is unreachable and recovers when DB is up (extends Phase 1 readiness).
- Separate test database URL; tests never touch developer seed volume unexpectedly.

### 2.2 Constraint tests (reject invalid rows)

| Constraint | Example assertion |
| --- | --- |
| Unique email / username | Case-insensitive duplicates rejected |
| Event time order | `endAt` ≤ `startAt` rejected |
| Positive capacities | `0` / negative rejected |
| FK integrity | Orphan event/group/member rejected |
| Unique active membership | Second active membership for same user/group rejected |
| Unique pending join request | Second pending request rejected |
| Campus isolation | Cross-school FK / association rejected where constrained |

### 2.3 Seed tests

- Seeds are deterministic and idempotent (re-run does not duplicate).
- Includes GT campus, sample users, friendships, public + restricted events, responses/saves, Move Groups, members, pending requests.
- No real student PII.

### 2.4 Transaction smoke (can start in Phase 2, harden in Phase 3)

- Scripted concurrent join/approve against capacity=N with N+1 workers → final member count ≤ N.
- Prefer `pg` advisory locks / `SELECT … FOR UPDATE` behavior verification once repositories exist.

---

## 3. Phase 3 — API tests

Use `AUTH_MODE=test` and `X-Sesh-Test-User-Id` for identity. Also assert `AUTH_MODE=disabled` fails closed on mutations.

### 3.1 Events API

**Public discovery**

- Guest `GET /v1/events` returns public published events only.
- Filters: `schoolId`, `category`, `price`, `timeWindow`, `search` applied server-side.
- Cursor pagination: stable order; `nextCursor` walks full set without duplicates/skips.
- Drafts excluded for guests; host sees own drafts only when requested.

**Detail & privacy**

- Public event: 200 + `EventView` without unlocked private address unless policy allows.
- Friends / custom / invite-only: friend sees 200; stranger / guest → `NOT_FOUND`.
- Address privacy matrix:

  | `addressPrivacy` | Who gets `unlockedPrivateAddress` |
  | --- | --- |
  | `PUBLIC_VENUE` | Viewers who can see event (members; guests only if product allows — today guests never get exact private address in mock) |
  | `RSVP_GOING_ONLY` | Host, GOING RSVP, or accepted Move Group member |
  | `APPROVED_GROUP_OR_HOST` | Host or accepted Move Group member |
  | `HOST_ONLY` | Host only |

- Unauthorized responses must omit private address strings entirely (`hasPrivateAddress` may be true).

**Mutations**

- Create requires auth; `hostId` = authenticated user; ignore spoofed host in body.
- Non-host PATCH/DELETE → `FORBIDDEN` or `NOT_FOUND` per anti-enumeration choice (document actual).
- Idempotency-Key: replay returns same event id without duplicate rows.
- Attendance PUT going/interested/null persists and updates counts.
- Save PUT true/false independent of attendance.
- Cancelled events disappear from discovery.

### 3.2 Move Groups API

**Visibility**

- List/detail honor `discoverability` + parent event visibility.
- Invite-only / network groups hidden from unauthorized → `NOT_FOUND`.
- Roster masking:

  - Guest / non-member non-friend: creator visible; others in `anonymousMemberCount`; zero hidden IDs in JSON.
  - Friend non-member: friends appear in `visibleMembers` with `isFriend: true`.
  - Member: full roster; `isFullRosterVisible: true`.
  - `unlockedExternalChatLink` only for accepted members; others may see `hasExternalChatLink`.

**Lifecycle**

- Create on published visible event; capacity ≥ 2; creator is sole member.
- Open join vs request-to-join vs invite-only paths.
- Approve/decline owner-only; non-owner → `FORBIDDEN`.
- Leave forbidden for creator (must disband or transfer).
- Remove member owner-only; cannot remove creator via delete-member.
- Transfer ownership atomic role swap.
- Disband hides group from subsequent GETs.

**Concurrency / conflicts**

- Parallel open-join into last slot → exactly one success; loser `CONFLICT` (+ `CAPACITY_FULL` reason).
- Parallel approve of two requests into last slot → same.
- Duplicate membership / duplicate pending → `CONFLICT`.
- Re-request after decline → `FORBIDDEN` (match mock).

### 3.3 Authorization module unit tests

Table-driven cases for guests, members, friends, non-friends, owners, blocked users:

- Event view / edit / address reveal
- Group view / join / manage / roster projection
- Block edges remove friendship-based visibility where required

Do not pass raw records to assertions meant for public JSON.

### 3.4 Error contract regression

- Unknown route → `NOT_FOUND` envelope with `requestId`.
- Invalid body → `VALIDATION_ERROR` without stack traces.
- Unauthenticated mutation → `UNAUTHENTICATED`.
- Rate limit path (if enabled) → `RATE_LIMITED`.

---

## 4. Phase 4 — Frontend adapter mode tests

No runtime wiring in this planning pass; tests to add when adapter lands.

### 4.1 Modes

| Mode | Assertions |
| --- | --- |
| **Mock** | Existing fictional data + demo identity switcher; local persistence; isolated frontend unit tests still pass |
| **API development** | Calls Fastify; persists in Postgres; uses controlled test identities; data visible across browsers/sessions |
| **Production** | Only configured production base URL; rejects demo/test identity headers; **no** silent localStorage fallback on API failure |

### 4.2 Adapter contract

- Async methods; no mixed Promise/sync ambiguity.
- Maps API `EventView` / `MoveGroupView` into existing UI view models.
- Maps error envelope → user-visible errors (`UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`/capacity, etc.).
- Mutations trigger refetch / subscription updates.

### 4.3 Page-level integration (component or Playwright light)

- Events Hub loads from API mode.
- Event detail RSVP + save.
- Create/Edit Move round-trip.
- Move Group create, request, approve, roster update after refetch.
- Private fields never appear in client state for unauthorized viewers (inspect adapter results, not just UI copy).

### 4.4 Regression

- `web` unit tests and production build pass with mock mode default.
- Demo banner / identity switcher inactive or clearly disabled in production mode.

---

## 5. Phase 5 — End-to-end, security, CI

### 5.1 Workflow E2E (Playwright)

Happy path with two controlled identities (API development mode):

1. Open Events Hub  
2. View public event  
3. Create event  
4. Discover new event  
5. Create Move Group  
6. Second identity requests join  
7. Owner approves  
8. Roster shows updated membership  
9. Hard refresh — data remains  

Separate suites: guest browsing; restricted-viewer denied paths.

### 5.2 Security checklist

- Unauthorized mutations rejected  
- Cross-campus access denied  
- Invalid input rejected  
- Secrets absent from logs/errors  
- CORS restricted to configured origin  
- Idempotent/duplicate requests cannot corrupt data  
- Capacity enforcement under concurrency  
- Production build rejects test identity headers / `AUTH_MODE=test` misconfig documented  

### 5.3 CI (GitHub Actions)

From clean checkout:

1. Install `api` + `web` deps  
2. Typecheck + lint both  
3. API unit/inject tests  
4. Postgres service + migrate + DB/API integration tests  
5. API build  
6. Frontend unit tests + build  
7. Optional Playwright job with ephemeral stack  

Never connect CI to production data.

### 5.4 Deployment readiness smoke (manual or scripted)

- Container health checks (`/health`, `/ready`)  
- Graceful shutdown  
- Env validation fails fast on missing secrets  
- Non-root user where practical  
- Confirm development auth not exposed publicly  

---

## 6. Suggested test file ownership (when implementing)

| Area | Suggested location |
| --- | --- |
| Phase 1 regressions | `api/tests/*.test.ts` (keep) |
| DB constraints / seeds | `api/tests/db/*.test.ts` (Phase 2 owner) |
| Events API | `api/tests/events/*.test.ts` |
| Move Groups API | `api/tests/move-groups/*.test.ts` |
| Authz matrix | `api/tests/authz/*.test.ts` |
| Concurrency | `api/tests/concurrency/*.test.ts` |
| Frontend adapter | `web/src/lib/__tests__/api-adapter*.test.ts` |
| E2E | `web/e2e/` or repo-level `e2e/` |

Exact paths may follow Phase 2 layout; do not create them in this planning delivery.

---

## 7. Definition of done (cross-phase)

- Phase 2: migrations, constraints, seeds, readiness DB check green  
- Phase 3: contracts implemented; privacy + capacity + owner rules green  
- Phase 4: mock + API-dev modes green; no production demo-auth footgun  
- Phase 5: E2E + CI + security checklist documented and passing  

Known limitations after each phase must be listed in the phase report (MS3 required report template).
