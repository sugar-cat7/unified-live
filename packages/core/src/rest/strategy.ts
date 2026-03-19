import type { RestRequest } from "./types";

/**
 * Handle returned by a rate limit strategy after acquiring a slot.
 * Callers must invoke either complete() or release() — never both.
 *
 * @postcondition complete() is called on success, release() on error
 * @category Plugin Development
 */
export type RateLimitHandle = {
  /** Called after successful response — updates state from response headers. */
  complete(headers: Headers): void;
  /** Called on retry — returns the consumed token/quota. */
  release(): void;
};

/**
 * Snapshot of a rate limit strategy's current state for telemetry.
 *
 * @category Plugin Development
 */
export type RateLimitStatus = {
  remaining: number;
  limit: number;
  resetsAt: Date;
  queued: number;
};

/**
 * Controls request throughput for a platform's rate limiting scheme.
 *
 * @precondition One strategy instance per platform
 * @postcondition acquire() resolves when it's safe to proceed with the request
 * @category Plugin Development
 */
export type RateLimitStrategy = {
  /**
   * Called before each request.
   * Consumes a token/quota unit and returns a handle.
   * May block (await) if tokens are exhausted.
   */
  acquire(req: RestRequest): Promise<RateLimitHandle>;
  /** Current rate limit status (for telemetry). */
  getStatus(): RateLimitStatus;
  /** Release timers and resources. */
  [Symbol.dispose](): void;
};

/**
 * Companion object for the RateLimitStrategy type.
 * Provides type guard utility.
 *
 * @example
 * ```ts
 * if (RateLimitStrategy.is(unknown)) { ... }
 * ```
 * @category Plugin Development
 */
export const RateLimitStrategy = {
  /**
   * Type guard for RateLimitStrategy.
   *
   * @param value - the value to check
   * @returns true if value implements RateLimitStrategy interface
   * @postcondition returns true if value has acquire, getStatus, and Symbol.dispose methods
   */
  is(value: unknown): value is RateLimitStrategy {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string | symbol, unknown>;
    return (
      typeof obj.acquire === "function" &&
      typeof obj.getStatus === "function" &&
      typeof obj[Symbol.dispose] === "function"
    );
  },
} as const;
