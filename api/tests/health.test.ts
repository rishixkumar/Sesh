import { describe, expect, it } from "vitest";

import { createTestApp } from "./helpers.js";

describe("health endpoints", () => {
  it("GET /health returns ok", async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      service: "sesh-api",
    });

    await app.close();
  });

  it("GET /ready returns ready", async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ready",
      service: "sesh-api",
    });

    await app.close();
  });
});
