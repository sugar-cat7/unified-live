---
title: Creating a Plugin
---

This guide walks you through building a platform plugin for unified-live. A plugin connects a streaming platform's API to the SDK's unified interface.

## When to Create a Plugin

Create a plugin when you want to add support for a new streaming platform (e.g., Kick, Bilibili, Nico Nico). Each plugin is an independent package that maps one platform's API to the unified `Content`, `Channel`, and `LiveStream` types.

## Architecture Overview

A plugin consists of two parts:

1. **`PluginDefinition`** — Declarative configuration: name, base URL, auth, rate limiting, URL matching
2. **`PluginMethods`** — Data access functions that use `RestManager` to call the platform API

These are combined with `PlatformPlugin.create(definition, methods)` to produce a fully wired plugin.

```
PluginDefinition + PluginMethods
        │
        ▼
  PlatformPlugin.create()
        │
        ▼
  PlatformPlugin (ready to register with UnifiedClient)
```

## Step 1: URL Matching

The `matchUrl` function is a pure function (no network calls) that detects whether a URL belongs to your platform:

```ts
import type { ResolvedUrl } from "@unified-live/core";

const matchExampleUrl = (url: string): ResolvedUrl | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "example.tv") return null;

    // Match: https://example.tv/videos/12345
    const videoMatch = parsed.pathname.match(/^\/videos\/(\w+)$/);
    if (videoMatch) {
      return { platform: "example", type: "content", id: videoMatch[1] };
    }

    // Match: https://example.tv/channels/username
    const channelMatch = parsed.pathname.match(/^\/channels\/(\w+)$/);
    if (channelMatch) {
      return { platform: "example", type: "channel", id: channelMatch[1] };
    }

    return null;
  } catch {
    return null;
  }
};
```

## Step 2: Plugin Configuration

Define your `PluginDefinition` with all platform-specific settings. This will be assembled inside a factory function (see Step 4):

```ts
import {
  TokenManager,
  createTokenBucketStrategy,
  createRateLimitHeaderParser,
  type PluginDefinition,
} from "@unified-live/core";

const parseHeaders = createRateLimitHeaderParser({
  limit: "X-RateLimit-Limit",
  remaining: "X-RateLimit-Remaining",
  reset: "X-RateLimit-Reset",
});

const createDefinition = (config: {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
}): PluginDefinition => ({
  name: "example",
  baseUrl: "https://api.example.tv/v1",
  rateLimitStrategy: createTokenBucketStrategy({
    global: { requests: 100, perMs: 60_000 }, // 100 req/min
    parseHeaders,
  }),
  tokenManager: TokenManager.static(`Bearer ${config.apiKey}`),
  matchUrl: matchExampleUrl,
  fetch: config.fetch,
  capabilities: {
    supportsLiveStreams: true,
    supportsArchiveResolution: false,
    authModel: "apiKey",
    rateLimitModel: "tokenBucket",
  },
});
```

## Step 3: Data Methods

Implement `PluginMethods` — each method receives a `RestManager` and returns unified types:

