import { describe, expect, it } from "vitest";

import { createTestApp } from "./helpers.js";

describe("CORS", () => {
  it("permits the configured web origin", async () => {
    const app = await createTestApp({
      WEB_ORIGIN: "http://localhost:3000",
    });

    const response = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "GET",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );

    await app.close();
  });

  it("rejects unauthorized origins", async () => {
    const app = await createTestApp({
      WEB_ORIGIN: "http://localhost:3000",
    });

    const response = await app.inject({
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "http://evil.example",
        "access-control-request-method": "GET",
      },
    });

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();

    await app.close();
  });
});
