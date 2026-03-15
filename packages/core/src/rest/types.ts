import type { TokenManager } from "../auth/types";
import type { RateLimitStrategy } from "./strategy";

/**
 * A REST request to a platform API.
 *
 * @category Plugin Development
 */
export type RestRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Rate limit bucket key (e.g., "videos:list", "search:list"). */
  bucketId?: string;
};

/**
 * A parsed REST response with typed data and optional rate limit info.
 *
 * @category Plugin Development
 */
export type RestResponse<T = unknown> = {
  status: number;
  headers: Headers;
  data: T;
  rateLimit?: RateLimitInfo;
};

/**
 * Rate limit state extracted from platform response headers.
 *
 * @category Plugin Development
 */
export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetsAt: Date;
  bucket?: string;
};

/**
 * Configuration options for creating a RestManager.
 *
 * @category Plugin Development
 */
export type RestManagerOptions = {
  platform: string;
  baseUrl: string;
  headers?: Record<string, string>;
  rateLimitStrategy: RateLimitStrategy;
  tokenManager?: TokenManager;
  fetch?: typeof globalThis.fetch;
  retry?: RetryConfig;
};

/**
 * Retry behavior configuration for failed requests.
 *
 * @category Plugin Development
 */
export type RetryConfig = {
  maxRetries?: number;
  baseDelay?: number;
  retryableStatuses?: number[];
};

/**
 * Creates a rate limit header parser from header name mappings.
 * Eliminates duplication across plugins that use standard limit/remaining/reset headers.
 *
 * @internal
 * @param headerNames - mapping of header names for limit, remaining, and reset
 * @returns a parser function that extracts rate limit info from headers
 * @idempotency Safe — returns a pure function
 */
export const createRateLimitHeaderParser = (headerNames: {
  limit: string;
  remaining: string;
  reset: string;
}): ((headers: Headers) => RateLimitInfo | undefined) => {
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
};
