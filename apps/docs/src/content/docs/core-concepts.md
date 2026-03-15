---
title: Core Concepts
---

## Content

`Content` is the unified abstraction over live streams and archived videos. It is a discriminated union with `type: "live" | "video"`.

```ts
const content = await client.getContent(url);

if (content.type === "live") {
  console.log(content.viewerCount); // number
  console.log(content.startedAt); // Date
}

if (content.type === "video") {
  console.log(content.duration); // seconds
  console.log(content.viewCount); // number
  console.log(content.publishedAt); // Date
}
```

### Type Guards

Use the `Content` companion object for type narrowing:

```ts
import { Content } from "@unified-live/core";

if (Content.isLive(content)) {
  // content is narrowed to LiveStream
  console.log(content.viewerCount);
}

if (Content.isVideo(content)) {
  // content is narrowed to Video
  console.log(content.duration);
}
```

### Shared Fields

Both `LiveStream` and `Video` share these fields:

| Field       | Type         | Description                                       |
| ----------- | ------------ | ------------------------------------------------- |
| `id`        | `string`     | Platform-specific content ID                      |
| `platform`  | `string`     | `"youtube"`, `"twitch"`, or `"twitcasting"`       |
| `title`     | `string`     | Content title                                     |
| `url`       | `string`     | URL to the content                                |
| `thumbnail` | `Thumbnail`  | Thumbnail image with `url`, `width`, `height`     |
| `channel`   | `ChannelRef` | Channel reference with `id`, `name`, `url`        |
| `sessionId` | `string?`    | Links a live broadcast to its archive (see below) |
| `raw`       | `unknown`    | Original API response for advanced use            |

## Channel

A `Channel` represents a streaming channel or user account:

```ts
const channel = await client.getChannel("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw");

console.log(channel.id); // "UC_x5XG1OV2P6uZZ5FSM9Ttw"
console.log(channel.platform); // "youtube"
console.log(channel.name); // Channel name
console.log(channel.url); // Channel URL
console.log(channel.thumbnail); // Thumbnail (optional)
```

## URL Resolution

The client can auto-detect the platform from a URL:

```ts
// Resolves to the correct platform automatically
const content = await client.getContent("https://www.youtube.com/watch?v=abc123");
const content = await client.getContent("https://www.twitch.tv/videos/123456");
const content = await client.getContent("https://twitcasting.tv/user/movie/123");

// Check without fetching
const resolved = client.match("https://www.youtube.com/watch?v=abc123");
// { platform: "youtube", type: "content", id: "abc123" }

const resolved = client.match("https://www.twitch.tv/username");
// { platform: "twitch", type: "channel", id: "username" }
```

### Supported URL Formats

**YouTube:**

- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/channel/CHANNEL_ID`
- `youtube.com/@handle`
- `youtube.com/live/VIDEO_ID`

**Twitch:**

- `twitch.tv/videos/VIDEO_ID`
- `twitch.tv/USERNAME`

**TwitCasting:**

- `twitcasting.tv/USER_ID/movie/MOVIE_ID`
- `twitcasting.tv/USER_ID`

## Session ID

`sessionId` links a live broadcast to its archive video. On some platforms (YouTube, TwitCasting), the live and archive share the same ID. On Twitch, they have different IDs, but `sessionId` provides a stable link.

```ts
// During live
const live = await client.getContent("https://youtube.com/watch?v=abc123");
console.log(live.sessionId); // "abc123"

// After the stream ends, the archive has the same sessionId
const archive = await client.getContent("https://youtube.com/watch?v=abc123");
console.log(archive.sessionId); // "abc123"
```

## Next Steps

- [Platform Plugins](../platform-plugins/) — How to configure each platform
- [Error Handling](../error-handling/) — Handling errors
