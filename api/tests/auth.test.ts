import { describe, expect, it } from "vitest";

import { createTestApp } from "./helpers.js";

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

  it("blocks protected routes in test mode when no user is present", async () => {
    const app = await createTestApp({ AUTH_MODE: "test" });

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
});
