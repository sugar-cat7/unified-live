# Plan: unified-live SDK Documentation & Architecture Finalization

## Context

We have a detailed v3 design document for `unified-live` — a TypeScript SDK providing a unified interface for YouTube / Twitch / TwitCasting live streaming APIs. The design covers data models, RestManager (discordeno-style), rate limiting strategies, auth abstraction, and OpenTelemetry instrumentation.

**Goal**: Finalize the architecture and produce all foundational documentation. No code is written in this phase — only docs.

**Key decision**: This repo becomes an **SDK-only project**. The existing web app template (services/api, services/web, web-frontend docs, design docs, etc.) will be removed/ignored. The monorepo structure is retained for SDK packages only.

## File Manifest

All files to create, in execution order:

### Group 1: Domain Specification (`docs/domain/`)

Populate the existing TBD templates with SDK domain knowledge.

| # | File | Action |
|---|---|---|
| 1 | `docs/domain/overview.md` | Rewrite |
| 2 | `docs/domain/entities.md` | Rewrite |
| 3 | `docs/domain/usecases.md` | Rewrite |
| 4 | `docs/domain/glossary.md` | Rewrite |
| 5 | `docs/domain/decisions.md` | Rewrite |

### Group 2: Feature Spec (`docs/plan/unified-live-sdk/`)

Adapted layer structure for SDK architecture.

| # | File | Action |
|---|---|---|
| 6 | `docs/plan/unified-live-sdk/00_OVERVIEW.md` | Create |
| 7 | `docs/plan/unified-live-sdk/01_DOMAIN_MODEL.md` | Create |
| 8 | `docs/plan/unified-live-sdk/02_PLATFORM_ADAPTERS.md` | Create |
| 9 | `docs/plan/unified-live-sdk/03_CLIENT_API.md` | Create |
| 10 | `docs/plan/unified-live-sdk/04_INFRASTRUCTURE.md` | Create |
| 11 | `docs/plan/unified-live-sdk/05_PACKAGE_STRUCTURE.md` | Create |

### Group 3: Architecture Reference (`docs/backend/`)

| # | File | Action |
|---|---|---|
| 12 | `docs/backend/sdk-architecture.md` | Create |

### Group 4: Cleanup

| # | Action |
|---|---|
| 13 | Remove or note as inapplicable: `services/api/`, `services/web/`, `docs/web-frontend/`, `docs/design/`, web-app-specific docs in `docs/backend/` (sql-antipatterns, api-design), `docs/testing/ui-testing.md`, `docs/testing/vrt-testing.md`, `docs/testing/e2e-testing.md` |

---

## Group 1: `docs/domain/` — Content Outline

### 1. `docs/domain/overview.md`

- Project name: `unified-live`
- Package scope: `@unified-live/*`
- Vision: Platform-agnostic TypeScript SDK for querying live streaming content
- Problem: 3 platforms, 3 different APIs, 3 different auth models, 3 different rate limit systems, ID mismatch between live and archive (Twitch)
- Target users: (1) Multi-platform live stream aggregator builders, (2) Bot/tool developers, (3) Data pipeline developers
- In Scope: Content retrieval (live/video/channel), session tracking (live->archive), per-platform auth, rate limiting, OTel instrumentation
- Out of Scope: Chat/messaging, stream broadcasting, webhooks/EventSub, video transcoding
- Tech stack: TypeScript, Zod 4, `@opentelemetry/api`, native `fetch` (zero runtime dependencies)
- NFR: Rate limit awareness, minimal overhead, credential isolation, no credential logging

### 2. `docs/domain/entities.md`

Core entities with Zod schema drafts and business rules:

- **Content** (discriminated union: `type: "live" | "video"`) — The root abstraction. Fields: id, platform, sessionId, title, url, thumbnail, channel, raw
- **LiveStream** (Content with `type: "live"`) — viewerCount, startedAt
- **Video** (Content with `type: "video"`) — duration, viewCount, publishedAt
- **Channel** — id, platform, name, url, thumbnail
- **ChannelRef** — id, name, url (lightweight reference embedded in Content)
- **Thumbnail** — url, width, height (value object)
- **BroadcastSession** — sessionId, platform, channel, startedAt, endedAt, contentIds (liveId, archiveId)
- **Page\<T>** — items, cursor, total (pagination envelope)
- **ResolvedUrl** — platform, type, id (URL parsing result)

