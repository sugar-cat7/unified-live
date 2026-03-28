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
import { SPAN_KIND_CLIENT, SPAN_STATUS_ERROR } from "../telemetry/otel-types";
import { getMeter, MetricNames } from "../telemetry/metrics";
import { getTracer, SpanAttributes } from "../telemetry/traces";
import type { RateLimitStrategy } from "./strategy";
import type { RateLimitInfo, RestManagerOptions, RestRequest, RestResponse } from "./types";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;
const DEFAULT_RETRYABLE_STATUSES: ReadonlySet<number> = new Set([500, 502, 503, 504]);
/** Client errors that should never be retried (408 is server-initiated timeout, not transient). */
const NON_RETRYABLE_CLIENT_STATUSES: ReadonlySet<number> = new Set([400, 408, 413, 415, 422]);

/** @category Plugin Development */
export type RestManager = {
  readonly platform: string;
  readonly baseUrl: string;
  readonly rateLimitStrategy: RateLimitStrategy;
  readonly tokenManager: TokenManager | undefined;

  /**
   * Execute a full request lifecycle: rate limit → headers → fetch → retry → parse.
   *
   * @precondition rateLimitStrategy is initialized
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
  handleResponse: <T>(response: Response, req: RestRequest) => Promise<RestResponse<T>>;

  /**
   * Handle rate-limited responses (429, 403). Return true to retry.
   * Override for platform-specific quota/rate limit detection.
   *
   * @precondition response has status 429 or 403
   * @postcondition returns true if the request should be retried, false otherwise
   */
  handleRateLimit: (response: Response, req: RestRequest, attempt: number) => Promise<boolean>;

  /**
   * Extract rate limit info from response headers. Override per platform.
   * Default returns undefined (no parsing).
   *
   * @postcondition returns RateLimitInfo if headers contain rate limit data, undefined otherwise
   */
  parseRateLimitHeaders: (headers: Headers) => RateLimitInfo | undefined;
};

/**
 * Creates a discordeno-style RestManager with overridable function properties.
 *
 * @param options - REST manager configuration
 * @returns a new RestManager instance
 * @precondition options.rateLimitStrategy is initialized
 * @postcondition returns a RestManager with all methods set
 * @idempotency Not idempotent — each call creates a new manager instance
 * @category Plugin Development
 */
