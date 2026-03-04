# 03: Client API

Replaces the standard `03_USECASE.md`. Specifies the SDK's public API surface.

## UnifiedClient

The main entry point for SDK consumers. Manages plugin registration and delegates operations to platform plugins.

### Creation

```ts
import { createClient } from "@unified-live/core";
import { YouTubePlugin } from "@unified-live/youtube";
import { TwitchPlugin } from "@unified-live/twitch";
import { TwitCastingPlugin } from "@unified-live/twitcasting";

const client = createClient({
  plugins: [
    new YouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    new TwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
    new TwitCastingPlugin({
      clientId: process.env.TC_CLIENT_ID!,
      clientSecret: process.env.TC_CLIENT_SECRET!,
    }),
  ],
});
```

### Convenience Shorthand

```ts
// Equivalent — config-based creation
const client = createClient({
  youtube: { apiKey: process.env.YOUTUBE_API_KEY! },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID!,
    clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  },
  twitcasting: {
    clientId: process.env.TC_CLIENT_ID!,
    clientSecret: process.env.TC_CLIENT_SECRET!,
  },
});
```

## Public Methods

### `client.getContent(url: string): Promise<Content>`

Retrieve content (live stream or video) from any platform by URL.

**Flow**: URL -> `match()` -> plugin resolution -> `plugin.getContent(id)`

```ts
const content = await client.getContent("https://youtube.com/watch?v=dQw4w9WgXcQ");
// content.type === "video"
// content.platform === "youtube"
// content.sessionId === "dQw4w9WgXcQ"

const live = await client.getContent("https://twitch.tv/videos/12345");
// live.type === "video"
// live.platform === "twitch"
```

**Errors**:
- `PlatformNotFoundError` — URL doesn't match any registered plugin
- `NotFoundError` — Resource not found on the platform
- `RateLimitError` — Rate limit exceeded after max retries
- `AuthenticationError` — Invalid/expired credentials
- `QuotaExhaustedError` — YouTube daily quota exhausted

---

### `client.getContent(platform: string, id: string): Promise<Content>`

Retrieve content by directly specifying platform and resource ID.

```ts
const content = await client.getContent("twitch", "44567123");
```

**Errors**: Same as URL-based `getContent`.

---

### `client.getLiveStreams(platform: string, channelId: string): Promise<LiveStream[]>`

List currently active live streams for a channel.

```ts
const streams = await client.getLiveStreams("twitch", "12345");
// streams: LiveStream[] (empty if no active streams)
```

**Errors**: `PlatformNotFoundError`, `NotFoundError`, `RateLimitError`, `AuthenticationError`, `QuotaExhaustedError`

---

### `client.getVideos(platform: string, channelId: string, cursor?: string): Promise<Page<Video>>`

List videos (archives) for a channel with cursor-based pagination.

```ts
// First page
const page1 = await client.getVideos("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw");
console.log(page1.items); // Video[]
console.log(page1.cursor); // "nextPageToken" or undefined

// Next page
if (page1.cursor) {
  const page2 = await client.getVideos("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw", page1.cursor);
}
```

**Errors**: Same as `getLiveStreams`.

---

### `client.getChannel(platform: string, id: string): Promise<Channel>`

Retrieve channel information.

```ts
const channel = await client.getChannel("twitcasting", "twitcasting_jp");
// channel.name, channel.url, channel.thumbnail
```

**Errors**: `PlatformNotFoundError`, `NotFoundError`, `RateLimitError`, `AuthenticationError`

---

### `client.platform(name: string): PlatformPlugin`

Access a specific platform plugin for platform-specific operations.

```ts
const twitch = client.platform("twitch");

// Platform-specific: resolve archive from live stream
const live = await client.getContent("twitch", "44567123");
if (Content.isLive(live)) {
  const archive = await twitch.resolveArchive(live);
  if (archive) {
    console.log(archive.sessionId === live.sessionId); // true
  }
}
```

**Errors**: `PlatformNotFoundError` if the platform is not registered.

---

### `client.match(url: string): ResolvedUrl | null`

Parse a URL to determine which platform it belongs to and extract the resource ID. No network calls.

