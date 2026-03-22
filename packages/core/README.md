<p align="center">
  <img src="../../apps/docs/public/logo.svg" alt="unified-live logo" width="48" height="48" />
</p>

# @unified-live/core

Client, plugin system, unified types, error hierarchy, and OpenTelemetry tracing for the unified-live SDK. **Zero runtime dependencies.**

[![npm](https://img.shields.io/npm/v/@unified-live/core.svg)](https://www.npmjs.com/package/@unified-live/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Install

```bash
pnpm add @unified-live/core
```

## Usage

```ts
import { UnifiedClient } from "@unified-live/core";

using client = UnifiedClient.create({ plugins: [/* ... */] });
const content = await client.resolve("https://www.youtube.com/watch?v=...");
```

## Development

```bash
pnpm build        # Build with tsdown (ESM + CJS)
pnpm type-check   # TypeScript type check
pnpm test:run     # Run tests
```

## Docs

See the [full documentation](https://sugar-cat7.github.io/unified-live).
