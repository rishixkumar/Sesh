# Sesh

Sesh is an 18+ campus event discovery and social coordination platform launching at Georgia Tech and Midtown Atlanta, organized as an npm workspaces monorepo. The Next.js frontend lives in `apps/web`; shared packages, docs, and infrastructure land in their own top-level folders as the project evolves.

> **Living document** — progress is tracked as **Milestone.iteration** (e.g. `0.1`, `0.2`) or **Milestone.agent.iteration** (condensed at surface level as `1.01`–`1.05`, expandable into `1.01.1`, `1.01.2`, etc.). Sections use multi-line `<details>` blocks and Markdown headings so they collapse cleanly **both** in your IDE source editor (via gutter fold arrows) **and** in rendered Markdown / GitHub preview. New milestone entries are added only when explicitly requested.

---

## Current status

| Area | Status |
| --- | --- |
| Monorepo layout | ✅ npm workspaces (`apps/*`, `packages/*`) |
| Frontend (`@sesh/web`) | ✅ Next.js 16 App Router (`cacheComponents` + Partial Prerendering) |
| UI & forms | ✅ Tailwind CSS v4 + shadcn/ui + React Hook Form + Zod v4 |
| Core MVP frontend | ✅ App Shell, Events Hub, Event Detail, Create/Edit Move, Move Groups |
| Unit tests | ✅ Vitest (`npm test` — filtering, validation, dates, privacy, persistence) |
| Shared packages | ⏳ reserved under `packages/` |
| Backend & DB | ⏳ planned (`SeshDataAdapter` ready to swap from local mock to REST API) |
| Docs & Infra | ⏳ reserved under `docs/` and `infra/` |

**Latest documented:** Milestone **1** · Agents **1.01 – 1.05** (`1.01.1` – `1.05.4`)

---

## Repository structure

<details open>
<summary><strong>Directory tree &amp; top-level folder roles</strong></summary>

```text
sesh/
├── apps/
│   └── web/
│       ├── components.json
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── events/
│       │   │   │   ├── new/page.tsx
│       │   │   │   └── [id]/
│       │   │   │       ├── not-found.tsx
│       │   │   │       ├── page.tsx
│       │   │   │       └── edit/page.tsx
│       │   │   ├── move-groups/
│       │   │   │   ├── new/page.tsx
│       │   │   │   └── [id]/
│       │   │   │       ├── not-found.tsx
│       │   │   │       ├── page.tsx
│       │   │   │       └── manage/page.tsx
│       │   │   ├── map/page.tsx
│       │   │   ├── friends/page.tsx
│       │   │   ├── notifications/page.tsx
│       │   │   └── profile/page.tsx
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   ├── events/
│       │   │   ├── moves/
│       │   │   ├── move-groups/
│       │   │   ├── shared/
│       │   │   └── ui/
│       │   ├── lib/
│       │   │   ├── __tests__/
│       │   │   ├── context/
│       │   │   ├── data/
│       │   │   ├── mock/
│       │   │   ├── permissions/
│       │   │   ├── validation/
│       │   │   ├── dates.ts
│       │   │   ├── events-filter.ts
│       │   │   └── utils.ts
│       │   └── types/
│       │       └── domain.ts
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── vitest.config.mts
│       └── eslint.config.mjs
├── packages/
├── docs/
├── infra/
├── .gitignore
├── AGENTS.md
├── README.md
├── package.json
└── package-lock.json
```

| Path | Role |
| --- | --- |
| `apps/` | Deployable applications. Right now: `@sesh/web` (Next.js 16). |
| `packages/` | Shared libraries and tooling used across apps. |
| `docs/` | Project documentation beyond this README. |
| `infra/` | Infrastructure and deployment configuration. |
| Root `package.json` | Workspace root — scripts and workspace wiring only. |

</details>

---

## Workspaces & Getting started

<details open>
<summary><strong>Workspace scripts, prerequisites &amp; local setup commands</strong></summary>

### Workspace scripts

Root scripts proxy into `@sesh/web`:

| Script | What it runs |
| --- | --- |
| `npm run dev` | `next dev` in `@sesh/web` |
| `npm run build` | `next build` in `@sesh/web` |
| `npm run lint` | `eslint .` in `@sesh/web` |
| `npm test` | `vitest run` in `@sesh/web` |

### Prerequisites

