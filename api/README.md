# SESH API

Fastify TypeScript backend for Sesh. Phase 1 provides application bootstrap, configuration, security defaults, and health endpoints. Database persistence and domain routes arrive in later phases.

## Requirements

- Node.js 22 LTS or newer
- npm

## Setup

```bash
cd api
cp .env.example .env
npm install
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with reload on `http://127.0.0.1:4000` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run the compiled production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Vitest suite |

## Health checks

- `GET /health` — process is up
- `GET /ready` — app dependencies initialized (database checks arrive in Phase 2)

## Notes

- Frontend origin allowed by CORS is controlled by `WEB_ORIGIN` (default `http://localhost:3000`).
- `AUTH_MODE=disabled` means protected routes fail closed until a trusted auth mode is configured.
- The Next.js app in `web/` is independent and does not need to be running.
