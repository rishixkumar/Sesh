import type { FastifyInstance, FastifyError } from "fastify";
import fp from "fastify-plugin";

import { AppError, toErrorResponse } from "../lib/errors.js";

function isFastifyError(error: unknown): error is FastifyError {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as FastifyError).statusCode === "number"
  );
}

async function errorsPlugin(app: FastifyInstance): Promise<void> {
  app.setNotFoundHandler((request, reply) => {
    const error = new AppError("NOT_FOUND", `Route ${request.method} ${request.url} not found.`);
    return reply.status(error.statusCode).send(
      toErrorResponse(error, request.id, false),
    );
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      const includeDetails =
        error.code === "VALIDATION_ERROR" &&
        app.config.NODE_ENV !== "production";

      return reply
        .status(error.statusCode)
        .send(toErrorResponse(error, request.id, includeDetails));
    }

    if (isFastifyError(error) && error.validation) {
      const appError = new AppError(
        "VALIDATION_ERROR",
        "The request contains invalid data.",
        {
          statusCode: 400,
          details: error.validation,
        },
      );

      return reply.status(400).send(
        toErrorResponse(appError, request.id, app.config.NODE_ENV !== "production"),
      );
    }

    if (isFastifyError(error) && typeof error.statusCode === "number") {
      const statusCode = error.statusCode;
      const code =
        statusCode === 429
          ? "RATE_LIMITED"
          : statusCode === 404
            ? "NOT_FOUND"
            : statusCode === 401
              ? "UNAUTHENTICATED"
              : statusCode === 403
                ? "FORBIDDEN"
                : statusCode === 409
                  ? "CONFLICT"
                  : statusCode >= 400 && statusCode < 500
                    ? "VALIDATION_ERROR"
                    : "INTERNAL_ERROR";

      const appError = new AppError(code, error.message || "Request failed.", {
        statusCode,
      });

      return reply
        .status(statusCode)
        .send(toErrorResponse(appError, request.id, false));
    }

    request.log.error({ err: error }, "Unhandled error");

    const internal = new AppError(
      "INTERNAL_ERROR",
      "An unexpected error occurred.",
    );

    return reply
      .status(internal.statusCode)
      .send(toErrorResponse(internal, request.id, false));
  });
}

export default fp(errorsPlugin, {
  name: "sesh-errors",
});
