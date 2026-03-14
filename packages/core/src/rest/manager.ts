import type { TokenManager } from "../auth/types";
import {
  AuthenticationError,
  classifyNetworkError,
  NetworkError,
  NotFoundError,
  ParseError,
  RateLimitError,
  UnifiedLiveError,
} from "../errors";
import { getTracer, SpanAttributes } from "../telemetry/traces";
import type { RateLimitStrategy } from "./strategy";
import type {
  RateLimitInfo,
  RestManagerOptions,
  RestRequest,
  RestResponse,
} from "./types";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;
const DEFAULT_RETRYABLE_STATUSES = [500, 502, 503, 504];

export type RestManager = {
  readonly platform: string;
  readonly baseUrl: string;
  readonly rateLimitStrategy: RateLimitStrategy;
  readonly tokenManager: TokenManager | undefined;

  /**
   * Execute a full request lifecycle: rate limit → headers → fetch → retry → parse.
   *
   * @precondition rateLimitStrategy is initialized and not disposed
   * @postcondition returns parsed response or throws an error from the hierarchy
   */
  request: <T>(req: RestRequest) => Promise<RestResponse<T>>;

  /**
   * Build auth + custom headers for a request. Override to inject platform-specific headers.
   *
   * @precondition tokenManager (if set) is ready to provide auth headers
   * @postcondition returns a headers record including Authorization if tokenManager is set
   */
  createHeaders: (req: RestRequest) => Promise<Record<string, string>>;

  /**
   * Execute a single fetch call. Override to add logging, metrics, or custom transport.
   *
   * @precondition url is a fully-qualified URL
   * @postcondition returns the raw Response from the server
   */
  runRequest: (url: string, init: RequestInit) => Promise<Response>;

  /**
   * Parse the response body as JSON and construct a RestResponse.
   * Throws UnifiedLiveError if the response is not valid JSON.
   *
   * @precondition response.ok or a handled status code
   * @postcondition returns a RestResponse with parsed data and optional rate limit info
   */
  handleResponse: <T>(
    response: Response,
    req: RestRequest,
  ) => Promise<RestResponse<T>>;

  /**
   * Handle rate-limited responses (429, 403). Return true to retry.
   * Override for platform-specific quota/rate limit detection.
   *
   * @precondition response has status 429 or 403
   * @postcondition returns true if the request should be retried, false otherwise
   */
  handleRateLimit: (
    response: Response,
    req: RestRequest,
    attempt: number,
  ) => Promise<boolean>;

  /**
   * Extract rate limit info from response headers. Override per platform.
   * Default returns undefined (no parsing).
   *
   * @postcondition returns RateLimitInfo if headers contain rate limit data, undefined otherwise
   */
  parseRateLimitHeaders: (headers: Headers) => RateLimitInfo | undefined;

  /**
   * Release all resources (timers, connections).
   *
   * @postcondition rateLimitStrategy and tokenManager are disposed
   * @idempotency Safe — multiple calls have no additional effect
   */
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
  const tracer = getTracer();

  const manager: RestManager = {
    platform: options.platform,
    baseUrl: options.baseUrl,
    rateLimitStrategy: options.rateLimitStrategy,
    tokenManager: options.tokenManager,

    request: async <T>(req: RestRequest): Promise<RestResponse<T>> => {
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
              const reqUrl = new URL(req.path, manager.baseUrl);
              if (req.query) {
                for (const [key, value] of Object.entries(req.query)) {
                  reqUrl.searchParams.set(key, value);
                }
              }
              const url = reqUrl.toString();

              const init: RequestInit = {
                method: req.method,
                headers: { ...headers, ...req.headers },
              };

              if (req.body !== undefined) {
                init.body = JSON.stringify(req.body);
                (init.headers as Record<string, string>)["Content-Type"] =
                  "application/json";
              }

              let response: Response;
              try {
                response = await manager.runRequest(url, init);
              } catch (e) {
                const err = e instanceof Error ? e : new Error(String(e));
                const code = classifyNetworkError(err);
                throw new NetworkError(manager.platform, code, {
                  path: req.path,
                  method: req.method,
                  cause: err,
                });
              }
              span.setAttribute(SpanAttributes.HTTP_STATUS, response.status);

              // Rate limit handling (429 or 403)
              if (response.status === 429 || response.status === 403) {
                const shouldRetry = await manager.handleRateLimit(
                  response,
                  req,
                  attempt,
                );
                if (shouldRetry && attempt < maxRetries) {
                  continue;
                }
                throw new RateLimitError(manager.platform);
              }

              // Auth error (401)
              if (response.status === 401) {
                manager.tokenManager?.invalidate();
                if (attempt < maxRetries) {
                  continue;
                }
                throw new AuthenticationError(manager.platform, {
                  code: "AUTHENTICATION_EXPIRED",
                });
              }

              // Not found (404)
              if (response.status === 404) {
                throw new NotFoundError(manager.platform, req.path);
              }

              // Retryable server errors (5xx)
              if (retryableStatuses.includes(response.status)) {
                if (attempt < maxRetries) {
                  await sleep(baseDelay * 2 ** attempt);
                  continue;
                }
                throw new NetworkError(manager.platform, "NETWORK_CONNECTION", {
                  message: `Request failed after ${maxRetries} retries`,
                  path: req.path,
                  method: req.method,
                });
              }

              const result = await manager.handleResponse<T>(response, req);

              if (result.rateLimit) {
                span.setAttribute(
                  SpanAttributes.RATE_LIMIT_REMAINING,
                  result.rateLimit.remaining,
                );
                span.setAttribute(
                  SpanAttributes.RATE_LIMIT_LIMIT,
                  result.rateLimit.limit,
                );
              }

              handle.complete(response.headers);
              span.end();
              return result;
            }

            throw new NetworkError(manager.platform, "NETWORK_CONNECTION", {
              message: `Request failed after ${maxRetries} retries`,
              path: req.path,
              method: req.method,
            });
          } catch (error) {
            if (error instanceof UnifiedLiveError) {
              span.setAttribute(SpanAttributes.ERROR_CODE, error.code);
              span.setAttribute(SpanAttributes.ERROR_TYPE, error.name);
              span.setAttribute(SpanAttributes.ERROR_HAS_CAUSE, !!error.cause);
            }
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
      req: RestRequest,
    ): Promise<RestResponse<T>> => {
      let data: T;
      try {
        data = (await response.json()) as T;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        throw new ParseError(manager.platform, "PARSE_JSON", {
          message: `Failed to parse JSON response from ${req.path}`,
          path: req.path,
          status: response.status,
          cause: err,
        });
      }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