```ts
import type {
  RestManager,
  PluginMethods,
  Content,
  Channel,
  LiveStream,
  Page,
  Video,
} from "@unified-live/core";

const exampleGetContent = async (rest: RestManager, id: string): Promise<Content> => {
  const res = await rest.request<{ video: ExampleVideo }>({
    method: "GET",
    path: `/videos/${id}`,
    bucketId: "videos:get",
  });
  return mapToContent(res.data.video);
};

const exampleGetChannel = async (rest: RestManager, id: string): Promise<Channel> => {
  const res = await rest.request<{ channel: ExampleChannel }>({
    method: "GET",
    path: `/channels/${id}`,
    bucketId: "channels:get",
  });
  return mapToChannel(res.data.channel);
};

const exampleGetLiveStreams = async (
  rest: RestManager,
  channelId: string,
): Promise<LiveStream[]> => {
  const res = await rest.request<{ streams: ExampleStream[] }>({
    method: "GET",
    path: `/channels/${channelId}/live`,
    bucketId: "streams:list",
  });
  return res.data.streams.map(mapToLiveStream);
};

const exampleGetVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize?: number,
): Promise<Page<Video>> => {
  const res = await rest.request<{ videos: ExampleVideo[]; nextCursor?: string }>({
    method: "GET",
    path: `/channels/${channelId}/videos`,
    query: {
      ...(cursor && { cursor }),
      ...(pageSize && { limit: String(pageSize) }),
    },
    bucketId: "videos:list",
  });
  return {
    items: res.data.videos.map(mapToVideo),
    cursor: res.data.nextCursor,
    hasMore: !!res.data.nextCursor,
  };
};

const methods: PluginMethods = {
  getContent: exampleGetContent,
  getChannel: exampleGetChannel,
  getLiveStreams: exampleGetLiveStreams,
  getVideos: exampleGetVideos,
};
```

## Step 4: Wire It Together

Combine definition and methods with `PlatformPlugin.create()`:

```ts
export const createExamplePlugin = (config: {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
}): PlatformPlugin => {
  return PlatformPlugin.create(createDefinition(config), methods);
};
```

## Step 5: Authentication

The SDK supports three auth patterns via `TokenManager`:

| Pattern         | Use Case             | Example                                          |
| --------------- | -------------------- | ------------------------------------------------ |
| **Static**      | API key / Basic auth | `TokenManager.static("Bearer key123")`           |
| **OAuth2**      | Token refresh needed | Custom `TokenManager` with refresh logic         |
| **Query param** | API key in URL       | Use `transformRequest` instead of `tokenManager` |

For **query parameter auth** (like YouTube), use `transformRequest`:

```ts
const definition: PluginDefinition = {
  // ...
  transformRequest: (req) => ({
    ...req,
    query: { ...req.query, key: config.apiKey },
  }),
};
```

For **OAuth2**, implement a custom `TokenManager`:

```ts
import { AuthenticationError, type TokenManager } from "@unified-live/core";

const createOAuth2TokenManager = (config: {
  clientId: string;
  clientSecret: string;
}): TokenManager => {
  let token: string | null = null;
  let expiresAt = 0;

  return {
    getAuthHeader: async () => {
      if (!token || Date.now() > expiresAt) {
        const res = await fetch("https://api.example.tv/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: config.clientId,
            client_secret: config.clientSecret,
          }).toString(),
        });
        if (!res.ok) throw new AuthenticationError("example", { message: `Token endpoint returned ${res.status}` });
        const data = await res.json();
        token = data.access_token;
        expiresAt = Date.now() + data.expires_in * 1000 * 0.9; // refresh at 90%
      }
      return `Bearer ${token}`;
    },
    invalidate: () => {
      token = null;
      expiresAt = 0;
    },
  };
};
```

## Step 6: Rate Limiting

Choose a strategy based on the platform's model:

| Strategy         | When to Use                    | Example Platform                               |
| ---------------- | ------------------------------ | ---------------------------------------------- |
| **Token Bucket** | Fixed requests per time window | Twitch (800 req/min), TwitCasting (60 req/min) |
| **Quota Budget** | Cost-based daily limit         | YouTube (10,000 units/day)                     |

**Token Bucket** — for platforms with request-per-second limits:

```ts
import { createTokenBucketStrategy } from "@unified-live/core";

const strategy = createTokenBucketStrategy({
  global: { requests: 100, perMs: 60_000 },
  parseHeaders: myHeaderParser,
});
```

**Quota Budget** — for platforms with daily cost-based limits:

```ts
import { createQuotaBudgetStrategy } from "@unified-live/core";

const strategy = createQuotaBudgetStrategy({
  dailyLimit: 10_000,
  costMap: {
    "videos:get": 1,
    "channels:get": 1,
    "search:list": 100,
  },
  defaultCost: 1,
  platform: "example",
});
```

