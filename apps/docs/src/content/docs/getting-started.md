---
title: Getting Started
description: "Install unified-live and run your first API query in minutes"
---

## Installation

Install the core package and the platform plugins you need:

```bash
# Core + YouTube
pnpm add @unified-live/core @unified-live/youtube

# Core + all platforms
pnpm add @unified-live/core @unified-live/youtube @unified-live/twitch @unified-live/twitcasting
```

## Quick Start

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";

// 1. Create a client with platform plugins
const client = UnifiedClient.create({
  plugins: [
    createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

// 2. Fetch content by URL — the client auto-detects the platform
const content = await client.resolve("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

console.log(content.title); // Video title
console.log(content.platform); // "youtube"
console.log(content.type); // "broadcast", "scheduled", "archive", or "clip"
```


## Requirements

- Node.js 18+ (or any runtime with native `fetch`: Deno, Bun, Cloudflare Workers)
- Platform API credentials (see [Platform Plugins](../platform-plugins/))

## Next Steps

- [Overview](../overview/) — Why unified-live and platform API comparison
- [Core Concepts](../core-concepts/) — Content, Channel, and type system
- [Platform Plugins](../platform-plugins/) — Configuration for each platform
- [Error Handling](../error-handling/) — Handling API errors gracefully
