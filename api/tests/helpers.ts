import { buildApp } from "../src/app.js";

export async function createTestApp(
  env: Record<string, string> = {},
) {
  return buildApp({
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      HOST: "127.0.0.1",
      PORT: "4000",
      WEB_ORIGIN: "http://localhost:3000",
      AUTH_MODE: "disabled",
      ...env,
    },
    logger: false,
  });
}
