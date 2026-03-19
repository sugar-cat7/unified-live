---
title: Overview
description: "Why unified-live exists and how it solves multi-platform live streaming API challenges"
---

## The Problem

Building an application that aggregates live streaming data across YouTube, Twitch, and TwitCasting means dealing with three completely different APIs — each with its own authentication scheme, rate limiting model, data format, and URL structure.

|                      | [YouTube Data API v3](https://developers.google.com/youtube/v3) | [Twitch Helix API](https://dev.twitch.tv/docs/api/) | [TwitCasting API v2](https://apiv2-doc.twitcasting.tv/) |
| :------------------- | :-------------------------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------ |
| **Auth**             | API Key (query parameter)                                       | OAuth2 Client Credentials                           | Basic Auth (base64)                                     |
| **Rate Limiting**    | Quota-based (10,000 units/day)                                  | Token bucket (header-driven)                        | Token bucket (60 req/60s)                               |
| **Cost Model**       | Per-endpoint cost (1–1,600 units)                               | Flat (1 req = 1 token)                              | Flat (1 req = 1 token)                                  |
| **Live vs. Archive** | Same video ID                                                   | Different video IDs                                 | Same movie ID                                           |
| **Channel ID**       | `UC...` prefix, `@handle`                                       | Login name                                          | User ID                                                 |

### Common Pain Points

- **YouTube quota** — The daily 10,000-unit quota runs out fast. A single `search.list` call costs 100 units. Without local tracking, you'll get silent 403 errors mid-day.
- **Twitch OAuth** — Tokens expire and must be refreshed before expiry. Missing a refresh means 401 errors in production.
- **TwitCasting rate limits** — Only 60 requests per minute. Without a proper token bucket, you'll hit 429 errors under any moderate load.
- **Different data models** — A "video" on YouTube, a "VOD" on Twitch, and a "movie" on TwitCasting are conceptually the same thing but have completely different JSON shapes and field names.

## How unified-live Solves This

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";
import { createTwitCastingPlugin } from "@unified-live/twitcasting";

const client = UnifiedClient.create({
  plugins: [
    createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
    createTwitCastingPlugin({
      clientId: process.env.TWITCASTING_CLIENT_ID!,
      clientSecret: process.env.TWITCASTING_CLIENT_SECRET!,
    }),
  ],
});

// One interface — the SDK handles auth, rate limits, and data normalization
const yt = await client.getContent("https://www.youtube.com/watch?v=abc123");
const tw = await client.getContent("https://www.twitch.tv/videos/123456");
const tc = await client.getContent("https://twitcasting.tv/user/movie/789");

// All return the same Content type
console.log(yt.title); // string
console.log(tw.platform); // "twitch"
console.log(tc.type); // "live" | "video"
```

### What the SDK Handles for You

| Concern                | How unified-live handles it                                                                                                            |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**     | API key injection (YouTube), OAuth2 auto-refresh (Twitch), Basic auth encoding (TwitCasting)                                           |
| **Rate Limiting**      | Local quota tracking with `QuotaExhaustedError` (YouTube), token bucket with header parsing (Twitch), fixed token bucket (TwitCasting) |
| **Retries**            | Exponential backoff for 429/5xx, token refresh on 401                                                                                  |
| **Data Normalization** | All platforms map to unified `Content`, `Channel`, `LiveStream`, `Video` types                                                         |
| **URL Resolution**     | Auto-detects platform from URL, supports multiple URL formats per platform                                                             |
| **Observability**      | OpenTelemetry spans and metrics for every API call (zero overhead when OTel is not configured)                                         |

### Feature Matrix

| Feature                  | YouTube | Twitch | TwitCasting |
| :----------------------- | :-----: | :----: | :---------: |
| Get content by URL       |   ✅    |   ✅   |     ✅      |
| Get content by ID        |   ✅    |   ✅   |     ✅      |
| List live streams        |   ✅    |   ✅   |     ✅      |
| List videos (pagination) |   ✅    |   ✅   |     ✅      |
| Get channel info         |   ✅    |   ✅   |     ✅      |
| Archive resolution       |   ✅    |   ✅   |     ✅      |
| OpenTelemetry traces & metrics |   ✅    |   ✅   |     ✅      |

## Official API Documentation

- [YouTube Data API v3](https://developers.google.com/youtube/v3/docs) — Google's video platform API (SDK targets **v3**)
- [Twitch Helix API](https://dev.twitch.tv/docs/api/guide) — Twitch's current REST API (SDK targets **Helix**, the current API)
- [TwitCasting API v2](https://apiv2-doc.twitcasting.tv/) — TwitCasting's REST API (SDK targets **v2**)

## Next Steps

- [Getting Started](../getting-started/) — Install and run your first query
- [Core Concepts](../core-concepts/) — Content, Channel, and the type system
- [Examples](../examples/) — Practical code recipes
