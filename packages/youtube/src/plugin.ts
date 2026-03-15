import {
  parseRetryAfter,
  PlatformPlugin,
  QuotaExhaustedError,
  ValidationError,
} from "@unified-live/core";
import {
  youtubeGetChannel,
  youtubeGetContent,
  youtubeGetLiveStreams,
  youtubeGetVideos,
  youtubeResolveArchive,
} from "./methods";
import { createYouTubeQuotaStrategy } from "./quota";
import { matchYouTubeUrl } from "./urls";

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
 * @param config - YouTube plugin configuration including API key
 * @returns configured PlatformPlugin for YouTube
 * @throws {ValidationError} if apiKey is empty/whitespace
 * @precondition config.apiKey is a valid YouTube Data API v3 key
 * @postcondition returns a PlatformPlugin that handles YouTube URLs and API calls
 * @idempotency Not idempotent — each call creates a new plugin instance
 */
export const createYouTubePlugin = (config: YouTubePluginConfig): PlatformPlugin => {
  if (!config.apiKey?.trim()) {
    throw new ValidationError("VALIDATION_INVALID_INPUT", "YouTube API key is required", {
      platform: "youtube",
    });
  }

  const quotaStrategy = createYouTubeQuotaStrategy(config.quota?.dailyLimit);

  return PlatformPlugin.create(
    {
      name: "youtube",
      baseUrl: YOUTUBE_BASE_URL,
      rateLimitStrategy: quotaStrategy,
      matchUrl: matchYouTubeUrl,
      fetch: config.fetch,
      capabilities: {
        supportsLiveStreams: true,
        supportsArchiveResolution: true,
        authModel: "apiKey",
        rateLimitModel: "quota",
      },
      transformRequest: (req) => ({
        ...req,
        query: { ...req.query, key: config.apiKey },
      }),
      handleRateLimit: async (response, _req, _attempt) => {
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
            const retryAfter = parseRetryAfter(response.headers.get("Retry-After"), 5);
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            return true;
          }
        }

        if (response.status === 429) {
          const retryAfter = parseRetryAfter(response.headers.get("Retry-After"), 1);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          return true;
        }

        return false;
      },
    },
    {
      getContent: youtubeGetContent,
      getChannel: youtubeGetChannel,
      getLiveStreams: youtubeGetLiveStreams,
      getVideos: youtubeGetVideos,
      resolveArchive: youtubeResolveArchive,
    },
  );
};
