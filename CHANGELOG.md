# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `description` field on all Content types (LiveStream, Video, ScheduledStream)
- `tags` field on all Content types (string array)
- `endedAt` optional field on LiveStream for stream end time tracking
- `SearchOptions.channelId` for per-channel search
- `SearchOptions.order` for result ordering (`"relevance"` | `"date"`)
- `UnifiedClient.getLiveStreamsBatch()` — batch live stream check across multiple channels
- `PluginMethods.getLiveStreamsBatch?` — optional batch method for plugins
- `PluginCapabilities.supportsBatchLiveStreams`
- Twitch: native `getLiveStreamsBatch` (max 100 channel IDs per request via repeated user_id params)
- YouTube/Twitch/TwitCasting: `channelId` support in search
- `ScheduledStream` type — third member of `Content` discriminated union for upcoming/scheduled broadcasts
- `Content.isScheduled()` type guard
- `BatchResult<T>` type for batch operations with partial failure support
- `SearchOptions` type and `searchOptionsSchema` for unified search
- `UnifiedClient.getContents()` — batch content retrieval with plugin native support or core fallback
- `UnifiedClient.getChannels()` — batch channel retrieval
- `UnifiedClient.search()` — unified search across platforms
- `PluginMethods.getContents?` / `getChannels?` / `search?` — optional batch and search for plugins
- `PluginCapabilities.supportsBatchContent` / `supportsBatchChannels` / `supportsSearch`
- YouTube: native batch `getContents` (max 50 IDs per request), `search` (wraps `search.list`), upcoming → ScheduledStream mapper
- Twitch: native batch `getContents` (max 100 IDs per request), `search`, `toScheduled` mapper for schedule segments
- TwitCasting: `search` (batch uses core fallback)
- YouTube API types auto-generated from Google Discovery Document
- Weekly GitHub Actions workflow to keep YouTube types in sync
- `parseRetryAfter()` utility with NaN guard and upper bound (120s)
- `Schemas` type export from youtube package for advanced usage
- `hasMore` field on `Page<T>` for explicit pagination state
- Configurable `pageSize` parameter on `getVideos` across all platforms
- Credential validation at plugin creation time (throws `ValidationError`)
- Disposed guard on `RestManager` — throws after `dispose()` called
- Integration tests for Twitch and TwitCasting plugins
- Auth tests for Twitch (token refresh, caching, errors) and TwitCasting (Basic auth)
- YouTube quota strategy tests
- Edge case tests for all platform mappers
- JSDoc on all `methods.ts` functions across platforms

### Changed

- `contentBaseSchema` now requires `description` (string) and `tags` (string[])
- `liveStreamSchema` now has optional `endedAt` (Date)
- `searchOptionsSchema` includes `channelId` and `order`
- `RestRequest.query` now accepts `string | string[]` values (string arrays produce repeated query params)
- Search validation: now accepts `channelId` as alternative to `query`/`status`
- `Content` discriminated union now includes `"scheduled"` variant (was `"live" | "video"`)
- `PluginCapabilities` has three new required fields: `supportsBatchContent`, `supportsBatchChannels`, `supportsSearch`
- **BREAKING:** Twitch mapper renames: `streamToLive` → `toLive`, `videoToVideo` → `toVideo`, `userToChannel` → `toChannel`, `parseTwitchDuration` → `parseDuration`
- **BREAKING:** TwitCasting mapper renames: `movieToContent` → `toContent`, `movieToLive` → `toLive`, `movieToVideo` → `toVideo`, `userToChannel` → `toChannel`
- **BREAKING:** `Page<T>` now requires `hasMore: boolean` field
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
- Unified `Content`, `Channel`, `LiveStream`, `Video` types
- Plugin architecture with `PlatformPlugin` and `UnifiedClient`
- Rate limiting (token bucket + quota budget strategies)
- Error hierarchy (`UnifiedLiveError` + subclasses)
- OpenTelemetry tracing support
- URL matching for all platforms
