# 01: Type Definitions

Package location: `packages/core/src/types.ts`

## Type Schemas

### ContentBase (shared fields)

```ts
import { z } from "zod";

export const thumbnailSchema = z.object({
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const channelRefSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  url: z.string().url(),
});

const contentBaseSchema = z.object({
  id: z.string().min(1),
  platform: z.string().min(1),
  title: z.string(),
  url: z.string().url(),
  thumbnail: thumbnailSchema,
  channel: channelRefSchema,
  sessionId: z.string().optional(),
  raw: z.unknown(),
});
```

### LiveStream

```ts
export const liveStreamSchema = contentBaseSchema.extend({
  type: z.literal("live"),
  viewerCount: z.number().int().nonnegative(),
  startedAt: z.date(),
});

export type LiveStream = z.infer<typeof liveStreamSchema>;
```

### Video

```ts
export const videoSchema = contentBaseSchema.extend({
  type: z.literal("video"),
  duration: z.number().nonnegative(),
  viewCount: z.number().int().nonnegative(),
  publishedAt: z.date(),
});

export type Video = z.infer<typeof videoSchema>;
```

### Content (Discriminated Union)

```ts
export const contentSchema = z.discriminatedUnion("type", [liveStreamSchema, videoSchema]);

export type Content = z.infer<typeof contentSchema>;
```

### Channel

```ts
export const channelSchema = z.object({
  id: z.string().min(1),
  platform: z.string().min(1),
  name: z.string(),
  url: z.string().url(),
  thumbnail: thumbnailSchema.optional(),
});

export type Channel = z.infer<typeof channelSchema>;
```

### BroadcastSession

```ts
export const broadcastSessionSchema = z.object({
  sessionId: z.string().min(1),
  platform: z.string().min(1),
  channel: channelRefSchema,
  startedAt: z.date(),
  endedAt: z.date().optional(),
  contentIds: z.object({
    liveId: z.string().optional(),
    archiveId: z.string().optional(),
  }),
});

export type BroadcastSession = z.infer<typeof broadcastSessionSchema>;
```

### Page\<T>

```ts
export type Page<T> = {
  items: T[];
  cursor?: string;
  total?: number;
};
```

### ResolvedUrl

```ts
export const resolvedUrlSchema = z.object({
  platform: z.string().min(1),
  type: z.enum(["content", "channel"]),
  id: z.string().min(1),
});

export type ResolvedUrl = z.infer<typeof resolvedUrlSchema>;
```

## Type Guards

```ts
export const Content = {
  isLive: (content: Content): content is LiveStream => content.type === "live",
  isVideo: (content: Content): content is Video => content.type === "video",
} as const;
```

## Session Tracking: sessionId Mapping

| Platform    | Live Content                  | Archive Content              | sessionId Source                                             |
| ----------- | ----------------------------- | ---------------------------- | ------------------------------------------------------------ |
| YouTube     | `id = "dQw4w9WgXcQ"`          | `id = "dQw4w9WgXcQ"`         | `sessionId = id` (same for both)                             |
| Twitch      | `id = "44567123"` (stream_id) | `id = "11223344"` (video_id) | `sessionId = stream.id` (live) / `video.stream_id` (archive) |
| TwitCasting | `id = "789012"` (movie_id)    | `id = "789012"` (movie_id)   | `sessionId = id` (same for both)                             |

### Plugin Mapping Examples

**YouTube**: `sessionId` is always `id` because YouTube uses the same ID for live and archive.

```ts
function toContent(raw: YTVideo): Content {
  return {
    id: raw.id!,
    sessionId: raw.id!,
    // ...
  };
}
```

**Twitch (Live)**: `sessionId` is the `stream.id`.

```ts
function streamToLive(raw: TwitchStream): LiveStream {
  return {
    id: raw.id, // stream_id
    sessionId: raw.id, // stream_id
    // ...
  };
}
```

**Twitch (Archive)**: `sessionId` is `video.stream_id`, which links back to the original stream.

```ts
function videoToVideo(raw: TwitchVideo): Video {
  return {
    id: raw.id, // video_id (different from stream_id)
    sessionId: raw.stream_id, // links back to the stream
    // ...
  };
}
```

**TwitCasting**: `sessionId` is always `id` because TwitCasting uses the same movie ID for live and archive.

```ts
function movieToContent(raw: TCMovie): Content {
  return {
    id: raw.id,
    sessionId: raw.id,
    // ...
  };
}
```

## Constraints

1. **Content discrimination**: `type` is the discriminant. Consumers use type guard functions `Content.isLive()` / `Content.isVideo()` for type-safe narrowing.
2. **sessionId availability**: `sessionId` is optional. It's undefined when the platform doesn't support session tracking (future platforms).
3. **raw preservation**: `raw` always contains the original platform API response, enabling consumers to access platform-specific fields not included in the unified model.
4. **Page cursor**: `cursor` is undefined for the last page. Consumers iterate by calling with the returned cursor until `cursor` is undefined.
5. **Thumbnail dimensions**: Required for all Content. Plugins should use the best available thumbnail size from the platform API.
