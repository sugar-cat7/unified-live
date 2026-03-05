# SDK Architecture

Architecture reference for unified-live SDK implementers.

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SDK Consumer Code                        │
│  client.getContent(url) / client.getLiveStreams(...)         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    UnifiedClient                            │
│  - URL parsing + plugin resolution (PluginRegistry)         │
│  - Delegates to PlatformPlugin                              │
│  - Package: @unified-live/core                              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Platform Plugins                              │
│  YouTubePlugin / TwitchPlugin / TwitCastingPlugin           │
│  - Request construction (path, query, bucketId)              │
│  - Response mapping (platform response -> Content)           │
│  - RestManager overrides (custom headers, error handling)    │
│  - Packages: @unified-live/youtube, twitch, twitcasting      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    RestManager                               │
│  - Full request lifecycle                                    │
│  - Rate limit coordination (RateLimitStrategy)               │
│  - Auth token management (TokenManager)                      │
│  - Retry with exponential backoff                            │
│  - OpenTelemetry instrumentation                             │
│  - All methods overridable (discordeno pattern)              │
│  - Package: @unified-live/core                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Cross-Cutting Infrastructure                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ RateLimit    │ │ TokenManager │ │ OpenTelemetry        │ │
│  │ Strategy     │ │              │ │ (traces + metrics)   │ │
│  │ - TokenBucket│ │ - Static     │ │                      │ │
│  │ - QuotaBudget│ │ - ClientCred │ │ @opentelemetry/api   │ │
│  │              │ │ - Basic      │ │ (peer dependency)    │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│  Package: @unified-live/core + platform packages             │
└─────────────────────────────────────────────────────────────┘
                         │
                    native fetch
                         │
              Platform APIs (googleapis.com / api.twitch.tv / apiv2.twitcasting.tv)
```

## Package Dependencies

1. **`@unified-live/core`** has zero platform-specific code. It defines interfaces (PlatformPlugin, RateLimitStrategy, TokenManager) and provides implementations of shared infrastructure (RestManager, TokenBucket, QuotaBudget, StaticTokenManager).

2. **Platform packages** (`@unified-live/youtube`, `@unified-live/twitch`, `@unified-live/twitcasting`) depend only on `core`. They implement the PlatformPlugin interface and provide platform-specific TokenManager and RateLimitStrategy configurations.

3. **Platform packages do not depend on each other.** YouTube code never imports from Twitch, etc.

4. **`@opentelemetry/api`** is a peer dependency of `core`. It provides the API contract only (~50KB). When no OTel SDK is registered by the consumer, all calls are automatic no-ops.

## Design Principles

### 1. Function Objects Over Classes (discordeno Pattern)

RestManager is designed as an interface with method properties, not a class with virtual methods. Every method is a replaceable property:

```ts
// Plugin customization via direct override
const origCreateHeaders = this.rest.createHeaders;
this.rest.createHeaders = async (req) => {
  const headers = await origCreateHeaders(req);
  return { ...headers, "Client-Id": config.clientId };
};
```

**Why**: Avoids deep inheritance hierarchies. Enables targeted customization of any single behavior without affecting others. Proven at scale by discordeno.

### 2. Zod Schema First

All types are derived from Zod schemas:

```ts
export const contentSchema = z.discriminatedUnion("type", [liveStreamSchema, videoSchema]);
export type Content = z.infer<typeof contentSchema>;
```

**Why**: Single source of truth for types and runtime validation. Aligns with monorepo conventions.

### 3. Zero Runtime Dependencies

The SDK depends only on `@opentelemetry/api` (peer, optional). HTTP is native `fetch`. No axios, ky, got, or other HTTP libraries.

**Why**: Minimizes supply chain risk, maximizes runtime portability (Node.js, Deno, Bun, Cloudflare Workers, etc.).

### 4. Transparent Infrastructure

Rate limits, auth token refresh, and retries are handled inside RestManager. SDK consumers never see 429 errors, expired tokens, or transient 5xx failures (unless retries are exhausted).

**Exception**: YouTube `QuotaExhaustedError` is thrown immediately because the daily quota reset is hours away — waiting would be pointless.

### 5. Platform-Specific Behavior via Strategy + Override

The SDK handles platform differences through two mechanisms:

- **Strategy pattern**: `RateLimitStrategy` (TokenBucket vs QuotaBudget) and `TokenManager` (per-platform auth) are injected into RestManager.
- **Method override**: Platform plugins override specific RestManager methods for behaviors that don't fit the strategy interfaces (e.g., YouTube's 403 quota error handling, TwitCasting's required headers).

## Error Handling

### Error Hierarchy

```
UnifiedLiveError (base)
├── QuotaExhaustedError     YouTube daily quota exceeded
├── AuthenticationError     Invalid/expired credentials
├── RateLimitError          Rate limit exceeded after max retries
├── PlatformNotFoundError   No plugin registered for platform
└── NotFoundError           Resource not found on platform
```

### Error Flow

1. Platform API returns error response (4xx, 5xx)
2. RestManager handles retryable errors automatically (429, 5xx, 401)
3. Non-retryable errors are mapped to SDK error types
4. SDK error is returned/thrown to consumer

### Thrown Exceptions (D-008)

The SDK uses thrown exceptions. All public methods throw `UnifiedLiveError` subtypes. See `docs/reference/decisions.md` D-008.

## Testing Strategy

### By Layer

| Layer | Approach | Dependencies |
| --- | --- | --- |
| **Types** (schemas, type guards) | Pure unit tests. No mocks. | None |
| **RateLimitStrategy** | Unit tests. Mock timers for TokenBucket refill. | `vi.useFakeTimers()` |
| **TokenManager** | Unit tests with mock fetch. Test token refresh, expiry, thundering herd. | Mock `fetch` |
| **RestManager** | Unit tests with mock fetch. Test request flow, retry, OTel span creation. | Mock `fetch`, mock OTel |
| **Platform plugins** | Integration tests with recorded HTTP responses. Test response mapping, pagination, URL matching. | MSW (Mock Service Worker) |
| **UnifiedClient** | Integration tests. Test full flow: URL -> plugin -> adapter -> response. | MSW or mock plugins |

### Test Commands

```bash
# All tests
pnpm test

# Per package
pnpm test --filter @unified-live/core
pnpm test --filter @unified-live/youtube
pnpm test --filter @unified-live/twitch
pnpm test --filter @unified-live/twitcasting
```

## Implementing a New Platform Plugin

To add a new platform (e.g., Niconico):

1. Create `packages/niconico/` with the standard structure
2. Implement `PlatformPlugin` interface:
   - `match(url)` / `resolveUrl(url)` for URL patterns
   - `getContent(id)`, `getChannel(id)`, `getLiveStreams(channelId)`, `getVideos(channelId, cursor?)`
   - Response mapping functions (platform response -> Content/Channel)
3. Configure `RateLimitStrategy` (TokenBucket or QuotaBudget)
4. Implement `TokenManager` for the platform's auth model
5. Override RestManager methods for platform-specific behaviors
6. Add integration tests with recorded HTTP responses

## Reference Documents

- `docs/plan/unified-live-sdk/` — Detailed feature specifications
- `docs/reference/` — Glossary, decisions, overview
- `docs/reference/decisions.md` — Architecture decision log
