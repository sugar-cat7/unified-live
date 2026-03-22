<p align="center">
  <img src="../../apps/docs/public/logo.svg" alt="unified-live logo" width="48" height="48" />
</p>

# @unified-live/twitcasting

TwitCasting API v2 plugin for the unified-live SDK. Provides token bucket rate limiting and Basic Auth support.

[![npm](https://img.shields.io/npm/v/@unified-live/twitcasting.svg)](https://www.npmjs.com/package/@unified-live/twitcasting)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Install

```bash
pnpm add @unified-live/core @unified-live/twitcasting
```

## Usage

```ts
import { UnifiedClient } from "@unified-live/core";
import { createTwitCastingPlugin } from "@unified-live/twitcasting";

const client = UnifiedClient.create({
  plugins: [
    createTwitCastingPlugin({
      clientId: process.env.TC_CLIENT_ID!,
      clientSecret: process.env.TC_CLIENT_SECRET!,
    }),
  ],
});

const content = await client.resolve("https://twitcasting.tv/username/movie/12345");
```

## Development

```bash
pnpm build        # Build with tsdown (ESM + CJS)
pnpm type-check   # TypeScript type check
pnpm test:run     # Run tests
```

## Docs

See the [full documentation](https://sugar-cat7.github.io/unified-live).
