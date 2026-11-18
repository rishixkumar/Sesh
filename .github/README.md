# Sesh

Sesh is an 18+ campus event discovery and social coordination platform launching at Georgia Tech and Midtown Atlanta. The Next.js app lives in [`web/`](../web/README.md), technical manuals live in [`docs/`](../docs/README.md), and repository meta files (this README, agent notes) live in [`.github/`](./).

> **Living document** — progress is tracked as **Milestone.iteration** (e.g. `0.1`, `0.2`) or **Milestone.agent** (`1.01`–`1.06`), where each Milestone 1 entry links directly to its dedicated **TSDoc / Javadoc-style** sub-iteration manual (`1.0X.1`–`1.0X.4`) under [`docs/milestones/milestone-1/`](../docs/milestones/milestone-1/README.md); `1.06` links to the data-structures & algorithms manual (`DS-01`–`DS-06`) under [`docs/ds-algorithms/`](../docs/ds-algorithms/README.md). Milestone 2 entries (`2.01`) are single-track and link to their implementation folders. New milestone entries are added only when explicitly requested.

---

## Current status

| Area | Status |
| --- | --- |
| Repository layout | ✅ `web/` (Next.js app) · `docs/` (manuals) · `.github/` (README, agent notes) |
| Frontend (`@sesh/web`) | ✅ Next.js 16 App Router (`cacheComponents` + Partial Prerendering) |
| UI & forms | ✅ Tailwind CSS v4 + shadcn/ui + React Hook Form + Zod v4 |
| Core MVP frontend | ✅ App Shell, Events Hub, Event Detail, Create/Edit Move, Move Groups |
| Data structures & algorithms | ✅ Hash maps, graph + BFS, aggregation, filter pipeline, suffix trie, binary heap ([`1.06`](../docs/ds-algorithms/README.md)) |
| Landing page (`/welcome`) | ✅ Apple-style scroll intro for first-time visitors — Motion + Lenis (`2.01`) |
| Unit tests | ✅ Vitest (`npm test` — filtering, validation, dates, privacy, persistence, data structures) |
| Technical docs (`docs/`) | ✅ [`docs/milestones/milestone-1/`](../docs/milestones/milestone-1/README.md) (`1.01`–`1.05` API & sub-iteration manuals) · [`docs/ds-algorithms/`](../docs/ds-algorithms/README.md) (`1.06`) |
| Backend & Infra | ⏳ planned (`SeshDataAdapter` ready to swap to a REST API) |

**Latest documented:** Milestone **2** · Track **2.01** (Landing Page) · Milestone **1** · Tracks **[1.01 – 1.05](../docs/milestones/milestone-1/README.md)** (`1.01.1` – `1.05.4`) · **[1.06](../docs/ds-algorithms/README.md)** (`DS-01` – `DS-06`)

---

## Project map

Every major folder has its own guide page (GitHub shows it below the file list), so you can jump straight to the area you care about instead of clicking through every directory.

```text
sesh/
├── .github/          README.md (this file) · AGENTS.md
├── docs/             milestone manuals & data-structures reference
├── web/              the Next.js app (@sesh/web)
│   ├── public/       static assets
│   └── src/
│       ├── app/          routes (pages & layouts)
│       ├── components/   React UI, grouped by feature
│       ├── lib/          domain logic, data, state, tests
│       ├── types/        shared domain types
│       └── proxy.ts      first-visit redirect  / → /welcome
└── .gitignore
```

| I want to… | Go to |
| --- | --- |
| Run the app, see scripts & config files | [`web/`](../web/README.md) |
| Find the page behind a URL | [`web/src/app/`](../web/src/app/README.md) — route → file table |
| Find a UI component | [`web/src/components/`](../web/src/components/README.md) — features, shared, and `ui/` primitives |
| Find business logic, data, or tests | [`web/src/lib/`](../web/src/lib/README.md) — adapter, privacy policies, data structures, tests |
| See the domain model | [`web/src/types/domain.ts`](../web/src/types/domain.ts) |
| Read milestone manuals & design notes | [`docs/`](../docs/README.md) |

---

## Getting started

<details open>
<summary><strong>Prerequisites, local setup &amp; scripts</strong></summary>

### Prerequisites

