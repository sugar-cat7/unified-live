import { PlatformPlugin } from "@unified-live/core";
import {
  youtubeGetChannel,
  youtubeGetContent,
  youtubeGetLiveStreams,
  youtubeGetVideos,
  youtubeResolveArchive,
} from "./methods.js";
import { createYouTubeQuotaStrategy } from "./quota.js";
import { createYouTubeRateLimitHandler } from "./rate-limit.js";
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

  return PlatformPlugin.create(
    {
      name: "youtube",
      baseUrl: YOUTUBE_BASE_URL,
      rateLimitStrategy: quotaStrategy,
      matchUrl: matchYouTubeUrl,
      fetch: config.fetch,
      transformRequest: (req) => ({
        ...req,
        query: { ...req.query, key: config.apiKey },
      }),
      handleRateLimit: createYouTubeRateLimitHandler(quotaStrategy),
    },
    {
      getContent: youtubeGetContent,
      getChannel: youtubeGetChannel,
      getLiveStreams: youtubeGetLiveStreams,
      getVideos: youtubeGetVideos,
      resolveArchive: youtubeResolveArchive,
    },
  );
}
