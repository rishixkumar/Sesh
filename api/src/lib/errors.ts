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

/**
 * Machine-readable `details.reason` values that are safe to return in every
 * environment. Feature agents must use these strings and no others.
 */
export const PUBLIC_ERROR_REASONS = [
  "CAPACITY_FULL",
  "DUPLICATE_MEMBERSHIP",
  "DUPLICATE_REQUEST",
  "IDEMPOTENCY_KEY_REUSED",
  "INVITE_ONLY",
  "JOIN_DECLINED",
  "CROSS_CAMPUS",
  "TRANSFER_TARGET_NOT_MEMBER",
] as const;

export type PublicErrorReason = (typeof PUBLIC_ERROR_REASONS)[number];

export function isPublicErrorReason(
  value: unknown,
): value is PublicErrorReason {
  return (
    typeof value === "string" &&
    (PUBLIC_ERROR_REASONS as readonly string[]).includes(value)
  );
}

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

function stablePublicReason(error: AppError): PublicErrorReason | undefined {
  if (error.code !== "CONFLICT" && error.code !== "FORBIDDEN") {
    return undefined;
  }

  if (
    error.details === null ||
    typeof error.details !== "object" ||
    !("reason" in error.details)
  ) {
    return undefined;
  }

  const reason = (error.details as { reason: unknown }).reason;
  return isPublicErrorReason(reason) ? reason : undefined;
}

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

  const reason = stablePublicReason(error);
  if (reason) {
    body.error.details = { reason };
    return body;
  }

  if (includeDetails && error.details !== undefined) {
    body.error.details = error.details;
  }

  return body;
}
