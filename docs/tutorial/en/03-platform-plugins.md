# Platform Plugins

Each platform has its own package with a factory function. You only install the platforms you need.

## YouTube

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

| Operation | Cost |
|-----------|------|
| `getContent` (videos.list) | 1 unit |
| `getChannel` (channels.list) | 1 unit |
| `getVideos` (playlistItems.list + videos.list) | 2 units |
| `getLiveStreams` (search.list + videos.list) | 101 units |

The SDK tracks quota consumption locally and throws `QuotaExhaustedError` when the limit is reached.

---

## Twitch

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

Twitch allows 800 requests per 60 seconds. The SDK manages this automatically via token bucket, using rate limit headers from API responses.

### Authentication

The SDK handles OAuth2 Client Credentials Grant automatically. Tokens are refreshed before expiry.

---

## TwitCasting

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

TwitCasting allows 60 requests per 60 seconds. The SDK manages this automatically.

### Authentication

The SDK uses Basic Authentication (`base64(clientId:clientSecret)`), handled internally.

---

## Registering Plugins

```ts
import { createClient } from "@unified-live/core";

// Option A: Register after creation
const client = createClient();
client.register(youtube);
client.register(twitch);
client.register(twitcasting);

// Option B: Pass plugins at creation
const client = createClient({
  plugins: [youtube, twitch, twitcasting],
});
```

## Cleanup

Always call `dispose()` when you're done to release internal timers:

```ts
client.dispose();
```

## Next Steps

- [Error Handling](./04-error-handling.md) — Handling API errors
- [Pagination](./05-pagination.md) — Fetching video lists
