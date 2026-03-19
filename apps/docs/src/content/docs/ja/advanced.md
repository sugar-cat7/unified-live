---
title: 応用
description: "OpenTelemetry トレーシングとメトリクス、リソース管理、高度な設定"
---

## OpenTelemetry 連携

SDK はすべての API 呼び出しで OpenTelemetry トレースとメトリクスを出力します。`@opentelemetry/api` は必須の peer dependency です — OTel SDK が登録されていない場合、自動的に no-op 実装が提供されオーバーヘッドはゼロです。

### セットアップ

```bash
pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "my-app",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// unified-live のすべての API 呼び出しが自動的にトレースとメトリクスを出力
const content = await client.getContent("https://youtube.com/watch?v=abc123");
```

### カスタム Provider 注入

グローバル OTel 登録の代わりに、カスタムの `TracerProvider` や `MeterProvider` インスタンスを注入できます:

```ts
import { UnifiedClient, createRestManager, getTracer, getMeter } from "@unified-live/core";

// クライアントに注入（クライアントレベルスパン用）
const client = UnifiedClient.create({
  plugins: [youtubePlugin],
  tracerProvider: myTracerProvider,
});

// REST マネージャーに注入（HTTP レベルスパン + メトリクス用）
const manager = createRestManager({
  platform: "youtube",
  baseUrl: "https://www.googleapis.com/youtube/v3",
  rateLimitStrategy: strategy,
  tracerProvider: myTracerProvider,
  meterProvider: myMeterProvider,
});

// カスタム計装に直接使用
const tracer = getTracer(myTracerProvider);
const meter = getMeter(myMeterProvider);
```

### スパン階層

SDK は2層のスパン階層を構築します:

```
unified-live.client getContent           ← クライアントレベルスパン
  ├── unified_live.platform = youtube
  ├── unified_live.operation = getContent
  └── GET                                ← REST レベルスパン (kind: CLIENT)
       ├── http.request.method = GET
       ├── url.full = https://www.googleapis.com/youtube/v3/videos?id=abc
       ├── url.path = /videos
       ├── url.scheme = https
       ├── server.address = www.googleapis.com
       ├── server.port = 443
       └── http.response.status_code = 200
```

**クライアントレベルスパン**は各パブリックメソッド呼び出し（`getContent`, `getContentById`, `getLiveStreams`, `getVideos`, `getChannel`, `getContents`, `getLiveStreamsBatch`, `search`）ごとに生成されます。操作名とプラットフォームを記録します。

**REST レベルスパン**は各 HTTP リクエストごとに生成されます。スパン名は [OTel HTTP client semantic conventions](https://opentelemetry.io/docs/specs/semconv/http/http-spans/) に準拠し、HTTP メソッドのみ（例: `GET`）です。Instrumentation Scope 名 `unified-live` でフィルタできます。

### クライアントスパン属性

| 属性                      | 型       | 説明                                                           |
| :------------------------ | :------- | :------------------------------------------------------------- |
| `unified_live.platform`   | `string` | プラットフォーム識別子（`"youtube"`, `"twitch"`, `"twitcasting"`） |
| `unified_live.operation`  | `string` | 操作名（例: `"getContent"`, `"search"`）                       |
| `unified_live.batch.size` | `number` | バッチサイズ（`getContents`, `getLiveStreamsBatch` のみ）       |

### REST スパン属性

| 属性                                | 型        | 説明                                                 |
| :---------------------------------- | :-------- | :--------------------------------------------------- |
| `unified_live.platform`             | `string`  | プラットフォーム識別子                               |
| `http.request.method`               | `string`  | HTTP メソッド（`"GET"`）                             |
| `url.full`                          | `string`  | 完全なリクエスト URL                                 |
| `url.path`                          | `string`  | リクエストパス（例: `"/videos"`）                    |
| `url.scheme`                        | `string`  | URL スキーム（例: `"https"`）                        |
| `http.response.status_code`         | `number`  | HTTP レスポンスステータスコード                      |
| `server.address`                    | `string`  | サーバーホスト名                                     |
| `server.port`                       | `number`  | サーバーポート（HTTPS は 443、HTTP は 80 がデフォルト） |
| `unified_live.rate_limit.remaining` | `number`  | 残りレート制限トークン数                             |
| `unified_live.rate_limit.limit`     | `number`  | レート制限の総容量                                   |
| `unified_live.error.code`           | `string`  | エラーコード（例: `"RATE_LIMIT_EXCEEDED"`）          |
| `error.type`                        | `string`  | HTTP ステータスコード文字列（例: `"404"`）またはエラー名 |
| `unified_live.error.has_cause`      | `boolean` | エラーが原因をラップしているかどうか                 |
| `unified_live.retry.count`          | `number`  | 実行されたリトライ回数                               |

### メトリクス

SDK は以下の OTel メトリクスを出力します:

| メトリクス                     | 型        | 単位 | 説明                         |
| :----------------------------- | :-------- | :--- | :--------------------------- |
| `http.client.request.duration` | Histogram | `s`  | HTTP クライアントリクエスト時間 |

ヒストグラムは以下の属性を記録します: `http.request.method`, `server.address`, `server.port`, `http.response.status_code`（レスポンス受信時）, `error.type`（エラー時）。

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
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "my-app",
  }),
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
