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

  it("GET /ready returns ready when database is available", async () => {
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

  it("GET /ready returns 503 when database is unavailable", async () => {
    const app = await createTestApp(
      {},
      {
        checkDatabase: async () => {
          throw new Error("connection refused");
        },
      },
    );

    const response = await app.inject({
      method: "GET",
      url: "/ready",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: "not_ready",
      service: "sesh-api",
    });

    await app.close();
  });
});
