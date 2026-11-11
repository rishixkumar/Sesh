# Sesh

Sesh is an npm workspaces monorepo. The Next.js frontend lives in `apps/web`; shared packages, docs, and infrastructure will land in their own top-level folders as the project grows.

> **Living document** — progress is tracked as **Milestone.iteration** (for example `0.1`, `0.2`). New entries are added only when explicitly requested.

---

## Current status

| Area | Status |
| --- | --- |
| Monorepo layout | ✅ npm workspaces (`apps/*`, `packages/*`) |
| Frontend (`@sesh/web`) | ✅ Next.js App Router + Tailwind CSS |
| UI kit | ✅ shadcn/ui (`button`, `card`, `badge`, `input`, `dialog`) |
| Shared packages | ⏳ reserved under `packages/` |
| Backend | ⏳ planned |
| Docs | ⏳ reserved under `docs/` |
| Infra | ⏳ reserved under `infra/` |

**Latest documented:** Milestone **0** · iteration **0.2**

---

## Repository structure

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
│       │   │   └── page.tsx
│       │   ├── components/
│       │   │   └── ui/
│       │   │       ├── badge.tsx
│       │   │       ├── button.tsx
│       │   │       ├── card.tsx
│       │   │       ├── dialog.tsx
│       │   │       └── input.tsx
│       │   └── lib/
│       │       └── utils.ts
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
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

### What each top-level folder is for

| Path | Role |
| --- | --- |
| `apps/` | Deployable applications. Right now: `@sesh/web` (Next.js). |
| `packages/` | Shared libraries and tooling used across apps. |
| `docs/` | Project documentation beyond this README. |
| `infra/` | Infrastructure and deployment configuration. |
| Root `package.json` | Workspace root — scripts and workspace wiring only. |

---

## Workspaces

Root scripts proxy into the web app workspace:

| Script | What it runs |
| --- | --- |
| `npm run dev` | `next dev` in `@sesh/web` |
| `npm run build` | `next build` in `@sesh/web` |
| `npm run lint` | `eslint .` in `@sesh/web` |

Frontend dependencies live in `apps/web/package.json`. The root package keeps workspace config and orchestration scripts only.

---

## Getting started

### Prerequisites

- Node.js **≥ 22.13.0** (or `^20.19.0` / `≥ 24`) — required by `eslint-visitor-keys`
- npm (workspaces are used by default)
- **Recommended:** [nvm](https://github.com/nvm-sh/nvm) for local Node version management

```bash
nvm install 22
nvm use 22
node -v
```

### Install

From the repo root:

```bash
npm install
```

### Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edits under `apps/web/src/app/` hot-reload.

### Build & lint

```bash
npm run build
npm run lint
```

### Security audit

```bash
npm audit
```

Current known findings (as of **0.2**): **7 moderate** vulnerabilities in the `minimatch` → `@typescript-eslint/*` chain. Fixes available via `npm audit fix`, but review before applying.

---

## Frontend (`apps/web`)

| Detail | Value |
| --- | --- |
| Package name | `@sesh/web` |
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Component primitives | Radix (`radix-nova` style) |
| Base color | Zinc |
| Language | TypeScript |
| Import alias | `@/*` → `./src/*` |

### UI components

Reusable primitives live in `apps/web/src/components/ui` (solo-project simplicity; extract to `packages/` later if a second frontend needs them):

| Component | Path |
| --- | --- |
| Button | `src/components/ui/button.tsx` |
| Card | `src/components/ui/card.tsx` |
| Badge | `src/components/ui/badge.tsx` |
| Input | `src/components/ui/input.tsx` |
| Dialog | `src/components/ui/dialog.tsx` |

Helpers:

- `src/lib/utils.ts` — `cn()` class-name utility
- `components.json` — shadcn/ui configuration

Primary app entry points:

- `apps/web/src/app/page.tsx` — home page
- `apps/web/src/app/layout.tsx` — root layout
- `apps/web/src/app/globals.css` — theme tokens + global styles

Add more components from `apps/web`:

```bash
npx shadcn@latest add <component>
```

---

## Milestones

Progress is documented as **Milestone.iteration**. Milestone **0** covers foundational setup before product features.

### Milestone 0 — Foundation

| ID | Title | Summary |
| --- | --- | --- |
| **0.1** | Monorepo bootstrap | Moved the Next.js app into `apps/web`, added npm workspaces at the root, and split frontend dependencies into `@sesh/web`. |
| **0.2** | shadcn/ui foundation | Initialized shadcn/ui in `@sesh/web` (Zinc base) and added `button`, `card`, `badge`, `input`, and `dialog`. Build and lint verified. |

---

## Notes for contributors & agents

- Prefer changes inside the relevant workspace (`apps/web`, future `packages/*`, etc.).
- Keep the root `package.json` free of app-specific dependencies.
- Keep UI components under `apps/web/src/components/ui` until a second consumer justifies a shared package.
- Do **not** add README milestone/iteration entries unless the project owner explicitly asks.
- See `AGENTS.md` for agent-oriented Next.js guidance in this repo.
