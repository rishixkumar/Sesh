import { describe, expect, it } from "vitest";

import { AppError } from "../src/lib/errors.js";
import { createTestApp } from "./helpers.js";

describe("error handling", () => {
  it("returns a consistent 404 for unknown routes", async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: "GET",
      url: "/does-not-exist",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: expect.any(String),
        requestId: expect.any(String),
      },
    });
    expect(response.json().error.stack).toBeUndefined();
    expect(JSON.stringify(response.json())).not.toContain("at ");

    await app.close();
  });

  it("returns consistent validation errors for invalid requests", async () => {
    const app = await createTestApp();

    const response = await app.inject({
      method: "POST",
      url: "/v1/echo",
      headers: { "content-type": "application/json" },
      payload: { message: "" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request contains invalid data.",
        requestId: expect.any(String),
      },
    });

    await app.close();
  });

  it("does not expose stack traces for unexpected errors", async () => {
    const app = await createTestApp();

    app.get("/boom", async () => {
      throw new Error("secret stack details");
    });

    const response = await app.inject({
      method: "GET",
      url: "/boom",
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        requestId: expect.any(String),
      },
    });
    expect(JSON.stringify(response.json())).not.toContain("secret stack details");

    await app.close();
  });

  it("maps AppError instances to the error contract", async () => {
    const app = await createTestApp();

    app.get("/conflict", async () => {
      throw new AppError("CONFLICT", "Already exists.");
    });

    const response = await app.inject({
      method: "GET",
      url: "/conflict",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      error: {
        code: "CONFLICT",
        message: "Already exists.",
        requestId: expect.any(String),
      },
    });

    await app.close();
  });
});
