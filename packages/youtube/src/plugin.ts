import type {
  Channel,
  Content,
  LiveStream,
  Page,
  ResolvedUrl,
  Video,
} from "@unified-live/core";
import {
  createRestManager,
  type PlatformPlugin,
  QuotaExhaustedError,
  type RestRequest,
  type RestResponse,
} from "@unified-live/core";
import {
  toChannel,
  toContent,
  type YTChannelResource,
  type YTPlaylistItemResource,
  type YTVideoResource,
} from "./mapper.js";
import { createYouTubeQuotaStrategy } from "./quota.js";
import { matchYouTubeUrl } from "./urls.js";

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

export type YouTubePluginConfig = {
  apiKey: string;
  quota?: {
    dailyLimit?: number;
  };
  /** Override fetch for testing. */
  fetch?: typeof globalThis.fetch;
};

type YTListResponse<T> = {
  items: T[];
  pageInfo: { totalResults: number; resultsPerPage: number };
  nextPageToken?: string;
};

/**
 * Creates a YouTube platform plugin.
 *
 * @precondition config.apiKey is a valid YouTube Data API v3 key
 * @postcondition returns a PlatformPlugin that handles YouTube URLs and API calls
 * @idempotency Not idempotent — each call creates a new plugin instance
 */
export function createYouTubePlugin(
  config: YouTubePluginConfig,
): PlatformPlugin {
  const quotaStrategy = createYouTubeQuotaStrategy(config.quota?.dailyLimit);

  const rest = createRestManager({
    platform: "youtube",
    baseUrl: YOUTUBE_BASE_URL,
    rateLimitStrategy: quotaStrategy,
    fetch: config.fetch,
  });

  // Override request to inject API key as query parameter
  const origRequest = rest.request;
  rest.request = async <T>(req: RestRequest): Promise<RestResponse<T>> => {
    const reqWithKey = {
      ...req,
      query: { ...req.query, key: config.apiKey },
    };
    return origRequest<T>(reqWithKey);
  };

  // Override handleRateLimit for YouTube-specific 403 handling
  rest.handleRateLimit = async (
    response: Response,
    _req: RestRequest,
    _attempt: number,
  ): Promise<boolean> => {
    if (response.status === 403) {
      const body = (await response
        .clone()
        .json()
        .catch(() => null)) as {
        error?: { errors?: Array<{ reason?: string }> };
      } | null;
      const reason = body?.error?.errors?.[0]?.reason;

      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        const status = quotaStrategy.getStatus();
        throw new QuotaExhaustedError("youtube", {
          consumed: status.limit - status.remaining,
          limit: status.limit,
          resetsAt: status.resetsAt,
          requestedCost: 0,
        });
      }

      if (reason === "rateLimitExceeded") {
        const retryAfter = Number.parseInt(
          response.headers.get("Retry-After") ?? "5",
          10,
        );
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return true; // retry
      }
    }

    if (response.status === 429) {
      const retryAfter = Number.parseInt(
        response.headers.get("Retry-After") ?? "1",
        10,
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return true;
    }

    return false;
  };

  const plugin: PlatformPlugin = {
    name: "youtube",
    rest,

    match(url: string): ResolvedUrl | null {
      return matchYouTubeUrl(url);
    },

    resolveUrl(url: string): ResolvedUrl | null {
      return matchYouTubeUrl(url);
    },

    async getContent(id: string): Promise<Content> {
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
        const { NotFoundError } = await import("@unified-live/core");
        throw new NotFoundError("youtube", id);
      }

      return toContent(item);
    },

    async getChannel(id: string): Promise<Channel> {
      // Handle @handle and custom URL lookups
      const query: Record<string, string> = {
        part: "snippet,contentDetails",
      };

      if (id.startsWith("@")) {
        query.forHandle = id;
      } else if (id.startsWith("UC")) {
        query.id = id;
      } else {
        // Custom URL — try forUsername
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
        const { NotFoundError } = await import("@unified-live/core");
        throw new NotFoundError("youtube", id);
      }

      return toChannel(item);
    },

    async getLiveStreams(channelId: string): Promise<LiveStream[]> {
      // Use search.list to find live broadcasts (costs 100 quota units!)
      const res = await rest.request<
        YTListResponse<{ id: { videoId: string } }>
      >({
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

      // Fetch full video details for found live streams
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

      return videosRes.data.items
        .map(toContent)
        .filter((c): c is LiveStream => c.type === "live");
    },

    async getVideos(channelId: string, cursor?: string): Promise<Page<Video>> {
      // First, get the uploads playlist ID for this channel
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
        const { NotFoundError } = await import("@unified-live/core");
        throw new NotFoundError("youtube", channelId);
      }

      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

      // List playlist items
      const query: Record<string, string> = {
        part: "snippet",
        playlistId: uploadsPlaylistId,
        maxResults: "50",
      };
      if (cursor) {
        query.pageToken = cursor;
      }

      const playlistRes = await rest.request<
        YTListResponse<YTPlaylistItemResource>
      >({
        method: "GET",
        path: "/playlistItems",
        query,
        bucketId: "playlistItems:list",
      });

      if (playlistRes.data.items.length === 0) {
        return { items: [] };
      }

      // Fetch full video details
      const videoIds = playlistRes.data.items
        .map((item) => item.snippet.resourceId.videoId)
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

      const videos = videosRes.data.items
        .map(toContent)
        .filter((c): c is Video => c.type === "video");

      return {
        items: videos,
        cursor: playlistRes.data.nextPageToken,
        total: playlistRes.data.pageInfo.totalResults,
      };
    },

    async resolveArchive(content: Content): Promise<Content | null> {
      // YouTube uses the same ID for live and archive
      if (content.type === "video") return content;
      return plugin.getContent(content.id);
    },

    dispose(): void {
      rest.dispose();
    },
  };

  return plugin;
}
