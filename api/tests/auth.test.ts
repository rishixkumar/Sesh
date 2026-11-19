import { describe, expect, it } from "vitest";

import { buildApp } from "../src/app.js";
import { SEED_USER_IDS } from "../src/db/seeds/ids.js";
import { createTestApp } from "./helpers.js";

const seedUserHeader = {
  "x-sesh-test-user-id": SEED_USER_IDS.maya,
  "x-sesh-test-school-id": "a1111111-1111-4111-8111-111111111111",
};

describe("authentication fail-closed behavior", () => {
  it("blocks protected routes when AUTH_MODE is disabled", async () => {
    const app = await createTestApp({ AUTH_MODE: "disabled" });

    const response = await app.inject({
      method: "GET",
      url: "/v1/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "UNAUTHENTICATED",
        requestId: expect.any(String),
      },
    });

    await app.close();
  });

  it("ignores the test user header when AUTH_MODE is disabled", async () => {
    const app = await createTestApp({ AUTH_MODE: "disabled" });

    const session = await app.inject({
      method: "GET",
      url: "/v1/session",
      headers: seedUserHeader,
    });

    expect(session.statusCode).toBe(200);
    expect(session.json()).toEqual({ user: null });

    const protectedResponse = await app.inject({
      method: "GET",
      url: "/v1/protected",
      headers: seedUserHeader,
    });

    expect(protectedResponse.statusCode).toBe(401);
    expect(protectedResponse.json().error.code).toBe("UNAUTHENTICATED");

    await app.close();
  });

  it("blocks protected routes in test mode when no user is present", async () => {
    const app = await createTestApp({ AUTH_MODE: "test" });

    const session = await app.inject({
      method: "GET",
      url: "/v1/session",
    });
    expect(session.statusCode).toBe(200);
    expect(session.json()).toEqual({ user: null });

    const response = await app.inject({
      method: "GET",
      url: "/v1/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "UNAUTHENTICATED",
        requestId: expect.any(String),
      },
    });

    await app.close();
  });

  it("does not accept a test header without a database user lookup", async () => {
    const app = await createTestApp({ AUTH_MODE: "test" });

    const response = await app.inject({
      method: "GET",
      url: "/v1/protected",
      headers: seedUserHeader,
      payload: {
        userId: SEED_USER_IDS.maya,
        schoolId: "a1111111-1111-4111-8111-111111111111",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHENTICATED");

    await app.close();
  });

  it("fails closed in managed mode and ignores the test header", async () => {
    const app = await createTestApp({ AUTH_MODE: "managed" });

    const session = await app.inject({
      method: "GET",
      url: "/v1/session",
      headers: seedUserHeader,
    });
    expect(session.statusCode).toBe(200);
    expect(session.json()).toEqual({ user: null });

    const response = await app.inject({
      method: "GET",
      url: "/v1/protected",
      headers: seedUserHeader,
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHENTICATED");

    await app.close();
  });

  it("refuses to start when production is combined with test auth", async () => {
    await expect(
      buildApp({
        env: {
          NODE_ENV: "production",
          AUTH_MODE: "test",
          LOG_LEVEL: "silent",
        },
        logger: false,
        skipDb: true,
      }),
    ).rejects.toThrow(/AUTH_MODE=test cannot be used when NODE_ENV=production/);
  });

  it("keeps health available while auth is disabled", async () => {
    const app = await createTestApp({ AUTH_MODE: "disabled" });

    const health = await app.inject({ method: "GET", url: "/health" });
    const ready = await app.inject({ method: "GET", url: "/ready" });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok", service: "sesh-api" });
    expect(ready.statusCode).toBe(200);

    await app.close();
  });
});
