# 00: Feature Overview

## Feature

unified-live SDK — A TypeScript SDK providing a unified interface for live streaming platform APIs.

## Purpose & Background

### Problem

Integrating with multiple live streaming platforms (YouTube, Twitch, TwitCasting) requires handling:

- 3 different REST APIs with different data models
- 3 different authentication systems (API key, OAuth Client Credentials, Basic Auth, Bearer tokens)
- 3 different rate limiting models (YouTube's cost-based daily quota vs Twitch/TwitCasting's token bucket)
- 3 different pagination patterns (pageToken, cursor, offset/slice_id)
- ID mismatch between live and archive (Twitch Stream ID != Video ID)

Each integration is 500-1000 lines of boilerplate for auth, retry, rate limit handling, and data normalization.

### Solution

A single SDK that handles all of this transparently:

```ts
const client = createClient({
  youtube: { apiKey: "..." },
  twitch: { clientId: "...", clientSecret: "..." },
  twitcasting: { clientId: "...", clientSecret: "..." },
});

// Works with any platform URL
const content = await client.getContent("https://twitch.tv/videos/12345");
console.log(content.title, content.platform, content.sessionId);
```

## MVP Scope

- **Core package** (`@unified-live/core`): Shared types, RestManager, RateLimitStrategy, TokenManager, OTel instrumentation
- **YouTube plugin** (`@unified-live/youtube`): videos.list, channels.list, search.list, liveBroadcasts.list
- **Twitch plugin** (`@unified-live/twitch`): /streams, /videos, /users, /channels + Client Credentials auth
- **TwitCasting plugin** (`@unified-live/twitcasting`): /users, /movies + Basic/Bearer auth

## Success Criteria

| Criteria | Verification |
| --- | --- |
| `getContent(url)` returns normalized Content from any platform | Integration tests with recorded API responses |
| Rate limits are invisible to consumer (no 429 errors bubble up) | Unit tests for TokenBucket and QuotaBudget strategies |
| Twitch token refresh is automatic | Unit test for ClientCredentialsTokenManager |
| `sessionId` links live and archive across platforms | Unit tests for plugin mapping |
| OTel spans emitted for every platform API call | Integration test with test OTel collector |
| YouTube `QuotaExhaustedError` is thrown clearly | Unit test for QuotaBudget exhaustion |

## Non-Goals (v1)

- Chat / messaging APIs
- Stream broadcasting / publishing
- Webhooks / EventSub push notifications
- Caching layer
- Plugin auto-discovery via package.json
- Twitch User Access Token flow (Phase 2)
- Additional platforms (Niconico, Bilibili, Kick)

## Architecture Reference

The SDK architecture follows the [discordeno](https://github.com/discordeno/discordeno) REST Manager pattern:

- Function object design (all methods are overridable properties)
- RestManager handles the full request lifecycle: auth -> rate limit acquire -> fetch -> retry -> response
- Platform plugins customize behavior by overriding specific RestManager methods

See `docs/backend/sdk-architecture.md` for the full architecture reference.

## Related Documents

- `docs/reference/` — Glossary, decisions, overview
- `docs/plan/unified-live-sdk/01_TYPES.md` — Zod schemas and type definitions
- `docs/plan/unified-live-sdk/02_PLUGINS.md` — Per-platform plugin specifications
- `docs/plan/unified-live-sdk/03_CLIENT_API.md` — Public API surface
- `docs/plan/unified-live-sdk/04_INFRASTRUCTURE.md` — RestManager, rate limiting, auth, OTel
- `docs/plan/unified-live-sdk/05_PACKAGE_STRUCTURE.md` — Monorepo layout, build, publishing
