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
  streamToLive,
  type TwitchStream,
  type TwitchUser,
  type TwitchVideo,
  userToChannel,
  videoToVideo,
} from "./mapper";

type TwitchResponse<T> = {
  data: T[];
  pagination?: { cursor?: string };
};

export const twitchGetContent = async (
  rest: RestManager,
  id: string,
): Promise<Content> => {
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

  return videoToVideo(item);
};

export const twitchGetChannel = async (
  rest: RestManager,
  id: string,
): Promise<Channel> => {
  const query: Record<string, string> = {};

  // Numeric IDs use id param, login names use login param
  if (/^\d+$/.test(id)) {
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

  return userToChannel(item);
};

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

  return res.data.data.filter((s) => s.type === "live").map(streamToLive);
};

export const twitchGetVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
): Promise<Page<Video>> => {
  const query: Record<string, string> = {
    user_id: channelId,
    type: "archive",
    first: "20",
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
    items: res.data.data.map(videoToVideo),
    cursor: res.data.pagination?.cursor,
  };
};

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
  return match ? videoToVideo(match) : null;
};
