# Sesh

Sesh is an npm workspaces monorepo. The Next.js frontend lives in `apps/web`; shared packages, docs, and infrastructure will land in their own top-level folders as the project grows.

> **Living document** — this README is updated after every major iteration so it always reflects the current shape of the repo.

---

## Current status

| Area | Status |
| --- | --- |
| Monorepo layout | ✅ npm workspaces (`apps/*`, `packages/*`) |
| Frontend (`@sesh/web`) | ✅ Next.js app scaffolded and relocated |
| Shared packages | ⏳ reserved under `packages/` |
| Backend | ⏳ planned |
| Docs | ⏳ reserved under `docs/` |
| Infra | ⏳ reserved under `infra/` |

**Iteration complete:** frontend separated into `apps/web`, root configured as the workspace orchestrator.

---

## Repository structure

```text
sesh/
├── apps/
│   └── web/
│       ├── public/
│       ├── src/
│       │   └── app/
│       │       ├── globals.css
│       │       ├── layout.tsx
│       │       └── page.tsx
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

- Node.js (LTS recommended)
- npm (workspaces are used by default)

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

---

## Frontend (`apps/web`)

| Detail | Value |
| --- | --- |
| Package name | `@sesh/web` |
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Import alias | `@/*` → `./src/*` |

Primary entry points:

- `apps/web/src/app/page.tsx` — home page
- `apps/web/src/app/layout.tsx` — root layout
- `apps/web/src/app/globals.css` — global styles

---

## Changelog of major iterations

| Iteration | Summary |
| --- | --- |
| **1 — Monorepo bootstrap** | Moved the Next.js app into `apps/web`, added npm workspaces at the root, and split frontend dependencies into `@sesh/web`. |

---

## Notes for contributors & agents

- Prefer changes inside the relevant workspace (`apps/web`, future `packages/*`, etc.).
- Keep the root `package.json` free of app-specific dependencies.
- Update this README when a major iteration lands (new app, package, backend, infra, or docs structure).
- See `AGENTS.md` for agent-oriented Next.js guidance in this repo.