Companion objects:
- `Content.isLive()`, `Content.isVideo()` type guards
- Per-entity factory functions

sessionId mapping table (YouTube: id=sessionId, Twitch: stream_id=sessionId but video_id differs, TwitCasting: movie_id=sessionId)

### 3. `docs/domain/usecases.md`

Public SDK operations (all MVP unless noted):

- UC-001: `getContent(url | {platform, id})` — Retrieve single content by URL or platform+ID
- UC-002: `getLiveStreams(channelId)` — List live streams for a channel
- UC-003: `getVideos(channelId, cursor?)` — List videos for a channel (paginated)
- UC-004: `getChannel(platform, id)` — Retrieve channel info
- UC-005: `resolveArchive(live)` — Find the archive video for a live stream
- UC-006: `resolveSession(content)` — Get full broadcast session info (Phase 2)
- UC-007: URL matching — `match(url)` to detect platform from URL

For each: input, output, preconditions (plugin registered, credentials configured), error cases (rate limit, auth expired, not found, platform unavailable)

### 4. `docs/domain/glossary.md`

Key terms:
- **Content**: Unified abstraction over LiveStream and Video
- **LiveStream**: Content with `type: "live"` — currently broadcasting
- **Video**: Content with `type: "video"` — recorded/archived
- **BroadcastSession**: Lifecycle link between a live stream and its archive
- **SessionId**: Platform-specific identifier linking live broadcast to archive
- **Platform**: YouTube / Twitch / TwitCasting
- **PlatformPlugin**: Interface for platform adapter implementations
- **RestManager**: HTTP client layer (discordeno-style overridable function object)
- **RateLimitStrategy**: Algorithm for managing API rate limits
- **TokenBucket**: Rate limiting via token refill (Twitch, TwitCasting)
- **QuotaBudget**: Rate limiting via daily cost tracking (YouTube)
- **TokenManager**: Per-platform auth credential manager
- **Page**: Cursor-based pagination result envelope

### 5. `docs/domain/decisions.md`

Key architecture decisions with rationale/alternatives:

- D-001: **Content as discriminated union** (not separate top-level types). Rationale: type-safe narrowing, single return type for getContent. Alt: separate LiveStream/Video types at top level.
- D-002: **discordeno-style RestManager** (overridable function object, not class inheritance). Rationale: composability, tree-shaking, testability. Alt: class-based HTTPClient.
- D-003: **Dual rate limit strategies** (TokenBucket vs QuotaBudget). Rationale: YouTube's quota is fundamentally different from Twitch/TwitCasting's token-per-second model. Alt: unified token bucket with cost weighting.
- D-004: **OpenTelemetry as first-class** (always instrumented, noop when SDK not registered). Rationale: production observability from day one, zero cost when unused. Alt: pluggable logging interface.
- D-005: **sessionId for cross-platform ID tracking**. Rationale: Twitch stream_id != video_id. Alt: consumer-managed correlation.
- D-006: **Monorepo with core + per-platform packages**. Rationale: tree-shaking, independent versioning. Alt: single package with platform modules.
- D-007: **Zero runtime dependencies** (only `@opentelemetry/api` as peer). Rationale: minimize supply chain risk, maximize portability. Alt: bring in HTTP client library.
- D-008: **Reuse `@my-app/errors` Result type**. Rationale: consistency with monorepo conventions, explicit error flow. Alt: thrown exceptions. (TBD: may fork/adapt for SDK-specific error codes)

---

## Group 2: `docs/plan/unified-live-sdk/` — Content Outline

### 6. `00_OVERVIEW.md`

- Feature: unified-live SDK
- Purpose & background: Solve the multi-platform integration problem
- MVP scope: core + YouTube + Twitch + TwitCasting (all 3 platforms)
- Success criteria:
  1. Consumer can `getContent(url)` and get normalized Content from any supported platform
  2. Rate limits are automatically managed (invisible to consumer)
  3. Auth tokens are refreshed transparently
  4. OTel traces emitted for every platform API call
- Non-goals (v1): Chat, broadcasting, webhooks, caching layer
- Architecture reference: discordeno (REST Manager pattern)

### 7. `01_DOMAIN_MODEL.md`

- Full Zod schema definitions for all entities (from `docs/domain/entities.md`)
- Business rules per entity
- Discriminated union patterns: `Content = LiveStream | Video`
- sessionId mapping per platform (detailed table)
- Type guards and factory functions
- Package location: `packages/core/src/types.ts`