- Node.js **≥ 22.13.0** (or `≥ 24`) — required by `eslint-visitor-keys`
- npm
- **Recommended:** [nvm](https://github.com/nvm-sh/nvm) for local Node version management

```bash
nvm install 22
nvm use 22
node -v
```

### Install, develop & verify

All commands run from the `web/` folder:

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm test
npm run lint
npm run build
```

| Script | What it runs |
| --- | --- |
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `eslint .` |
| `npm test` | `vitest run` |

</details>

---

## Frontend (`web/`)

<details>
<summary><strong>Stack details, timezone conventions &amp; prototype security notes</strong></summary>

| Detail | Value |
| --- | --- |
| Package name | `@sesh/web` |
| Framework | Next.js 16.4.6 (App Router, Cache Components + Partial Prerendering) |
| Styling | Tailwind CSS v4 + shadcn/ui (`radix-nova`, Zinc base) |
| Forms & validation | React Hook Form + Zod v4 |
| Scroll animation (M2) | Motion (`motion/react` scroll-linked transforms) + Lenis smooth scroll |
| Timezone convention | Stored as UTC ISO strings · displayed in `America/New_York` (ET) |
| Persistence (M1) | Centralized `SeshDataAdapter` (`LocalMockSeshAdapter` + `localStorage`) |
| Unit testing | Vitest + React Testing Library (`src/lib/__tests__/`) |
| Import alias | `@/*` → `./src/*` |
| Deployment | Vercel, project root directory `web` |

> **Prototype security note:** Milestone 1 uses simulated personas (`Guest`, `Maya Patel`, `Jordan Brooks`, `Tyler Nguyen`) and browser-local adapter projections to prevent exposing private house-party addresses, hidden Move Group members, or members-only chat links in the UI. Real `.edu` authentication and server-enforced authorization land in upcoming backend milestones.

Add more shadcn/ui components from `web/`:

```bash
npx shadcn@latest add <component>
```

</details>

---

## Milestones

Progress is documented as **Milestone.iteration** for single-track work and **Milestone.agent** for multi-agent milestones, with each agent row linking directly to its dedicated sub-iteration manual (`Milestone.agent.iteration`) under [`docs/milestones/`](../docs/milestones/milestone-1/README.md).

### Milestone 0 — Foundation

| ID | Title | Summary |
| --- | --- | --- |
| **0.1** | Monorepo bootstrap | Moved the Next.js app into `apps/web`, added npm workspaces at the root, and split frontend dependencies into `@sesh/web`. |
| **0.2** | shadcn/ui foundation | Initialized shadcn/ui in `@sesh/web` (Zinc base) and added `button`, `card`, `badge`, `input`, and `dialog`. Build and lint verified. |

### Milestone 1 — Core MVP Frontend ([Milestone 1 Index](../docs/milestones/milestone-1/README.md))

Coordinated over shared domain models (`src/types/domain.ts`), `America/New_York` date utilities, Zod v4 schemas, viewer privacy projections, 14 dynamic Georgia Tech seed events, `SeshDataAdapter`, and Vitest unit tests, with feature implementation and technical documentation owned by five specialized agents (`1.01`–`1.05`), followed by a data-structures & algorithms foundation pass (`1.06`, branch `ds-alg-integrations`):

| ID | Title | Summary | Sub-Iterations & Technical Docs |
| --- | --- | --- | --- |
| **[1.01](../docs/milestones/milestone-1/1.01-app-shell/README.md)** | App Shell & Navigation | Built the responsive Georgia Tech `18+` campus shell, desktop & 5-tab mobile navigation, Demo Identity Switcher, Guest sign-in prompt, and shell routes (`/map`, `/friends`, `/notifications`, `/profile`). | [`1.01.1` – `1.01.4` Manual](../docs/milestones/milestone-1/1.01-app-shell/README.md) · [`Folder`](../docs/milestones/milestone-1/1.01-app-shell/) |
| **[1.02](../docs/milestones/milestone-1/1.02-events-hub/README.md)** | Events Hub | Built the Georgia Tech discovery feed (`/`) with live `?q=` search, category/price/time filters, dynamic time-window sections (`Happening Now`, `Tonight`, `This Weekend`, `Upcoming`), host draft banners, and RSVP-ready event cards. | [`1.02.1` – `1.02.4` Manual](../docs/milestones/milestone-1/1.02-events-hub/README.md) · [`Folder`](../docs/milestones/milestone-1/1.02-events-hub/) |
| **[1.03](../docs/milestones/milestone-1/1.03-event-detail/README.md)** | Event Detail | Implemented `/events/[id]` with safe cached OpenGraph metadata, conditional exact-address unlocking, Going/Interested/Save toggles, friends-going proof, event Move Groups, share, and simulated moderation reporting. | [`1.03.1` – `1.03.4` Manual](../docs/milestones/milestone-1/1.03-event-detail/README.md) · [`Folder`](../docs/milestones/milestone-1/1.03-event-detail/) |
| **[1.04](../docs/milestones/milestone-1/1.04-create-edit-move/README.md)** | Create & Edit a Move | Built `/events/new` and `/events/[id]/edit` with React Hook Form + Zod v4 validation, audience & address-privacy controls, General vs. Unlocked live preview, and browser-local Save Draft / Publish workflows. | [`1.04.1` – `1.04.4` Manual](../docs/milestones/milestone-1/1.04-create-edit-move/README.md) · [`Folder`](../docs/milestones/milestone-1/1.04-create-edit-move/) |
| **[1.05](../docs/milestones/milestone-1/1.05-move-groups/README.md)** | Move Groups | Implemented `/move-groups/new`, `/move-groups/[id]`, and `/move-groups/[id]/manage` with privacy-projected roster masking, members-only chat links, request/approve/decline/leave/remove/disband flows, and owner-only guards. | [`1.05.1` – `1.05.4` Manual](../docs/milestones/milestone-1/1.05-move-groups/README.md) · [`Folder`](../docs/milestones/milestone-1/1.05-move-groups/) |
| **[1.06](../docs/ds-algorithms/README.md)** | Data Structures & Algorithms | Rebuilt the domain layer on reusable, tested structures with byte-identical viewer behavior: hash-map indexes with cache invalidation, a friendship graph with BFS friend suggestions, single-pass RSVP aggregation, a composable filter pipeline with stable comparators, a suffix-trie search index (Hub + Friends people search), and a binary-heap `ActivityFeed` for `/notifications`. | [`DS-01` – `DS-06` Manual](../docs/ds-algorithms/README.md) · [`Folder`](../docs/ds-algorithms/) |

### Milestone 2 — Landing Page & First-Visit Experience

Built on the Milestone 1 frontend as a single-track iteration (branch `HomePage`, merged into `Production`): an Apple-style scroll story that introduces Sesh to first-time visitors, using Motion scroll-linked animation and Lenis smooth scrolling, with a static `prefers-reduced-motion` fallback and real HTML text for SEO and screen readers:

| ID | Title | Summary | Implementation |
| --- | --- | --- | --- |
| **[2.01](../web/src/components/landing/)** | Landing Page (`/welcome`) | Built a scroll-driven intro at `/welcome`: an SVG logo stroke-draw loader tied to real asset readiness (1.1 s min, 1.8 s cap), a word-by-word hook statement, a pinned phone mockup that scrubs through five chapters (live feed, Move Groups, audience picker, expiring location sharing, host flow + share card), guardrails, a campus waitlist (browser-local until a backend exists), and a final *Enter Sesh* / guest CTA. `proxy.ts` sends `/` to `/welcome` only when the `sesh_intro_seen` cookie is missing, a persistent *Skip intro* button is always visible, and existing pages moved into an `(app)` route group so the landing page renders without the app shell (URLs unchanged). | [`components/landing/`](../web/src/components/landing/) · [`lib/landing/`](../web/src/lib/landing/) · [`app/welcome/`](../web/src/app/welcome/page.tsx) · [`proxy.ts`](../web/src/proxy.ts) |


---

## Notes for contributors & agents

- App code, dependencies, and config live in `web/`; run npm commands from there.
- Keep UI primitives under `web/src/components/ui` and feature components in their feature folder.
- When adding a top-level folder under `web/src/`, add a line to the matching guide page so the [project map](#project-map) stays accurate.
- Do **not** add README milestone/iteration entries unless the project owner explicitly asks.
- See [`AGENTS.md`](./AGENTS.md) for agent-oriented Next.js guidance in this repo.
