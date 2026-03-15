import {
  createRateLimitHeaderParser,
  createTokenBucketStrategy,
  PlatformPlugin,
  ValidationError,
} from "@unified-live/core";
import { createClientCredentialsTokenManager } from "./auth";
import {
  twitchGetChannel,
  twitchGetContent,
  twitchGetLiveStreams,
  twitchGetVideos,
  twitchResolveArchive,
} from "./methods";
import { matchTwitchUrl } from "./urls";

const TWITCH_BASE_URL = "https://api.twitch.tv/helix";

export type TwitchPluginConfig = {
  clientId: string;
  clientSecret: string;
  /** Override fetch for testing. */
  fetch?: typeof globalThis.fetch;
};

const parseTwitchRateLimitHeaders = createRateLimitHeaderParser({
  limit: "Ratelimit-Limit",
  remaining: "Ratelimit-Remaining",
  reset: "Ratelimit-Reset",
});

/**
 * Creates a Twitch platform plugin.
 *
 * @param config - Twitch plugin configuration including client credentials
 * @returns configured PlatformPlugin for Twitch
 * @precondition config.clientId and config.clientSecret are valid Twitch app credentials
 * @postcondition returns a PlatformPlugin that handles Twitch URLs and API calls
 * @idempotency Not idempotent — each call creates a new plugin instance
 */
export const createTwitchPlugin = (config: TwitchPluginConfig): PlatformPlugin => {
  if (!config.clientId || !config.clientSecret) {
    throw new ValidationError("VALIDATION_INVALID_INPUT", "Twitch clientId and clientSecret are required", { platform: "twitch" });
  }

  return PlatformPlugin.create(
    {
      name: "twitch",
      baseUrl: TWITCH_BASE_URL,
      rateLimitStrategy: createTokenBucketStrategy({
        global: { requests: 800, perMs: 60_000 },
        parseHeaders: parseTwitchRateLimitHeaders,
      }),
      tokenManager: createClientCredentialsTokenManager({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        fetch: config.fetch,
      }),
      matchUrl: matchTwitchUrl,
      headers: { "Client-Id": config.clientId },
      parseRateLimitHeaders: parseTwitchRateLimitHeaders,
      fetch: config.fetch,
    },
    {
      getContent: twitchGetContent,
      getChannel: twitchGetChannel,
      getLiveStreams: twitchGetLiveStreams,
      getVideos: twitchGetVideos,
      resolveArchive: twitchResolveArchive,
    },
  );
};
