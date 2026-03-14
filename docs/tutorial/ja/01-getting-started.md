# はじめに

## インストール

コアパッケージと必要なプラットフォームプラグインをインストールします:

```bash
# Core + YouTube
pnpm add @unified-live/core @unified-live/youtube

# Core + 全プラットフォーム
pnpm add @unified-live/core @unified-live/youtube @unified-live/twitch @unified-live/twitcasting
```

## クイックスタート

```ts
import { createClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";

// 1. クライアントを作成
const client = createClient();

// 2. プラットフォームプラグインを登録
client.register(createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }));
client.register(
  createTwitchPlugin({
    clientId: process.env.TWITCH_CLIENT_ID!,
    clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  }),
);

// 3. URL からコンテンツを取得 — プラットフォームは自動判別
const content = await client.getContent("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

console.log(content.title); // 動画タイトル
console.log(content.platform); // "youtube"
console.log(content.type); // "live" または "video"

// 4. 使い終わったらリソースを解放
client.dispose();
```

## 動作要件

- Node.js 18 以上（または `fetch` をネイティブサポートするランタイム: Deno, Bun, Cloudflare Workers）
- プラットフォームの API 認証情報（[プラットフォームプラグイン](./03-platform-plugins.md)を参照）

## 次のステップ

- [基本概念](./02-core-concepts.md) — Content, Channel, 型システム
- [プラットフォームプラグイン](./03-platform-plugins.md) — 各プラットフォームの設定
- [エラーハンドリング](./04-error-handling.md) — API エラーの処理
