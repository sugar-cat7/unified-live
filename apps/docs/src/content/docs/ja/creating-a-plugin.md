---
title: プラグインの作成
---

このガイドでは、unified-live のプラットフォームプラグインを構築する手順を説明します。プラグインは配信プラットフォームの API を SDK の統一インターフェースに接続します。

## プラグインを作成するタイミング

新しい配信プラットフォーム（例: Kick、Bilibili、ニコニコ）のサポートを追加したい場合にプラグインを作成します。各プラグインは独立したパッケージで、1つのプラットフォームの API を統一された `Content`、`Channel`、`LiveStream` 型にマッピングします。

## アーキテクチャ概要

プラグインは2つの部分で構成されます:

1. **`PluginDefinition`** — 宣言的な設定: 名前、ベース URL、認証、レート制限、URL マッチング
2. **`PluginMethods`** — `RestManager` を使ってプラットフォーム API を呼び出すデータアクセス関数

これらを `PlatformPlugin.create(definition, methods)` で組み合わせて、完全に配線されたプラグインを生成します。

```
PluginDefinition + PluginMethods
        │
        ▼
  PlatformPlugin.create()
        │
        ▼
  PlatformPlugin（UnifiedClient に登録可能）
```

## ステップ 1: URL マッチング

`matchUrl` 関数は純粋関数（ネットワークコール不要）で、URL が対象プラットフォームに属するかを判定します:

```ts
import type { ResolvedUrl } from "@unified-live/core";

const matchExampleUrl = (url: string): ResolvedUrl | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "example.tv") return null;

    // マッチ: https://example.tv/videos/12345
    const videoMatch = parsed.pathname.match(/^\/videos\/(\w+)$/);
    if (videoMatch) {
      return { platform: "example", type: "content", id: videoMatch[1] };
    }

    // マッチ: https://example.tv/channels/username
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

## ステップ 2: プラグイン設定

プラットフォーム固有の設定を `PluginDefinition` で定義します。これはファクトリ関数内で組み立てます（ステップ 4 参照）:

```ts
import {
  TokenManager,
  createTokenBucketStrategy,
  type PluginDefinition,
} from "@unified-live/core";

const createDefinition = (apiKey: string): PluginDefinition => ({
  name: "example",
  baseUrl: "https://api.example.tv/v1",
  rateLimitStrategy: createTokenBucketStrategy({
    global: { requests: 100, perMs: 60_000 }, // 100リクエスト/分
    parseHeaders: (headers) => {
      const limit = headers.get("X-RateLimit-Limit");
      const remaining = headers.get("X-RateLimit-Remaining");
      const reset = headers.get("X-RateLimit-Reset");
      if (!limit || !remaining || !reset) return undefined;
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        resetsAt: new Date(parseInt(reset, 10) * 1000),
      };
    },
  }),
  tokenManager: TokenManager.static(`Bearer ${apiKey}`),
  matchUrl: matchExampleUrl,
  capabilities: {
    supportsLiveStreams: true,
    supportsArchiveResolution: false,
    authModel: "apiKey",
    rateLimitModel: "tokenBucket",
  },
});
```

## ステップ 3: データメソッド

`PluginMethods` を実装 — 各メソッドは `RestManager` を受け取り、統一型を返します:

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

## ステップ 4: 組み立て

`PlatformPlugin.create()` で definition と methods を組み合わせます:

```ts
export const createExamplePlugin = (config: { apiKey: string }): PlatformPlugin => {
  return PlatformPlugin.create(definition, methods);
};
```

## ステップ 5: 認証

SDK は `TokenManager` を通じて3つの認証パターンをサポート:

| パターン             | ユースケース                 | 例                                                  |
| -------------------- | ---------------------------- | --------------------------------------------------- |
| **静的**             | API キー / Basic auth        | `TokenManager.static("Bearer key123")`              |
| **OAuth2**           | トークンのリフレッシュが必要 | カスタム `TokenManager` にリフレッシュロジック      |
| **クエリパラメータ** | URL 中の API キー            | `tokenManager` の代わりに `transformRequest` を使用 |

**クエリパラメータ認証**（YouTube のような場合）は `transformRequest` を使用:

```ts
const definition: PluginDefinition = {
  // ...
  transformRequest: (req) => ({
    ...req,
    query: { ...req.query, key: config.apiKey },
  }),
};
```

**OAuth2** の場合はカスタム `TokenManager` を実装:

```ts
const createOAuth2TokenManager = (config: {
  clientId: string;
  clientSecret: string;
}): TokenManager => {
  let token: string | null = null;
  let expiresAt = 0;

  return {
    async getAuthHeader() {
      if (!token || Date.now() > expiresAt) {
        const res = await fetch("https://api.example.tv/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=client_credentials&client_id=${config.clientId}&client_secret=${config.clientSecret}`,
        });
        const data = await res.json();
        token = data.access_token;
        expiresAt = Date.now() + data.expires_in * 1000 * 0.9; // 90%で更新
      }
      return `Bearer ${token}`;
    },
    invalidate() {
      token = null;
      expiresAt = 0;
    },
  };
};
```

## ステップ 6: レート制限

プラットフォームのモデルに応じて戦略を選択:

| 戦略             | 使用タイミング                 | プラットフォーム例                             |
| ---------------- | ------------------------------ | ---------------------------------------------- |
| **Token Bucket** | 時間窓あたりの固定リクエスト数 | Twitch (800 req/min)、TwitCasting (60 req/min) |
| **Quota Budget** | コストベースの日次制限         | YouTube (10,000 units/day)                     |

**Token Bucket** — リクエスト/秒制限のプラットフォーム向け:

```ts
import { createTokenBucketStrategy } from "@unified-live/core";

