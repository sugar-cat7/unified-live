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

export const contentSchema = z.discriminatedUnion("type", [liveStreamSchema, videoSchema]);

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
  hasMore: boolean;
};

/**
 * Companion object for the Page type.
 * Provides transformation and factory utilities.
 *
 * @example
 * ```ts
 * const mapped = Page.map(page, (item) => item.id);
 * const empty = Page.empty<Video>();
 * ```
 */
export const Page = {
  /**
   * Transform items in a page while preserving pagination metadata.
   *
   * @param page - the source page
   * @param fn - mapping function applied to each item
   * @returns a new Page with transformed items
   * @postcondition cursor, total, and hasMore are preserved
   * @idempotency Safe — pure function
   */
  map: <T, U>(page: Page<T>, fn: (item: T) => U): Page<U> => ({
    items: page.items.map(fn),
    cursor: page.cursor,
    total: page.total,
    hasMore: page.hasMore,
  }),

  /**
   * Create an empty page with no items.
   *
   * @returns an empty Page with hasMore=false
   * @idempotency Safe — pure function
   */
  empty: <T>(): Page<T> => ({
    items: [],
    hasMore: false,
  }),

} as const;

export const resolvedUrlSchema = z.object({
  platform: z.string().check(z.minLength(1)),
  type: z.enum(["content", "channel"]),
  id: z.string().check(z.minLength(1)),
});

export type ResolvedUrl = z.infer<typeof resolvedUrlSchema>;

/**
 * Companion object for the LiveStream type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (LiveStream.is(value)) { ... }
 * ```
 */
export const LiveStream = {
  /**
   * Structural type guard for LiveStream.
   *
   * @param value - the value to check
   * @returns true if value has the LiveStream shape (type === "live")
   */
  is: (value: unknown): value is LiveStream => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return obj.type === "live" && typeof obj.id === "string" && typeof obj.platform === "string";
  },
} as const;

/**
 * Companion object for the Video type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (Video.is(value)) { ... }
 * ```
 */
export const Video = {
  /**
   * Structural type guard for Video.
   *
   * @param value - the value to check
   * @returns true if value has the Video shape (type === "video")
   */
  is: (value: unknown): value is Video => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return obj.type === "video" && typeof obj.id === "string" && typeof obj.platform === "string";
  },
} as const;

/**
 * Companion object for the Channel type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (Channel.is(value)) { ... }
 * ```
 */
export const Channel = {
  /**
   * Structural type guard for Channel.
   *
   * @param value - the value to check
   * @returns true if value has the Channel shape
   */
  is: (value: unknown): value is Channel => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      typeof obj.id === "string" && typeof obj.platform === "string" && typeof obj.name === "string"
    );
  },
} as const;

/**
 * Companion object for the BroadcastSession type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (BroadcastSession.is(value)) { ... }
 * ```
 */
export const BroadcastSession = {
  /**
   * Structural type guard for BroadcastSession.
   *
   * @param value - the value to check
   * @returns true if value has the BroadcastSession shape
   */
  is: (value: unknown): value is BroadcastSession => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return typeof obj.sessionId === "string" && typeof obj.platform === "string";
  },
} as const;

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
