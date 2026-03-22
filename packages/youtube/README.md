<p align="center">
  <img src="../../apps/docs/public/logo.svg" alt="unified-live logo" width="48" height="48" />
</p>

# @unified-live/youtube

YouTube Data API v3 plugin for the unified-live SDK. Provides quota-based rate limiting, API key auth, and search support.

[![npm](https://img.shields.io/npm/v/@unified-live/youtube.svg)](https://www.npmjs.com/package/@unified-live/youtube)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Install

```bash
pnpm add @unified-live/core @unified-live/youtube
```

## Usage

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";

using client = UnifiedClient.create({
  plugins: [createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! })],
});

const content = await client.resolve("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
```

## Development

```bash
pnpm build        # Build with tsdown (ESM + CJS)
pnpm type-check   # TypeScript type check
pnpm test:run     # Run tests
```

## Docs

See the [full documentation](https://sugar-cat7.github.io/unified-live).
