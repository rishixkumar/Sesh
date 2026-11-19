import { defineConfig } from "vitest/config";

/**
 * Unit suites stay parallel. DB integration suites are a separate project
 * (single file under tests/db/) and self-skip unless DATABASE_URL_TEST is set
 * and SQL migrations exist.
 *
 *   DATABASE_URL_TEST=postgres://sesh:sesh@127.0.0.1:5433/sesh_test \
 *     npm test -- --project db
 */
export default defineConfig({
  test: {
    environment: "node",
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/db/**"],
        },
      },
      {
        test: {
          name: "db",
          environment: "node",
          include: ["tests/db/**/*.test.ts"],
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
