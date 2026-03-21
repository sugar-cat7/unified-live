# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `description` field on all Content types (Broadcast, Archive, ScheduledBroadcast)
- `tags` field on all Content types (string array)
- `Clip` type — short clip extracted from a stream or video, discriminated by `type: "clip"`
- `clipSchema`, `clipOptionsSchema` — Zod schemas for clips
- `Clip.is()` type guard
- `Content.isClip()` type guard on the Content companion object
- `BroadcastSession` type and `broadcastSessionSchema` — links broadcast to archive
- `BroadcastSession.is()` type guard
- `channelRefSchema` — lightweight channel reference embedded in content objects
- `thumbnailSchema` — Zod schema for image thumbnails
- `Content` base schema: `languageCode` optional field
- `Broadcast` schema: `endedAt` optional field for stream end time
- `SearchOptions.channelId` for per-channel search
- `SearchOptions.order` for result ordering (`"relevance"` | `"date"`)
- `UnifiedClient.batchGetBroadcasts()` — batch broadcast check across multiple channels
- `UnifiedClient.batchGetContents()` — batch content retrieval with plugin native support or core fallback
- `UnifiedClient.batchGetClips()` — batch retrieve clips by IDs
- `UnifiedClient.listClips()` — list clips for a channel
- `UnifiedClient.crossListBroadcasts()` — fetch broadcasts from all specified platforms in parallel
- `UnifiedClient.crossSearch()` — search across all registered plugins that support search
- `UnifiedClient.search()` — unified search across platforms
- `UnifiedClient.resolve(url)` — resolve URL to content (renamed from `getContent(url)`)
- `UnifiedClient.getContent(platform, id)` — renamed from `getContentById(platform, id)`
- `PluginMethods.batchGetBroadcasts?` — optional batch method for plugins
- `PluginMethods.listClips?` / `PluginMethods.batchGetClips?` — optional clip methods for plugins
- `PluginMethods.batchGetContents?` / `PluginMethods.search?` — optional batch and search for plugins
- `PluginCapabilities.supportsBatchBroadcasts`
- `PluginCapabilities.supportsBatchContent` / `PluginCapabilities.supportsSearch`
- Twitch: native `batchGetBroadcasts` (max 100 channel IDs per request via repeated user_id params)
- Twitch: native `listClips` and `batchGetClips` support
- YouTube/Twitch/TwitCasting: `channelId` support in search
- `ScheduledBroadcast` type — third member of `Content` discriminated union for upcoming/scheduled broadcasts
- `Content.isScheduledBroadcast()` type guard
- `BatchResult<T>` type for batch operations with partial failure support
- `BatchResult.empty()` companion object utility
- `Page.map()` / `Page.empty()` companion object utilities
- `SearchOptions` type and `searchOptionsSchema` for unified search
- YouTube: native batch `batchGetContents` (max 50 IDs per request), `search` (wraps `search.list`), upcoming → ScheduledBroadcast mapper
- Twitch: native batch `batchGetContents` (max 100 IDs per request), `search`
- TwitCasting: `search` (batch uses core fallback)
- YouTube API types auto-generated from Google Discovery Document
- Weekly GitHub Actions workflow to keep YouTube types in sync
- `parseRetryAfter()` utility with NaN guard and upper bound (120s)
- `Schemas` type export from youtube package for advanced usage
- `hasMore` field on `Page<T>` for explicit pagination state
- Configurable `pageSize` parameter on `listArchives` across all platforms
- Credential validation at plugin creation time (throws `ValidationError`)
- Disposed guard on `RestManager` — throws after `dispose()` called
- `ErrorCode` companion object with category helpers (`isNetwork`, `isAuth`, `isClientError`, `isRateLimit`)
- `UnifiedLiveError.retryable` getter
- `UnifiedLiveError.toJSON()` with cause chain serialization
- OpenTelemetry: `SpanAttributes` constants, `MetricNames` constants, `withSpan()` utility
- Structured logging: `Logger`, `LoggerProvider`, `getLogger()`, `setLoggerProvider()`
- Integration tests for Twitch and TwitCasting plugins
- Auth tests for Twitch (token refresh, caching, errors) and TwitCasting (Basic auth)
- YouTube quota strategy tests
- Edge case tests for all platform mappers
- JSDoc on all `methods.ts` functions across platforms

### Changed

- **BREAKING:** API naming revision — all types and methods renamed per Google AIP conventions (see [docs/superpowers/specs/2026-03-20-api-naming-revision-design.md](docs/superpowers/specs/2026-03-20-api-naming-revision-design.md))
- **BREAKING:** `contentBaseSchema` now requires `description` (string) and `tags` (string[])
- **BREAKING:** `Content` discriminated union now includes `"clip"` variant
- **BREAKING:** `PluginCapabilities` has new required fields: `supportsClips`, `supportsBatchContent`, `supportsSearch`
- `contentSchema` discriminant literals updated: `"live"` → `"broadcast"`, `"video"` → `"archive"`
- `broadcastSchema` now has optional `endedAt` (Date)
- `searchOptionsSchema` includes `channelId` and `order`
- `RestRequest.query` now accepts `string | string[]` values (string arrays produce repeated query params)
- Search validation: now accepts `channelId` as alternative to `query`/`status`
- **BREAKING:** `Content` discriminated union now includes `"scheduled"` variant (was `"live" | "video"`)
- **BREAKING:** Twitch mapper renames: `streamToLive` → `toLive`, `videoToVideo` → `toVideo`, `userToChannel` → `toChannel`, `parseTwitchDuration` → `parseDuration`
- **BREAKING:** TwitCasting mapper renames: `movieToContent` → `toContent`, `movieToLive` → `toLive`, `movieToVideo` → `toVideo`, `userToChannel` → `toChannel`
- **BREAKING:** `Page<T>` now requires `hasMore: boolean` field
- **BREAKING:** OpenTelemetry span names updated to match new method names
- Turbo cache enabled for `build` and `type-check` tasks
- PR check workflow consolidated (single build, shared artifacts)
- YouTube type update workflow scoped to youtube package only
- Bundle minification enabled in all tsdown configs
- Exponential backoff now includes jitter (0.5-1.5x) to prevent thundering herd
- oxlint JSDoc rules strengthened from warn to error
- knip config excludes generated files

### Fixed

- `Retry-After` header parsing: NaN guard prevents retry storms from malformed headers
- `autofix.yaml` uses `continue-on-error` instead of `|| true` to surface lint errors

## [0.1.0] - 2026-03-15

### Added

- Initial release with YouTube, Twitch, and TwitCasting support
- Unified `Content`, `Channel` types with platform abstraction
- Plugin architecture with `PlatformPlugin` and `UnifiedClient`
- Rate limiting (token bucket + quota budget strategies)
- Error hierarchy (`UnifiedLiveError` + subclasses)
- OpenTelemetry tracing support
- URL matching for all platforms
