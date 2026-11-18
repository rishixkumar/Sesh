/** Must match the literal cookie key in `src/proxy.ts` matcher (matchers are static). */
export const INTRO_SEEN_COOKIE = "sesh_intro_seen";

export const CAMPUS_WAITLIST_STORAGE_KEY = "sesh_campus_waitlist";

/** Hard ceiling on the intro loader so it never feels fake-slow. */
export const LOADER_MAX_MS = 1800;
/** Minimum time so the logo draw can finish instead of flashing. */
export const LOADER_MIN_MS = 1100;
