---
title: 応用
sidebar:
  order: 6
---

## OpenTelemetry 連携

SDK はすべての API 呼び出しで OpenTelemetry トレースを出力します。OTel SDK が設定されていればトレースが自動的に表示され、設定されていなければオーバーヘッドはゼロです。

```ts
// OTel SDK のインストール（任意）
// pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// unified-live のすべての API 呼び出しが以下の属性でトレースを出力:
// - unified_live.platform ("youtube", "twitch" など)
// - http.request.method ("GET")
// - レート制限の状態
// - エラー情報
```

## プラグインへの直接アクセス

プラットフォーム固有の操作には、プラグインに直接アクセスできます:

```ts
const youtube = client.platform("youtube");

// プラグインのメソッドを直接呼び出し
const content = await youtube.getContent("dQw4w9WgXcQ");
const channel = await youtube.getChannel("@GoogleDevelopers");
```

## 生の API レスポンスへのアクセス

すべての `Content` と `Channel` には、元の API レスポンスが `raw` フィールドに含まれています:

```ts
const content = await client.getContent(url);

// YouTube/Twitch/TwitCasting の生レスポンスにアクセス
const rawResponse = content.raw;
```

## プラットフォームと ID を直接指定

プラットフォームと ID が分かっている場合、URL 解析をスキップできます:

```ts
// URL から取得（プラットフォーム自動判別）
const content = await client.getContent("https://youtube.com/watch?v=abc123");

// プラットフォーム + ID で直接取得（URL 解析なし）
const content = await client.getContentById("youtube", "abc123");
```

## 環境変数

推奨する `.env` の設定:

```env
# YouTube
YOUTUBE_API_KEY=AIza...

# Twitch
TWITCH_CLIENT_ID=abc123
TWITCH_CLIENT_SECRET=def456

# TwitCasting
TWITCASTING_CLIENT_ID=12345
TWITCASTING_CLIENT_SECRET=secret
```
