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
  type Schemas,
  type YTChannelResource,
  type YTVideoResource,
} from "./mapper";

/** List response shape shared by all YouTube Data API list endpoints. */
type YTListResponse<T> = {
  items?: T[];
  pageInfo?: Schemas["PageInfo"];
  nextPageToken?: string;
};

/**
 * Fetch a YouTube video by ID and map to unified Content.
 *
 * @param rest - REST manager for API requests
 * @param id - YouTube video ID
 * @returns unified Content (live or video)
 * @throws NotFoundError if video does not exist
 * @precondition id is a valid YouTube video ID
 * @postcondition returns Content mapped from the YouTube video resource
 */
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

  const item = res.data.items?.[0];
  if (!item) {
    throw new NotFoundError("youtube", id);
  }

  return toContent(item);
};

/**
 * Fetch a YouTube channel by ID, handle, or username and map to unified Channel.
 *
 * @param rest - REST manager for API requests
 * @param id - YouTube channel ID (UC...), handle (@...), or legacy username
 * @returns unified Channel
 * @throws NotFoundError if channel does not exist
 * @precondition id is a valid YouTube channel ID, handle, or username
 * @postcondition returns Channel mapped from the YouTube channel resource
 */
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

  const item = res.data.items?.[0];
  if (!item) {
    throw new NotFoundError("youtube", id);
  }

  return toChannel(item);
};

/**
 * Fetch active live streams for a YouTube channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - YouTube channel ID
 * @returns array of active LiveStream objects (empty if none are live)
 * @precondition channelId is a valid YouTube channel ID
 * @postcondition returns only streams with type "live"
 */
export const youtubeGetLiveStreams = async (
  rest: RestManager,
  channelId: string,
): Promise<LiveStream[]> => {
  const res = await rest.request<YTListResponse<Schemas["SearchResult"]>>({
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

  if (!res.data.items || res.data.items.length === 0) {
    return [];
  }

  const videoIds = res.data.items
    .map((item) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  const videosRes = await rest.request<YTListResponse<YTVideoResource>>({
    method: "GET",
    path: "/videos",
    query: {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      id: videoIds,
    },
    bucketId: "videos:list",
  });

  return (videosRes.data.items ?? [])
    .map(toContent)
    .filter((c): c is LiveStream => c.type === "live");
};

/**
 * Fetch paginated uploaded videos for a YouTube channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - YouTube channel ID
 * @param cursor - optional page token for pagination
 * @param pageSize - number of items per page (default 50)
 * @returns paginated list of Video objects
 * @throws NotFoundError if channel does not exist or has no uploads playlist
 * @precondition channelId is a valid YouTube channel ID
 * @postcondition returns videos from the channel's uploads playlist
 */
export const youtubeGetVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize = 50,
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

  const channel = channelRes.data.items?.[0];
  if (!channel) {
    throw new NotFoundError("youtube", channelId);
  }

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new NotFoundError("youtube", channelId);
  }

  const query: Record<string, string> = {
    part: "snippet",
    playlistId: uploadsPlaylistId,
    maxResults: String(pageSize),
  };
  if (cursor) {
    query.pageToken = cursor;
  }

  const playlistRes = await rest.request<YTListResponse<Schemas["PlaylistItem"]>>({
    method: "GET",
    path: "/playlistItems",
    query,
    bucketId: "playlistItems:list",
  });

  if (!playlistRes.data.items || playlistRes.data.items.length === 0) {
    return { items: [], hasMore: false };
  }

  const videoIds = playlistRes.data.items
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter(Boolean)
    .join(",");

  const videosRes = await rest.request<YTListResponse<YTVideoResource>>({
    method: "GET",
    path: "/videos",
    query: {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      id: videoIds,
    },
    bucketId: "videos:list",
  });

  const videos = (videosRes.data.items ?? [])
    .map(toContent)
    .filter((c): c is Video => c.type === "video");

  return {
    items: videos,
    cursor: playlistRes.data.nextPageToken,
    total: playlistRes.data.pageInfo?.totalResults ?? 0,
    hasMore: playlistRes.data.nextPageToken !== undefined,
  };
};

/**
 * Resolve a live stream to its archived video.
 *
 * YouTube uses the same video ID for live and archive, so this re-fetches
 * the content and returns it only if it has transitioned to a video.
 *
 * @param rest - REST manager for API requests
 * @param live - live stream to check for archive
 * @returns archived Video, or null if still live
 * @postcondition returns Video if the stream ended, null otherwise
 */
export const youtubeResolveArchive = async (
  rest: RestManager,
  live: LiveStream,
): Promise<Video | null> => {
  const content = await youtubeGetContent(rest, live.id);
  return content.type === "video" ? content : null;
};