### 8. `02_PLATFORM_ADAPTERS.md`

Replaces the standard `02_DATA_ACCESS.md`. The SDK's "data access" is HTTP calls to platform APIs.

**PlatformPlugin interface** — full TypeScript definition:
- `name`, `rest`, `match(url)`, `resolveUrl(url)`, `getContent(id)`, `getChannel(id)`, `getLiveStreams(channelId)`, `getVideos(channelId, cursor?)`, `resolveArchive?(live)`, `resolveSession?(content)`, `dispose?()`

**YouTube adapter** (`packages/youtube/`):
- API endpoints: videos.list, channels.list, search.list, liveBroadcasts.list
- Quota costs per endpoint (1 unit for most, 100 for search)
- Response mapping: YTVideo -> Content, YTChannel -> Channel
- Pagination: pageToken-based
- Auth: API key via query parameter (`?key=`)
- URL patterns: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/channel/`, `youtube.com/@`

**Twitch adapter** (`packages/twitch/`):
- API endpoints: /streams, /videos, /users, /channels
- Response mapping: TwitchStream -> LiveStream, TwitchVideo -> Video
- Pagination: cursor-based
- Auth: Client-Id header + Bearer token
- Rate limit headers: `Ratelimit-Limit`, `Ratelimit-Remaining`, `Ratelimit-Reset`
- URL patterns: `twitch.tv/<username>`, `twitch.tv/videos/<id>`
- sessionId: stream.id (live) / video.stream_id (archive)

**TwitCasting adapter** (`packages/twitcasting/`):
- API endpoints: /users/:id, /users/:id/movies, /movies/:id
- Response mapping: TCMovie -> Content (is_live -> LiveStream, else -> Video)
- Pagination: offset-based with slice_id for >1000 items
- Auth: Basic (app) or Bearer (user)
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Required header: `X-Api-Version: 2.0`
- URL patterns: `twitcasting.tv/<username>`, `twitcasting.tv/<username>/movie/<id>`
- Constraints: offset max 1000, use slice_id beyond; 60 req/60sec; docs in Japanese only

### 9. `03_CLIENT_API.md`

Replaces the standard `03_USECASE.md`. The SDK's public surface.

**UnifiedClient creation**:
```ts
const client = createClient({
  youtube: { apiKey: "..." },
  twitch: { clientId: "...", clientSecret: "..." },
  twitcasting: { clientId: "...", clientSecret: "..." },
});
```

**Public methods** (each with signature, behavior, error cases):
- `client.getContent(url)` — URL -> Platform resolution -> Plugin.getContent
- `client.getContent(platform, id)` — Direct platform access
- `client.getLiveStreams(platform, channelId)` — List live streams
- `client.getVideos(platform, channelId, cursor?)` — Paginated videos
- `client.getChannel(platform, id)` — Channel info
- `client.platform(name)` — Access platform-specific plugin (for resolveArchive etc.)

**Plugin registration**:
- Manual: `client.register(new YouTubePlugin(config))`
- Auto-discovery: package.json `unified-live-plugin` field (Phase 2)

**Error handling**: Result type or thrown errors (TBD — decide based on D-008)

### 10. `04_INFRASTRUCTURE.md`

Replaces the standard `04_API_INTERFACE.md`. Cross-cutting SDK infrastructure.

**RestManager** (`packages/core/src/rest/`):
- Function object interface: `request()`, `createHeaders()`, `runRequest()`, `handleResponse()`, `handleRateLimit()`, `parseRateLimitHeaders()`, `dispose()`
- All methods overridable (discordeno pattern)
- Retry policy: max 3, exponential backoff, Retry-After header respect
- 401 -> token invalidation + retry
- 429 -> rate limit handling + retry
- Custom fetch injection for testing

**RateLimitStrategy** (`packages/core/src/rest/`):
- Interface: `acquire(req) -> RateLimitHandle`, `getStatus()`, `dispose()`
- RateLimitHandle: `complete(headers)`, `release()`
- TokenBucketStrategy (Twitch: 800/60s, TwitCasting: 60/60s): header-driven update, queue on exhaustion
- QuotaBudgetStrategy (YouTube: 10,000 units/day): local tracking, cost map, QuotaExhaustedError on exhaustion, Pacific time reset
- YouTube 403 quotaExceeded / rateLimitExceeded handling

**TokenManager** (`packages/core/src/auth/`):
- Interface: `getAuthHeader()`, `invalidate()`, `dispose?()`
- StaticTokenManager (API key)
- ClientCredentialsTokenManager (Twitch app): auto-fetch, thundering herd prevention, proactive refresh at 90% expiry
- UserAccessTokenManager (Twitch user): refresh_token flow (Phase 2)
- BasicAuthTokenManager (TwitCasting app): Base64 encoded, no refresh
- TwitCastingBearerTokenManager (TwitCasting user): 180-day expiry, no refresh (re-auth required)

**OpenTelemetry** (`packages/core/src/telemetry/`):
- Traces: one span per REST call, attributes (platform, method, path, status, quota)
- Metrics: request.count, request.duration, rate_limit.remaining, retry.count, quota.consumed, token.refresh_count
- Noop fallback when OTel SDK not registered
- User setup: just configure OTel SDK, unified-live instruments automatically

### 11. `05_PACKAGE_STRUCTURE.md`

Replaces the standard `05_FRONTEND.md`. Monorepo and packaging design.

**Package layout**:
```
packages/
  core/           # @unified-live/core
  youtube/        # @unified-live/youtube
  twitch/         # @unified-live/twitch
  twitcasting/    # @unified-live/twitcasting
