---
title: Advanced Usage
---

## OpenTelemetry Integration

The SDK emits OpenTelemetry traces for every API call. If you have an OTel SDK configured, traces appear automatically. If not, there is zero overhead — the SDK uses a no-op tracer internally.

### Setup

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

// All unified-live API calls now emit traces automatically
const content = await client.getContent("https://youtube.com/watch?v=abc123");
```

### Span Format

Every API request creates a span named `unified-live.rest {platform} {method} {path}`.

Example: `unified-live.rest youtube GET /videos`

### Span Attributes

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `unified_live.platform` | `string` | Platform identifier (`"youtube"`, `"twitch"`, `"twitcasting"`) |
| `http.request.method` | `string` | HTTP method (`"GET"`) |
| `url.path` | `string` | Request path (e.g., `"/videos"`) |
| `http.response.status_code` | `number` | HTTP response status code |
| `unified_live.rate_limit.remaining` | `number` | Remaining rate limit tokens |
| `unified_live.rate_limit.limit` | `number` | Total rate limit capacity |
| `unified_live.quota.consumed` | `number` | Quota units consumed (YouTube) |
| `unified_live.quota.daily_remaining` | `number` | Daily quota remaining (YouTube) |
| `error.code` | `string` | Error code (e.g., `"RATE_LIMIT_EXCEEDED"`) |
| `error.type` | `string` | Error class name |
| `error.has_cause` | `boolean` | Whether the error wraps a cause |

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

const sdk = new NodeSDK({
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
