---
title: 応用
description: "OpenTelemetry トレーシングとメトリクス"
---

## OpenTelemetry 連携

SDK はすべての API 呼び出しで OpenTelemetry トレースとメトリクスを出力します。`@opentelemetry/api` は peer dependency です（未設定時は no-op）。

### セットアップ

```bash
pnpm add @opentelemetry/sdk-node @opentelemetry/sdk-trace-node @opentelemetry/resources @opentelemetry/semantic-conventions
```

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "my-app",
  }),
  traceExporter: new ConsoleSpanExporter(),
});
sdk.start();

// unified-live のすべての API 呼び出しが自動的にトレースとメトリクスを出力
const content = await client.getContent("https://youtube.com/watch?v=abc123");
```

### スパン階層

2層のスパン階層:

```
unified-live.client getContent           ← クライアントレベルスパン
  └── GET                                ← REST レベルスパン (kind: CLIENT)
```

トレーシング UI で Instrumentation Scope 名 `unified-live` でフィルタできます。

### クライアントスパン属性

| 属性                      | 型       | 説明                                                               |
| :------------------------ | :------- | :----------------------------------------------------------------- |
| `unified_live.platform`   | `string` | プラットフォーム識別子（`"youtube"`, `"twitch"`, `"twitcasting"`） |
| `unified_live.operation`  | `string` | 操作名（例: `"getContent"`, `"search"`）                           |
| `unified_live.batch.size` | `number` | バッチサイズ（`getContents`, `getLiveStreamsBatch` のみ）          |

### REST スパン属性

標準 HTTP semantic conventions（`http.request.method`, `url.full`, `http.response.status_code`, `server.address` 等）が記録されます。SDK 固有の属性:

| 属性                                | 型        | 説明                                        |
| :---------------------------------- | :-------- | :------------------------------------------ |
| `unified_live.platform`             | `string`  | プラットフォーム識別子                      |
| `unified_live.rate_limit.remaining` | `number`  | 残りレート制限トークン数                    |
| `unified_live.rate_limit.limit`     | `number`  | レート制限の総容量                          |
| `unified_live.error.code`           | `string`  | エラーコード（例: `"RATE_LIMIT_EXCEEDED"`） |
| `unified_live.error.has_cause`      | `boolean` | エラーが原因をラップしているかどうか        |
| `unified_live.retry.count`          | `number`  | 実行されたリトライ回数                      |

### メトリクス

| メトリクス                     | 型        | 単位 | 説明                                |
| :----------------------------- | :-------- | :--- | :---------------------------------- |
| `http.client.request.duration` | Histogram | `s`  | HTTP クライアントリクエスト所要時間 |

記録属性: `http.request.method`, `server.address`, `server.port`, `http.response.status_code`, `error.type`。

### Jaeger での利用

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/jaeger:latest
```

OTLP エクスポーターをインストールし、`ConsoleSpanExporter` を `OTLPTraceExporter` に置き換えます:

```bash
pnpm add @opentelemetry/exporter-trace-otlp-http
```

```ts
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

// NodeSDK config 内:
traceExporter: new OTLPTraceExporter({
  url: "http://localhost:4318/v1/traces",
}),
```

`http://localhost:16686` を開き、サービス名 `my-app` で検索してください。

### カスタム Provider 注入

テストやマルチテナント環境では、グローバルの代わりにカスタムの `TracerProvider` / `MeterProvider` を注入できます:

```ts
import { UnifiedClient, getTracer, getMeter } from "@unified-live/core";

const client = UnifiedClient.create({
  plugins: [youtubePlugin],
  tracerProvider: myTracerProvider,
});

const tracer = getTracer(myTracerProvider);
const meter = getMeter(myMeterProvider);
```

## 次のステップ

- [コード例](../examples/) — 実用的なコードレシピ
- [プラグインの作成](../creating-a-plugin/) — カスタムプラットフォームプラグインの作成