```

- Dependency graph: youtube/twitch/twitcasting -> core. core has no platform deps.
- Peer dependency: `@opentelemetry/api`
- Build: tsup (ESM + CJS dual)
- TypeScript: project references, strict, verbatimModuleSyntax
- Type generation: openapi-typescript for YouTube/Twitch (TwitCasting has no OpenAPI spec)
- Tree-shaking: consumers install only needed platform packages
- Relationship to existing packages: `@my-app/errors` reuse (TBD: fork as `@unified-live/errors`?)
- pnpm-workspace.yaml update
- Existing `services/api`, `services/web` to be removed

---

## Group 3: Architecture Reference

### 12. `docs/backend/sdk-architecture.md`

The SDK's equivalent of `server-architecture.md`:

- Layer diagram: Domain Types -> RestManager/Auth/RateLimit -> Platform Adapters -> Client API
- Dependency rules: core has zero platform deps, platform packages depend only on core
- Design principles: function objects > classes, Result types, Zod Schema First, zero runtime deps
- Error handling: SDK error hierarchy (UnifiedLiveError -> QuotaExhaustedError, AuthenticationError, RateLimitError)
- Testing strategy: unit (domain), recorded HTTP / MSW (adapters), mock adapters (client)
- discordeno pattern reference: how/why function object overrides work

---

## Group 4: Cleanup (deferred — note only)

The following are inapplicable to the SDK project and should be removed when implementation begins:
- `services/api/`, `services/web/`
- `docs/web-frontend/`, `docs/design/`
- `docs/backend/sql-antipatterns.md`, `docs/backend/api-design.md`
- `docs/testing/ui-testing.md`, `docs/testing/vrt-testing.md`, `docs/testing/e2e-testing.md`
- `infrastructure/terraform/` (no infrastructure to deploy)

---

## Execution Order

```
Step 1: docs/domain/ (5 files)
   Populate overview -> entities -> usecases -> glossary -> decisions
   These are the foundation that all plan docs reference.

Step 2: docs/plan/unified-live-sdk/ (6 files)
   Create 00_OVERVIEW -> 01_DOMAIN_MODEL -> 02_PLATFORM_ADAPTERS
        -> 03_CLIENT_API -> 04_INFRASTRUCTURE -> 05_PACKAGE_STRUCTURE
   Detailed specs derived from v3 design doc, structured per adapted layers.

Step 3: docs/backend/sdk-architecture.md (1 file)
   Architecture reference for SDK implementers.

Step 4: Cleanup notes (no file changes — just document what to remove later)
```

Total: **12 files** to create/rewrite.

## Verification

After all docs are created:
1. Cross-reference check: every entity in `docs/domain/entities.md` appears in `01_DOMAIN_MODEL.md`
2. Every use case in `docs/domain/usecases.md` has a corresponding method in `03_CLIENT_API.md`
3. Every decision in `docs/domain/decisions.md` is reflected in the relevant plan doc
4. Glossary terms are used consistently across all documents
5. No references to web-app concepts (Hono, Drizzle, React, etc.) in SDK docs
