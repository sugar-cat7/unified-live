import type { TokenManager } from "../auth/types.js";
import {
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from "../errors.js";
import { getTracer, SpanAttributes } from "../telemetry/traces.js";
import type { RateLimitStrategy } from "./strategy.js";
import type {
  RateLimitInfo,
  RestManagerOptions,
  RestRequest,
  RestResponse,
} from "./types.js";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;
const DEFAULT_RETRYABLE_STATUSES = [500, 502, 503, 504];

export type RestManager = {
  readonly platform: string;
  readonly baseUrl: string;
  readonly rateLimitStrategy: RateLimitStrategy;
  readonly tokenManager: TokenManager | undefined;

  /** High-level API — called by plugins. */
  request: <T>(req: RestRequest) => Promise<RestResponse<T>>;

  /** Build auth + custom headers for a request. */
  createHeaders: (req: RestRequest) => Promise<Record<string, string>>;

  /** Execute a single fetch call. */
  runRequest: (url: string, init: RequestInit) => Promise<Response>;

  /** Parse the response body and construct a RestResponse. */
  handleResponse: <T>(
    response: Response,
    req: RestRequest,
  ) => Promise<RestResponse<T>>;

  /** Handle rate-limited responses. Return true to retry. */
  handleRateLimit: (
    response: Response,
    req: RestRequest,
    attempt: number,
  ) => Promise<boolean>;

  /** Extract rate limit info from response headers. */
  parseRateLimitHeaders: (headers: Headers) => RateLimitInfo | undefined;

  /** Release all resources (timers, etc.). */
  dispose: () => void;
};

/**
 * Creates a discordeno-style RestManager with overridable function properties.
 *
 * @precondition options.rateLimitStrategy is initialized
 * @postcondition returns a RestManager with all methods set
 * @idempotency Not idempotent — each call creates a new manager instance
 */
export function createRestManager(options: RestManagerOptions): RestManager {
  const maxRetries = options.retry?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options.retry?.baseDelay ?? DEFAULT_BASE_DELAY;
  const retryableStatuses =
    options.retry?.retryableStatuses ?? DEFAULT_RETRYABLE_STATUSES;
  const fetchFn = options.fetch ?? globalThis.fetch;

  const manager: RestManager = {
    platform: options.platform,
    baseUrl: options.baseUrl,
    rateLimitStrategy: options.rateLimitStrategy,
    tokenManager: options.tokenManager,

    request: async <T>(req: RestRequest): Promise<RestResponse<T>> => {
      const tracer = getTracer();
      return tracer.startActiveSpan(
        `unified-live.rest ${manager.platform} ${req.method} ${req.path}`,
        async (span) => {
          span.setAttribute(SpanAttributes.PLATFORM, manager.platform);
          span.setAttribute(SpanAttributes.HTTP_METHOD, req.method);
          span.setAttribute(SpanAttributes.URL_PATH, req.path);

          const handle = await manager.rateLimitStrategy.acquire(req);

          try {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
              const headers = await manager.createHeaders(req);
              const url = buildUrl(manager.baseUrl, req.path, req.query);

              const init: RequestInit = {
                method: req.method,
                headers: { ...headers, ...req.headers },
              };

              if (req.body !== undefined) {
                init.body = JSON.stringify(req.body);
                (init.headers as Record<string, string>)["Content-Type"] =
                  "application/json";
              }

              const response = await manager.runRequest(url, init);
              span.setAttribute(SpanAttributes.HTTP_STATUS, response.status);

              // Rate limit handling (429 or custom)
              if (response.status === 429 || response.status === 403) {
                const shouldRetry = await manager.handleRateLimit(
                  response,
                  req,
                  attempt,
                );
                if (shouldRetry && attempt < maxRetries) {
                  continue;
                }
              }

              // Auth error
              if (response.status === 401) {
                manager.tokenManager?.invalidate();
                if (attempt < maxRetries) {
                  continue;
                }
                throw new AuthenticationError(manager.platform);
              }

              // Not found
              if (response.status === 404) {
                throw new NotFoundError(manager.platform, req.path);
              }

              // Retryable server errors
              if (retryableStatuses.includes(response.status)) {
                if (attempt < maxRetries) {
                  await sleep(baseDelay * 2 ** attempt);
                  continue;
                }
              }

              const result = await manager.handleResponse<T>(response, req);

              const rateLimitInfo = manager.parseRateLimitHeaders(
                response.headers,
              );
              if (rateLimitInfo) {
                span.setAttribute(
                  SpanAttributes.RATE_LIMIT_REMAINING,
                  rateLimitInfo.remaining,
                );
                span.setAttribute(
                  SpanAttributes.RATE_LIMIT_LIMIT,
                  rateLimitInfo.limit,
                );
              }

              handle.complete(response.headers);
              span.end();
              return result;
            }

            // Exhausted retries
            throw new RateLimitError(manager.platform);
          } catch (error) {
            handle.release();
            span.end();
            throw error;
          }
        },
      );
    },

    createHeaders: async (
      _req: RestRequest,
    ): Promise<Record<string, string>> => {
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...options.headers,
      };

      if (manager.tokenManager) {
        headers.Authorization = await manager.tokenManager.getAuthHeader();
      }

      return headers;
    },

    runRequest: async (url: string, init: RequestInit): Promise<Response> => {
      return fetchFn(url, init);
    },

    handleResponse: async <T>(
      response: Response,
      _req: RestRequest,
    ): Promise<RestResponse<T>> => {
      const data = (await response.json()) as T;
      const rateLimit = manager.parseRateLimitHeaders(response.headers);
      return {
        status: response.status,
        headers: response.headers,
        data,
        rateLimit,
      };
    },

    handleRateLimit: async (
      response: Response,
      _req: RestRequest,
      attempt: number,
    ): Promise<boolean> => {
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfter = retryAfterHeader
          ? Number.parseInt(retryAfterHeader, 10)
          : 1;
        await sleep(retryAfter * 1000);
        return attempt < maxRetries;
      }
      return false;
    },

    parseRateLimitHeaders: (_headers: Headers): RateLimitInfo | undefined => {
      // Default: no parsing. Plugins override this.
      return undefined;
    },

    dispose: (): void => {
      manager.rateLimitStrategy.dispose();
      manager.tokenManager?.dispose?.();
    },
  };

  return manager;
}

function buildUrl(
  base: string,
  path: string,
  query?: Record<string, string>,
): string {
  const url = new URL(path, base);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
