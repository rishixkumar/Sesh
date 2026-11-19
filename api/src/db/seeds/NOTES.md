# Deterministic Seeds (MS3 §2.7)

Fictional Georgia Tech development dataset. **Never** load real student PII.

## Contents

| Entity | Count | Notes |
| --- | --- | --- |
| School | 1 | `georgia-tech` |
| Users + profiles + affiliations | 7 | Maya, Jordan, Tyler, Priya, Marcus, Chloe, Ramblin' Nights |
| Friendships | 9 | 8 accepted + 1 pending |
| Venues | 4 | Fictional Midtown / campus pins |
| Events | 6 | Public, FRIENDS, INVITE_ONLY |
| Responses / saves | 14 / 3 | GOING + INTERESTED; saves separate |
| Move Groups | 4 | Members + 2 pending join requests + 1 invite |

All primary keys are fixed UUIDs under `ids.ts`. Re-running upserts the same rows.

## How to run

Prerequisites (migrations / PostGIS agent):

1. Postgres + PostGIS up: `npm run db:up` (from `api/`, host port **5433**).
2. Migrations applied: `npm run db:migrate`.
3. `DATABASE_URL` set (see `.env.example`).

From `api/`:

```bash
npm run db:seed
# equivalent:
npx tsx src/db/seeds/index.ts
npx tsx src/db/seeds/run.ts
```

Default URL if unset: `postgres://sesh:sesh@127.0.0.1:5433/sesh`.

## Idempotency check

```bash
npm run db:seed
npm run db:seed
```

Second run should report `delta.users/events/move_groups` of `0` and identical absolute counts.

## Programmatic use

```ts
import { applySeeds, seed } from "./src/db/seeds/index.js";

await applySeeds(db);
// or harness-compatible:
await seed({ db, sql });
```
