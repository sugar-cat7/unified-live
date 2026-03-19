---
title: Platform Plugins
description: "Configure YouTube, Twitch, and TwitCasting platform plugins"
---

Each platform has its own package with a factory function. You only install the platforms you need.

## Platform Status

| Platform    | Status    | Auth                      | Rate Limiting          | Archive Resolution |
| :---------- | :-------- | :------------------------ | :--------------------- | :----------------- |
| YouTube     | ✅ Stable | API Key (query param)     | Quota Budget (10k/day) | ✅ Supported       |
| Twitch      | ✅ Stable | OAuth2 Client Credentials | Token Bucket (800/min) | ✅ Supported       |
| TwitCasting | ✅ Stable | Basic Auth (base64)       | Token Bucket (60/min)  | ✅ Supported       |

---

## YouTube

> **Official docs:** [YouTube Data API v3](https://developers.google.com/youtube/v3)
>
> YouTube's quota system charges different costs per endpoint (1–101 units) from a daily pool of 10,000. The SDK tracks consumption locally and throws `QuotaExhaustedError` before you hit silent 403s.

```bash
pnpm add @unified-live/core @unified-live/youtube
```

```ts
import { createYouTubePlugin } from "@unified-live/youtube";

const youtube = createYouTubePlugin({
  apiKey: process.env.YOUTUBE_API_KEY!,
  quota: {
    dailyLimit: 10_000, // optional, default: 10,000 units
  },
});
```

### Getting a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Enable the **YouTube Data API v3**
4. Go to **Credentials** and create an API key

### Quota

YouTube uses a cost-based daily quota (default: 10,000 units). Different operations cost different amounts:

| Operation                                                      | Cost      |
| -------------------------------------------------------------- | --------- |
| `getContent` (videos.list)                                     | 1 unit    |
| `getChannel` (channels.list)                                   | 1 unit    |
| `getVideos` (channels.list + playlistItems.list + videos.list) | 3 units   |
| `getLiveStreams` (search.list + videos.list)                   | 101 units |

The SDK tracks quota consumption locally and throws `QuotaExhaustedError` when the limit is reached.

---

## Twitch

> **Official docs:** [Twitch Helix API](https://dev.twitch.tv/docs/api/)
>
> Twitch requires OAuth2 Client Credentials with token refresh. The SDK handles the full token lifecycle — initial fetch, 90% expiry refresh, and automatic retry on 401.

```bash
pnpm add @unified-live/core @unified-live/twitch
```

```ts
import { createTwitchPlugin } from "@unified-live/twitch";

const twitch = createTwitchPlugin({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
```

### Getting Twitch Credentials

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Register a new application
3. Copy the **Client ID** and generate a **Client Secret**

### Rate Limits

Twitch uses a token-bucket algorithm with rate limits communicated via `Ratelimit-Limit`/`Ratelimit-Remaining`/`Ratelimit-Reset` response headers. The SDK initializes with a default bucket size and dynamically adjusts based on actual API responses.

### Authentication

The SDK handles OAuth2 Client Credentials Grant automatically. Tokens are refreshed before expiry.

---

## TwitCasting

> **Official docs:** [TwitCasting API v2](https://apiv2-doc.twitcasting.tv/)
>
> TwitCasting has a strict 60 req/min rate limit. The SDK enforces this with a token bucket and transparent retries so you never see unexpected 429 errors.

```bash
pnpm add @unified-live/core @unified-live/twitcasting
```

```ts
import { createTwitCastingPlugin } from "@unified-live/twitcasting";

const twitcasting = createTwitCastingPlugin({
  clientId: process.env.TWITCASTING_CLIENT_ID!,
  clientSecret: process.env.TWITCASTING_CLIENT_SECRET!,
});
```

### Getting TwitCasting Credentials

1. Go to [TwitCasting Developer](https://twitcasting.tv/developer.php)
2. Register a new application
3. Copy the **Client ID** and **Client Secret**

### Rate Limits

Most TwitCasting endpoints allow 60 requests per 60 seconds. Some endpoints (supporter/supporting lists) have stricter limits of 30 requests per 60 seconds. The SDK manages this automatically.

### Authentication

The SDK uses Basic Authentication (`base64(clientId:clientSecret)`) for application-level access, handled internally. TwitCasting also supports Bearer Token for user-level operations, but this is not currently implemented.

---

## Registering Plugins

**Option A — Pass plugins at creation:**

```ts
import { UnifiedClient } from "@unified-live/core";

const client = UnifiedClient.create({
  plugins: [youtube, twitch, twitcasting],
});
```

**Option B — Register after creation:**

```ts
import { UnifiedClient } from "@unified-live/core";

const client = UnifiedClient.create();
client.register(youtube);
client.register(twitch);
client.register(twitcasting);
```

## Cleanup

Use `using` to automatically release internal timers when the client goes out of scope:

```ts
using client = UnifiedClient.create({ plugins: [createYouTubePlugin({ apiKey: "..." })] });
// client[Symbol.dispose]() is called automatically at end of scope
```

## Next Steps

- [Error Handling](../error-handling/) — Handling API errors
- [Pagination](../pagination/) — Fetching video lists
- [Creating a Plugin](../creating-a-plugin/) — Build your own platform plugin
