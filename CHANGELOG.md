# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
