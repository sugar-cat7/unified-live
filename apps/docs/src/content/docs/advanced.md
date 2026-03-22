---
title: Advanced Usage
description: "OpenTelemetry tracing and metrics"
---

## OpenTelemetry Integration

The SDK supports OpenTelemetry traces and metrics for every API call. `@opentelemetry/api` is an **optional** peer dependency — the SDK works without it, using built-in no-op stubs with zero overhead. Install it only when you need real tracing.

### Setup

```bash
pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/sdk-trace-node @opentelemetry/resources @opentelemetry/semantic-conventions
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

// All unified-live API calls now emit traces and metrics automatically
const content = await client.resolve("https://youtube.com/watch?v=abc123");
```

### Span Hierarchy

Two-level span hierarchy:

```
unified-live.client resolve                ← Client-level span
  └── GET                                  ← REST-level span (kind: CLIENT)
```

Filter by Instrumentation Scope name `unified-live` in your tracing UI.

### Client Span Attributes

| Attribute                 | Type     | Description                                                                                         |
| :------------------------ | :------- | :-------------------------------------------------------------------------------------------------- |
| `unified_live.platform`   | `string` | Platform identifier (`"youtube"`, `"twitch"`, `"twitcasting"`)                                      |
| `unified_live.operation`  | `string` | Operation name (e.g., `"resolve"`, `"search"`)                                                      |
| `unified_live.batch.size` | `number` | Batch size (only for `batchGetContents`, `batchGetBroadcasts`, `batchGetChannels`, `batchGetClips`) |

### REST Span Attributes

Standard HTTP semantic conventions (`http.request.method`, `url.full`, `http.response.status_code`, `server.address`, etc.) are recorded. SDK-specific attributes:

| Attribute                           | Type      | Description                                |
| :---------------------------------- | :-------- | :----------------------------------------- |
| `unified_live.platform`             | `string`  | Platform identifier                        |
| `unified_live.rate_limit.remaining` | `number`  | Remaining rate limit tokens                |
| `unified_live.rate_limit.limit`     | `number`  | Total rate limit capacity                  |
| `unified_live.error.code`           | `string`  | Error code (e.g., `"RATE_LIMIT_EXCEEDED"`) |
| `unified_live.error.has_cause`      | `boolean` | Whether the error wraps a cause            |
| `unified_live.retry.count`          | `number`  | Number of retries performed                |

### Metrics

| Metric                         | Type      | Unit | Description                      |
| :----------------------------- | :-------- | :--- | :------------------------------- |
| `http.client.request.duration` | Histogram | `s`  | Duration of HTTP client requests |

Recorded attributes: `http.request.method`, `server.address`, `server.port`, `http.response.status_code`, `error.type`.

### Using with Jaeger

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/jaeger:latest
```

Install the OTLP exporter and replace `ConsoleSpanExporter` with `OTLPTraceExporter`:

```bash
pnpm add @opentelemetry/exporter-trace-otlp-http
```

```ts
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

// In NodeSDK config:
traceExporter: new OTLPTraceExporter({
  url: "http://localhost:4318/v1/traces",
}),
```

Open `http://localhost:16686` and search for service `my-app`.

### Custom Provider Injection

For testing or multi-tenant scenarios, inject custom `TracerProvider` / `MeterProvider` instead of the global:

```ts
import { UnifiedClient, getTracer, getMeter } from "@unified-live/core";

const client = UnifiedClient.create({
  plugins: [youtubePlugin],
  tracerProvider: myTracerProvider,
});

const tracer = getTracer(myTracerProvider);
const meter = getMeter(myMeterProvider);
```

## Next Steps

- [Examples](../examples/) — Practical code recipes
- [Creating a Plugin](../creating-a-plugin/) — Build your own platform plugin
