export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { statusCode?: number; details?: unknown; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode ?? STATUS_BY_CODE[code];
    this.details = options?.details;
  }
}

export type ErrorResponseBody = {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: unknown;
  };
};

export function toErrorResponse(
  error: AppError,
  requestId: string,
  includeDetails: boolean,
): ErrorResponseBody {
  const body: ErrorResponseBody = {
    error: {
      code: error.code,
      message: error.message,
      requestId,
    },
  };

  if (includeDetails && error.details !== undefined) {
    body.error.details = error.details;
  }

  return body;
}
