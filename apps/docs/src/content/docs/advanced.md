---
title: Advanced Usage
description: "OpenTelemetry tracing and metrics, resource cleanup, and advanced SDK configuration"
---

## OpenTelemetry Integration

The SDK emits OpenTelemetry traces and metrics for every API call. `@opentelemetry/api` is a required peer dependency — when no OTel SDK is registered, it automatically provides no-op implementations with zero overhead.

### Setup

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

// All unified-live API calls now emit traces and metrics automatically
const content = await client.getContent("https://youtube.com/watch?v=abc123");
```

### Custom Provider Injection

You can inject custom `TracerProvider` and `MeterProvider` instances instead of relying on the global OTel registration:

```ts
import { UnifiedClient, getTracer, getMeter } from "@unified-live/core";

// Inject into the client (for client-level spans)
const client = UnifiedClient.create({
  plugins: [youtubePlugin],
  tracerProvider: myTracerProvider,
});

// Inject into REST managers (for HTTP-level spans + metrics)
const manager = createRestManager({
  platform: "youtube",
  baseUrl: "https://www.googleapis.com/youtube/v3",
  rateLimitStrategy: strategy,
  tracerProvider: myTracerProvider,
  meterProvider: myMeterProvider,
});

// Or use directly for custom instrumentation
const tracer = getTracer(myTracerProvider);
const meter = getMeter(myMeterProvider);
```

### Span Hierarchy

The SDK creates a two-level span hierarchy:

```
unified-live.client getContent           ← Client-level span
  ├── unified_live.platform = youtube
  ├── unified_live.operation = getContent
  └── GET                                ← REST-level span (kind: CLIENT)
       ├── http.request.method = GET
       ├── url.full = https://www.googleapis.com/youtube/v3/videos?id=abc
       ├── url.path = /videos
       ├── url.scheme = https
       ├── server.address = www.googleapis.com
       ├── server.port = 443
       └── http.response.status_code = 200
```

**Client-level spans** are created for each public method call (`getContent`, `getContentById`, `getLiveStreams`, `getVideos`, `getChannel`, `getContents`, `getLiveStreamsBatch`, `search`). They carry the operation name and platform.

**REST-level spans** are created for each HTTP request. The span name follows the [OTel HTTP client semantic conventions](https://opentelemetry.io/docs/specs/semconv/http/http-spans/) — just the HTTP method (e.g., `GET`). Use the Instrumentation Scope name `unified-live` to filter spans.

### Client Span Attributes

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `unified_live.platform` | `string` | Platform identifier (`"youtube"`, `"twitch"`, `"twitcasting"`) |
| `unified_live.operation` | `string` | Operation name (e.g., `"getContent"`, `"search"`) |
| `unified_live.batch.size` | `number` | Batch size (only for `getContents`, `getLiveStreamsBatch`) |

### REST Span Attributes

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `unified_live.platform` | `string` | Platform identifier |
| `http.request.method` | `string` | HTTP method (`"GET"`) |
| `url.full` | `string` | Full request URL |
| `url.path` | `string` | Request path (e.g., `"/videos"`) |
| `url.scheme` | `string` | URL scheme (e.g., `"https"`) |
| `http.response.status_code` | `number` | HTTP response status code |
| `server.address` | `string` | Server hostname |
| `server.port` | `number` | Server port (defaults to 443 for HTTPS, 80 for HTTP) |
| `unified_live.rate_limit.remaining` | `number` | Remaining rate limit tokens |
| `unified_live.rate_limit.limit` | `number` | Total rate limit capacity |
| `unified_live.error.code` | `string` | Error code (e.g., `"RATE_LIMIT_EXCEEDED"`) |
| `error.type` | `string` | HTTP status code string (e.g., `"404"`) or exception name |
| `unified_live.error.has_cause` | `boolean` | Whether the error wraps a cause |
| `unified_live.retry.count` | `number` | Number of retries performed |

### Metrics

The SDK emits the following OTel metrics:

| Metric | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `http.client.request.duration` | Histogram | `s` | Duration of HTTP client requests |

The histogram records the following attributes: `http.request.method`, `server.address`, `server.port`, `http.response.status_code` (when a response was received), `error.type` (on failure).

### Using with Jaeger

```bash
# Run Jaeger locally
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

Then open `http://localhost:16686` and search for service `unified-live`.

### Accessing the Tracer

For custom instrumentation, use the exported tracer:

```ts
import { getTracer, SpanAttributes } from "@unified-live/core";

const tracer = getTracer();
const span = tracer.startSpan("my-custom-operation");
span.setAttribute(SpanAttributes.PLATFORM, "youtube");
// ... your logic
span.end();
```

---

## Direct Plugin Access

For platform-specific operations, access plugins directly:

```ts
const youtube = client.platform("youtube");

// Use plugin methods directly
const content = await youtube.getContent("dQw4w9WgXcQ");
const channel = await youtube.getChannel("@GoogleDevelopers");
```

## Accessing Raw API Responses

Every `Content` and `Channel` includes a `raw` field with the original API response:

```ts
const content = await client.getContent(url);

// Access the raw YouTube/Twitch/TwitCasting response
const rawResponse = content.raw;
```

## Content by Platform and ID

When you already know the platform and ID, skip URL resolution:

```ts
// By URL (auto-detects platform)
const content = await client.getContent("https://youtube.com/watch?v=abc123");

// By platform + ID (no URL parsing)
const content = await client.getContentById("youtube", "abc123");
```

## Environment Variables

A recommended `.env` setup:

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

## Next Steps

- [Examples](../examples/) — Practical code recipes
- [Creating a Plugin](../creating-a-plugin/) — Build your own platform plugin
