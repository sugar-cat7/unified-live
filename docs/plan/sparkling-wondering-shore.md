# Plan: YouTube-only MVP Implementation

## Context

The unified-live SDK docs and architecture specs are finalized (see `docs/plan/unified-live-sdk/`). The repo is still a web-app template (Next.js + Hono + TiDB) with zero SDK source code. This plan implements the plugin-based SDK architecture with YouTube-only minimum scope, removing all template artifacts.

Specs: `01_TYPES.md`, `02_PLUGINS.md`, `03_CLIENT_API.md`, `04_INFRASTRUCTURE.md`, `05_PACKAGE_STRUCTURE.md`

## Spec Divergences

These deviations from the spec docs are intentional:

1. **`createYouTubePlugin(config)` not `new YouTubePlugin(config)`** — CLAUDE.md: "factory functions, overridable function objects. No class inheritance hierarchies."
2. **`mapper.ts` not `adapter.ts`** — D-009 renamed "Adapter" to "Plugin". The response mapping file is a mapper.
3. **`registry.ts` folded into `client.ts`** — Registry is a `Map` inside the client. Separate file is premature.
4. **`rest/queue.ts` deferred** — Token bucket handles its own queue. Not needed for YouTube.
5. **`zod` as runtime dep (not devDep)** — Schemas are exported and used for validation by consumers.
6. **No `openapi-typescript` generated types for MVP** — YouTube API types defined inline in `mapper.ts` (subset of fields actually used). Generated types add tooling overhead for MVP.
7. **No `createClient` convenience shorthand** (`{ youtube: { apiKey } }`) — Would require core to import platform packages, violating dependency graph. Consumers use `createClient({ plugins: [createYouTubePlugin({ apiKey })] })`.

## Phase 0: Clean Slate

Remove template artifacts, update root config.

### Delete (entire directories)

- `services/api/`, `services/web/`
- `infrastructure/terraform/`
- `packages/errors/`, `packages/logger/`, `packages/dayjs/`

### Delete (files)

- `compose.yaml`, `compose.test.yaml`
- `renovate/groups/api.json`, `renovate/groups/web.json`, `renovate/groups/infra.json`
- `.github/workflows/terraform-apply-dev.yml`, `.github/workflows/terraform-plan-dev.yml`, `.github/workflows/visual-regression.yaml`

### Modify

- **`package.json`** — Name `unified-live`, remove template scripts (dev:next, tiup:*, db:*, storybook, etc.), remove dotenv-cli
- **`pnpm-workspace.yaml`** — Remove `services/*`, clean catalog to SDK deps only
- **`turbo.json`** — Remove globalPassThroughEnv, template tasks (dev, tiup, docker), simplify
- **`knip.json`** — Replace workspace config for `packages/core` and `packages/youtube`
- **`scripts/post-edit-check.sh`** — Remove `pnpm security-scan` (Docker-dependent)
- **`.github/workflows/pr-check.yaml`** — Remove integration-test job, docker-build, octocov
- **`.github/workflows/security-scan.yaml`** — Remove Docker image scan section

### Create

- **`tsconfig.base.json`** — Shared TS config per spec (ESNext, Bundler, strict, verbatimModuleSyntax)

### Verify

`pnpm install` succeeds, no build errors from removed packages.

---

## Phase 1: Core Types + Errors

Create `packages/core/` scaffold and implement the type foundation.

### Create

- `packages/core/package.json` — `@unified-live/core`, zod as runtime dep, @opentelemetry/api as optional peer
- `packages/core/tsconfig.json` — Extends `../../tsconfig.base.json`
- `packages/core/tsup.config.ts` — ESM + CJS, dts, external @opentelemetry/api
- `packages/core/vitest.config.ts`
- `packages/core/biome.json` — Extends `../../biome.base.json`
- `packages/core/src/types.ts` — All Zod schemas from 01_TYPES.md:
  - `thumbnailSchema`, `channelRefSchema`, `contentBaseSchema` (internal)
  - `liveStreamSchema`/`LiveStream`, `videoSchema`/`Video`
  - `contentSchema`/`Content` (discriminated union)
  - `channelSchema`/`Channel`, `broadcastSessionSchema`/`BroadcastSession`
  - `resolvedUrlSchema`/`ResolvedUrl`, `Page<T>` type
  - `Content.isLive()`, `Content.isVideo()` type guards
