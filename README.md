# Sesh

Sesh is an 18+ campus event discovery and social coordination platform launching at Georgia Tech and Midtown Atlanta, organized as an npm workspaces monorepo. The Next.js frontend lives in `apps/web`; shared packages, milestone documentation, and infrastructure live in their own top-level folders as the project evolves.

> **Living document** — progress is tracked as **Milestone.iteration** (e.g. `0.1`, `0.2`) or **Milestone.agent** (`1.01`–`1.05`), where each Milestone 1 entry links directly to its dedicated **TSDoc / Javadoc-style** sub-iteration manual (`1.0X.1`–`1.0X.4`) under [`docs/milestones/milestone-1/`](./docs/milestones/milestone-1/README.md). New milestone entries are added only when explicitly requested.

---

## Current status

| Area | Status |
| --- | --- |
| Monorepo layout | ✅ npm workspaces (`apps/*`, `packages/*`) |
| Frontend (`@sesh/web`) | ✅ Next.js 16 App Router (`cacheComponents` + Partial Prerendering) |
| UI & forms | ✅ Tailwind CSS v4 + shadcn/ui + React Hook Form + Zod v4 |
| Core MVP frontend | ✅ App Shell, Events Hub, Event Detail, Create/Edit Move, Move Groups |
| Unit tests | ✅ Vitest (`npm test` — filtering, validation, dates, privacy, persistence) |
| Technical docs (`docs/`) | ✅ [`docs/milestones/milestone-1/`](./docs/milestones/milestone-1/README.md) (`1.01`–`1.05` API & sub-iteration manuals) |
| Shared packages | ⏳ reserved under `packages/` |
| Backend & Infra | ⏳ planned (`SeshDataAdapter` ready to swap to REST API; `infra/` reserved) |

**Latest documented:** Milestone **1** · Tracks **[1.01 – 1.05](./docs/milestones/milestone-1/README.md)** (`1.01.1` – `1.05.4`)

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
│   └── milestones/
│       └── milestone-1/
│           ├── README.md
│           ├── 1.01-app-shell/
│           │   └── README.md
│           ├── 1.02-events-hub/
│           │   └── README.md
│           ├── 1.03-event-detail/
│           │   └── README.md
│           ├── 1.04-create-edit-move/
│           │   └── README.md
│           └── 1.05-move-groups/
│               └── README.md
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
| `docs/` | Technical milestone manuals, sub-iteration logs, API specs, and regression checklists. |
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

Progress is documented as **Milestone.iteration** for single-track work and **Milestone.agent** for multi-agent milestones, with each agent row linking directly to its dedicated sub-iteration manual (`Milestone.agent.iteration`) under [`docs/milestones/`](./docs/milestones/milestone-1/README.md).

### Milestone 0 — Foundation

| ID | Title | Summary |
| --- | --- | --- |
| **0.1** | Monorepo bootstrap | Moved the Next.js app into `apps/web`, added npm workspaces at the root, and split frontend dependencies into `@sesh/web`. |
| **0.2** | shadcn/ui foundation | Initialized shadcn/ui in `@sesh/web` (Zinc base) and added `button`, `card`, `badge`, `input`, and `dialog`. Build and lint verified. |

### Milestone 1 — Core MVP Frontend ([Milestone 1 Index](./docs/milestones/milestone-1/README.md))

Coordinated over shared domain models (`src/types/domain.ts`), `America/New_York` date utilities, Zod v4 schemas, viewer privacy projections, 14 dynamic Georgia Tech seed events, `SeshDataAdapter`, and Vitest unit tests, with feature implementation and technical documentation owned by five specialized agents:

| ID | Title | Summary | Sub-Iterations & Technical Docs |
| --- | --- | --- | --- |
| **[1.01](./docs/milestones/milestone-1/1.01-app-shell/README.md)** | App Shell & Navigation | Built the responsive Georgia Tech `18+` campus shell, desktop & 5-tab mobile navigation, Demo Identity Switcher, Guest sign-in prompt, and shell routes (`/map`, `/friends`, `/notifications`, `/profile`). | [`1.01.1` – `1.01.4` Manual](./docs/milestones/milestone-1/1.01-app-shell/README.md) · [`Folder`](./docs/milestones/milestone-1/1.01-app-shell/) |
| **[1.02](./docs/milestones/milestone-1/1.02-events-hub/README.md)** | Events Hub | Built the Georgia Tech discovery feed (`/`) with live `?q=` search, category/price/time filters, dynamic time-window sections (`Happening Now`, `Tonight`, `This Weekend`, `Upcoming`), host draft banners, and RSVP-ready event cards. | [`1.02.1` – `1.02.4` Manual](./docs/milestones/milestone-1/1.02-events-hub/README.md) · [`Folder`](./docs/milestones/milestone-1/1.02-events-hub/) |
| **[1.03](./docs/milestones/milestone-1/1.03-event-detail/README.md)** | Event Detail | Implemented `/events/[id]` with safe cached OpenGraph metadata, conditional exact-address unlocking, Going/Interested/Save toggles, friends-going proof, event Move Groups, share, and simulated moderation reporting. | [`1.03.1` – `1.03.4` Manual](./docs/milestones/milestone-1/1.03-event-detail/README.md) · [`Folder`](./docs/milestones/milestone-1/1.03-event-detail/) |
| **[1.04](./docs/milestones/milestone-1/1.04-create-edit-move/README.md)** | Create & Edit a Move | Built `/events/new` and `/events/[id]/edit` with React Hook Form + Zod v4 validation, audience & address-privacy controls, General vs. Unlocked live preview, and browser-local Save Draft / Publish workflows. | [`1.04.1` – `1.04.4` Manual](./docs/milestones/milestone-1/1.04-create-edit-move/README.md) · [`Folder`](./docs/milestones/milestone-1/1.04-create-edit-move/) |
| **[1.05](./docs/milestones/milestone-1/1.05-move-groups/README.md)** | Move Groups | Implemented `/move-groups/new`, `/move-groups/[id]`, and `/move-groups/[id]/manage` with privacy-projected roster masking, members-only chat links, request/approve/decline/leave/remove/disband flows, and owner-only guards. | [`1.05.1` – `1.05.4` Manual](./docs/milestones/milestone-1/1.05-move-groups/README.md) · [`Folder`](./docs/milestones/milestone-1/1.05-move-groups/) |

---

## Notes for contributors & agents

- Prefer changes inside the relevant workspace (`apps/web`, future `packages/*`, etc.).
- Keep the root `package.json` free of app-specific dependencies.
- Keep UI components under `apps/web/src/components/ui` until a second consumer justifies a shared package.
- Do **not** add README milestone/iteration entries unless the project owner explicitly asks.
- See `AGENTS.md` for agent-oriented Next.js guidance in this repo.
