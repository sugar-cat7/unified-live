import type { UnifiedLiveError } from "./errors";

/**
 * Image thumbnail with URL and positive integer dimensions.
 *
 * @category Types
 */
export type Thumbnail = {
  url: string;
  width: number;
  height: number;
};

/**
 * Lightweight channel reference embedded in content objects.
 *
 * @category Types
 */
export type ChannelRef = {
  id: string;
  name: string;
  url: string;
};

type ContentBase = {
  id: string;
  platform: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  thumbnail: Thumbnail;
  channel: ChannelRef;
  sessionId?: string;
  raw: unknown;
  languageCode?: string;
};

/**
 * A currently-active broadcast on any supported platform.
 * Discriminated by `type: "broadcast"`. Use `Content.isBroadcast()` to narrow from Content.
 *
 * @category Types
 */
export type Broadcast = ContentBase & {
  type: "broadcast";
  viewerCount: number;
  startedAt: Date;
  endedAt?: Date;
};

/**
 * An archived broadcast recording on any supported platform.
 * Discriminated by `type: "archive"`. Use `Content.isArchive()` to narrow from Content.
 *
 * @category Types
 */
export type Archive = ContentBase & {
  type: "archive";
  duration: number;
  viewCount: number;
  publishedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
};

/**
 * A scheduled (upcoming) broadcast on any supported platform.
 * Discriminated by `type: "scheduled"`. Use `Content.isScheduledBroadcast()` to narrow from Content.
 *
 * @category Types
 */
export type ScheduledBroadcast = ContentBase & {
  type: "scheduled";
  scheduledStartAt: Date;
};

/**
 * A short clip extracted from a broadcast or archive on any supported platform.
 * Discriminated by `type: "clip"`. Use `Content.isClip()` to narrow from Content.
 *
 * @category Types
 */
export type Clip = ContentBase & {
  type: "clip";
  duration: number;
  viewCount: number;
  createdAt: Date;
  clipCreator?: { id: string; name: string };
  embedUrl?: string;
  vodOffset?: number;
  isFeatured?: boolean;
  gameId?: string;
};

/**
 * A piece of content (broadcast, archive, scheduled broadcast, or clip) on any supported platform.
 * Use `Content.isBroadcast()` / `Content.isArchive()` / `Content.isScheduledBroadcast()` / `Content.isClip()` to narrow.
 *
 * @category Types
 */
export type Content = Broadcast | Archive | ScheduledBroadcast | Clip;

/**
 * A streaming channel or user account on any supported platform.
 *
 * @category Types
 */
export type Channel = {
  id: string;
  platform: string;
  name: string;
  url: string;
  thumbnail?: Thumbnail;
  description?: string;
  subscriberCount?: number;
  publishedAt?: Date;
};

/**
 * Links a broadcast to its eventual archive.
 * `contentIds` maps between the broadcast ID and archive ID.
 *
 * @category Types
 */
export type BroadcastSession = {
  sessionId: string;
  platform: string;
  channel: ChannelRef;
  startedAt: Date;
  endedAt?: Date;
  contentIds: {
    broadcastId?: string;
    archiveId?: string;
  };
};

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

/**
 * Options for search operations across platforms.
 * All fields are optional at the type level, but `UnifiedClient.search()`
 * requires at least one of `query`, `status`, or `channelId` to be provided.
 *
 * @category Types
 */
export type SearchOptions = {
  query?: string;
  status?: "live" | "upcoming" | "ended";
  channelId?: string;
  order?: "relevance" | "date" | "rating" | "title" | "videoCount" | "viewCount";
  limit?: number;
  cursor?: string;
  safeSearch?: "moderate" | "none" | "strict";
  languageCode?: string;
};

/**
 * Options for clip retrieval operations.
 *
 * @category Types
 */
export type ClipOptions = {
  startedAt?: Date;
  endedAt?: Date;
  limit?: number;
  cursor?: string;
  isFeatured?: boolean;
};

/**
 * Known supported platform identifiers.
 *
 * @category Types
 */
export const knownPlatforms = ["youtube", "twitch", "twitcasting"] as const;

/**
 * A known supported platform identifier.
 *
 * @category Types
 */
export type KnownPlatform = (typeof knownPlatforms)[number];

/**
 * Result of resolving a platform URL without network calls.
 * Contains detected platform, resource type, and platform-specific ID.
 *
 * @category Types
 */
export type ResolvedUrl = {
  platform: string;
  type: "content" | "channel";
  id: string;
};

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
    return obj.type === "archive" && typeof obj.id === "string" && typeof obj.platform === "string";
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
