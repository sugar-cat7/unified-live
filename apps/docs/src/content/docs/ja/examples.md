---
title: 使用例
---

unified-live の実践的なコードレシピ集。基本的な使い方から高度なパターンまで。

## 基本

### URL からコンテンツを取得

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";

const client = UnifiedClient.create({
  plugins: [createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! })],
});

const content = await client.getContent("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
console.log(content.title, content.type); // "live" or "video"

client[Symbol.dispose]();
```

### エラーハンドリング

```ts
import { UnifiedLiveError, NotFoundError, RateLimitError } from "@unified-live/core";

try {
  const content = await client.getContent("https://www.youtube.com/watch?v=invalid");
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`レート制限 — ${err.retryAfter}秒後にリトライ`);
  } else if (err instanceof NotFoundError) {
    console.log(`見つかりません: ${err.message}`);
  } else if (err instanceof UnifiedLiveError) {
    console.log(`SDKエラー [${err.code}]: ${err.message}`);
  } else {
    throw err; // SDK以外のエラーは再スロー
  }
}
```

### チャンネルのライブ配信一覧

```ts
const streams = await client.getLiveStreams("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw");

for (const stream of streams) {
  console.log(`${stream.title} — ${stream.viewerCount} 視聴者`);
}
```

### 動画のページネーション

```ts
let cursor: string | undefined;

do {
  const page = await client.getVideos("twitch", "123456", cursor);
  for (const video of page.items) {
    console.log(`${video.title} (${video.duration}秒)`);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
```

## 中級

### マルチプラットフォーム集約

YouTube と Twitch のライブ配信を並列取得してマージ:

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";

const client = UnifiedClient.create({
  plugins: [
    createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

const [ytStreams, twitchStreams] = await Promise.all([
  client.getLiveStreams("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw"),
  client.getLiveStreams("twitch", "twitchdev"),
]);

const allStreams = [...ytStreams, ...twitchStreams].sort((a, b) => b.viewerCount - a.viewerCount);

console.log(`プラットフォーム全体で ${allStreams.length} 配信`);

client[Symbol.dispose]();
```

### ライブ配信モニター

定期的にポーリングして新しいライブ配信を検出:

```ts
const seen = new Set<string>();

const poll = async () => {
  const streams = await client.getLiveStreams("twitch", "twitchdev");
  for (const stream of streams) {
    if (!seen.has(stream.id)) {
      seen.add(stream.id);
      console.log(`新しい配信: ${stream.title}`);
    }
  }
};

const interval = setInterval(poll, 60_000); // 60秒ごと
await poll(); // 初回チェック

// クリーンアップ
clearInterval(interval);
client[Symbol.dispose]();
```

### 型安全なコンテンツ分岐

`Content` 型ガードを使った安全な型の絞り込み:

```ts
import { Content } from "@unified-live/core";

const content = await client.getContent("https://www.youtube.com/watch?v=abc123");

if (Content.isLive(content)) {
  // TypeScript が認識: content は LiveStream
  console.log(`配信中: ${content.viewerCount} 視聴者、${content.startedAt} から`);
} else if (Content.isVideo(content)) {
  // TypeScript が認識: content は Video
  console.log(`動画: ${content.duration}秒、${content.viewCount} 再生`);
}
```

## 上級

### OpenTelemetry 連携

unified-live はすべての API コールで OpenTelemetry スパンを発行します。Jaeger などの OTel 対応バックエンドに接続:

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { UnifiedClient } from "@unified-live/core";
import { createTwitchPlugin } from "@unified-live/twitch";

// 1. OpenTelemetry を初期化
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
  }),
});
sdk.start();

// 2. unified-live を通常通り使用 — スパンは自動的に発行される
const client = UnifiedClient.create({
  plugins: [
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

const content = await client.getContent("https://www.twitch.tv/videos/123456");
// スパン "unified-live.rest GET" がプラットフォームとパス属性付きで発行される

client[Symbol.dispose]();
await sdk.shutdown();
```

### テスト用モックプラグイン

実際の API にアクセスせずにユニットテスト用の軽量プラグインを作成:

```ts
import {
  PlatformPlugin,
  type Content,
  type Channel,
  type Page,
  type Video,
  type LiveStream,
} from "@unified-live/core";

const mockContent: Content = {
  id: "test-1",
  platform: "mock",
  type: "video",
  title: "Test Video",
  url: "https://example.com/video/test-1",
  thumbnail: { url: "https://example.com/thumb.jpg", width: 320, height: 180 },
  channel: { id: "ch-1", name: "テストチャンネル", url: "https://example.com/channel/ch-1" },
  duration: 120,
  viewCount: 1000,
  publishedAt: new Date("2024-01-01"),
  raw: {},
};

const mockPlugin: PlatformPlugin = {
  name: "mock",
  rest: {} as any, // モックでは未使用
  capabilities: {
    supportsLiveStreams: true,
    supportsArchiveResolution: false,
    authModel: "apiKey",
    rateLimitModel: "tokenBucket",
  },
  match: (url) =>
    url.includes("example.com") ? { platform: "mock", type: "content", id: "test-1" } : null,
  resolveUrl: (url) =>
    url.includes("example.com") ? { platform: "mock", type: "content", id: "test-1" } : null,
  getContent: async () => mockContent,
  getChannel: async () => ({
    id: "ch-1",
    platform: "mock",
    name: "Test Channel",
    url: "https://example.com/channel/ch-1",
  }),
  getLiveStreams: async () => [],
  getVideos: async () => ({ items: [mockContent as Video], hasMore: false }),
  [Symbol.dispose]: () => {},
};

// テストで使用
const client = UnifiedClient.create({ plugins: [mockPlugin] });
const content = await client.getContent("https://example.com/video/test-1");
expect(content.title).toBe("Test Video");
```

## 次のステップ

- [プラグインの作成](../creating-a-plugin/) — 独自のプラットフォームプラグインを構築
- [エラーハンドリング](../error-handling/) — API エラーの適切な処理
- [コアコンセプト](../core-concepts/) — 型システムの理解
