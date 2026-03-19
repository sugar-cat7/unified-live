---
title: 応用
description: "OpenTelemetryトレーシング、リソース管理、高度な設定"
---

## OpenTelemetry 連携

SDK はすべての API 呼び出しで OpenTelemetry トレースを出力します。OTel SDK が設定されていればトレースが自動的に表示され、設定されていなければオーバーヘッドはゼロです（内部で no-op トレーサーを使用）。

### セットアップ

```bash
pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// unified-live のすべての API 呼び出しが自動的にトレースを出力
const content = await client.getContent("https://youtube.com/watch?v=abc123");
```

### スパンのフォーマット

各 API リクエストは `unified-live.rest {platform} {method} {path}` という名前のスパンを生成します。

例: `unified-live.rest youtube GET /videos`

### スパン属性

| 属性                                 | 型        | 説明                                                               |
| :----------------------------------- | :-------- | :----------------------------------------------------------------- |
| `unified_live.platform`              | `string`  | プラットフォーム識別子（`"youtube"`, `"twitch"`, `"twitcasting"`） |
| `http.request.method`                | `string`  | HTTP メソッド（`"GET"`）                                           |
| `url.path`                           | `string`  | リクエストパス（例: `"/videos"`）                                  |
| `http.response.status_code`          | `number`  | HTTP レスポンスステータスコード                                    |
| `unified_live.rate_limit.remaining`  | `number`  | 残りレート制限トークン数                                           |
| `unified_live.rate_limit.limit`      | `number`  | レート制限の総容量                                                 |
| `unified_live.quota.consumed`        | `number`  | 消費クォータユニット数（YouTube）                                  |
| `unified_live.quota.daily_remaining` | `number`  | 残り日次クォータ（YouTube）                                        |
| `error.code`                         | `string`  | エラーコード（例: `"RATE_LIMIT_EXCEEDED"`）                        |
| `error.type`                         | `string`  | エラークラス名                                                     |
| `error.has_cause`                    | `boolean` | エラーが原因をラップしているかどうか                               |

### Jaeger での利用

```bash
# Jaeger をローカルで起動
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
  }),
});
sdk.start();
```

`http://localhost:16686` を開き、サービス名 `unified-live` で検索してください。

### トレーサーへの直接アクセス

カスタム計装には、エクスポートされたトレーサーを使用します:

```ts
import { getTracer, SpanAttributes } from "@unified-live/core";

const tracer = getTracer();
const span = tracer.startSpan("my-custom-operation");
span.setAttribute(SpanAttributes.PLATFORM, "youtube");
// ... ロジック
span.end();
```

---

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

```txt
# YouTube
YOUTUBE_API_KEY=AIza...

# Twitch
TWITCH_CLIENT_ID=abc123
TWITCH_CLIENT_SECRET=def456

# TwitCasting
TWITCASTING_CLIENT_ID=12345
TWITCASTING_CLIENT_SECRET=secret
```

## 次のステップ

- [コード例](../examples/) — 実用的なコードレシピ
- [プラグインの作成](../creating-a-plugin/) — カスタムプラットフォームプラグインの作成
