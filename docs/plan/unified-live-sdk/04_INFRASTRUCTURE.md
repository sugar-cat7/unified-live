# 04: Infrastructure

Covers the SDK's cross-cutting infrastructure: RestManager, rate limiting, authentication, and observability.

---

## RestManager

Package: `packages/core/src/rest/manager.ts`

The RestManager is the HTTP client layer responsible for the full request lifecycle. Designed as a discordeno-style overridable function object.

### Interface

```ts
interface RestManager {
  readonly platform: string;
  readonly baseUrl: string;
  readonly tracer: Tracer;
  readonly rateLimitStrategy: RateLimitStrategy;
  readonly tokenManager: TokenManager;

  /** High-level API — called by plugins */
  request<T>(req: RestRequest): Promise<RestResponse<T>>;

  // --- Overridable internal methods ---
  createHeaders(req: RestRequest): Promise<Record<string, string>>;
  runRequest(url: string, init: RequestInit): Promise<Response>;
  handleResponse<T>(response: Response, req: RestRequest): Promise<RestResponse<T>>;
  handleRateLimit(response: Response, req: RestRequest, attempt: number): Promise<boolean>;
  parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined;
  dispose(): void;
}
```

### Request Types

```ts
interface RestRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Rate limit bucket key (e.g., "videos:list", "search:list") */
  bucketId?: string;
}

interface RestResponse<T = unknown> {
  status: number;
  headers: Headers;
  data: T;
  rateLimit?: RateLimitInfo;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetsAt: Date;
  bucket?: string;
}
```

### Configuration

```ts
interface RestManagerOptions {
  platform: string;
  baseUrl: string;
  headers?: Record<string, string>;
  rateLimitStrategy: RateLimitStrategy;
  tokenManager?: TokenManager;
  fetch?: typeof globalThis.fetch;
  retry?: RetryConfig;
}

interface RetryConfig {
  maxRetries?: number;        // Default: 3
  baseDelay?: number;         // Default: 1000ms
  retryableStatuses?: number[]; // Default: [500, 502, 503, 504]
}
```

### Request Flow

```
request(req)
  |
  +-- span start (OTel)
  |
  +-- 1. rateLimitStrategy.acquire(req)    // Rate limit token/quota reservation
  |
  +-- 2. createHeaders(req)                // Auth header + custom headers
  |
  +-- 3. buildUrl(baseUrl, path, query)    // URL construction
  |
  +-- 4. runRequest(url, init)             // fetch() execution
  |
  +-- 5a. 429 -> handleRateLimit()         // Auto-retry with backoff
  |   5b. 401 -> tokenManager.invalidate() // Token refresh + retry
  |   5c. 5xx -> exponential backoff       // Retry on server errors
  |
  +-- 6. handleResponse(response, req)     // JSON parse, error check
  |
  +-- 7. handle.complete(headers)          // Update rate limit state from headers
  |
  +-- span end (OTel: status, rate_limit.remaining, metrics)
```

### Declarative Plugin Configuration

Since `PlatformPlugin.create()` (see `docs/plan/plugin-companion-object/`), plugins declare customizations via `PluginDefinition` instead of manual overrides:

```ts
// YouTube: declarative configuration
PlatformPlugin.create(
  {
    name: "youtube",
    baseUrl: "https://www.googleapis.com/youtube/v3",
    rateLimitStrategy: quotaStrategy,
    matchUrl: matchYouTubeUrl,
    transformRequest: (req) => ({                    // API key injection
      ...req,
      query: { ...req.query, key: config.apiKey },
    }),
    handleRateLimit: createYouTubeRateLimitHandler(quotaStrategy),  // 403 handling
  },
  { getContent, getChannel, getLiveStreams, getVideos, resolveArchive },
);

// Twitch: declarative headers + auth
PlatformPlugin.create(
  {
    name: "twitch",
    baseUrl: "https://api.twitch.tv/helix",
    rateLimitStrategy: createTokenBucketStrategy({ ... }),
    tokenManager: createClientCredentialsTokenManager(config),
    headers: { "Client-Id": config.clientId },       // Static headers
    parseRateLimitHeaders: parseTwitchRateLimitHeaders,
    matchUrl: matchTwitchUrl,
  },
  { getContent, getChannel, getLiveStreams, getVideos, resolveArchive },
);
```

Direct RestManager method overrides remain available for advanced cases not covered by `PluginDefinition`.

---

## RateLimitStrategy

Package: `packages/core/src/rest/strategy.ts`

### Interface

