import {
  type Archive,
  type BatchResult,
  type Broadcast,
  type Channel,
  type Content,
  NotFoundError,
  Page,
  type RestManager,
  type SearchOptions,
  UnifiedLiveError,
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

const YOUTUBE_VIDEO_PARTS = "snippet,contentDetails,statistics,liveStreamingDetails";

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
      part: YOUTUBE_VIDEO_PARTS,
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
    part: "snippet,contentDetails,statistics",
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
 * Fetch active broadcasts for a YouTube channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - YouTube channel ID
 * @returns array of active Broadcast objects (empty if none are live)
 * @precondition channelId is a valid YouTube channel ID
 * @postcondition returns only streams with type "broadcast"
 */
export const youtubeListBroadcasts = async (
  rest: RestManager,
  channelId: string,
): Promise<Broadcast[]> => {
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
      part: YOUTUBE_VIDEO_PARTS,
      id: videoIds,
    },
    bucketId: "videos:list",
  });

  const items = videosRes.data.items ?? [];
  const broadcasts: Broadcast[] = [];
  for (const item of items) {
    const content = toContent(item);
    if (content.type === "broadcast") {
      broadcasts.push(content);
    }
  }
  return broadcasts;
};

/**
 * Fetch paginated uploaded archives for a YouTube channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - YouTube channel ID
 * @param cursor - optional page token for pagination
 * @param pageSize - number of items per page (default 50)
 * @returns paginated list of Archive objects
 * @throws NotFoundError if channel does not exist or has no uploads playlist
 * @precondition channelId is a valid YouTube channel ID
 * @postcondition returns archives from the channel's uploads playlist
 */
export const youtubeListArchives = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize = 50,
): Promise<Page<Archive>> => {
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
      part: YOUTUBE_VIDEO_PARTS,
      id: videoIds,
    },
    bucketId: "videos:list",
  });

  const items = videosRes.data.items ?? [];
  const archives: Archive[] = [];
  for (const item of items) {
    const content = toContent(item);
    if (content.type === "archive") {
      archives.push(content);
    }
  }

  return {
    items: archives,
    cursor: playlistRes.data.nextPageToken,
    total: playlistRes.data.pageInfo?.totalResults ?? 0,
    hasMore: playlistRes.data.nextPageToken !== undefined,
  };
};

/**
 * Resolve a broadcast to its archived content.
 *
 * YouTube uses the same video ID for live and archive, so this re-fetches
 * the content and returns it only if it has transitioned to an archive.
 *
 * @param rest - REST manager for API requests
 * @param live - broadcast to check for archive
 * @returns Archive, or null if still live
 * @postcondition returns Archive if the stream ended, null otherwise
 */
export const youtubeResolveArchive = async (
  rest: RestManager,
  live: Broadcast,
): Promise<Archive | null> => {
  const content = await youtubeGetContent(rest, live.id);
  return content.type === "archive" ? content : null;
};

const YOUTUBE_MAX_IDS_PER_REQUEST = 50;

/**
 * Batch-fetch YouTube videos by IDs and map to unified Content.
 *
 * @param rest - REST manager for API requests
 * @param ids - array of YouTube video IDs
 * @returns BatchResult with values for found videos and NotFoundError for missing IDs
 * @precondition each id is a valid YouTube video ID
 * @postcondition values contains Content for each found video; errors contains NotFoundError for each missing ID
 * @idempotency Safe — read-only API calls
 */
export const youtubeBatchGetContents = async (
  rest: RestManager,
  ids: string[],
): Promise<BatchResult<Content>> => {
  const values = new Map<string, Content>();
  const errors = new Map<string, UnifiedLiveError>();

  for (let i = 0; i < ids.length; i += YOUTUBE_MAX_IDS_PER_REQUEST) {
    const chunk = ids.slice(i, i + YOUTUBE_MAX_IDS_PER_REQUEST);
    const res = await rest.request<YTListResponse<YTVideoResource>>({
      method: "GET",
      path: "/videos",
      query: {
        part: YOUTUBE_VIDEO_PARTS,
        id: chunk.join(","),
      },
      bucketId: "videos:list",
    });

    const returnedIds = new Set<string>();
    for (const item of res.data.items ?? []) {
      if (item.id) {
        values.set(item.id, toContent(item));
        returnedIds.add(item.id);
      }
    }

    for (const id of chunk) {
      if (!returnedIds.has(id)) {
        errors.set(id, new NotFoundError("youtube", id));
      }
    }
  }

  return { values, errors };
};

/**
 * Search YouTube for videos matching the given options.
 *
 * @param rest - REST manager for API requests
 * @param options - search options (query, status, limit, cursor)
 * @returns paginated list of Content items
 * @precondition options.query or options.status should be provided for meaningful results
 * @postcondition returns Page with items mapped from YouTube video resources
 * @idempotency Safe — read-only API calls
 */
export const youtubeSearch = async (
  rest: RestManager,
  options: SearchOptions,
): Promise<Page<Content>> => {
  const query: Record<string, string> = {
    part: "id",
    type: "video",
  };

  if (options.query) query.q = options.query;
  if (options.channelId) query.channelId = options.channelId;
  if (options.order) query.order = options.order;
  if (options.limit) query.maxResults = String(Math.min(options.limit, 50));
  if (options.cursor) query.pageToken = options.cursor;
  if (options.safeSearch) query.safeSearch = options.safeSearch;
  if (options.languageCode) query.relevanceLanguage = options.languageCode;

  if (options.status) {
    const eventTypeMap = {
      live: "live",
      upcoming: "upcoming",
      ended: "completed",
    } as const;
    query.eventType = eventTypeMap[options.status];
  }

  const searchRes = await rest.request<YTListResponse<Schemas["SearchResult"]>>({
    method: "GET",
    path: "/search",
    query,
    bucketId: "search:list",
  });

  if (!searchRes.data.items || searchRes.data.items.length === 0) {
    return Page.empty<Content>();
  }

  const videoIds = searchRes.data.items
    .map((item) => item.id?.videoId)
    .filter(Boolean)
    .join(",");

  if (!videoIds) return Page.empty<Content>();

  const videosRes = await rest.request<YTListResponse<YTVideoResource>>({
    method: "GET",
    path: "/videos",
    query: {
      part: YOUTUBE_VIDEO_PARTS,
      id: videoIds,
    },
    bucketId: "videos:list",
  });

  const items = (videosRes.data.items ?? []).map(toContent);

  return {
    items,
    cursor: searchRes.data.nextPageToken,
    total: searchRes.data.pageInfo?.totalResults,
    hasMore: searchRes.data.nextPageToken !== undefined,
  };
};
