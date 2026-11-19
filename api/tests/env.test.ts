import { describe, expect, it } from "vitest";

import { loadEnv } from "../src/config/env.js";

describe("environment configuration", () => {
  it("applies recommended defaults", () => {
    const env = loadEnv({});

    expect(env).toMatchObject({
      NODE_ENV: "development",
      PORT: 4000,
      HOST: "127.0.0.1",
      WEB_ORIGIN: "http://localhost:3000",
      LOG_LEVEL: "info",
      AUTH_MODE: "disabled",
    });
  });

  it("fails on invalid configuration", () => {
    expect(() =>
      loadEnv({
        PORT: "not-a-number",
      }),
    ).toThrow(/Invalid environment configuration/);
  });

  it("rejects AUTH_MODE=test when NODE_ENV is production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        AUTH_MODE: "test",
      }),
    ).toThrow(/AUTH_MODE=test cannot be used when NODE_ENV=production/);
  });

  it("allows AUTH_MODE=disabled in production", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      AUTH_MODE: "disabled",
    });

    expect(env.AUTH_MODE).toBe("disabled");
    expect(env.NODE_ENV).toBe("production");
  });
});