```ts
interface RateLimitStrategy {
  /**
   * Called before each request.
   * Consumes a token/quota unit and returns a handle.
   * May block (await) if tokens are exhausted.
   */
  acquire(req: RestRequest): Promise<RateLimitHandle>;

  /** Current rate limit status (for telemetry) */
  getStatus(): RateLimitStatus;

  /** Release timers and resources */
  dispose(): void;
}

interface RateLimitHandle {
  /** Called after successful response — updates bucket from response headers */
  complete(headers: Headers): void;
  /** Called on retry — returns the consumed token/quota */
  release(): void;
}

interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetsAt: Date;
  queued: number;
}
```

### TokenBucketStrategy

Package: `packages/core/src/rest/bucket.ts`

Used by: Twitch (800 req/60s), TwitCasting (60 req/60s)

Header-driven token bucket that synchronizes with the actual rate limit state from API response headers.

```ts
interface TokenBucketConfig {
  global: { requests: number; perMs: number };
  routes?: Record<string, { requests: number; perMs: number }>;
  parseHeaders: (headers: Headers) => RateLimitInfo | undefined;
}
```

**Behavior**:
- On `acquire()`: consume a token. If no tokens available, the Promise blocks until tokens refill.
- On `handle.complete(headers)`: parse rate limit headers and update the bucket with the actual remaining count (most accurate source).
- On `handle.release()`: return the token (used during retry).
- Timer-based refill: `setInterval` refills tokens at the configured rate.
- Queued requests: when tokens are exhausted, requests queue and are released FIFO on refill.

**Platform Configurations**:

| Platform | Global Limit | Window | Headers |
| --- | --- | --- | --- |
| Twitch | 800 requests | 60,000ms | `Ratelimit-Limit`, `Ratelimit-Remaining`, `Ratelimit-Reset` |
| TwitCasting | 60 requests | 60,000ms | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |

### QuotaBudgetStrategy

Package: `packages/core/src/rest/quota.ts`

Used by: YouTube (10,000 units/day)

Cost-based daily quota tracking. Since YouTube doesn't return remaining quota in response headers, the strategy tracks consumption locally (optimistic).

```ts
interface QuotaBudgetConfig {
  dailyLimit: number;          // Default: 10,000
  costMap: Record<string, number>;
  defaultCost: number;         // Default: 1
}
```

**YouTube Quota Cost Map**:

| Endpoint (bucketId) | Cost |
| --- | --- |
| `videos:list` | 1 |
| `channels:list` | 1 |
| `playlists:list` | 1 |
| `playlistItems:list` | 1 |
| `liveBroadcasts:list` | 1 |
| `liveStreams:list` | 1 |
| `search:list` | **100** |

