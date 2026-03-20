import { z } from "zod/v4";

import type { UnifiedLiveError } from "./errors";

/**
 * Image thumbnail with validated URL and positive integer dimensions.
 *
 * @category Types
 */
export const thumbnailSchema = z.object({
  url: z.url(),
  width: z.int().check(z.positive()),
  height: z.int().check(z.positive()),
});

/**
 * Lightweight channel reference embedded in content objects.
 *
 * @category Types
 */
export const channelRefSchema = z.object({
  id: z.string().check(z.minLength(1)),
  name: z.string(),
  url: z.url(),
});

const contentBaseSchema = z.object({
  id: z.string().check(z.minLength(1)),
  platform: z.string().check(z.minLength(1)),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  url: z.url(),
  thumbnail: thumbnailSchema,
  channel: channelRefSchema,
  sessionId: z.string().optional(),
  raw: z.unknown(),
  languageCode: z.string().optional(),
});

/**
 * Zod schema for a currently-active broadcast.
 * Validates viewer count (non-negative) and start time.
 *
 * @category Types
 */
export const broadcastSchema = contentBaseSchema.extend({
  type: z.literal("broadcast"),
  viewerCount: z.int().check(z.nonnegative()),
  startedAt: z.date(),
  endedAt: z.date().optional(),
});

/**
 * A currently-active broadcast on any supported platform.
 * Discriminated by `type: "broadcast"`. Use `Content.isBroadcast()` to narrow from Content.
 *
 * @category Types
 */
export type Broadcast = z.infer<typeof broadcastSchema>;

/**
 * Zod schema for an archived or uploaded video.
 * Validates duration, view count, and publish date.
 *
 * @category Types
 */
export const archiveSchema = contentBaseSchema.extend({
  type: z.literal("archive"),
  duration: z.number().check(z.nonnegative()),
  viewCount: z.int().check(z.nonnegative()),
  publishedAt: z.date(),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
});

/**
 * An archived or uploaded video on any supported platform.
 * Discriminated by `type: "archive"`. Use `Content.isArchive()` to narrow from Content.
 *
 * @category Types
 */
export type Archive = z.infer<typeof archiveSchema>;

/**
 * Zod schema for a scheduled (upcoming) broadcast.
 * Validates the scheduled start time.
 *
 * @category Types
 */
export const scheduledBroadcastSchema = contentBaseSchema.extend({
  type: z.literal("scheduled"),
  scheduledStartAt: z.date(),
});

/**
 * A scheduled (upcoming) broadcast on any supported platform.
 * Discriminated by `type: "scheduled"`. Use `Content.isScheduledBroadcast()` to narrow from Content.
 *
 * @category Types
 */
export type ScheduledBroadcast = z.infer<typeof scheduledBroadcastSchema>;

/**
 * Zod schema for a short clip extracted from a stream or video.
 * Validates duration (non-negative), view count, and creation date.
 *
 * @category Types
 */
export const clipSchema = contentBaseSchema.extend({
  type: z.literal("clip"),
  duration: z.number().check(z.nonnegative()),
  viewCount: z.int().check(z.nonnegative()),
  createdAt: z.date(),
  clipCreator: z.object({ id: z.string(), name: z.string() }).optional(),
  embedUrl: z.url().optional(),
  vodOffset: z.int().optional(),
  isFeatured: z.boolean().optional(),
  gameId: z.string().optional(),
});

/**
 * A short clip extracted from a stream or video on any supported platform.
 * Discriminated by `type: "clip"`. Use `Content.isClip()` to narrow from Content.
 *
 * @category Types
 */
export type Clip = z.infer<typeof clipSchema>;

/**
 * Discriminated union schema for content. Discriminates on `type` field.
 * Covers broadcasts, archives, scheduled broadcasts, and clips.
 *
 * @category Types
 */
export const contentSchema = z.discriminatedUnion("type", [
  broadcastSchema,
  archiveSchema,
  scheduledBroadcastSchema,
  clipSchema,
]);

/**
 * A piece of content (broadcast, archive, scheduled broadcast, or clip) on any supported platform.
 * Use `Content.isBroadcast()` / `Content.isArchive()` / `Content.isScheduledBroadcast()` / `Content.isClip()` to narrow.
 *
 * @category Types
 */
export type Content = z.infer<typeof contentSchema>;

/**
 * Zod schema for a streaming channel or user account.
 *
 * @category Types
 */
export const channelSchema = z.object({
  id: z.string().check(z.minLength(1)),
  platform: z.string().check(z.minLength(1)),
  name: z.string(),
  url: z.url(),
  thumbnail: thumbnailSchema.optional(),
  description: z.string().optional(),
  subscriberCount: z.int().check(z.nonnegative()).optional(),
  publishedAt: z.date().optional(),
});

/**
 * A streaming channel or user account on any supported platform.
 *
 * @category Types
 */
export type Channel = z.infer<typeof channelSchema>;

/**
 * Zod schema for a broadcast session linking live and archive content.
 *
 * @category Types
 */
export const broadcastSessionSchema = z.object({
  sessionId: z.string().check(z.minLength(1)),
  platform: z.string().check(z.minLength(1)),
  channel: channelRefSchema,
  startedAt: z.date(),
  endedAt: z.date().optional(),
  contentIds: z.object({
    broadcastId: z.string().optional(),
    archiveId: z.string().optional(),
  }),
});

/**
 * Links a broadcast to its eventual archive.
 * `contentIds` maps between the broadcast ID and archive ID.
 *
 * @category Types
 */
export type BroadcastSession = z.infer<typeof broadcastSessionSchema>;

