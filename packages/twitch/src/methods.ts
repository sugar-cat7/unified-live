import {
  type Channel,
  type Content,
  type LiveStream,
  NotFoundError,
  type Page,
  type RestManager,
  type Video,
} from "@unified-live/core";
import {
  toLive,
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