## Step 7: Testing

### URL Matching Tests

```ts
import { describe, it, expect } from "vitest";

describe("matchExampleUrl", () => {
  it.each([
    ["https://example.tv/videos/123", { platform: "example", type: "content", id: "123" }],
    ["https://example.tv/channels/user1", { platform: "example", type: "channel", id: "user1" }],
    ["https://other.com/videos/123", null],
    ["not-a-url", null],
  ])("matchExampleUrl(%s) = %o", (url, expected) => {
    expect(matchExampleUrl(url)).toEqual(expected);
  });
});
```

### Plugin Integration Tests

Use a mock `fetch` to test data methods without hitting real APIs:

```ts
import { describe, it, expect, vi } from "vitest";

describe("createExamplePlugin", () => {
  it("fetches content by ID", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ video: { id: "123", title: "Test" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const plugin = createExamplePlugin({
      apiKey: "test-key",
      fetch: mockFetch, // inject mock fetch
    });

    const content = await plugin.getContent("123");
    expect(content.title).toBe("Test");

    plugin[Symbol.dispose]();
  });
});
```

## Complete Skeleton

Here's a minimal but complete plugin:

```ts
import {
  PlatformPlugin,
  TokenManager,
  createTokenBucketStrategy,
  type PluginDefinition,
  type PluginMethods,
  type RestManager,
  type Content,
  type Channel,
  type LiveStream,
  type Page,
  type Video,
  type ResolvedUrl,
} from "@unified-live/core";

// URL matching
const matchUrl = (url: string): ResolvedUrl | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "example.tv") return null;
    const match = parsed.pathname.match(/^\/videos\/(\w+)$/);
    return match ? { platform: "example", type: "content", id: match[1] } : null;
  } catch {
    return null;
  }
};

// Data methods
const getContent = async (rest: RestManager, id: string): Promise<Content> => {
  const res = await rest.request<any>({ method: "GET", path: `/videos/${id}` });
  return res.data as Content; // map platform response to Content
};

const getChannel = async (rest: RestManager, id: string): Promise<Channel> => {
  const res = await rest.request<any>({ method: "GET", path: `/channels/${id}` });
  return res.data as Channel; // map platform response to Channel
};

const getLiveStreams = async (rest: RestManager, channelId: string): Promise<LiveStream[]> => {
  const res = await rest.request<any>({ method: "GET", path: `/channels/${channelId}/live` });
  return []; // map res.data to LiveStream[]
};

const getVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize?: number,
): Promise<Page<Video>> => {
  const res = await rest.request<any>({ method: "GET", path: `/channels/${channelId}/videos` });
  return { items: [], hasMore: false }; // map res.data
};

// Factory
export type ExamplePluginConfig = { apiKey: string; fetch?: typeof globalThis.fetch };

export const createExamplePlugin = (config: ExamplePluginConfig): PlatformPlugin => {
  return PlatformPlugin.create(
    {
      name: "example",
      baseUrl: "https://api.example.tv/v1",
      rateLimitStrategy: createTokenBucketStrategy({
        global: { requests: 100, perMs: 60_000 },
        parseHeaders: () => undefined,
      }),
      tokenManager: TokenManager.static(`Bearer ${config.apiKey}`),
      matchUrl,
      fetch: config.fetch,
      capabilities: {
        supportsLiveStreams: true,
        supportsArchiveResolution: false,
        authModel: "apiKey",
        rateLimitModel: "tokenBucket",
      },
    },
    { getContent, getChannel, getLiveStreams, getVideos },
  );
};
```

## Next Steps

- [Examples](../examples/) — Practical code recipes
- [Platform Plugins](../platform-plugins/) — Existing plugin reference
- [API Reference](/unified-live/api/) — Full TypeDoc reference