```ts
const resolved = client.match("https://youtu.be/dQw4w9WgXcQ");
// { platform: "youtube", type: "content", id: "dQw4w9WgXcQ" }

const unknown = client.match("https://example.com/foo");
// null
```

---

### `client.dispose(): void`

Release all resources (rate limit timers, token refresh schedulers).

```ts
// Clean shutdown
client.dispose();
```

## Plugin Registration

### Manual Registration (MVP)

```ts
const client = createClient();
client.register(new YouTubePlugin({ apiKey: "..." }));
client.register(new TwitchPlugin({ clientId: "...", clientSecret: "..." }));
```

### Config-Based Registration (MVP)

The convenience shorthand shown above creates and registers plugins internally.

### Auto-Discovery (Phase 2)

Plugins installed as npm packages with a `unified-live-plugin` field in their `package.json` are auto-discovered and registered.

## Plugin Configuration

### YouTube

```ts
new YouTubePlugin({
  apiKey: string;           // Required: YouTube Data API v3 key
  quota?: {
    dailyLimit?: number;    // Default: 10,000. Increase if quota extension approved.
  };
});
```

### Twitch

```ts
// App Access Token (server-side, most common)
new TwitchPlugin({
  clientId: string;         // Required
  clientSecret: string;     // Required
});

// User Access Token (for user-specific operations, Phase 2)
new TwitchPlugin({
  clientId: string;
  clientSecret: string;
  userToken: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
});
```

### TwitCasting

```ts
// Basic Auth (read-only, most common)
new TwitCastingPlugin({
  clientId: string;         // Required
  clientSecret: string;     // Required
});

// Bearer Token (user-specific operations, Phase 2)
new TwitCastingPlugin({
  accessToken: string;
  expiresIn: number;        // ~15,552,000 (180 days)
});
```

## Error Types

```ts
class UnifiedLiveError extends Error {
  platform: string;
  code: string;
}

/** YouTube daily quota exhausted */
class QuotaExhaustedError extends UnifiedLiveError {
  details: {
    consumed: number;
    limit: number;
    resetsAt: Date;
    requestedCost: number;
  };
}

/** Credentials invalid or expired */
class AuthenticationError extends UnifiedLiveError {}

/** Rate limit exceeded after max retries */
class RateLimitError extends UnifiedLiveError {
  retryAfter?: number;
}

/** Platform not registered */
class PlatformNotFoundError extends UnifiedLiveError {}

/** Resource not found on platform */
class NotFoundError extends UnifiedLiveError {}
```

### Error Handling (TBD: D-008)

The error handling strategy is pending a decision (see `docs/domain/decisions.md` D-008):

**Option A: Thrown exceptions** (simpler for SDK consumers)
```ts
try {
  const content = await client.getContent(url);
} catch (e) {
  if (e instanceof QuotaExhaustedError) {
    console.log(`Quota resets at ${e.details.resetsAt}`);
  }
}
```

**Option B: Result type** (explicit, composable)
```ts
const result = await client.getContent(url);
if (result.isErr()) {
  const error = result.error;
  // handle error
}
const content = result.value;
```

## Usage Examples

### Cross-Platform Content Lookup

```ts
const urls = [
  "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "https://twitch.tv/videos/12345",
  "https://twitcasting.tv/user/movie/67890",
];

const contents = await Promise.all(
  urls.map((url) => client.getContent(url)),
);

for (const content of contents) {
  console.log(`[${content.platform}] ${content.title} (${content.type})`);
}
```

### Live Stream to Archive Tracking

```ts
// Get live stream
const live = await client.getContent("https://twitch.tv/shroud");
if (Content.isLive(live)) {
  console.log(`Session: ${live.sessionId}`);

  // Later: find the archive
  const twitch = client.platform("twitch");
  const archive = await twitch.resolveArchive(live);
  if (archive) {
    console.log(`Archive: ${archive.id}, same session: ${archive.sessionId === live.sessionId}`);
  }
}
```

### Paginated Video Listing

```ts
let cursor: string | undefined;
const allVideos: Video[] = [];

do {
  const page = await client.getVideos("youtube", channelId, cursor);
  allVideos.push(...page.items);
  cursor = page.cursor;
} while (cursor);

console.log(`Total: ${allVideos.length} videos`);
```
