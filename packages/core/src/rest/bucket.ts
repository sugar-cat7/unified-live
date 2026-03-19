import type { RateLimitHandle, RateLimitStatus, RateLimitStrategy } from "./strategy";
import type { RateLimitInfo, RestRequest } from "./types";

/** @category Plugin Development */
export type TokenBucketConfig = {
  global: { requests: number; perMs: number };
  parseHeaders: (headers: Headers) => RateLimitInfo | undefined;
};

/**
 * Creates a header-driven token bucket strategy (used by Twitch, TwitCasting).
 *
 * @param config - token bucket configuration with limits and header parser
 * @returns a RateLimitStrategy backed by a token bucket
 * @precondition global.requests > 0 and global.perMs > 0
 * @postcondition acquire() blocks when no tokens are available, resolves on refill
 * @idempotency Not idempotent — each acquire() consumes a token
 * @category Plugin Development
 */
export const createTokenBucketStrategy = (config: TokenBucketConfig): RateLimitStrategy => {
  let remaining = config.global.requests;
  const limit = config.global.requests;
  let resetsAt = new Date(Date.now() + config.global.perMs);
  const waiters: Array<() => void> = [];
  let disposed = false;
  let refillTimer: ReturnType<typeof setInterval> | undefined;

  const ensureRefillTimer = (): void => {
    if (refillTimer !== undefined || disposed) return;
    refillTimer = setInterval(() => {
      remaining = limit;
      resetsAt = new Date(Date.now() + config.global.perMs);
      // Wake all waiters
      while (waiters.length > 0) {
        const resolve = waiters.shift();
        resolve?.();
      }
    }, config.global.perMs);

    if (typeof refillTimer === "object" && typeof refillTimer.unref === "function") {
      refillTimer.unref();
    }
  };

  return {
    acquire(_req: RestRequest): Promise<RateLimitHandle> {
      ensureRefillTimer();
      const tryAcquire = (): Promise<RateLimitHandle> => {
        if (disposed) {
          // Return a no-op handle when disposed — allows pending promises to resolve
          return Promise.resolve({
            complete() {},
            release() {},
          } satisfies RateLimitHandle);
        }

        if (remaining > 0) {
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
        }

        // No tokens available — wait for refill
        return new Promise<void>((resolve) => {
          waiters.push(resolve);
        }).then(() => tryAcquire());
      };

      return tryAcquire();
    },

    getStatus(): RateLimitStatus {
      return {
        remaining,
        limit,
        resetsAt,
        queued: waiters.length,
      };
    },

    [Symbol.dispose](): void {
      disposed = true;
      if (refillTimer !== undefined) {
        clearInterval(refillTimer);
      }
      // Unblock all waiters
      while (waiters.length > 0) {
        const resolve = waiters.shift();
        resolve?.();
      }
    },
  };
};
