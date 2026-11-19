import { describe, expect, it } from "vitest";

import { createTestApp } from "./helpers.js";

describe("application factory", () => {
  it("initializes successfully", async () => {
    const app = await createTestApp();

    expect(app.config.PORT).toBe(4000);
    expect(app.config.AUTH_MODE).toBe("disabled");
    expect(app.hasRoute({ method: "GET", url: "/health" })).toBe(true);

    await app.close();
  });
});
