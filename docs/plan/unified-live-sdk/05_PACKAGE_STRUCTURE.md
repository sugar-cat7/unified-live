# 05: Package Structure

Covers monorepo layout, build configuration, and packaging.

## Monorepo Layout

```
unified-live/
├── packages/
│   ├── core/                          # @unified-live/core
│   │   ├── src/
│   │   │   ├── index.ts               # Public exports
│   │   │   ├── client.ts              # UnifiedClient
│   │   │   ├── types.ts               # Content, LiveStream, Video, Channel, etc.
│   │   │   ├── plugin.ts              # PlatformPlugin interface
│   │   │   ├── registry.ts            # PluginRegistry
│   │   │   ├── errors.ts              # Error types
│   │   │   ├── rest/
│   │   │   │   ├── manager.ts         # RestManager (discordeno-style)
│   │   │   │   ├── strategy.ts        # RateLimitStrategy interface
│   │   │   │   ├── bucket.ts          # TokenBucketStrategy
│   │   │   │   ├── quota.ts           # QuotaBudgetStrategy
│   │   │   │   ├── queue.ts           # RequestQueue
│   │   │   │   └── types.ts           # REST-related types
│   │   │   ├── auth/
│   │   │   │   ├── types.ts           # TokenManager interface
│   │   │   │   └── noop.ts            # StaticTokenManager
│   │   │   └── telemetry/
│   │   │       └── traces.ts          # Span creation, attribute helpers
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── youtube/                       # @unified-live/youtube
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── plugin.ts             # YouTubePlugin
│   │   │   ├── adapter.ts            # YouTube response -> Content mapping
│   │   │   ├── quota.ts              # QuotaBudgetStrategy config + cost map
│   │   │   └── generated/
│   │   │       └── types.ts          # openapi-typescript generated types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── twitch/                        # @unified-live/twitch
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── plugin.ts             # TwitchPlugin
│   │   │   ├── adapter.ts            # Twitch response -> Content mapping
│   │   │   ├── auth.ts               # ClientCredentialsTokenManager
│   │   │   ├── rate-limits.ts        # TokenBucketStrategy config
│   │   │   └── generated/
│   │   │       └── types.ts          # openapi-typescript generated types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── twitcasting/                   # @unified-live/twitcasting
│       ├── src/
│       │   ├── index.ts
│       │   ├── plugin.ts             # TwitCastingPlugin
│       │   ├── adapter.ts            # TwitCasting response -> Content mapping
│       │   ├── auth.ts               # BasicAuthTokenManager
│       │   ├── rate-limits.ts        # TokenBucketStrategy config
│       │   └── types.ts              # Manual type definitions (no OpenAPI spec)
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                       # Root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json                 # Shared TS config
└── turbo.json                         # Build orchestration
```

## Dependency Graph

```
@unified-live/youtube    ──┐
@unified-live/twitch     ──┼──> @unified-live/core ──> @opentelemetry/api (peer)
@unified-live/twitcasting──┘
```

**Rules**:
- `core` has zero platform-specific code
- Platform packages depend only on `core`
- Platform packages do not depend on each other
- `@opentelemetry/api` is a peer dependency of `core` (consumer provides it)

## Package Configurations

### `@unified-live/core` package.json

```json
{
  "name": "@unified-live/core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "@opentelemetry/api": "^1.0.0"
  },
  "peerDependenciesMeta": {
    "@opentelemetry/api": {
      "optional": true
    }
  },
  "devDependencies": {
    "tsup": "catalog:",
    "typescript": "catalog:",
    "zod": "catalog:",
    "vitest": "catalog:"
  }
}
```

### Platform package.json (e.g., `@unified-live/youtube`)

```json
{
  "name": "@unified-live/youtube",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "dependencies": {
    "@unified-live/core": "workspace:*"
  },
  "devDependencies": {
    "tsup": "catalog:",
    "typescript": "catalog:",
    "zod": "catalog:",
    "vitest": "catalog:"
  }
}
```

### Root pnpm-workspace.yaml

```yaml
packages:
  - packages/*
catalog:
  '@opentelemetry/api': ^1.9.0
  '@types/node': 20.19.25
  tsup: 8.5.1
  typescript: 5.9.3
  vitest: ^3.0.0
  zod: 4.2.1
```

## Build Configuration

### tsup (per package)

```ts
// packages/core/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@opentelemetry/api"],
});
```

### TypeScript (shared base)

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

Per-package tsconfig extends the base and adds project references:

```json
// packages/youtube/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [
    { "path": "../core" }
  ]
}
```

## Type Generation

### YouTube & Twitch (openapi-typescript)

```bash
# Generate types from OpenAPI specs
pnpm dlx openapi-typescript https://api.apis.guru/v2/specs/googleapis.com/youtube/v3/openapi.yaml \
  -o packages/youtube/src/generated/types.ts

pnpm dlx openapi-typescript https://raw.githubusercontent.com/twitch4j/twitch4j.github.io/master/static/twitch-api.yaml \
  -o packages/twitch/src/generated/types.ts
```

### TwitCasting (Manual)

TwitCasting has no public OpenAPI spec. Types are manually defined in `packages/twitcasting/src/types.ts` based on the [TwitCasting API v2 documentation](https://apiv2-doc.twitcasting.tv/).

## Tree-Shaking

Consumers install only the platforms they need:

```bash
# YouTube only
pnpm add @unified-live/core @unified-live/youtube

# YouTube + Twitch
pnpm add @unified-live/core @unified-live/youtube @unified-live/twitch

# All platforms
pnpm add @unified-live/core @unified-live/youtube @unified-live/twitch @unified-live/twitcasting
```

No unused platform code is included in the bundle.

## Relationship to Existing Packages

The monorepo currently contains template packages (`@my-app/errors`, `@my-app/logger`, `@my-app/dayjs`). For the SDK-only repo:

| Existing Package | Decision |
| --- | --- |
| `@my-app/errors` | Remove. SDK uses thrown exceptions (D-008). |
| `@my-app/logger` | Remove. SDK uses OTel for observability, not application logging. |
| `@my-app/dayjs` | Remove. SDK uses native `Date` and `Intl` APIs. |

## Items to Remove

The following template artifacts are not applicable to the SDK project:

- `services/api/` — No Hono API server
- `services/web/` — No Next.js frontend
- `infrastructure/terraform/` — No infrastructure to deploy
- `docs/web-frontend/` — No frontend docs
- `docs/design/` — No design system
- `docs/backend/sql-antipatterns.md` — No database
- `docs/backend/api-design.md` — No HTTP server (SDK is the API)
- `docs/testing/ui-testing.md`, `docs/testing/vrt-testing.md`, `docs/testing/e2e-testing.md` — No UI

## Testing Strategy

| Layer | Test Type | Tool | What to Test |
| --- | --- | --- | --- |
| Types (schemas, type guards) | Unit | Vitest | Type guards, factory functions, Zod schema validation |
| Rate limiting | Unit | Vitest | TokenBucket acquire/release/refill, QuotaBudget cost tracking/exhaustion |
| Auth | Unit | Vitest (+ mock fetch) | Token fetch, refresh, expiry, thundering herd prevention |
| Platform plugins | Integration | Vitest + MSW | Response mapping, pagination, URL matching (recorded HTTP responses) |
| RestManager | Unit | Vitest (+ mock fetch) | Request flow, retry, error handling, OTel span creation |
| Client (end-to-end) | Integration | Vitest | Full flow: URL -> plugin resolution -> adapter -> response |
