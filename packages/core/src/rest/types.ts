export type RestRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Rate limit bucket key (e.g., "videos:list", "search:list"). */
  bucketId?: string;
};

export type RestResponse<T = unknown> = {
  status: number;
  headers: Headers;
  data: T;
  rateLimit?: RateLimitInfo;
};

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetsAt: Date;
  bucket?: string;
};

export type RestManagerOptions = {
  platform: string;
  baseUrl: string;
  headers?: Record<string, string>;
  rateLimitStrategy: RateLimitStrategy;
  tokenManager?: TokenManager;
  fetch?: typeof globalThis.fetch;
  retry?: RetryConfig;
};

export type RetryConfig = {
  maxRetries?: number;
  baseDelay?: number;
  retryableStatuses?: number[];
};

// Re-export for convenience
import type { TokenManager } from "../auth/types.js";
import type { RateLimitStrategy } from "./strategy.js";
export type { TokenManager, RateLimitStrategy };

/**
 * Creates a rate limit header parser from header name mappings.
 * Eliminates duplication across plugins that use standard limit/remaining/reset headers.
 *
 * @idempotency Safe — returns a pure function
 */
export function createRateLimitHeaderParser(headerNames: {
  limit: string;
  remaining: string;
  reset: string;
}): (headers: Headers) => RateLimitInfo | undefined {
  return (headers: Headers) => {
    const limit = headers.get(headerNames.limit);
    const remaining = headers.get(headerNames.remaining);
    const reset = headers.get(headerNames.reset);
    if (!limit || !remaining || !reset) return undefined;
    return {
      limit: Number.parseInt(limit, 10),
      remaining: Number.parseInt(remaining, 10),
      resetsAt: new Date(Number.parseInt(reset, 10) * 1000),
    };
  };
}
