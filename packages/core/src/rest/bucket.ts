import { RateLimitError } from "../errors";
import type { RateLimitHandle, RateLimitStatus, RateLimitStrategy } from "./strategy";
import type { RateLimitInfo, RestRequest } from "./types";

/** @category Plugin Development */
export type TokenBucketConfig = {
  global: { requests: number; perMs: number };
  parseHeaders: (headers: Headers) => RateLimitInfo | undefined;
  platform: string;
};

/**
 * Creates a header-driven token bucket strategy (used by Twitch, TwitCasting).
 * Uses lazy refill: tokens are recalculated from elapsed time on each acquire() call.
 * No timers, no cleanup needed.
 *
 * @param config - token bucket configuration with limits, header parser, and platform name
 * @returns a RateLimitStrategy backed by a token bucket
 * @precondition global.requests > 0 and global.perMs > 0
 * @postcondition acquire() rejects with RateLimitError when no tokens are available
 * @idempotency Not idempotent — each acquire() consumes a token
 * @category Plugin Development
 */
export const createTokenBucketStrategy = (config: TokenBucketConfig): RateLimitStrategy => {
  let remaining = config.global.requests;
  const limit = config.global.requests;
  let lastRefillTime = Date.now();
  let resetsAt = new Date(lastRefillTime + config.global.perMs);

  const refill = (): void => {
    if (Date.now() >= resetsAt.getTime()) {
      remaining = limit;
      lastRefillTime = Date.now();
      resetsAt = new Date(lastRefillTime + config.global.perMs);
    }
  };

  return {
    acquire(_req: RestRequest): Promise<RateLimitHandle> {
      refill();

      if (remaining <= 0) {
        const retryAfterMs = resetsAt.getTime() - Date.now();
        const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
        return Promise.reject(new RateLimitError(config.platform, { retryAfter }));
      }

      remaining--;
      const handle: RateLimitHandle = {
        complete(headers: Headers) {
          const info = config.parseHeaders(headers);
          if (info) {
            remaining = info.remaining;
            resetsAt = info.resetsAt;
          }
        },
        release() {
          remaining = Math.min(remaining + 1, limit);
        },
      };
      return Promise.resolve(handle);
    },

    getStatus(): RateLimitStatus {
      return {
        remaining,
        limit,
        resetsAt,
        queued: 0,
      };
    },
  };
};
