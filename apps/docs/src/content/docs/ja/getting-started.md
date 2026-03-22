---
title: はじめに
description: "unified-liveのインストールと最初のAPIクエリ実行"
---

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
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";

// 1. プラットフォームプラグインを指定してクライアントを作成
const client = UnifiedClient.create({
  plugins: [
    createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

// 2. URL からコンテンツを取得 — プラットフォームは自動判別
const content = await client.resolve("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

console.log(content.title); // 動画タイトル
console.log(content.platform); // "youtube"
console.log(content.type); // "broadcast" または "archive"
```

## 動作要件

- Node.js 18 以上（または `fetch` をネイティブサポートするランタイム: Deno, Bun, Cloudflare Workers）
- プラットフォームの API 認証情報（[プラットフォームプラグイン](../platform-plugins/)を参照）

## 次のステップ

- [概要](../overview/) — unified-live を使う理由とプラットフォーム API 比較
- [基本概念](../core-concepts/) — Content, Channel, 型システム
- [プラットフォームプラグイン](../platform-plugins/) — 各プラットフォームの設定
- [エラーハンドリング](../error-handling/) — API エラーの処理
