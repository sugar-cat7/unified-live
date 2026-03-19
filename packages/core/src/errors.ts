/**
 * Hierarchical error code for all unified-live SDK errors.
 *
 * Categories: NOT_FOUND, AUTHENTICATION_*, RATE_LIMIT_*, QUOTA_*,
 * NETWORK_*, PARSE_*, VALIDATION_*, PLATFORM_*, INTERNAL.
 *
 * @category Errors
 */
export type ErrorCode =
  | "NOT_FOUND"
  | "AUTHENTICATION_INVALID"
  | "AUTHENTICATION_EXPIRED"
  | "RATE_LIMIT_EXCEEDED"
  | "QUOTA_EXHAUSTED"
  | "NETWORK_TIMEOUT"
  | "NETWORK_CONNECTION"
  | "NETWORK_DNS"
  | "NETWORK_ABORT"
  | "PARSE_JSON"
  | "PARSE_RESPONSE"
  | "VALIDATION_INVALID_URL"
  | "VALIDATION_INVALID_INPUT"
  | "PLATFORM_NOT_FOUND"
  | "INTERNAL";

/**
 * Companion object for the ErrorCode type.
 * Provides category helpers for error classification in monitoring and alerting.
 *
 * @example
 * ```ts
 * if (ErrorCode.isNetwork(error.code)) { ... }
 * ```
 * @category Errors
 */
export const ErrorCode = {
  /**
   * Whether the error code represents a network-level failure.
   *
   * @param code - the error code to check
   * @returns true if the code is a network error
   */
  isNetwork: (code: ErrorCode): boolean =>
    code === "NETWORK_TIMEOUT" ||
    code === "NETWORK_CONNECTION" ||
    code === "NETWORK_DNS" ||
    code === "NETWORK_ABORT",

  /**
   * Whether the error code represents an authentication failure.
   *
   * @param code - the error code to check
   * @returns true if the code is an auth error
   */
  isAuth: (code: ErrorCode): boolean =>
    code === "AUTHENTICATION_INVALID" || code === "AUTHENTICATION_EXPIRED",

  /**
   * Whether the error code represents a client-side error (validation, not found).
   *
   * @param code - the error code to check
   * @returns true if the code is a client error
   */
  isClientError: (code: ErrorCode): boolean =>
    code === "NOT_FOUND" ||
    code === "VALIDATION_INVALID_URL" ||
    code === "VALIDATION_INVALID_INPUT" ||
    code === "PLATFORM_NOT_FOUND",

  /**
   * Whether the error code represents a rate limiting issue.
   *
   * @param code - the error code to check
   * @returns true if the code is a rate limit error
   */
  isRateLimit: (code: ErrorCode): boolean =>
    code === "RATE_LIMIT_EXCEEDED" || code === "QUOTA_EXHAUSTED",
} as const;

/**
 * Structured metadata attached to every SDK error.
 *
 * @postcondition platform is always present
 * @category Errors
 */
export type ErrorContext = {
  /** Platform name (always present). */
  platform: string;
  /** HTTP method if the error occurred during a request. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Request path (e.g., "/videos"). */
  path?: string;
  /** HTTP status code from the response. */
  status?: number;
  /** Resource ID that was being accessed. */
  resourceId?: string;
};

/**
 * Base error for all unified-live SDK errors.
 *
 * @precondition message is a non-empty string
 * @precondition code is a valid ErrorCode
 * @precondition context.platform is a non-empty string
 * @postcondition instanceof UnifiedLiveError === true for all SDK errors
 * @idempotency constructing with the same arguments yields equivalent errors
 * @category Errors
 */
export class UnifiedLiveError extends Error {
  readonly code: ErrorCode;
  readonly context: ErrorContext;

  constructor(
    message: string,
    code: ErrorCode,
    context: ErrorContext,
    options?: { cause?: Error },
  ) {
    super(message, { cause: options?.cause });
    this.name = "UnifiedLiveError";
    this.code = code;
    this.context = context;
  }

  /**
   * Backward-compatible getter for context.platform.
   *
   * @returns the platform name
   */
  get platform(): string {
    return this.context.platform;
  }

  get [Symbol.toStringTag](): string {
    return this.name;
  }

  /**
   * Structured representation for JSON.stringify and structured logging.
   *
   * @returns a plain object with error details including cause chain
   * @postcondition returned object is JSON-serializable
   */
  toJSON(): Record<string, unknown> {
    const serializeCause = (err: unknown, depth = 0): Record<string, unknown> | undefined => {
      if (!(err instanceof Error) || depth > 10) return undefined;
      return {
        name: err.name,
        message: err.message,
        ...(err.cause ? { cause: serializeCause(err.cause, depth + 1) } : {}),
      };
    };

    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      ...(this.cause ? { cause: serializeCause(this.cause) } : {}),
    };
  }

  /**
   * Whether this error is transient and the operation may succeed on retry.
   *
   * @returns true for rate limits, network issues, and server errors
   * @postcondition auth errors, not found, validation, and parse errors return false
   */
  get retryable(): boolean {
    return RETRYABLE_CODES.has(this.code);
  }
}

const RETRYABLE_CODES: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  "RATE_LIMIT_EXCEEDED",
  "QUOTA_EXHAUSTED",
  "NETWORK_TIMEOUT",
  "NETWORK_CONNECTION",
  "NETWORK_DNS",
]);

/**
 * Resource not found on platform.
 *
 * @category Errors
 */
export class NotFoundError extends UnifiedLiveError {
  declare readonly code: "NOT_FOUND";