export const createRestManager = (options: RestManagerOptions): RestManager => {
  const maxRetries = options.retry?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options.retry?.baseDelay ?? DEFAULT_BASE_DELAY;
  const retryableStatuses: ReadonlySet<number> = options.retry?.retryableStatuses
    ? new Set(options.retry.retryableStatuses)
    : DEFAULT_RETRYABLE_STATUSES;
  const timeout = options.retry?.timeout;
  const fetchFn = options.fetch ?? globalThis.fetch;
  const tracer = getTracer(options.tracerProvider);
  const meter = getMeter(options.meterProvider);
  const requestDuration = meter.createHistogram(MetricNames.HTTP_CLIENT_REQUEST_DURATION, {
    description: "Duration of HTTP client requests",
    unit: "s",
  });
  // Cache parsed base URL components for OTel attributes (avoids parsing on every request)
  let cachedUrl: { hostname: string; port: number; scheme: string } | undefined;
  try {
    const parsed = new URL(options.baseUrl);
    const scheme = parsed.protocol.replace(":", "");
    cachedUrl = {
      hostname: parsed.hostname,
      port: parsed.port ? Number.parseInt(parsed.port, 10) : scheme === "https" ? 443 : 80,
      scheme,
    };
  } catch {
    // ignore invalid URL
  }

  // Pre-compute base metric attributes that don't change per-request
  const baseMetricAttrs: Record<string, string | number> = {};
  if (cachedUrl) {
    baseMetricAttrs[SpanAttributes.SERVER_ADDRESS] = cachedUrl.hostname;
    baseMetricAttrs[SpanAttributes.SERVER_PORT] = cachedUrl.port;
  }

  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  const manager: RestManager = {
    platform: options.platform,
    baseUrl: options.baseUrl,
    rateLimitStrategy: options.rateLimitStrategy,
    tokenManager: options.tokenManager,

    request: async <T>(req: RestRequest): Promise<RestResponse<T>> => {
      return tracer.startActiveSpan(req.method, { kind: SPAN_KIND_CLIENT }, async (span) => {
        span.setAttribute(SpanAttributes.PLATFORM, manager.platform);
        span.setAttribute(SpanAttributes.HTTP_METHOD, req.method);
        span.setAttribute(SpanAttributes.URL_PATH, req.path);

        if (cachedUrl) {
          span.setAttribute(SpanAttributes.SERVER_ADDRESS, cachedUrl.hostname);
          span.setAttribute(SpanAttributes.SERVER_PORT, cachedUrl.port);
          span.setAttribute(SpanAttributes.URL_SCHEME, cachedUrl.scheme);
        }

        const handle = await manager.rateLimitStrategy.acquire(req);
        const startTime = performance.now();
        let lastStatusCode: number | undefined;

        try {
          // Hoist invariants out of the retry loop
          // Ensure baseUrl path is preserved: new URL("/path", "https://host/base") drops "/base",
          // so normalize to trailing-slash base + relative path.
          const base = manager.baseUrl.endsWith("/") ? manager.baseUrl : `${manager.baseUrl}/`;
          const relative = req.path.startsWith("/") ? req.path.slice(1) : req.path;
          const reqUrl = new URL(relative, base);
          if (req.query) {
            for (const [key, value] of Object.entries(req.query)) {
              if (Array.isArray(value)) {
                for (const v of value) {
                  reqUrl.searchParams.append(key, v);
                }
              } else {
                reqUrl.searchParams.set(key, value);
              }
            }
          }
          const url = reqUrl.toString();
          span.setAttribute(SpanAttributes.URL_FULL, url);
          const timeoutSignal = timeout && !req.signal ? AbortSignal.timeout(timeout) : undefined;
          const signal = req.signal ?? timeoutSignal;
          const serializedBody =
            req.body !== undefined && req.bodyType !== "raw" ? JSON.stringify(req.body) : undefined;

          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const headers = await manager.createHeaders(req);

            const init: RequestInit = {
              method: req.method,
              headers: { ...headers, ...req.headers },
              signal,
            };

            if (req.body !== undefined) {
              if (req.bodyType === "raw") {
                init.body = req.body as RequestInit["body"];
              } else {
                init.body = serializedBody;
                (init.headers as Record<string, string>)["Content-Type"] = "application/json";
              }
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
            lastStatusCode = response.status;
            span.setAttribute(SpanAttributes.HTTP_STATUS, response.status);

            // Rate limit handling (429 or 403)
            if (response.status === 429 || response.status === 403) {
              const shouldRetry = await manager.handleRateLimit(response, req, attempt);
              if (shouldRetry && attempt < maxRetries) {
                span.addEvent("retry", {
                  "unified_live.retry.attempt": attempt + 1,
                  "unified_live.retry.reason": "rate_limit",
                  [SpanAttributes.HTTP_STATUS]: response.status,
                });
                continue;
              }
              const retryAfterSec = parseRetryAfter(response.headers.get("Retry-After"));
              throw new RateLimitError(manager.platform, {
                retryAfter: retryAfterSec > 0 ? retryAfterSec : undefined,
              });
            }

            // Auth error (401)
            if (response.status === 401) {
              manager.tokenManager?.invalidate();
              if (attempt < maxRetries) {
                span.addEvent("retry", {
                  "unified_live.retry.attempt": attempt + 1,
                  "unified_live.retry.reason": "auth_refresh",
                  [SpanAttributes.HTTP_STATUS]: response.status,
                });
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

            // Non-retryable client errors — fail immediately without retry
            if (NON_RETRYABLE_CLIENT_STATUSES.has(response.status)) {
              throw new UnifiedLiveError(
                `Request to ${req.path} failed with status ${response.status}`,
                response.status === 408 ? "NETWORK_TIMEOUT" : "INTERNAL",
                {
                  platform: manager.platform,
                  method: req.method,
                  path: req.path,
                  status: response.status,
                },
              );
            }

            // Retryable server errors (5xx)
            if (retryableStatuses.has(response.status)) {
              if (attempt < maxRetries) {
                const jitter = 0.5 + Math.random();
                await sleep(baseDelay * 2 ** attempt * jitter);
                span.addEvent("retry", {
                  "unified_live.retry.attempt": attempt + 1,
                  [SpanAttributes.HTTP_STATUS]: response.status,
                });
                continue;
              }
              throw new NetworkError(manager.platform, "NETWORK_CONNECTION", {
                message: `${req.method} ${req.path} failed with status ${response.status} after ${maxRetries + 1} attempts`,
                path: req.path,
                method: req.method,
                status: response.status,
              });
            }

            const result = await manager.handleResponse<T>(response, req);

            if (result.rateLimit) {
              span.setAttribute(SpanAttributes.RATE_LIMIT_REMAINING, result.rateLimit.remaining);
              span.setAttribute(SpanAttributes.RATE_LIMIT_LIMIT, result.rateLimit.limit);
            }

            if (attempt > 0) {
              span.setAttribute(SpanAttributes.RETRY_COUNT, attempt);
            }

            const duration = (performance.now() - startTime) / 1000;
            requestDuration.record(duration, {
              ...baseMetricAttrs,
              [SpanAttributes.HTTP_METHOD]: req.method,
              [SpanAttributes.HTTP_STATUS]: response.status,
            });

            handle.complete(response.headers);
            span.end();
            return result;
          }

          throw new NetworkError(manager.platform, "NETWORK_CONNECTION", {
            message: `${req.method} ${req.path} failed after ${maxRetries + 1} attempts`,
            path: req.path,
            method: req.method,
          });
        } catch (error) {
          // Per semconv: use status code string for HTTP errors, exception name otherwise
          const errorType =
            lastStatusCode !== undefined && lastStatusCode >= 400
              ? String(lastStatusCode)
              : error instanceof Error
                ? error.name
                : "unknown";
          span.setAttribute(SpanAttributes.ERROR_TYPE, errorType);

          if (error instanceof UnifiedLiveError) {
            span.setAttribute(SpanAttributes.ERROR_CODE, error.code);
            span.setAttribute(SpanAttributes.ERROR_HAS_CAUSE, !!error.cause);
          }

          const duration = (performance.now() - startTime) / 1000;
          requestDuration.record(duration, {
            ...baseMetricAttrs,
            [SpanAttributes.HTTP_METHOD]: req.method,
            [SpanAttributes.ERROR_TYPE]: errorType,
            ...(lastStatusCode !== undefined && {
              [SpanAttributes.HTTP_STATUS]: lastStatusCode,
            }),
          });

          span.setStatus({
            code: SPAN_STATUS_ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          span.recordException(error instanceof Error ? error : new Error(String(error)));
          handle.release();
          span.end();
          throw error;
        }
      });
    },

    createHeaders: async (_req: RestRequest): Promise<Record<string, string>> => {
      const headers: Record<string, string> = { ...baseHeaders };

      if (manager.tokenManager) {
        headers.Authorization = await manager.tokenManager.getAuthHeader();
      }

      return headers;
    },

    runRequest: async (url: string, init: RequestInit): Promise<Response> => {
      return fetchFn(url, init);
    },

    handleResponse: async <T>(response: Response, req: RestRequest): Promise<RestResponse<T>> => {
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
        const retryAfter = parseRetryAfter(response.headers.get("Retry-After"), 1);
        await sleep(retryAfter * 1000);
        return attempt < maxRetries;
      }
      return false;
    },

    parseRateLimitHeaders: (_headers: Headers): RateLimitInfo | undefined => {
      // Default: no parsing. Plugins override this.
      return undefined;
    },
  };

  // Prevent accidental deletion of function properties
  for (const prop of [
    "request",
    "createHeaders",
    "runRequest",
    "handleResponse",
    "handleRateLimit",
    "parseRateLimitHeaders",
  ] as const) {
    Object.defineProperty(manager, prop, {
      value: manager[prop],
      writable: true,
      enumerable: true,
      configurable: false,
    });
  }
  return manager;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Companion object for the RestManager type.
 * Provides type guard utility.
 *
 * @category Plugin Development
 */
export const RestManager = {
  /**
   * Type guard for RestManager.
   *
   * @param value - the value to check
   * @returns true if value implements RestManager interface
   */
  is(value: unknown): value is RestManager {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string | symbol, unknown>;
    return (
      typeof obj.platform === "string" &&
      typeof obj.baseUrl === "string" &&
      typeof obj.request === "function" &&
      typeof obj.createHeaders === "function" &&
      typeof obj.runRequest === "function" &&
      typeof obj.handleResponse === "function" &&
      typeof obj.handleRateLimit === "function" &&
      typeof obj.parseRateLimitHeaders === "function"
    );
  },
} as const;

/**
 * Parse a Retry-After header value into a bounded number of seconds.
 * Returns fallback if the header is missing, NaN, or out of bounds.
 *
 * @param header - raw Retry-After header value (may be null)
 * @param fallback - default seconds if header is missing or invalid
 * @returns seconds in range [0, 120], or fallback if header is missing/invalid
 * @category Plugin Development
 */
export const parseRetryAfter = (header: string | null, fallback = 1): number => {
  if (!header) return Math.min(Math.max(fallback, 0), 120);
  const parsed = Number.parseInt(header, 10);
  if (Number.isNaN(parsed) || parsed < 0) return Math.min(Math.max(fallback, 0), 120);
  return Math.min(parsed, 120);
};
