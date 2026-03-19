import {
  type BatchResult,
  type Channel,
  type Content,
  type LiveStream,
  NotFoundError,
  type Page,
  type RestManager,
  type SearchOptions,
  UnifiedLiveError,
  type Video,
} from "@unified-live/core";
import {
  toLive,
  toSearchLive,
  type TwitchSearchChannel,
  type TwitchStream,
  type TwitchUser,
  type TwitchVideo,
  toChannel,
  toVideo,
} from "./mapper";

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
 * Fetch active live streams for a Twitch channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - Twitch user ID
 * @returns array of active LiveStream objects (empty if not live)
 * @precondition channelId is a valid Twitch user ID
 * @postcondition returns only streams with type "live"
 */
export const twitchGetLiveStreams = async (
  rest: RestManager,
  channelId: string,
): Promise<LiveStream[]> => {
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
 * @returns paginated list of Video objects
 * @precondition channelId is a valid Twitch user ID
 * @postcondition returns archive-type videos with cursor for next page
 */
export const twitchGetVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize = 20,
): Promise<Page<Video>> => {
  const query: Record<string, string> = {
    user_id: channelId,
    type: "archive",
    first: String(pageSize),
  };
  if (cursor) {
    query.after = cursor;
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
 * Resolve a live stream to its archived video by matching stream_id.
 *
 * @param rest - REST manager for API requests
 * @param live - live stream to check for archive
 * @returns archived Video, or null if no archive found or no sessionId
 * @postcondition returns Video if a matching archive exists, null otherwise
 */
export const twitchResolveArchive = async (
  rest: RestManager,
  live: LiveStream,
): Promise<Video | null> => {
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

const TWITCH_MAX_IDS_PER_REQUEST = 100;

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
export const twitchGetContents = async (
  rest: RestManager,
  ids: string[],
): Promise<BatchResult<Content>> => {
  const values = new Map<string, Content>();
  const errors = new Map<string, UnifiedLiveError>();

  for (let i = 0; i < ids.length; i += TWITCH_MAX_IDS_PER_REQUEST) {
    const chunk = ids.slice(i, i + TWITCH_MAX_IDS_PER_REQUEST);
    const res = await rest.request<TwitchResponse<TwitchVideo>>({
      method: "GET",
      path: "/videos",
      query: { id: chunk.join(",") },
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
 * Search Twitch for live channels matching the given options.
 *
 * @param rest - REST manager for API requests
 * @param options - search options (query, status, limit, cursor)
 * @returns paginated list of Content items (LiveStream for live searches, empty for other statuses)
 * @precondition options.query should be provided for meaningful results
 * @postcondition returns Page with items mapped from Twitch search channel resources
 * @idempotency Safe — read-only API calls
 */
export const twitchSearch = async (
  rest: RestManager,
  options: SearchOptions,
): Promise<Page<Content>> => {
  // Twitch schedule requires broadcaster_id — no general upcoming search
  // Twitch has no general ended/archive search endpoint
  if (options.status === "upcoming" || options.status === "ended") {
    return { items: [], hasMore: false };
  }

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

  const items: Content[] = res.data.data
    .filter((ch) => ch.is_live)
    .map(toSearchLive);

  return {
    items,
    cursor: res.data.pagination?.cursor,
    hasMore: res.data.pagination?.cursor !== undefined,
  };
};
