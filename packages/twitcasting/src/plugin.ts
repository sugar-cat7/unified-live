import {
  createRateLimitHeaderParser,
  createTokenBucketStrategy,
  PlatformPlugin,
  ValidationError,
} from "@unified-live/core";
import { createBasicAuthTokenManager } from "./auth";
import {
  twitcastingGetChannel,
  twitcastingGetContent,
  twitcastingListArchives,
  twitcastingListBroadcasts,
  twitcastingResolveArchive,
  twitcastingSearch,
} from "./methods";
import { matchTwitCastingUrl } from "./urls";

const TWITCASTING_BASE_URL = "https://apiv2.twitcasting.tv";

export type TwitCastingPluginConfig = {
  clientId: string;
  clientSecret: string;
  /** Override fetch for testing. */
  fetch?: typeof globalThis.fetch;
};

const parseTwitCastingRateLimitHeaders = createRateLimitHeaderParser({
  limit: "X-RateLimit-Limit",
  remaining: "X-RateLimit-Remaining",
  reset: "X-RateLimit-Reset",
});

/**
 * Creates a TwitCasting platform plugin.
 *
 * @param config - TwitCasting plugin configuration including client credentials
 * @returns configured PlatformPlugin for TwitCasting
 * @throws {ValidationError} if clientId or clientSecret are empty/whitespace
 * @precondition config.clientId and config.clientSecret are valid TwitCasting app credentials
 * @postcondition returns a PlatformPlugin that handles TwitCasting URLs and API calls
 * @idempotency Not idempotent — each call creates a new plugin instance
 */
export const createTwitCastingPlugin = (config: TwitCastingPluginConfig): PlatformPlugin => {
  if (!config.clientId?.trim() || !config.clientSecret?.trim()) {
    throw new ValidationError(
      "VALIDATION_INVALID_INPUT",
      "TwitCasting clientId and clientSecret are required",
      { platform: "twitcasting" },
    );
  }

  return PlatformPlugin.create(
    {
      name: "twitcasting",
      baseUrl: TWITCASTING_BASE_URL,
      rateLimitStrategy: createTokenBucketStrategy({
        global: { requests: 60, perMs: 60_000 },
        parseHeaders: parseTwitCastingRateLimitHeaders,
        platform: "twitcasting",
      }),
      tokenManager: createBasicAuthTokenManager({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      }),
      matchUrl: matchTwitCastingUrl,
      capabilities: {
        supportsBroadcasts: true,
        supportsArchiveResolution: true,
        authModel: "basic",
        rateLimitModel: "tokenBucket",
        supportsBatchContent: false,
        supportsBatchBroadcasts: false,
        supportsSearch: true,
        supportsClips: false,
      },
      headers: { "X-Api-Version": "2.0" },
      parseRateLimitHeaders: parseTwitCastingRateLimitHeaders,
      fetch: config.fetch,
    },
    {
      getContent: twitcastingGetContent,
      getChannel: twitcastingGetChannel,
      listBroadcasts: twitcastingListBroadcasts,
      listArchives: twitcastingListArchives,
      resolveArchive: twitcastingResolveArchive,
      search: twitcastingSearch,
    },
  );
};
