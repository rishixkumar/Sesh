import type { z } from "zod";

import { AppError } from "./errors.js";

export function parseOrThrow<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "The request contains invalid data.", {
      details: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return result.data;
}
