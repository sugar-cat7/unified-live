# Advanced Usage

## OpenTelemetry Integration

The SDK emits OpenTelemetry traces for every API call. If you have an OTel SDK configured, traces appear automatically. If not, there is zero overhead.

```ts
// Install the OTel SDK (optional)
// pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

// Now all unified-live API calls emit traces with:
// - unified_live.platform ("youtube", "twitch", etc.)
// - http.request.method ("GET")
// - rate limit state
// - error information
```

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
