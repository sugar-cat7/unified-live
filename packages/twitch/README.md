<p align="center">
  <img src="../../apps/docs/public/logo.svg" alt="unified-live logo" width="48" height="48" />
</p>

# @unified-live/twitch

Twitch Helix API plugin for the unified-live SDK. Provides token bucket rate limiting, OAuth2 Client Credentials auth, and clip support.

[![npm](https://img.shields.io/npm/v/@unified-live/twitch.svg)](https://www.npmjs.com/package/@unified-live/twitch)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Install

```bash
pnpm add @unified-live/core @unified-live/twitch
```

## Usage

```ts
import { UnifiedClient } from "@unified-live/core";
import { createTwitchPlugin } from "@unified-live/twitch";

const client = UnifiedClient.create({
  plugins: [
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
});

const content = await client.resolve("https://www.twitch.tv/shroud");
```

## Development

```bash
pnpm build        # Build with tsdown (ESM + CJS)
pnpm type-check   # TypeScript type check
pnpm test:run     # Run tests
```

## Docs

See the [full documentation](https://sugar-cat7.github.io/unified-live).
