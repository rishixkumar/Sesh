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
});
