# `web/` — Sesh Next.js app (`@sesh/web`)

The whole product lives here: routes, UI, domain logic, tests, and config. Run every npm command from this folder.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest run
npm run lint     # eslint .
npm run build    # next build
```

## Where things are

| Folder | What's inside | Guide |
| --- | --- | --- |
| `src/app/` | Routes: every page, layout, and the `/welcome` landing page | [Route map](./src/app/README.md) |
| `src/components/` | React UI grouped by feature, plus shared pieces and shadcn/ui primitives | [Component map](./src/components/README.md) |
| `src/lib/` | Data adapter, privacy policies, data structures, validation, dates, tests | [Logic map](./src/lib/README.md) |
| `src/types/` | Shared domain model (`domain.ts`) | [`domain.ts`](./src/types/domain.ts) |
| `src/proxy.ts` | Sends first-time visitors from `/` to `/welcome` (cookie `sesh_intro_seen`) | [`proxy.ts`](./src/proxy.ts) |
| `public/` | Static assets served from `/` | — |

## Config files

| File | Purpose |
| --- | --- |
| `package.json` / `package-lock.json` | Dependencies and scripts |
| `next.config.ts` | Next.js config (Cache Components, Partial Prefetching, Tailwind loader) |
| `tsconfig.json` | TypeScript config; `@/*` maps to `./src/*` |
| `eslint.config.mjs` | ESLint (Next.js preset) |
| `vitest.config.mts` | Vitest unit-test config |
| `components.json` | shadcn/ui generator settings |
| `AGENTS.md` | Next.js 16 notes for AI coding agents |

Deployed on Vercel with the project root directory set to `web`.
