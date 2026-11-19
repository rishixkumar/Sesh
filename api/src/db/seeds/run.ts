/**
 * Alternate CLI entry — prefer `npm run db:seed` / `index.ts`.
 * Kept so `npx tsx src/db/seeds/run.ts` works as documented in NOTES.md.
 */

import { seed } from "./index.js";

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});
