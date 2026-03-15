import type { RestRequest } from "./types";

export type RateLimitHandle = {
  /** Called after successful response — updates state from response headers. */
  complete(headers: Headers): void;
  /** Called on retry — returns the consumed token/quota. */
  release(): void;
};

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
