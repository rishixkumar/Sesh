# Sesh DB Schema Notes — Milestone 3 Phase 2 (Schema Only)

**Status:** APPROVED by managing agent (2026-11-18). Migrations, seeds, and DB tests may proceed on `MS3/P2-database-foundation`.

**Approval notes:** Proceed with MS3 §2.2 entities as defined. Defer invitation tokens + notifications tables. Keep consent/auth-provider enums as starters (adjustable in a later migration if product locks values). Prefer app-layer state transitions for now; add DB triggers only where constraints already require them. Cross-campus integrity triggers optional for this phase if `school_id` FKs + app checks are in place.

**Branch:** `MS3/P2-database-foundation`  
**ORM:** Drizzle ORM (`drizzle-orm`) + future `drizzle-kit` migrations  
**Database:** PostgreSQL 16+ with PostGIS (SRID 4326 geography)

## Scope of this deliverable

| Included | Explicitly deferred |
| --- | --- |
| Authoritative table/enum/FK/index/check definitions under `src/db/schema/` | SQL migration generation (`drizzle-kit generate`) |
| PostGIS `geography(Point,4326)` column types + GIST index declarations | Docker Compose / running Postgres |
| Placeholder dirs for migrations, seeds, DB tests | Seed scripts |
| `drizzle.config.ts` pointing at this schema | DB client, pool, `/ready` DB check |
| | Domain REST endpoints (Phase 3) |

## Layout

```
api/
├── drizzle.config.ts          # Kit config — do not generate yet
└── src/db/
    ├── SCHEMA_NOTES.md        # This file
    ├── index.ts               # Re-exports schema only (no client yet)
    ├── schema/
    │   ├── index.ts           # Barrel export
    │   ├── enums.ts
    │   ├── types.ts           # geographyPoint custom type
    │   ├── schools.ts
    │   ├── users.ts
    │   ├── venues.ts
    │   ├── events.ts
    │   ├── move-groups.ts
    │   ├── social.ts
    │   └── audit.ts
    ├── migrations/            # EMPTY — migrations agent owns contents
    └── seeds/                 # EMPTY — seeds agent owns contents
api/tests/db/                  # EMPTY — DB tests agent owns contents
```

## Design decisions

1. **Users vs profiles:** `users` holds account identity (email, username, status, primary school). `user_profiles` holds presentation fields (display name, avatar, bio, graduation year, verifiedStudent flag).
2. **Campus isolation:** Every campus-scoped entity has `school_id` (`schools`, `venues`, `events`, `move_groups`, `school_affiliations`, optional on `audit_logs`). Move Groups denormalize `school_id` from the parent event.
3. **Responses vs saves:** Frontend packs `SAVED` into `EventResponseType`. MS3 §2.2 lists them separately, so DB uses `event_responses` (`GOING` \| `INTERESTED`) and `event_saves`.
4. **Friendships:** One row per unordered pair via `user_low_id` / `user_high_id` unique constraint; `requester_id` / `addressee_id` preserve request direction.
5. **Active memberships / pending requests:** Partial unique indexes (`left_at IS NULL`, `status = 'PENDING'`).
6. **Geography:** Custom `geographyPoint` → `geography(Point,4326)` on `venues.location`, `events.location`, `move_groups.meetup_location`.
7. **Deletion:** Restrict on school/host/creator roots; cascade for dependent membership/response/request rows; set-null for optional venue / audit actor.

## Suggested handoff paths

| Workstream | Own these paths | First tasks after approval |
| --- | --- | --- |
| **Migrations & PostGIS** | `api/src/db/migrations/`, `api/drizzle.config.ts`, Docker Compose (repo root or `api/`), `DATABASE_URL` in env | Enable `postgis` + `citext`/`pgcrypto` as needed; generate SQL from schema; verify GIST indexes; wire Drizzle client under `api/src/db/` |
| **Seeds** | `api/src/db/seeds/` | Deterministic Georgia Tech fictional dataset; idempotent upserts; never real student PII |
| **DB tests** | `api/tests/db/` | Constraint rejection tests; isolation checks; migration clean-apply; separate test database |

## Open questions (for managing agent)

1. **Invitations:** Frontend `Invitation` (token links for EVENT / MOVE_GROUP) is not in MS3 §2.2. Omitted for now — add table if product requires share tokens in Phase 2.
2. **Notifications:** Mentioned in some planning language; MS3 Phase 2 table list does not include them. Activity feed today is derived. No `notifications` table yet.
3. **Consent type enum values:** Spec says “Consent records” without enumerating types. Current enum is a reasonable starter (`TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `LOCATION_SHARING`, `MARKETING`, `AGE_CONFIRMATION`).
4. **Auth providers:** `auth_provider` enum includes placeholders (`CLERK`, `AUTH0`, …). Confirm before locking migrations.
5. **Cross-campus integrity:** Schema relies on `school_id` columns + app authz. Composite FKs / triggers ensuring `events.host` is affiliated with `events.school_id` (and Move Group `school_id` matches event) are deferred to migrations agent if required.
6. **Venue required vs optional:** Events always store `venue_name` text; `venue_id` is optional FK for normalized places / map pins.
7. **Friendship acceptance model:** Spec requires “many users to many accepted friends.” Pending/declined/cancelled statuses are included; confirm UX for decline vs cancel.
8. **State-transition CHECKs:** MS3 asks for “valid state transitions where appropriate.” Enum + status columns exist; transition enforcement (e.g. cannot PENDING→CANCELLED illegally) left to app or trigger layer — confirm preference.
