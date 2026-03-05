/**
 * Base error for all unified-live SDK errors.
 *
 * @precondition message is a non-empty string
 * @postcondition instanceof UnifiedLiveError === true for all SDK errors
 */
export class UnifiedLiveError extends Error {
  readonly platform: string;
  readonly code: string;

  constructor(message: string, platform: string, code: string) {
    super(message);
    this.name = "UnifiedLiveError";
    this.platform = platform;
    this.code = code;
  }
}

/** YouTube daily quota exhausted. */
export class QuotaExhaustedError extends UnifiedLiveError {
  readonly details: {
    consumed: number;
    limit: number;
    resetsAt: Date;
    requestedCost: number;
  };

  constructor(
    platform: string,
    details: {
      consumed: number;
      limit: number;
      resetsAt: Date;
      requestedCost: number;
    },
  ) {
    super(
      `Quota exhausted: ${details.consumed}/${details.limit} used, resets at ${details.resetsAt.toISOString()}`,
      platform,
      "QUOTA_EXHAUSTED",
    );
    this.name = "QuotaExhaustedError";
    this.details = details;
  }
}

/** Credentials invalid or expired. */
export class AuthenticationError extends UnifiedLiveError {
  constructor(platform: string, message?: string) {
    super(message ?? "Authentication failed", platform, "AUTHENTICATION");
    this.name = "AuthenticationError";
  }
}

/** Rate limit exceeded after max retries. */
export class RateLimitError extends UnifiedLiveError {
  readonly retryAfter?: number;

  constructor(platform: string, retryAfter?: number) {
    super(
      retryAfter ? `Rate limited, retry after ${retryAfter}s` : "Rate limited",
      platform,
      "RATE_LIMITED",
    );
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Platform not registered in client. */
export class PlatformNotFoundError extends UnifiedLiveError {
  constructor(platform: string) {
    super(
      `Platform "${platform}" is not registered`,
      platform,
      "PLATFORM_NOT_FOUND",
    );
    this.name = "PlatformNotFoundError";
  }
}

/** Resource not found on platform. */
export class NotFoundError extends UnifiedLiveError {
  constructor(platform: string, resourceId: string) {
    super(
      `Resource "${resourceId}" not found on ${platform}`,
      platform,
      "NOT_FOUND",
    );
    this.name = "NotFoundError";
  }
}