/**
 * Cursor-based pagination wrapper.
 * `hasMore` indicates whether additional pages exist.
 * Pass `cursor` to the next call to fetch the next page.
 *
 * @category Types
 */
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
 * const empty = Page.empty<Archive>();
 * ```
 * @category Types
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

/**
 * Result of a batch operation. Contains successful results and per-item errors.
 * Request-level errors (rate limit, auth) are thrown, not stored here.
 *
 * Exception to Zod-first convention: Map with generic parameter is not representable in Zod.
 *
 * @category Types
 */
export type BatchResult<T> = {
  readonly values: ReadonlyMap<string, T>;
  readonly errors: ReadonlyMap<string, UnifiedLiveError>;
};

/**
 * Companion object for the BatchResult type.
 * Provides factory utilities.
 *
 * @example
 * ```ts
 * const empty = BatchResult.empty<Content>();
 * ```
 * @category Types
 */
export const BatchResult = {
  /**
   * Create an empty BatchResult with no values or errors.
   *
   * @returns an empty BatchResult
   * @idempotency Safe — pure function
   */
  empty: <T>(): BatchResult<T> => ({
    values: new Map(),
    errors: new Map(),
  }),
} as const;

export const searchOptionsSchema = z.object({
  query: z.string().optional(),
  status: z.enum(["live", "upcoming", "ended"]).optional(),
  channelId: z.string().check(z.minLength(1)).optional(),
  order: z.enum(["relevance", "date", "rating", "title", "videoCount", "viewCount"]).optional(),
  limit: z.int().check(z.positive(), z.lte(100)).optional(),
  cursor: z.string().optional(),
  safeSearch: z.enum(["moderate", "none", "strict"]).optional(),
  languageCode: z.string().optional(),
});

/**
 * Options for search operations across platforms.
 * All fields are optional at the schema level, but `UnifiedClient.search()`
 * requires at least one of `query`, `status`, or `channelId` to be provided.
 *
 * @category Types
 */
export type SearchOptions = z.infer<typeof searchOptionsSchema>;

/**
 * Zod schema for clip query options.
 * All fields are optional. `limit` is capped at 100.
 *
 * @category Types
 */
export const clipOptionsSchema = z.object({
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  limit: z.int().check(z.positive(), z.lte(100)).optional(),
  cursor: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

/**
 * Options for clip retrieval operations.
 *
 * @category Types
 */
export type ClipOptions = z.infer<typeof clipOptionsSchema>;

/**
 * Enum schema for known supported platforms.
 *
 * @category Types
 */
export const knownPlatforms = z.enum(["youtube", "twitch", "twitcasting"]);

/**
 * A known supported platform identifier.
 *
 * @category Types
 */
export type KnownPlatform = z.infer<typeof knownPlatforms>;

/**
 * Zod schema for a resolved platform URL.
 *
 * @category Types
 */
export const resolvedUrlSchema = z.object({
  platform: z.string().check(z.minLength(1)),
  type: z.enum(["content", "channel"]),
  id: z.string().check(z.minLength(1)),
});

/**
 * Result of resolving a platform URL without network calls.
 * Contains detected platform, resource type, and platform-specific ID.
 *
 * @category Types
 */
export type ResolvedUrl = z.infer<typeof resolvedUrlSchema>;

/**
 * Companion object for the Broadcast type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (Broadcast.is(value)) { ... }
 * ```
 * @category Types
 */
export const Broadcast = {
  /**
   * Structural type guard for Broadcast.
   *
   * @param value - the value to check
   * @returns true if value has the Broadcast shape (type === "broadcast")
   */
  is: (value: unknown): value is Broadcast => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      obj.type === "broadcast" && typeof obj.id === "string" && typeof obj.platform === "string"
    );
  },
} as const;

/**
 * Companion object for the ScheduledBroadcast type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (ScheduledBroadcast.is(value)) { ... }
 * ```
 * @category Types
 */
export const ScheduledBroadcast = {
  /**
   * Structural type guard for ScheduledBroadcast.
   *
   * @param value - the value to check
   * @returns true if value has the ScheduledBroadcast shape (type === "scheduled")
   */
  is: (value: unknown): value is ScheduledBroadcast => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      obj.type === "scheduled" && typeof obj.id === "string" && typeof obj.platform === "string"
    );
  },
} as const;

/**
 * Companion object for the Archive type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (Archive.is(value)) { ... }
 * ```
 * @category Types
 */
export const Archive = {
  /**
   * Structural type guard for Archive.
   *
   * @param value - the value to check
   * @returns true if value has the Archive shape (type === "archive")
   */
  is: (value: unknown): value is Archive => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
      obj.type === "archive" && typeof obj.id === "string" && typeof obj.platform === "string"
    );
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
 * @category Types
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
 * Companion object for the Clip type.
 * Provides lightweight structural type guard.
 *
 * @example
 * ```ts
 * if (Clip.is(value)) { ... }
 * ```
 * @category Types
 */
export const Clip = {
  /**
   * Structural type guard for Clip.
   *
   * @param value - the value to check
   * @returns true if value has the Clip shape (type === "clip")
   */
  is: (value: unknown): value is Clip => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return obj.type === "clip" && typeof obj.id === "string" && typeof obj.platform === "string";
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
 * @category Types
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
 * @postcondition narrows to Broadcast, Archive, ScheduledBroadcast, or Clip
 * @category Types
 */
export const Content = {
  isBroadcast: (content: Content): content is Broadcast => content.type === "broadcast",
  isScheduledBroadcast: (content: Content): content is ScheduledBroadcast =>
    content.type === "scheduled",
  isArchive: (content: Content): content is Archive => content.type === "archive",
  isClip: (content: Content): content is Clip => content.type === "clip",
} as const;
