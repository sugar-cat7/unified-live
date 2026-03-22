<p align="center">
  <img src="apps/docs/public/logo.svg" alt="unified-live logo" width="80" height="80" />
</p>

<h1 align="center">unified-live</h1>

<p align="center">
  A TypeScript SDK providing a unified interface for live streaming platform APIs.
</p>

<p align="center">
  <a href="https://github.com/sugar-cat7/unified-live/actions/workflows/pr-check.yaml"><img src="https://github.com/sugar-cat7/unified-live/actions/workflows/pr-check.yaml/badge.svg" alt="CI" /></a>
  <a href="https://app.codecov.io/github/sugar-cat7/unified-live"><img src="https://codecov.io/github/sugar-cat7/unified-live/graph/badge.svg" alt="codecov" /></a>
  <a href="https://github.com/sugar-cat7/unified-live/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" /></a>
  <img src="https://img.shields.io/badge/dependencies-0_(optional_peer:_OTel)-brightgreen.svg" alt="Zero Required Dependencies" />
</p>

<p align="center">
  <a href="https://sugar-cat7.github.io/unified-live">Documentation</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://sugar-cat7.github.io/unified-live/getting-started/">Getting Started</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://sugar-cat7.github.io/unified-live/api/">API Reference</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

Pass a URL and the SDK auto-detects the platform, normalizes the response, and handles auth, rate limits, and retries.

## Features

- **Unified API** — One interface for YouTube, Twitch, and TwitCasting. `Content`, `Channel`, `Broadcast`, `Archive` types work across all platforms.
- **Plugin Architecture** — Install only the platforms you need. Each platform is a separate package with its own auth, rate limiting, and URL resolution.
- **OpenTelemetry Compatible** — Built-in tracing with zero overhead when OTel SDK is not configured. Every API call emits spans with platform, HTTP, rate limit, and quota attributes.
- **Automatic Rate Limiting** — Token bucket (Twitch, TwitCasting) and quota-based (YouTube) strategies handled transparently with exponential backoff retries.
- **Zero Required Dependencies** — The core package has no runtime dependencies. OpenTelemetry tracing is supported via an optional peer dependency. Plain TypeScript types with discriminated unions — no schema libraries, no bloat.
- **Type-Safe** — `Content.isBroadcast()` / `Content.isArchive()` companion object type guards for safe narrowing across all content types.
- **Runtime Agnostic** — Works on Node.js 18+, Deno, Bun, Cloudflare Workers — any runtime with native `fetch`.

## Quick Start

```bash
pnpm add @unified-live/core @unified-live/youtube @unified-live/twitch
```

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";

const client = UnifiedClient.create({
  plugins: [
    createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

// Auto-detects platform from URL
const content = await client.resolve("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

console.log(content.title);
console.log(content.platform); // "youtube"
console.log(content.type); // "broadcast", "scheduled", "archive", or "clip"
```

## Packages

| Package                                             | Description                                                                  |
| :-------------------------------------------------- | :--------------------------------------------------------------------------- |
| [`@unified-live/core`](packages/core)               | Client, plugin system, unified types, error hierarchy, OpenTelemetry tracing |
| [`@unified-live/youtube`](packages/youtube)         | YouTube Data API v3 — quota-based rate limiting, API key auth                |
| [`@unified-live/twitch`](packages/twitch)           | Twitch Helix API — token bucket rate limiting, OAuth2 Client Credentials     |
| [`@unified-live/twitcasting`](packages/twitcasting) | TwitCasting API v2 — token bucket rate limiting, Basic Auth                  |

## Supported Runtimes

| Runtime            | Version     |
| :----------------- | :---------- |
| Node.js            | 18, 20, 22+ |
| Deno               | 1.x+        |
| Bun                | 1.x+        |
| Cloudflare Workers | Supported   |

> Any runtime with native `fetch` is supported. No Node.js-specific dependencies in core.

## Feature Status

| Feature                 | Status |
| :---------------------- | :----- |
| YouTube plugin          | Stable |
| Twitch plugin           | Stable |
| TwitCasting plugin      | Stable |
| OpenTelemetry tracing   | Stable |
| Automatic retries       | Stable |
| Cursor-based pagination | Stable |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Setup
pnpm install

# Quality check (build + lint + type-check + test)
./scripts/post-edit-check.sh
```

## Code of Conduct

This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Authors

- **sugar-cat7** - [GitHub](https://github.com/sugar-cat7)

## License

[MIT](LICENSE)