- `packages/core/src/errors.ts` — Error hierarchy from 03_CLIENT_API.md:
  - `UnifiedLiveError` (base: platform, code)
  - `QuotaExhaustedError` (details: consumed, limit, resetsAt, requestedCost)
  - `AuthenticationError`, `RateLimitError` (retryAfter), `PlatformNotFoundError`, `NotFoundError`
- `packages/core/src/index.ts` — Re-exports types + errors
- `packages/core/src/__tests__/types.test.ts` — Schema parse/reject, type guards
- `packages/core/src/__tests__/errors.test.ts` — instanceof chain, message formatting

### Verify

`pnpm --filter @unified-live/core build && pnpm --filter @unified-live/core test:run`

---

## Phase 2: Auth + Telemetry

### Create

- `packages/core/src/auth/types.ts` — `TokenManager` type (getAuthHeader, invalidate, dispose)
- `packages/core/src/auth/static.ts` — `createStaticTokenManager(header): TokenManager`
- `packages/core/src/telemetry/traces.ts` — `getTracer()` using `@opentelemetry/api`, span attribute constants
- `packages/core/src/telemetry/metrics.ts` — `getMeter()`, metric definitions
- `packages/core/src/__tests__/auth/static.test.ts`
- Update `packages/core/src/index.ts`

### Verify

`pnpm --filter @unified-live/core test:run`

---

## Phase 3: Rate Limit Strategies

### Create

- `packages/core/src/rest/types.ts` — RestRequest, RestResponse, RateLimitInfo, RestManagerOptions, RetryConfig
- `packages/core/src/rest/strategy.ts` — RateLimitStrategy, RateLimitHandle, RateLimitStatus types
- `packages/core/src/rest/quota.ts` — `createQuotaBudgetStrategy(config): RateLimitStrategy`
  - `acquire()`: Check consumed + cost <= dailyLimit, throw QuotaExhaustedError if over
  - `handle.complete()`: no-op (YouTube has no quota headers)
  - Auto-reset at Pacific midnight via setTimeout
- `packages/core/src/rest/bucket.ts` — `createTokenBucketStrategy(config): RateLimitStrategy`
  - `acquire()`: Consume token or block until refill
  - `handle.complete(headers)`: Update remaining from server headers
  - Refill timer via setInterval
- `packages/core/src/__tests__/rest/quota.test.ts` — Cost deduction, exhaustion, release, auto-reset (fake timers)
- `packages/core/src/__tests__/rest/bucket.test.ts` — Acquire/block/refill, header update, dispose
- Update `packages/core/src/index.ts`

### Verify

`pnpm --filter @unified-live/core test:run`

---

## Phase 4: RestManager

discordeno-style factory: `createRestManager(options): RestManager` returning a plain object with overridable function properties.

### Create

- `packages/core/src/rest/manager.ts`:
  - Overridable methods: `request`, `createHeaders`, `runRequest`, `handleResponse`, `handleRateLimit`, `parseRateLimitHeaders`, `dispose`
  - Request flow: OTel span → rateLimitStrategy.acquire → createHeaders → buildUrl → runRequest → retry loop (429/5xx) → handleResponse → handle.complete → span end
  - Helper: `buildUrl(base, path, query)`, `sleep(ms)`
- `packages/core/src/__tests__/rest/manager.test.ts`:
  - Successful GET, retry on 5xx, 429 with Retry-After, 404→NotFoundError, 401→AuthenticationError
  - rateLimitStrategy.acquire called, handle.complete called
  - Method override works (reassign function property)
  - Uses mock fetch via `options.fetch`
- Update `packages/core/src/index.ts`

### Verify

`pnpm --filter @unified-live/core test:run && pnpm --filter @unified-live/core build`

---

## Phase 5: Plugin Interface + Client

### Create

- `packages/core/src/plugin.ts` — `PlatformPlugin` type:
  - `name`, `rest`, `match`, `resolveUrl`, `getContent`, `getChannel`, `getLiveStreams`, `getVideos`
  - Optional: `resolveArchive`, `resolveSession`, `dispose`
- `packages/core/src/client.ts` — `createClient(options?): UnifiedClient`:
  - Internal `Map<string, PlatformPlugin>` registry
  - `register(plugin)`, `getContent(url)` / `getContent(platform, id)`, `getLiveStreams`, `getVideos`, `getChannel`, `platform(name)`, `match(url)`, `dispose()`
  - URL-based routing: iterate plugins calling `match()`, resolve to plugin + id
- `packages/core/src/__tests__/client.test.ts` — Mock plugin, URL routing, PlatformNotFoundError
- Update `packages/core/src/index.ts`

### Verify

`pnpm --filter @unified-live/core test:run && pnpm --filter @unified-live/core build`

