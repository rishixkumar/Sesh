import { buildApp } from "../src/app.js";

export async function createTestApp(
  env: Record<string, string> = {},
  options: {
    checkDatabase?: () => Promise<void>;
    skipDb?: boolean;
  } = {},
) {
  return buildApp({
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      HOST: "127.0.0.1",
      PORT: "4000",
      WEB_ORIGIN: "http://localhost:3000",
      AUTH_MODE: "disabled",
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        process.env.DATABASE_URL ??
        "postgres://sesh:sesh@127.0.0.1:5433/sesh_test",
      ...env,
    },
    logger: false,
    // Unit tests default to a successful readiness probe without requiring Docker.
    skipDb: options.skipDb ?? true,
    checkDatabase:
      options.checkDatabase ??
      (async () => {
        /* ready */
      }),
  });
}
