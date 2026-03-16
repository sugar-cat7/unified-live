---
title: Examples
---

Practical code recipes for common unified-live tasks, from basic usage to advanced patterns.

## Basic

### Get Content from a URL

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";

const client = UnifiedClient.create({
  plugins: [createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! })],
});

const content = await client.getContent("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
console.log(content.title, content.type); // "live" or "video"

client[Symbol.dispose]();
```

### Error Handling

```ts
import { UnifiedLiveError, NotFoundError, RateLimitError } from "@unified-live/core";

try {
  const content = await client.getContent("https://www.youtube.com/watch?v=invalid");
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Rate limited — retry after ${err.retryAfter}s`);
  } else if (err instanceof NotFoundError) {
    console.log(`Not found: ${err.message}`);
  } else if (err instanceof UnifiedLiveError) {
    console.log(`SDK error [${err.code}]: ${err.message}`);
  } else {
    throw err; // re-throw non-SDK errors
  }
}
```

### List Live Streams for a Channel

```ts
const streams = await client.getLiveStreams("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw");

for (const stream of streams) {
  console.log(`${stream.title} — ${stream.viewerCount} viewers`);
}
```

### Paginate Through Videos

```ts
let cursor: string | undefined;

do {
  const page = await client.getVideos("twitch", "123456", cursor);
  for (const video of page.items) {
    console.log(`${video.title} (${video.duration}s)`);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
```

## Intermediate

### Multi-Platform Aggregation

Fetch live streams from YouTube and Twitch in parallel, then merge the results:

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";

const client = UnifiedClient.create({
  plugins: [
    createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

const [ytStreams, twitchStreams] = await Promise.all([
  client.getLiveStreams("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw"),
  client.getLiveStreams("twitch", "twitchdev"),
]);

const allStreams = [...ytStreams, ...twitchStreams].sort((a, b) => b.viewerCount - a.viewerCount);

console.log(`${allStreams.length} streams across platforms`);

client[Symbol.dispose]();
```

### Live Stream Monitor

Poll for new live streams at a regular interval:

```ts
const seen = new Set<string>();

const poll = async () => {
  const streams = await client.getLiveStreams("twitch", "twitchdev");
  for (const stream of streams) {
    if (!seen.has(stream.id)) {
      seen.add(stream.id);
      console.log(`🔴 New stream: ${stream.title}`);
    }
  }
};

const interval = setInterval(poll, 60_000); // every 60 seconds
await poll(); // initial check

// Cleanup
clearInterval(interval);
client[Symbol.dispose]();
```

### Type-Safe Content Branching

Use the `Content` type guards for safe narrowing:

```ts
import { Content } from "@unified-live/core";

const content = await client.getContent("https://www.youtube.com/watch?v=abc123");

if (Content.isLive(content)) {
  // TypeScript knows: content is LiveStream
  console.log(`Live: ${content.viewerCount} viewers since ${content.startedAt}`);
} else if (Content.isVideo(content)) {
  // TypeScript knows: content is Video
  console.log(`Video: ${content.duration}s, ${content.viewCount} views`);
}
```

## Advanced

### OpenTelemetry Integration

unified-live emits OpenTelemetry spans for every API call. Connect them to Jaeger or any OTel-compatible backend:

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { UnifiedClient } from "@unified-live/core";
import { createTwitchPlugin } from "@unified-live/twitch";

// 1. Initialize OpenTelemetry
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
  }),
});
sdk.start();

// 2. Use unified-live as normal — spans are emitted automatically
const client = UnifiedClient.create({
  plugins: [
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

const content = await client.getContent("https://www.twitch.tv/videos/123456");
// A span "unified-live.rest twitch GET /videos" is sent to your collector

client[Symbol.dispose]();
await sdk.shutdown();
```

### Mock Plugin for Testing

Create a lightweight plugin for unit tests without hitting real APIs:

```ts
import {
  PlatformPlugin,
  type Content,
  type Channel,
  type Page,
  type Video,
  type LiveStream,
} from "@unified-live/core";

const mockContent: Content = {
  id: "test-1",
  platform: "mock",
  type: "video",
  title: "Test Video",
  url: "https://example.com/video/test-1",
  thumbnail: { url: "https://example.com/thumb.jpg", width: 320, height: 180 },
  channel: { id: "ch-1", name: "Test Channel", url: "https://example.com/channel/ch-1" },
  duration: 120,
  viewCount: 1000,
  publishedAt: new Date("2024-01-01"),
  raw: {},
};

const mockPlugin: PlatformPlugin = {
  name: "mock",
  rest: {} as any, // not used in mock
  capabilities: {
    supportsLiveStreams: true,
    supportsArchiveResolution: false,
    authModel: "apiKey",
    rateLimitModel: "tokenBucket",
  },
  match: (url) =>
    url.includes("example.com") ? { platform: "mock", type: "content", id: "test-1" } : null,
  resolveUrl: (url) =>
    url.includes("example.com") ? { platform: "mock", type: "content", id: "test-1" } : null,
  getContent: async () => mockContent,
  getChannel: async () => ({
    id: "ch-1",
    platform: "mock",
    name: "Test Channel",
    url: "https://example.com/channel/ch-1",
  }),
  getLiveStreams: async () => [],
  getVideos: async () => ({ items: [mockContent as Video], hasMore: false }),
  [Symbol.dispose]: () => {},
};

// Use in tests
const client = UnifiedClient.create({ plugins: [mockPlugin] });
const content = await client.getContent("https://example.com/video/test-1");
expect(content.title).toBe("Test Video");
```

## Next Steps

- [Creating a Plugin](../creating-a-plugin/) — Build your own platform plugin
- [Error Handling](../error-handling/) — Handle API errors gracefully
- [Core Concepts](../core-concepts/) — Understand the type system