- Node.js **≥ 22.13.0** (or `^20.19.0` / `≥ 24`) — required by `eslint-visitor-keys`
- npm (workspaces are used by default)
- **Recommended:** [nvm](https://github.com/nvm-sh/nvm) for local Node version management

```bash
nvm install 22
nvm use 22
node -v
```

### Install, develop & verify

```bash
npm install
npm run dev      # http://localhost:3000
npm test
npm run lint
npm run build
```

</details>

---

## Frontend (`apps/web`)

<details>
<summary><strong>Stack details, timezone conventions &amp; prototype security notes</strong></summary>

| Detail | Value |
| --- | --- |
| Package name | `@sesh/web` |
| Framework | Next.js 16.4.6 (App Router, Cache Components + Partial Prerendering) |
| Styling | Tailwind CSS v4 + shadcn/ui (`radix-nova`, Zinc base) |
| Forms & validation | React Hook Form + Zod v4 |
| Timezone convention | Stored as UTC ISO strings · displayed in `America/New_York` (ET) |
| Persistence (M1) | Centralized `SeshDataAdapter` (`LocalMockSeshAdapter` + `localStorage`) |
| Unit testing | Vitest + React Testing Library (`src/lib/__tests__/milestone1.test.ts`) |
| Import alias | `@/*` → `./src/*` |

> **Prototype security note:** Milestone 1 uses simulated personas (`Guest`, `Maya Patel`, `Jordan Brooks`, `Tyler Nguyen`) and browser-local adapter projections to prevent exposing private house-party addresses, hidden Move Group members, or members-only chat links in the UI. Real `.edu` authentication and server-enforced authorization land in upcoming backend milestones.

Add more shadcn/ui components from `apps/web`:

```bash
npx shadcn@latest add <component>
```

</details>

---

## Milestones

Progress is documented as **Milestone.iteration** for single-track work and **Milestone.agent.iteration** for multi-agent milestones. Surface tables stay compact (`0.1`–`0.2`, `1.01`–`1.05`), while each agent's sub-iterations live in multi-line collapsible `<details>` blocks right below (foldable in both raw source code via IDE gutter arrows and rendered Markdown preview).

### Milestone 0 — Foundation

| ID | Title | Summary |
| --- | --- | --- |
| **0.1** | Monorepo bootstrap | Moved the Next.js app into `apps/web`, added npm workspaces at the root, and split frontend dependencies into `@sesh/web`. |
| **0.2** | shadcn/ui foundation | Initialized shadcn/ui in `@sesh/web` (Zinc base) and added `button`, `card`, `badge`, `input`, and `dialog`. Build and lint verified. |

### Milestone 1 — Core MVP Frontend

Coordinated by a managing agent over shared domain models (`src/types/domain.ts`), `America/New_York` date utilities, Zod v4 schemas, viewer privacy projections, 14 dynamic Georgia Tech seed events, `SeshDataAdapter`, and Vitest unit tests, with feature implementation delegated across five specialized agents:

| ID | Title | Summary |
| --- | --- | --- |
| **1.01** | App Shell & Navigation | Built the responsive Georgia Tech `18+` campus shell, desktop & 5-tab mobile navigation, Demo Identity Switcher, Guest sign-in prompt, and shell routes (`/map`, `/friends`, `/notifications`, `/profile`). |
| **1.02** | Events Hub | Built the Georgia Tech discovery feed (`/`) with live `?q=` search, category/price/time filters, dynamic time-window sections (`Happening Now`, `Tonight`, `This Weekend`, `Upcoming`), host draft banners, and RSVP-ready event cards. |
| **1.03** | Event Detail | Implemented `/events/[id]` with safe cached OpenGraph metadata, conditional exact-address unlocking, Going/Interested/Save toggles, friends-going proof, event Move Groups, share, and simulated moderation reporting. |
| **1.04** | Create & Edit a Move | Built `/events/new` and `/events/[id]/edit` with React Hook Form + Zod v4 validation, audience & address-privacy controls, General vs. Unlocked live preview, and browser-local Save Draft / Publish workflows. |
| **1.05** | Move Groups | Implemented `/move-groups/new`, `/move-groups/[id]`, and `/move-groups/[id]/manage` with privacy-projected roster masking, members-only chat links, request/approve/decline/leave/remove/disband flows, and owner-only guards. |

<!-- #region Milestone 1 Agent Sub-Iterations -->

<details>
<summary><strong>1.01 — Agent 01 Sub-iterations (<code>1.01.1</code> – <code>1.01.4</code>): App Shell &amp; Navigation</strong></summary>

- **`1.01.1` — Context & Contract Audit:** Inspected `domain.ts`, `sesh-provider.tsx`, shared UI primitives, and Next.js 16 `cacheComponents` rules to align persona state and adapter queries.
- **`1.01.2` — Global Shell & Demo Identity:** Built `layout.tsx`, `AppShell`, `SiteHeader`, `DesktopNav`, `MobileNav`, `DemoIdentitySwitcher`, and `DemoSignInDialog` with `<Suspense>`-isolated route leaves.
- **`1.01.3` — Shell Routes & Static Verification:** Implemented `/map`, `/friends`, `/notifications`, and `/profile` (including `ConfirmDialog`-guarded demo data reset) with zero type or lint errors.
- **`1.01.4` — Post-Merge Hydration Guard Refinement:** Refined `SiteHeader`, `DesktopNav`, and `MobileNav` with client hydration guards and stable Radix ID ordering so Partial Prerender shells hydrate cleanly.

</details>

<details>
<summary><strong>1.02 — Agent 02 Sub-iterations (<code>1.02.1</code> – <code>1.02.4</code>): Events Hub</strong></summary>

- **`1.02.1` — Context & Contract Alignment:** Audited `EventView` projections, `SeshProvider`, ET date bucketing, and Next.js 16 `<Suspense>` rules for `useSearchParams()`.
- **`1.02.2` — Core Hub & Card Implementation:** Built `page.tsx`, `events-hub.tsx`, `event-filters.tsx`, `event-section.tsx`, and `event-card.tsx` with time-bucketed feeds, host draft banners, private-address lock badges, and guest-gated Save/RSVP controls.
- **`1.02.3` — Lint, Type & Determinism Verification:** Verified zero render-time `new Date()`, `window`, `localStorage`, or private-address leaks across ESLint and TypeScript checks.
- **`1.02.4` — Cross-Route CTA Alignment:** Connected the Events Hub header's Move Group CTA directly to `/move-groups/new` for seamless crew creation.

</details>

<details>
<summary><strong>1.03 — Agent 03 Sub-iterations (<code>1.03.1</code> – <code>1.03.4</code>): Event Detail</strong></summary>

- **`1.03.1` — Domain & Privacy Contract Audit:** Reviewed `EventView`, `MoveGroupView`, `policies.ts`, and `dates.ts` to verify address unlocking, roster masking, and ET schedule formatting.
- **`1.03.2` — Core Route & Social Modules Build:** Built `page.tsx`, `not-found.tsx`, `event-detail-view.tsx`, `rsvp-controls.tsx`, `friends-going-card.tsx`, `event-move-groups-section.tsx`, `share-event-button.tsx`, and `report-event-dialog.tsx`.
- **`1.03.3` — Hook Dependency & Determinism Verification:** Streamlined reactive adapter reads and verified zero non-deterministic render calls across all 8 owned files.
- **`1.03.4` — Cached Metadata & Section Heading Polish:** Verified `generateMetadata` awaits `params` outside `"use cache"` via `getServerSafePublicEventMetadata` and polished the Move Groups section heading.

</details>

<details>
<summary><strong>1.04 — Agent 04 Sub-iterations (<code>1.04.1</code> – <code>1.04.4</code>): Create &amp; Edit a Move</strong></summary>

- **`1.04.1` — Routes, Suspense & Host Guards:** Scaffolded `/events/new` and `<Suspense>`-wrapped `/events/[id]/edit` with Guest sign-in gating and strict host-only edit protection.
- **`1.04.2` — React Hook Form + Zod v4 Validation:** Implemented `MoveForm` with `Controller`-bound selects, `America/New_York` datetime conversion, and field-level validation errors.
- **`1.04.3` — General vs. Unlocked Move Preview:** Added `MovePreview` (sticky desktop sidebar + mobile dialog) comparing masked campus-viewer cards against unlocked attendee address views.
- **`1.04.4` — Local Draft/Publish Persistence:** Wired `DRAFT` and `PUBLISHED` persistence into `SeshDataAdapter` (`localStorage`) with toast follow-ups to spin up a Move Group.

</details>

<details>
<summary><strong>1.05 — Agent 05 Sub-iterations (<code>1.05.1</code> – <code>1.05.4</code>): Move Groups</strong></summary>

- **`1.05.1` — Domain, Adapter & UI Scaffolding:** Built all 10 Move Groups routes and components enforcing creator + friend visibility, anonymous non-friend counts, members-only chat unlocking, and Owner-Only management.
- **`1.05.2` — Static Analysis & React Compiler Hardening:** Replaced `form.watch()` with `useWatch()` and derived share URLs cleanly via `isHydrated` with zero lint or TypeScript warnings.
- **`1.05.3` — Cache Components & Hydration Audit:** Confirmed async `params` and `useSearchParams()` stay isolated inside `<Suspense>` and `mg-local-*` groups survive refreshes cleanly.
- **`1.05.4` — Cross-Feature Route Alignment:** Linked the empty-published-events fallback CTA in `create-move-group-form.tsx` directly to `/events/new`.

</details>

<!-- #endregion -->

---

## Notes for contributors & agents

- Prefer changes inside the relevant workspace (`apps/web`, future `packages/*`, etc.).
- Keep the root `package.json` free of app-specific dependencies.
- Keep UI components under `apps/web/src/components/ui` until a second consumer justifies a shared package.
- Do **not** add README milestone/iteration entries unless the project owner explicitly asks.
- See `AGENTS.md` for agent-oriented Next.js guidance in this repo.
