# Overview

## Project Basic Information

| Item | Details |
| --- | --- |
| Project Name | unified-live |
| Repository Identifier | `@unified-live/*` |
| Domain | Live streaming platform API abstraction |
| Created | 2026-03-05 |
| Last Updated | 2026-03-05 |

## Summary

- What to build: A TypeScript SDK that provides a single, platform-agnostic interface for querying live streaming content across YouTube, Twitch, and TwitCasting
- Problem to solve: Each platform has its own API, authentication model, rate limiting system, data model, and pagination pattern. Integrating with multiple platforms requires duplicating boilerplate for auth, retry, rate limit handling, and data normalization.
- Value proposition: One unified interface to query any supported platform. Rate limits, auth token refresh, retries, and data normalization are handled transparently. OpenTelemetry instrumentation is built-in.

## Target Users

| User Type | Problem | Expected Outcome |
| --- | --- | --- |
| Multi-platform aggregator developers | Need to integrate with 3+ streaming APIs, each with different auth/rate limits/data models | Single SDK call returns normalized data from any platform |
| Bot / tool developers | Need cross-platform content lookup (e.g., "is this streamer live?") | `client.getContent(url)` works regardless of platform |
| Data pipeline developers | Need to collect streaming metadata across platforms | Consistent data model with session tracking for live-to-archive correlation |

## Scope

### In Scope

- Content retrieval: live streams, videos (archives), channels
- Session tracking: live-to-archive ID mapping via `sessionId`
- Per-platform authentication: API key (YouTube), OAuth Client Credentials / User Token (Twitch), Basic Auth / Bearer (TwitCasting)
- Rate limiting: automatic management with platform-appropriate strategies
- OpenTelemetry instrumentation: traces and metrics for every platform API call
- Platform plugins: YouTube, Twitch, TwitCasting

### Out of Scope

- Chat / messaging APIs
- Stream broadcasting / publishing
- Webhooks / EventSub push notifications
- Video transcoding or media processing
- Caching layer (future scope)
- Additional platforms: Niconico, Bilibili, Kick (future scope)

## Success Metrics (MVP)

| Metric | Target | Measurement Method |
| --- | --- | --- |
| Platform coverage | YouTube, Twitch, TwitCasting | All 3 platform plugins pass integration tests |
| API transparency | Consumer never sees 429/rate limit errors | Rate limit handling is fully automatic |
| Auth transparency | Consumer never manually refreshes tokens | Token refresh is automatic (Twitch Client Credentials) |
| Observability | Every platform API call emits OTel trace span | Verify spans in test collector |

## Non-Functional Requirements

- Availability: N/A (client library, not a service)
- Performance: Minimal overhead over raw platform API calls. Rate limit awareness prevents unnecessary request failures.
- Security: Credential isolation per platform. No credential values in logs or OTel attributes. Custom fetch injection for testing without real credentials.
- Portability: Zero runtime dependencies beyond `@opentelemetry/api` (peer). Works with any JavaScript runtime supporting `fetch`.

## Technology Stack

- Language: TypeScript (strict, verbatimModuleSyntax)
- Schema / Validation: Zod 4 (`z.infer<typeof schema>` for all type definitions)
- HTTP: Native `fetch` (no HTTP client library)
- API type generation: openapi-typescript (YouTube, Twitch)
- Observability: `@opentelemetry/api` (peer dependency)
- Error handling: Thrown exceptions (`UnifiedLiveError` hierarchy)
- Build: tsdown (ESM + CJS dual output, powered by Rolldown)
- Package manager: pnpm (workspace monorepo)
- Architecture: discordeno pattern (factory functions, overridable function objects)