Core package is feature-complete at this point.

---

## Phase 6: YouTube Plugin

### Create

- `packages/youtube/package.json` — @unified-live/youtube, depends on workspace:* core
- `packages/youtube/tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `biome.json`
- `packages/youtube/src/urls.ts` — URL patterns:
  - `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/live/` → content
  - `youtube.com/channel/`, `youtube.com/@`, `youtube.com/c/` → channel
- `packages/youtube/src/quota.ts` — Cost map (videos:list=1, search:list=100, etc.), `createYouTubeQuotaStrategy(dailyLimit?)`
- `packages/youtube/src/mapper.ts`:
  - `toContent(item): Content` — Determine LiveStream vs Video from `liveBroadcastContent`
  - `toChannel(item): Channel`
  - `parseDuration(iso8601): number` — PT1H2M3S → seconds
  - Inline YouTube API response type subset (no generated types for MVP)
- `packages/youtube/src/plugin.ts` — `createYouTubePlugin(config): PlatformPlugin`:
  - Creates RestManager with QuotaBudgetStrategy
  - Override `rest.request`: inject API key as query param
  - Override `rest.handleRateLimit`: 403 quotaExceeded → QuotaExhaustedError, 403 rateLimitExceeded → retry
  - Implements: getContent (videos.list), getChannel (channels.list, handles @handle/forUsername), getLiveStreams (search.list + videos.list), getVideos (channels → uploads playlist → playlistItems → videos.list), resolveArchive (same ID)
- `packages/youtube/src/index.ts`
- Tests:
  - `__tests__/urls.test.ts` — All URL patterns + non-matching
  - `__tests__/mapper.test.ts` — Live/video/channel mapping, duration parsing
  - `__tests__/plugin.test.ts` — Integration with mock fetch: getContent, 403 quota, getLiveStreams empty

### Verify

`pnpm --filter @unified-live/youtube test:run && pnpm --filter @unified-live/youtube build`

---

## Phase 7: Integration Test + Polish

### Create

- `packages/youtube/src/__tests__/integration.test.ts` — Full consumer flow:
  - `createClient({ plugins: [createYouTubePlugin({ apiKey })] })`
  - `client.getContent("https://youtube.com/watch?v=...")` → Content
  - `client.match(url)` → ResolvedUrl
  - `client.dispose()`

### Polish

- JSDoc on all public functions (preconditions, postconditions, idempotency)
- Run `pnpm biome`, `pnpm knip`, `pnpm type-check`
- Run `./scripts/post-edit-check.sh` as final gate

### Verify (final)

```
pnpm build          # Both packages build
pnpm biome          # Lint passes
pnpm knip           # No dead exports
pnpm type-check     # No type errors
pnpm test           # All tests pass
```

---

## File Summary

### Phase 0 Delete (directories)

`services/api/`, `services/web/`, `infrastructure/terraform/`, `packages/errors/`, `packages/logger/`, `packages/dayjs/`

### Phase 0 Delete (files)

`compose.yaml`, `compose.test.yaml`, `renovate/groups/{api,web,infra}.json`, `.github/workflows/{terraform-apply-dev,terraform-plan-dev,visual-regression}.*`

### Phase 0 Modify

`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `knip.json`, `scripts/post-edit-check.sh`, `.github/workflows/pr-check.yaml`, `.github/workflows/security-scan.yaml`

### Phase 0 Create

`tsconfig.base.json`

### Phases 1-5: packages/core/ (~17 source files + ~8 test files)

```
packages/core/
├── package.json, tsconfig.json, tsup.config.ts, vitest.config.ts, biome.json
└── src/
    ├── index.ts
    ├── types.ts, errors.ts, plugin.ts, client.ts
    ├── auth/types.ts, auth/static.ts
    ├── telemetry/traces.ts, telemetry/metrics.ts
    ├── rest/types.ts, rest/strategy.ts, rest/quota.ts, rest/bucket.ts, rest/manager.ts
    └── __tests__/types.test.ts, errors.test.ts, client.test.ts
        auth/static.test.ts, rest/{quota,bucket,manager}.test.ts
```

### Phases 6-7: packages/youtube/ (~5 source files + ~4 test files)

```
packages/youtube/
├── package.json, tsconfig.json, tsup.config.ts, vitest.config.ts, biome.json
└── src/
    ├── index.ts, plugin.ts, mapper.ts, quota.ts, urls.ts
    └── __tests__/urls.test.ts, mapper.test.ts, plugin.test.ts, integration.test.ts
```
