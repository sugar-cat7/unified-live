import {
  type Archive,
  type BatchResult,
  type Broadcast,
  type Channel,
  type Clip,
  type ClipOptions,
  type Content,
  NotFoundError,
  Page,
  type RestManager,
  type SearchOptions,
  UnifiedLiveError,
} from "@unified-live/core";
import {
  toClip,
  toLive,
  toSearchLive,
  type TwitchClip,
  type TwitchSearchChannel,
  type TwitchStream,
  type TwitchUser,
  type TwitchVideo,
  toChannel,
  toVideo,
} from "./mapper";

/** Twitch-specific video query options. */
export type TwitchVideoOptions = {
  period?: "all" | "day" | "week" | "month";
  sort?: "time" | "trending" | "views";
  videoType?: "archive" | "highlight" | "upload";
};

const NUMERIC_ID = /^\d+$/;

type TwitchResponse<T> = {
  data: T[];
  pagination?: { cursor?: string };
};

/**
 * Fetch a Twitch video by ID and map to unified Content.
 *
 * @param rest - REST manager for API requests
 * @param id - Twitch video ID
 * @returns unified Content (Video)
 * @throws NotFoundError if video does not exist
 * @precondition id is a valid Twitch video ID
 * @postcondition returns Content mapped from the Twitch video resource
 */
export const twitchGetContent = async (rest: RestManager, id: string): Promise<Content> => {
  const res = await rest.request<TwitchResponse<TwitchVideo>>({
    method: "GET",
    path: "/videos",
    query: { id },
    bucketId: "videos",
  });

  const item = res.data.data[0];
  if (!item) {
    throw new NotFoundError("twitch", id);
  }

  return toVideo(item);
};

/**
 * Fetch a Twitch channel by numeric ID or login name and map to unified Channel.
 *
 * @param rest - REST manager for API requests
 * @param id - Twitch user ID (numeric) or login name
 * @returns unified Channel
 * @throws NotFoundError if user does not exist
 * @precondition id is a valid Twitch user ID or login name
 * @postcondition returns Channel mapped from the Twitch user resource
 */
export const twitchGetChannel = async (rest: RestManager, id: string): Promise<Channel> => {
  const query: Record<string, string> = {};

  // Numeric IDs use id param, login names use login param
  if (NUMERIC_ID.test(id)) {
    query.id = id;
  } else {
    query.login = id;
  }

  const res = await rest.request<TwitchResponse<TwitchUser>>({
    method: "GET",
    path: "/users",
    query,
    bucketId: "users",
  });

  const item = res.data.data[0];
  if (!item) {
    throw new NotFoundError("twitch", id);
  }

  return toChannel(item);
};

/**
 * Fetch active broadcasts for a Twitch channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - Twitch user ID
 * @returns array of active Broadcast objects (empty if not live)
 * @precondition channelId is a valid Twitch user ID
 * @postcondition returns Broadcast objects (type === "broadcast"); Twitch API is filtered on stream.type === "live"
 */
export const twitchListBroadcasts = async (
  rest: RestManager,
  channelId: string,
): Promise<Broadcast[]> => {
  const res = await rest.request<TwitchResponse<TwitchStream>>({
    method: "GET",
    path: "/streams",
    query: { user_id: channelId },
    bucketId: "streams",
  });

  return res.data.data.filter((s) => s.type === "live").map(toLive);
};

/**
 * Fetch paginated archive videos for a Twitch channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - Twitch user ID
 * @param cursor - optional pagination cursor
 * @param pageSize - number of items per page (default 20)
 * @param options - optional Twitch-specific video query options (period, sort, videoType)
 * @returns paginated list of Archive objects
 * @precondition channelId is a valid Twitch user ID
 * @postcondition returns archives with cursor for next page; defaults to archive type when no videoType specified
 */
export const twitchListArchives = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize = 20,
  options?: TwitchVideoOptions,
): Promise<Page<Archive>> => {
  const query: Record<string, string> = {
    user_id: channelId,
    type: options?.videoType ?? "archive",
    first: String(pageSize),
  };
  if (cursor) {
    query.after = cursor;
  }
  if (options?.period) {
    query.period = options.period;
  }
  if (options?.sort) {
    query.sort = options.sort;
  }

  const res = await rest.request<TwitchResponse<TwitchVideo>>({
    method: "GET",
    path: "/videos",
    query,
    bucketId: "videos",
  });

  return {
    items: res.data.data.map(toVideo),
    cursor: res.data.pagination?.cursor,
    hasMore: res.data.pagination?.cursor !== undefined,
  };
};

