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
  toChannel,
  toContent,
  type YTChannelResource,
  type YTPlaylistItemResource,
  type YTVideoResource,
} from "./mapper";

type YTListResponse<T> = {
  items: T[];
  pageInfo: { totalResults: number; resultsPerPage: number };
  nextPageToken?: string;
};

export const youtubeGetContent = async (rest: RestManager, id: string): Promise<Content> => {
  const res = await rest.request<YTListResponse<YTVideoResource>>({
    method: "GET",
    path: "/videos",
    query: {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      id,
    },
    bucketId: "videos:list",
  });

  const item = res.data.items[0];
  if (!item) {
    throw new NotFoundError("youtube", id);
  }

  return toContent(item);
};

export const youtubeGetChannel = async (rest: RestManager, id: string): Promise<Channel> => {
  const query: Record<string, string> = {
    part: "snippet,contentDetails",
  };

  if (id.startsWith("@")) {
    query.forHandle = id;
  } else if (id.startsWith("UC")) {
    query.id = id;
  } else {
    query.forUsername = id;
  }

  const res = await rest.request<YTListResponse<YTChannelResource>>({
    method: "GET",
    path: "/channels",
    query,
    bucketId: "channels:list",
  });

  const item = res.data.items[0];
  if (!item) {
    throw new NotFoundError("youtube", id);
  }

  return toChannel(item);
};

export const youtubeGetLiveStreams = async (
  rest: RestManager,
  channelId: string,
): Promise<LiveStream[]> => {
  const res = await rest.request<YTListResponse<{ id: { videoId: string } }>>({
    method: "GET",
    path: "/search",
    query: {
      part: "id",
      channelId,
      type: "video",
      eventType: "live",
    },
    bucketId: "search:list",
  });

  if (res.data.items.length === 0) {
    return [];
  }

  const videoIds = res.data.items.map((item) => item.id.videoId).join(",");

  const videosRes = await rest.request<YTListResponse<YTVideoResource>>({
    method: "GET",
    path: "/videos",
    query: {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      id: videoIds,
    },
    bucketId: "videos:list",
  });

  return videosRes.data.items.map(toContent).filter((c): c is LiveStream => c.type === "live");
};

export const youtubeGetVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
): Promise<Page<Video>> => {
  const channelRes = await rest.request<YTListResponse<YTChannelResource>>({
    method: "GET",
    path: "/channels",
    query: {
      part: "contentDetails",
      id: channelId,
    },
    bucketId: "channels:list",
  });

  const channel = channelRes.data.items[0];
  if (!channel) {
    throw new NotFoundError("youtube", channelId);
  }

  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

  const query: Record<string, string> = {
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: "50",
  };
  if (cursor) {
    query.pageToken = cursor;
  }

  const playlistRes = await rest.request<YTListResponse<YTPlaylistItemResource>>({
    method: "GET",
    path: "/playlistItems",
    query,
    bucketId: "playlistItems:list",
  });

  if (playlistRes.data.items.length === 0) {
    return { items: [] };
  }

  const videoIds = playlistRes.data.items.map((item) => item.snippet.resourceId.videoId).join(",");

  const videosRes = await rest.request<YTListResponse<YTVideoResource>>({
    method: "GET",
    path: "/videos",
    query: {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      id: videoIds,
    },
    bucketId: "videos:list",
  });

  const videos = videosRes.data.items.map(toContent).filter((c): c is Video => c.type === "video");

  return {
    items: videos,
    cursor: playlistRes.data.nextPageToken,
    total: playlistRes.data.pageInfo.totalResults,
  };
};

export const youtubeResolveArchive = async (
  rest: RestManager,
  live: LiveStream,
): Promise<Video | null> => {
  const content = await youtubeGetContent(rest, live.id);
  return content.type === "video" ? content : null;
};
