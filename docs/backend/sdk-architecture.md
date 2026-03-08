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
│  - Declarative configuration via PluginDefinition            │
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

1. **`@unified-live/core`** has zero platform-specific code. It defines types (`PlatformPlugin`, `RateLimitStrategy`, `TokenManager`) and provides shared infrastructure (`RestManager`, `TokenBucket`, `QuotaBudget`, `StaticTokenManager`).

2. **Platform packages** (`@unified-live/youtube`, `@unified-live/twitch`, `@unified-live/twitcasting`) depend only on `core`. They use `PlatformPlugin.create()` to wire platform-specific configurations.

3. **Platform packages do not depend on each other.** YouTube code never imports from Twitch, etc.

4. **`@opentelemetry/api`** is a peer dependency of `core`. It provides the API contract only (~50KB). When no OTel SDK is registered by the consumer, all calls are automatic no-ops.

---

## Design Patterns

### 1. Companion Object Pattern

TypeScript allows a type and a value to share the same name. We use this pattern for types that need associated factory methods, type guards, or static operations.

**Structure:**

```ts
// 1. Zod schema — source of truth
const contentSchema = z.discriminatedUnion("type", [liveStreamSchema, videoSchema]);

// 2. Type derived from schema
export type Content = z.infer<typeof contentSchema>;

// 3. Companion object — same name, holds type guards / factories
export const Content = {
  isLive: (content: Content): content is LiveStream => content.type === "live",
  isVideo: (content: Content): content is Video => content.type === "video",
} as const;
```

**When to use:**

| Use Case | Companion Object Method | Example |
| --- | --- | --- |
| Discriminated union narrowing | Type guards (`isX`) | `Content.isLive(c)` |
| Constructing instances from config | Factory (`create`) | `PlatformPlugin.create(def, methods)` |
| Runtime type checking | Type guard (`is`) | `PlatformPlugin.is(value)` |

**Conventions:**

- Always use `as const` on the companion object
- Factory methods: `create` (from config) or `new` (from raw props)
- Type guards: `is` (general), `isX` (discriminated union variant)
- Companion objects hold **stateless operations only** — no mutable state
- For types not derived from Zod (e.g., `PlatformPlugin`), define the type directly

**Current companion objects in the SDK:**

| Name | Location | Methods |
| --- | --- | --- |
| `Content` | `core/src/types.ts` | `isLive`, `isVideo` |
| `PlatformPlugin` | `core/src/plugin.ts` | `create`, `is` |

### 2. Function Objects Over Classes (discordeno Pattern)

RestManager is a plain object with method properties, not a class. Every method is a replaceable property:

```ts
const rest = createRestManager({ ... });

// Override any single method without subclassing
rest.handleRateLimit = async (response, req, attempt) => { ... };
```

`PlatformPlugin.create()` wraps this pattern declaratively — plugin authors configure behavior via `PluginDefinition` instead of manual overrides:

```ts
const plugin = PlatformPlugin.create(
  {
    name: "twitch",
    baseUrl: "https://api.twitch.tv/helix",
    rateLimitStrategy: createTokenBucketStrategy({ ... }),
    tokenManager: createClientCredentialsTokenManager(config),
    headers: { "Client-Id": config.clientId },
    parseRateLimitHeaders: parseTwitchRateLimitHeaders,
  },
  { getContent, getChannel, getLiveStreams, getVideos, resolveArchive },
);
```

Direct RestManager overrides remain available for advanced cases not covered by `PluginDefinition`.

**Why**: Avoids deep inheritance hierarchies. Enables targeted customization of any single behavior. Proven at scale by discordeno.

### 3. Zod Schema First

All types are derived from Zod schemas:

```ts
export const contentSchema = z.discriminatedUnion("type", [liveStreamSchema, videoSchema]);
export type Content = z.infer<typeof contentSchema>;
```

**Why**: Single source of truth for types and runtime validation.

### 4. Factory Functions for Infrastructure

Infrastructure components use `create*` factory functions that return plain objects:

```ts
// Rate limiting
const strategy = createTokenBucketStrategy({ global: { requests: 800, perMs: 60_000 } });

// Auth
const tokenManager = createClientCredentialsTokenManager({ clientId, clientSecret });

// Shared utilities
const parseHeaders = createRateLimitHeaderParser({ limit: "X-RateLimit-Limit", ... });

// Client
const client = createClient();
```

**Why**: Factory functions are composable, testable, and avoid the complexity of class constructors. Dependencies are explicit via function arguments.

### 5. Strategy Pattern for Platform Differences

The SDK handles platform differences through injectable strategies:

- **`RateLimitStrategy`**: TokenBucket (Twitch, TwitCasting) vs QuotaBudget (YouTube)
- **`TokenManager`**: ClientCredentials (Twitch) vs BasicAuth (TwitCasting) vs none (YouTube uses API key query param)
- **`PluginDefinition`**: Declarative platform-specific behaviors (`transformRequest`, `handleRateLimit`, `parseRateLimitHeaders`, `headers`)

---

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

### Public API: Thrown Exceptions

All public methods throw `UnifiedLiveError` subtypes. This matches the convention of every major OSS TypeScript SDK (discordeno, Octokit, Stripe, AWS SDK v3).

### Internal: Result Type (Optional)

Internal logic may use `Result<V, E>` / `Ok` / `Err` / `wrap` / `unwrap` for readability when error flow is complex. Result must **never** appear in public return types.

```ts
// Internal usage example
const result = await wrap(fetchData(), (err) => new NotFoundError("youtube", id));
if (result.err) {
  // handle internally
}
```

### Error Flow

1. Platform API returns error response (4xx, 5xx)
2. RestManager handles retryable errors automatically (429, 5xx, 401)
3. Non-retryable errors are mapped to SDK error types
4. SDK error is thrown to consumer

**Exception**: YouTube `QuotaExhaustedError` is thrown immediately because the daily quota reset is hours away.

---

## Infrastructure

### Zero Runtime Dependencies

The SDK depends only on `@opentelemetry/api` (peer, optional). HTTP is native `fetch`.

**Why**: Minimizes supply chain risk, maximizes runtime portability (Node.js, Deno, Bun, Cloudflare Workers, etc.).

### Transparent Infrastructure

Rate limits, auth token refresh, and retries are handled inside RestManager. SDK consumers never see 429 errors, expired tokens, or transient 5xx failures (unless retries are exhausted).

### OpenTelemetry Instrumentation

Every API call emits OpenTelemetry traces with attributes for platform, HTTP method, rate limit state, and errors. When no OTel SDK is registered, all calls are automatic no-ops with zero overhead.

---

## Testing Strategy

### By Layer

| Layer | Approach | Dependencies |
| --- | --- | --- |
| **Types** (schemas, type guards) | Pure unit tests. No mocks. | None |
| **RateLimitStrategy** | Unit tests. Mock timers for TokenBucket refill. | `vi.useFakeTimers()` |
| **TokenManager** | Unit tests with mock fetch. Test token refresh, expiry, thundering herd. | Mock `fetch` |
| **RestManager** | Unit tests with mock fetch. Test request flow, retry, OTel span creation. | Mock `fetch`, mock OTel |
| **Platform plugins** | Integration tests with recorded HTTP responses. Test response mapping, pagination, URL matching. | Mock `fetch` |
| **UnifiedClient** | Integration tests. Test full flow: URL -> plugin -> adapter -> response. | Mock plugins |

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

---

## Implementing a New Platform Plugin

To add a new platform (e.g., Niconico):

1. Create `packages/niconico/` with the standard structure:
   ```
   packages/niconico/
   ├── src/
   │   ├── urls.ts          # URL matching
   │   ├── mapper.ts        # Platform types + mapping to unified types
   │   ├── methods.ts       # PluginMethods implementations
   │   ├── auth.ts          # TokenManager (if needed)
   │   ├── plugin.ts        # PlatformPlugin.create() wiring
   │   └── index.ts         # Re-exports
   ├── package.json
   ├── tsconfig.json
   ├── tsup.config.ts
   └── vitest.config.ts
   ```

2. Define the `PluginDefinition`:
   ```ts
   PlatformPlugin.create(
     {
       name: "niconico",
       baseUrl: "https://api.niconico.example",
       rateLimitStrategy: createTokenBucketStrategy({ ... }),
       tokenManager: createSomeTokenManager(config),
       matchUrl: matchNiconicoUrl,
       headers: { "X-Custom-Header": "value" },           // optional
       transformRequest: (req) => ({ ...req, ... }),       // optional
       handleRateLimit: customHandler,                     // optional
       parseRateLimitHeaders: parseNiconicoHeaders,        // optional
     },
     { getContent, getChannel, getLiveStreams, getVideos, resolveArchive },
   );
   ```

3. Implement `PluginMethods` as pure functions receiving `RestManager` as first argument:
   ```ts
   export async function niconicoGetContent(rest: RestManager, id: string): Promise<Content> {
     const res = await rest.request<NiconicoVideoResponse>({ ... });
     return toContent(res.data);
   }
   ```

4. Add tests (URL matching, mapper, plugin integration)

---

## Reference Documents

- `docs/plan/unified-live-sdk/` — Detailed feature specifications
- `docs/reference/` — Glossary, decisions, overview
- `docs/reference/decisions.md` — Architecture decision log