/**
 * Resolve a broadcast to its archived video by matching stream_id.
 *
 * @param rest - REST manager for API requests
 * @param live - broadcast to check for archive
 * @returns archived Archive, or null if no archive found or no sessionId
 * @postcondition returns Archive if a matching archive exists, null otherwise
 */
export const twitchResolveArchive = async (
  rest: RestManager,
  live: Broadcast,
): Promise<Archive | null> => {
  if (!live.sessionId) return null;

  const res = await rest.request<TwitchResponse<TwitchVideo>>({
    method: "GET",
    path: "/videos",
    query: {
      user_id: live.channel.id,
      type: "archive",
      first: "20",
    },
    bucketId: "videos",
  });

  const match = res.data.data.find((v) => v.stream_id === live.sessionId);
  return match ? toVideo(match) : null;
};

const TWITCH_CHUNK_SIZE = 100;

/**
 * Batch-fetch Twitch videos by IDs and map to unified Content.
 *
 * @param rest - REST manager for API requests
 * @param ids - array of Twitch video IDs
 * @returns BatchResult with values for found videos and NotFoundError for missing IDs
 * @precondition each id is a valid Twitch video ID
 * @postcondition values contains Content for each found video; errors contains NotFoundError for each missing ID
 * @idempotency Safe — read-only API calls
 */
export const twitchBatchGetContents = async (
  rest: RestManager,
  ids: string[],
): Promise<BatchResult<Content>> => {
  const values = new Map<string, Content>();
  const errors = new Map<string, UnifiedLiveError>();

  for (let i = 0; i < ids.length; i += TWITCH_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + TWITCH_CHUNK_SIZE);
    const res = await rest.request<TwitchResponse<TwitchVideo>>({
      method: "GET",
      path: "/videos",
      query: { id: chunk },
      bucketId: "videos",
    });

    const returnedIds = new Set<string>();
    for (const item of res.data.data) {
      if (item.id) {
        values.set(item.id, toVideo(item));
        returnedIds.add(item.id);
      }
    }

    for (const id of chunk) {
      if (!returnedIds.has(id)) {
        errors.set(id, new NotFoundError("twitch", id));
      }
    }
  }

  return { values, errors };
};

/**
 * Batch-fetch broadcasts for multiple Twitch channels in a single API call.
 *
 * @param rest - REST manager for API requests
 * @param channelIds - array of Twitch user IDs
 * @returns BatchResult with Broadcast[] per channel (empty array if not live); errors map is empty (API-level errors throw)
 * @precondition each channelId is a valid Twitch user ID
 * @postcondition values contains Broadcast[] for every requested channelId (empty if offline)
 * @idempotency Safe — read-only API calls
 */
export const twitchBatchGetBroadcasts = async (
  rest: RestManager,
  channelIds: string[],
): Promise<BatchResult<Broadcast[]>> => {
  const values = new Map<string, Broadcast[]>();
  const errors = new Map<string, UnifiedLiveError>();

  // Initialize all channels as empty (no broadcasts)
  for (const id of channelIds) {
    values.set(id, []);
  }

  for (let i = 0; i < channelIds.length; i += TWITCH_CHUNK_SIZE) {
    const chunk = channelIds.slice(i, i + TWITCH_CHUNK_SIZE);
    const res = await rest.request<TwitchResponse<TwitchStream>>({
      method: "GET",
      path: "/streams",
      query: { user_id: chunk, type: "live" },
      bucketId: "streams",
    });

    // Group broadcasts by user_id
    for (const stream of res.data.data) {
      const existing = values.get(stream.user_id) ?? [];
      existing.push(toLive(stream));
      values.set(stream.user_id, existing);
    }
  }

  return { values, errors };
};

/**
 * Search Twitch for live channels matching the given options.
 *
 * @param rest - REST manager for API requests
 * @param options - search options (query, status, limit, cursor)
 * @returns paginated list of Content items (Broadcast for live searches, empty for other statuses)
 * @precondition options.query should be provided for meaningful results
 * @postcondition returns Page with items mapped from Twitch search channel resources
 * @idempotency Safe — read-only API calls
 */
