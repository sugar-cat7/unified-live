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