  constructor(platform: string, resourceId: string, options?: { cause?: Error }) {
    super(
      `Resource "${resourceId}" not found on ${platform}`,
      "NOT_FOUND",
      { platform, resourceId },
      options,
    );
    this.name = "NotFoundError";
  }
}

type AuthenticationCode = "AUTHENTICATION_INVALID" | "AUTHENTICATION_EXPIRED";

/**
 * Credentials invalid or expired.
 *
 * @category Errors
 */
export class AuthenticationError extends UnifiedLiveError {
  declare readonly code: AuthenticationCode;

  constructor(
    platform: string,
    options?: {
      code?: AuthenticationCode;
      message?: string;
      cause?: Error;
    },
  ) {
    super(
      options?.message ?? "Authentication failed",
      options?.code ?? "AUTHENTICATION_INVALID",
      { platform },
      { cause: options?.cause },
    );
    this.name = "AuthenticationError";
  }
}

/**
 * Rate limit exceeded after max retries.
 *
 * @category Errors
 */
export class RateLimitError extends UnifiedLiveError {
  declare readonly code: "RATE_LIMIT_EXCEEDED";
  readonly retryAfter?: number;

  constructor(platform: string, options?: { retryAfter?: number; cause?: Error }) {
    super(
      options?.retryAfter ? `Rate limited, retry after ${options.retryAfter}s` : "Rate limited",
      "RATE_LIMIT_EXCEEDED",
      { platform },
      { cause: options?.cause },
    );
    this.name = "RateLimitError";
    this.retryAfter = options?.retryAfter;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/** @category Errors */
export type QuotaDetails = {
  consumed: number;
  limit: number;
  resetsAt: Date;
  requestedCost: number;
};

/**
 * YouTube daily quota exhausted.
 *
 * @category Errors
 */
export class QuotaExhaustedError extends UnifiedLiveError {
  declare readonly code: "QUOTA_EXHAUSTED";
  readonly details: QuotaDetails;

  constructor(platform: string, details: QuotaDetails, options?: { cause?: Error }) {
    super(
      `Quota exhausted: ${details.consumed}/${details.limit} used, resets at ${details.resetsAt.toISOString()}`,
      "QUOTA_EXHAUSTED",
      { platform },
      options,
    );
    this.name = "QuotaExhaustedError";
    this.details = details;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      details: {
        ...this.details,
        resetsAt: this.details.resetsAt.toISOString(),
      },
    };
  }
}

/** @category Errors */
export type NetworkCode =
  | "NETWORK_TIMEOUT"
  | "NETWORK_CONNECTION"
  | "NETWORK_DNS"
  | "NETWORK_ABORT";

/**
 * Fetch-level network failure.
 *
 * @category Errors
 */
export class NetworkError extends UnifiedLiveError {
  declare readonly code: NetworkCode;

  constructor(
    platform: string,
    code: NetworkCode,
    options?: {
      message?: string;
      path?: string;
      method?: ErrorContext["method"];
      status?: number;
      cause?: Error;
    },
  ) {
    super(
      options?.message ?? `Network error: ${code}`,
      code,
      { platform, path: options?.path, method: options?.method, status: options?.status },
      { cause: options?.cause },
    );
    this.name = "NetworkError";
  }
}

type ParseCode = "PARSE_JSON" | "PARSE_RESPONSE";

/**
 * Response parsing failure.
 *
 * @category Errors
 */
export class ParseError extends UnifiedLiveError {
  declare readonly code: ParseCode;

  constructor(
    platform: string,
    code: ParseCode,
    options?: {
      message?: string;
      path?: string;
      status?: number;
      cause?: Error;
    },
  ) {
    super(
      options?.message ?? `Parse error: ${code}`,
      code,
      { platform, path: options?.path, status: options?.status },
      { cause: options?.cause },
    );
    this.name = "ParseError";
  }
}

type ValidationCode = "VALIDATION_INVALID_URL" | "VALIDATION_INVALID_INPUT";

/**
 * Input validation failure.
 *
 * @category Errors
 */
export class ValidationError extends UnifiedLiveError {
  declare readonly code: ValidationCode;

  constructor(
    code: ValidationCode,
    message: string,
    options?: { platform?: string; cause?: Error },
  ) {
    super(message, code, { platform: options?.platform ?? "unknown" }, { cause: options?.cause });
    this.name = "ValidationError";
  }
}

/**
 * Platform not registered in client.
 *
 * @category Errors
 */
export class PlatformNotFoundError extends UnifiedLiveError {
  declare readonly code: "PLATFORM_NOT_FOUND";

  constructor(platform: string) {
    super(`Platform "${platform}" is not registered`, "PLATFORM_NOT_FOUND", {
      platform,
    });
    this.name = "PlatformNotFoundError";
  }
}

/**
 * Classify a fetch error into a specific NetworkCode.
 *
 * @param error - the caught fetch exception
 * @returns the classified network error code
 * @precondition error is a caught fetch exception
 * @postcondition returns one of NETWORK_ABORT, NETWORK_TIMEOUT, NETWORK_DNS, NETWORK_CONNECTION
 * @idempotency same error always produces same code
 * @category Errors
 */
export const classifyNetworkError = (error: Error): NetworkCode => {
  const msg = error.message.toLowerCase();
  if (error.name === "AbortError" || msg.includes("abort")) return "NETWORK_ABORT";
  if (msg.includes("timeout") || error.name === "TimeoutError") return "NETWORK_TIMEOUT";
  if (msg.includes("dns") || msg.includes("getaddrinfo")) return "NETWORK_DNS";
  return "NETWORK_CONNECTION";
};
