# 02: Platform Plugins

## YouTube Plugin Migration

### Before (current — imperative)

```ts
export function createYouTubePlugin(config: YouTubePluginConfig): PlatformPlugin {
  const quotaStrategy = createYouTubeQuotaStrategy(config.quota?.dailyLimit);
  const rest = createRestManager({ ... });

  // Manual overrides
  const origRequest = rest.request;
  rest.request = async <T>(req) => { ... inject API key ... };
  rest.handleRateLimit = async (response, req, attempt) => { ... 403 handling ... };

  // 180-line object literal with all methods
  return { name: "youtube", rest, match, resolveUrl, getContent, ... };
}
```

### After (declarative)

```ts
export function createYouTubePlugin(config: YouTubePluginConfig): PlatformPlugin {
  const quotaStrategy = createYouTubeQuotaStrategy(config.quota?.dailyLimit);

  return PlatformPlugin.create(
    {
      name: "youtube",
      baseUrl: YOUTUBE_BASE_URL,
      rateLimitStrategy: quotaStrategy,
      matchUrl: matchYouTubeUrl,
      fetch: config.fetch,

      // Declarative request transformation
      transformRequest: (req) => ({
        ...req,
        query: { ...req.query, key: config.apiKey },
      }),

      // Platform-specific rate limit handling
      handleRateLimit: createYouTubeRateLimitHandler(quotaStrategy),
    },
    {
      // Pure methods that receive rest as first argument
      getContent: youtubeGetContent,
      getChannel: youtubeGetChannel,
      getLiveStreams: youtubeGetLiveStreams,
      getVideos: youtubeGetVideos,
      resolveArchive: youtubeResolveArchive,
    },
  );
}
```

### Method Extraction

Each method is extracted as a standalone function:

```ts
// packages/youtube/src/methods.ts

async function youtubeGetContent(rest: RestManager, id: string): Promise<Content> {
  const res = await rest.request<YTListResponse<YTVideoResource>>({
    method: "GET",
    path: "/videos",
    query: { part: "snippet,contentDetails,statistics,liveStreamingDetails", id },
    bucketId: "videos:list",
  });
  const item = res.data.items[0];
  if (!item) throw new NotFoundError("youtube", id);
  return toContent(item);
}

// ... getChannel, getLiveStreams, getVideos, resolveArchive similarly
```

### YouTube Rate Limit Handler

Extracted as a factory function:

```ts
// packages/youtube/src/rate-limit.ts

function createYouTubeRateLimitHandler(
  quotaStrategy: RateLimitStrategy,
): (response: Response, req: RestRequest, attempt: number) => Promise<boolean> {
  return async (response, _req, _attempt) => {
    if (response.status === 403) {
      const body = await response.clone().json().catch(() => null);
      const reason = body?.error?.errors?.[0]?.reason;

      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        const status = quotaStrategy.getStatus();
        throw new QuotaExhaustedError("youtube", { ... });
      }

      if (reason === "rateLimitExceeded") {
        const retryAfter = parseInt(response.headers.get("Retry-After") ?? "5", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return true;
      }
    }

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") ?? "1", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return true;
    }

    return false;
  };
}
```

## Future Plugin Example (Twitch)

Shows how the declarative pattern simplifies new plugin creation:

```ts
export function createTwitchPlugin(config: TwitchPluginConfig): PlatformPlugin {
  return PlatformPlugin.create(
    {
      name: "twitch",
      baseUrl: "https://api.twitch.tv/helix",
      rateLimitStrategy: createTokenBucketStrategy({ ... }),
      tokenManager: createClientCredentialsTokenManager(config),
      matchUrl: matchTwitchUrl,

      // Twitch requires Client-Id header on all requests
      headers: { "Client-Id": config.clientId },

      // Twitch provides standard rate limit headers
      parseRateLimitHeaders: parseTwitchRateLimitHeaders,
    },
    { getContent, getChannel, getLiveStreams, getVideos, resolveArchive },
  );
}
```

Note how headers are declarative (no manual `createHeaders` override) and rate limit parsing is a simple function reference.

## File Structure Changes

```
packages/youtube/src/
├── index.ts              # Re-exports (unchanged)
├── plugin.ts             # createYouTubePlugin (simplified, uses PlatformPlugin.create)
├── methods.ts            # NEW: extracted getContent, getChannel, etc.
├── rate-limit.ts         # NEW: createYouTubeRateLimitHandler
├── mapper.ts             # Response mapping (unchanged)
├── urls.ts               # URL matching (unchanged)
└── quota.ts              # Quota strategy (unchanged)
```