**Behavior**:
- On `acquire()`: check if `consumed + cost <= dailyLimit`. If yes, optimistically increment `consumed`. If no, throw `QuotaExhaustedError` immediately (no point waiting — reset is hours away).
- On `handle.complete()`: no-op (YouTube doesn't provide quota info in headers).
- On `handle.release()`: decrement `consumed` (used during retry).
- Auto-reset: quota resets at Pacific time midnight (Google's schedule). The strategy calculates the next reset time and resets the counter.
- No queuing: unlike TokenBucket, QuotaBudget throws immediately on exhaustion rather than waiting.

**Reset Time Calculation**:

```ts
/** Pacific time midnight (Google's quota reset schedule) */
private nextResetTime(): Date {
  const now = new Date();
  const pt = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const tomorrow = new Date(pt);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}
```

### Platform Rate Limit Summary

| Platform | Strategy | Model | Header Update | Reset | Exhaustion Behavior |
| --- | --- | --- | --- | --- | --- |
| YouTube | QuotaBudgetStrategy | Cost-based (1 or 100 units) | No (local tracking) | Pacific midnight | `QuotaExhaustedError` immediately |
| Twitch | TokenBucketStrategy | 800 req/min | Header-driven | 60s window | Promise waits (auto-queue) |
| TwitCasting | TokenBucketStrategy | 60 req/60s | Header-driven | 60s window | Promise waits (auto-queue) |

---

## TokenManager

Package: `packages/core/src/auth/types.ts`

### Interface

```ts
interface TokenManager {
  /** Returns a valid auth header value (e.g., "Bearer <token>") */
  getAuthHeader(): Promise<string>;
  /** Invalidate current token (called on 401 response) */
  invalidate(): void;
  /** Release resources */
  dispose?(): void;
}
```

### Implementations

#### StaticTokenManager

Package: `packages/core/src/auth/noop.ts`

For credentials that never change (API keys, static tokens).

```ts
class StaticTokenManager implements TokenManager {
  constructor(private header: string) {}
  async getAuthHeader(): Promise<string> { return this.header; }
  invalidate(): void {
    throw new AuthenticationError("Static token invalidated. Check credentials.");
  }
}
```

#### ClientCredentialsTokenManager (Twitch)

Package: `packages/twitch/src/auth.ts`

Twitch Client Credentials Grant Flow:
- Fetches App Access Token from `https://id.twitch.tv/oauth2/token`
- Token expires in ~58 days (`expires_in` ~5,011,271 seconds)
- No refresh_token — re-fetches before expiry
- Proactive refresh at 90% of expiry time (~52 days)
- Thundering herd prevention: concurrent requests share a single refresh Promise

```ts
class ClientCredentialsTokenManager implements TokenManager {
  private token: string | null = null;
  private expiresAt: Date | null = null;
  private refreshPromise: Promise<string> | null = null;  // Dedup

  async getAuthHeader(): Promise<string> {
    const token = await this.getToken();
    return `Bearer ${token}`;
  }

  private async getToken(): Promise<string> {
    if (this.token && this.expiresAt && new Date() < this.expiresAt) {
      return this.token;
    }
    if (this.refreshPromise) return this.refreshPromise;  // Join in-flight
    this.refreshPromise = this.fetchToken();
    try { return await this.refreshPromise; }
    finally { this.refreshPromise = null; }
  }

  invalidate(): void {
    this.token = null;
    this.expiresAt = null;
  }
}
```

#### UserAccessTokenManager (Twitch, Phase 2)

Twitch User Access Token with refresh_token flow:
- Token expires in ~4 hours
- Automatic refresh via refresh_token
- Twitch returns new refresh_token on each refresh

#### BasicAuthTokenManager (TwitCasting)

Package: `packages/twitcasting/src/auth.ts`

TwitCasting Basic Authentication:
- `Authorization: Basic base64(clientId:clientSecret)`
- Never expires
- `invalidate()` throws (credentials are static)

#### TwitCastingBearerTokenManager (TwitCasting, Phase 2)

TwitCasting OAuth2 Bearer Token:
- Expires in ~180 days
- No refresh_token — re-authorization required on expiry
- `invalidate()` marks token as expired

### Platform Auth Summary

| Platform | TokenManager | Expiry | Auto-Refresh |
| --- | --- | --- | --- |
| YouTube | N/A (API key via query param) | Never | N/A |
| Twitch (App) | ClientCredentialsTokenManager | ~58 days | Re-fetch at 90% expiry |
| Twitch (User) | UserAccessTokenManager (Phase 2) | ~4 hours | refresh_token |
| TwitCasting (App) | BasicAuthTokenManager | Never | N/A |
| TwitCasting (User) | TwitCastingBearerTokenManager (Phase 2) | ~180 days | Not possible (re-auth) |

---

## OpenTelemetry Instrumentation

Package: `packages/core/src/telemetry/`

### Design Principle

The SDK depends on `@opentelemetry/api` (the API contract only, ~50KB). When no OTel SDK is registered by the consumer, all API calls are no-ops with zero overhead. When a consumer configures an OTel SDK, traces and metrics flow automatically.

### Traces

Every platform API call creates a span:

```
unified-live.client getContent
|  url.full: "https://youtube.com/watch?v=..."
|  unified_live.resolved_platform: "youtube"
|
+-- unified-live.rest youtube GET /youtube/v3/videos
    |  http.request.method: GET
    |  http.response.status_code: 200
    |  unified_live.rate_limit.remaining: 95
    |  unified_live.rate_limit.limit: 100
    |  unified_live.quota.consumed: 1             (YouTube only)
    |  unified_live.quota.daily_remaining: 9842   (YouTube only)
    |
    +-- [event] rate_limited { retry_after_ms: 2000 }   (on 429)
    +-- [event] token_refreshed { platform: "twitch" }   (on token refresh)
```

**Span Attributes** (following OpenTelemetry semantic conventions):

| Attribute | Type | Description |
| --- | --- | --- |
| `unified_live.platform` | string | Platform name |
| `http.request.method` | string | HTTP method |
| `url.path` | string | API path |
| `http.response.status_code` | int | Response status |
| `unified_live.rate_limit.remaining` | int | Remaining rate limit tokens |
| `unified_live.rate_limit.limit` | int | Rate limit ceiling |
| `unified_live.quota.consumed` | int | YouTube quota units consumed (YouTube only) |
| `unified_live.quota.daily_remaining` | int | YouTube remaining daily quota (YouTube only) |

### Metrics (Deferred)

Metrics instrumentation is deferred. When implemented, counters and histograms will be added to `packages/core/src/telemetry/metrics.ts`.

### Noop Fallback

When the OTel SDK is not registered, `trace.getTracer()` returns a no-op implementation automatically (this is built into `@opentelemetry/api`). No special handling needed in the SDK code.

### Consumer Setup

Consumers configure OTel independently. The SDK requires no configuration:

```ts
// Consumer's setup (nothing SDK-specific)
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" }),
});
sdk.start();

// SDK automatically emits traces — no configuration needed
const client = createClient({ ... });
```

### Implementation Files

| File | Purpose |
| --- | --- |
| `packages/core/src/telemetry/traces.ts` | Tracer creation, span attribute helpers |
