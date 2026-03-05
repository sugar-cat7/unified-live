import { z } from "zod/v4";

export const thumbnailSchema = z.object({
  url: z.url(),
  width: z.int().check(z.positive()),
  height: z.int().check(z.positive()),
});

export const channelRefSchema = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string(),
  url: z.url(),
});

const contentBaseSchema = z.object({
  id: z.string().check(z.minLength(1)),
  platform: z.string().check(z.minLength(1)),
  title: z.string(),
  url: z.url(),
  thumbnail: thumbnailSchema,
  channel: channelRefSchema,
  sessionId: z.string().optional(),
  raw: z.unknown(),
});

export const liveStreamSchema = contentBaseSchema.extend({
  type: z.literal("live"),
  viewerCount: z.int().check(z.nonnegative()),
  startedAt: z.date(),
});

export type LiveStream = z.infer<typeof liveStreamSchema>;

export const videoSchema = contentBaseSchema.extend({
  type: z.literal("video"),
  duration: z.number().check(z.nonnegative()),
  viewCount: z.int().check(z.nonnegative()),
  publishedAt: z.date(),
});

export type Video = z.infer<typeof videoSchema>;

export const contentSchema = z.discriminatedUnion("type", [
  liveStreamSchema,
  videoSchema,
]);

export type Content = z.infer<typeof contentSchema>;

export const channelSchema = z.object({
  id: z.string().check(z.minLength(1)),
  platform: z.string().check(z.minLength(1)),
  name: z.string(),
  url: z.url(),
  thumbnail: thumbnailSchema.optional(),
});

export type Channel = z.infer<typeof channelSchema>;

export const broadcastSessionSchema = z.object({
  sessionId: z.string().check(z.minLength(1)),
  platform: z.string().check(z.minLength(1)),
  channel: channelRefSchema,
  startedAt: z.date(),
  endedAt: z.date().optional(),
  contentIds: z.object({
    liveId: z.string().optional(),
    archiveId: z.string().optional(),
  }),
});

export type BroadcastSession = z.infer<typeof broadcastSessionSchema>;

export type Page<T> = {
  items: T[];
  cursor?: string;
  total?: number;
};

export const resolvedUrlSchema = z.object({
  platform: z.string().check(z.minLength(1)),
  type: z.enum(["content", "channel"]),
  id: z.string().check(z.minLength(1)),
});

export type ResolvedUrl = z.infer<typeof resolvedUrlSchema>;

/**
 * Type guard namespace for Content discriminated union.
 *
 * @precondition content must be a valid Content value
 * @postcondition narrows to LiveStream or Video
 */
export const Content = {
  isLive: (content: Content): content is LiveStream => content.type === "live",
  isVideo: (content: Content): content is Video => content.type === "video",
} as const;