const strategy = createTokenBucketStrategy({
  global: { requests: 100, perMs: 60_000 },
  parseHeaders: myHeaderParser,
});
```

**Quota Budget** — 日次コストベース制限のプラットフォーム向け:

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

## ステップ 7: テスト

### URL マッチングテスト

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

### プラグイン統合テスト

モック `fetch` を使用して実際の API にアクセスせずにデータメソッドをテスト:

```ts
import { describe, it, expect, vi } from "vitest";

describe("createExamplePlugin", () => {
  it("URL でコンテンツを取得", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ video: { id: "123", title: "Test" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const plugin = createExamplePlugin({
      apiKey: "test-key",
      fetch: mockFetch, // モック fetch を注入
    });

    const content = await plugin.getContent("123");
    expect(content.title).toBe("Test");

    plugin[Symbol.dispose]();
  });
});
```

## 完全なスケルトン

最小限だが完全なプラグイン:

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

// URL マッチング
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

// データメソッド
const getContent = async (rest: RestManager, id: string): Promise<Content> => {
  const res = await rest.request<any>({ method: "GET", path: `/videos/${id}` });
  return {
    /* res.data を Content にマッピング */
  } as Content;
};

const getChannel = async (rest: RestManager, id: string): Promise<Channel> => {
  const res = await rest.request<any>({ method: "GET", path: `/channels/${id}` });
  return {
    /* res.data を Channel にマッピング */
  } as Channel;
};

const getLiveStreams = async (rest: RestManager, channelId: string): Promise<LiveStream[]> => {
  const res = await rest.request<any>({ method: "GET", path: `/channels/${channelId}/live` });
  return []; // res.data を LiveStream[] にマッピング
};

const getVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize?: number,
): Promise<Page<Video>> => {
  const res = await rest.request<any>({ method: "GET", path: `/channels/${channelId}/videos` });
  return { items: [], hasMore: false }; // res.data をマッピング
};

// ファクトリ
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

## 次のステップ

- [使用例](../examples/) — 実践的なコードレシピ
- [プラットフォームプラグイン](../platform-plugins/) — 既存プラグインのリファレンス
- [API リファレンス](/unified-live/api/) — 完全な TypeDoc リファレンス