export const twitchSearch = async (
  rest: RestManager,
  options: SearchOptions,
): Promise<Page<Content>> => {
  // Twitch schedule requires broadcaster_id — no general upcoming search
  if (options.status === "upcoming") return Page.empty<Content>();

  // channelId-based search: use direct endpoints (no /search/channels needed)
  if (options.channelId && !options.query) {
    if (options.status === "ended") {
      const res = await rest.request<TwitchResponse<TwitchVideo>>({
        method: "GET",
        path: "/videos",
        query: { user_id: options.channelId, type: "archive", first: String(options.limit ?? 20) },
        bucketId: "videos",
      });
      return { items: res.data.data.map(toVideo), hasMore: false };
    }
    // Default or status=live: fetch broadcasts for this channel
    const res = await rest.request<TwitchResponse<TwitchStream>>({
      method: "GET",
      path: "/streams",
      query: { user_id: options.channelId, type: "live" },
      bucketId: "streams",
    });
    return { items: res.data.data.map(toLive), hasMore: false };
  }

  // status=ended without channelId: no general ended search
  if (options.status === "ended") return Page.empty<Content>();

  // Twitch /search/channels only returns meaningful Content when filtered to live channels.
  // Without live_only, results are channels (not broadcasts/archives) which don't map to Content.
  if (!options.query) return Page.empty<Content>();

  const query: Record<string, string> = {
    live_only: "true",
  };

  if (options.query) query.query = options.query;
  if (options.limit) query.first = String(options.limit);
  if (options.cursor) query.after = options.cursor;

  const res = await rest.request<TwitchResponse<TwitchSearchChannel>>({
    method: "GET",
    path: "/search/channels",
    query,
    bucketId: "search",
  });

  const items: Content[] = res.data.data.filter((ch) => ch.is_live).map(toSearchLive);

  return {
    items,
    cursor: res.data.pagination?.cursor,
    hasMore: res.data.pagination?.cursor !== undefined,
  };
};

/**
 * Fetch paginated clips for a Twitch channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - Twitch broadcaster ID
 * @param options - optional clip query options (date range, pagination, featured filter)
 * @returns paginated list of Clip objects
 * @precondition channelId is a valid Twitch broadcaster ID
 * @postcondition returns clips with cursor for next page
 * @idempotency Safe — read-only API calls
 */
export const twitchListClips = async (
  rest: RestManager,
  channelId: string,
  options?: ClipOptions,
): Promise<Page<Clip>> => {
  const query: Record<string, string> = { broadcaster_id: channelId };
  if (options?.startedAt) query.started_at = options.startedAt.toISOString();
  if (options?.endedAt) query.ended_at = options.endedAt.toISOString();
  if (options?.limit) query.first = String(options.limit);
  if (options?.cursor) query.after = options.cursor;
  if (options?.isFeatured !== undefined) query.is_featured = String(options.isFeatured);

  const res = await rest.request<TwitchResponse<TwitchClip>>({
    method: "GET",
    path: "/clips",
    query,
    bucketId: "clips",
  });

  return {
    items: res.data.data.map(toClip),
    cursor: res.data.pagination?.cursor,
    hasMore: res.data.pagination?.cursor !== undefined,
  };
};

/**
 * Batch-fetch Twitch clips by IDs and map to unified Clip.
 *
 * @param rest - REST manager for API requests
 * @param ids - array of Twitch clip IDs
 * @returns BatchResult with values for found clips and NotFoundError for missing IDs
 * @precondition each id is a valid Twitch clip ID
 * @postcondition values contains Clip for each found clip; errors contains NotFoundError for each missing ID
 * @idempotency Safe — read-only API calls
 */
export const twitchBatchGetClips = async (
  rest: RestManager,
  ids: string[],
): Promise<BatchResult<Clip>> => {
  const values = new Map<string, Clip>();
  const errors = new Map<string, UnifiedLiveError>();

  for (let i = 0; i < ids.length; i += TWITCH_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + TWITCH_CHUNK_SIZE);
    const res = await rest.request<TwitchResponse<TwitchClip>>({
      method: "GET",
      path: "/clips",
      query: { id: chunk },
      bucketId: "clips",
    });

    const returnedIds = new Set<string>();
    for (const item of res.data.data) {
      values.set(item.id, toClip(item));
      returnedIds.add(item.id);
    }

    for (const id of chunk) {
      if (!returnedIds.has(id)) {
        errors.set(id, new NotFoundError("twitch", id));
      }
    }
  }

  return { values, errors };
};
