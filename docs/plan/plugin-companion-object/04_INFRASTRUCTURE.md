# 04: Infrastructure

## PlatformPlugin.create() Implementation

The core of this feature. `PlatformPlugin.create()` wires `PluginDefinition` + `PluginMethods` into a fully functional `PlatformPlugin`.

### Internal Flow

```
PlatformPlugin.create(definition, methods)
  │
  ├─ 1. createRestManager({
  │       platform: definition.name,
  │       baseUrl: definition.baseUrl,
  │       rateLimitStrategy: definition.rateLimitStrategy,
  │       tokenManager: definition.tokenManager,
  │       headers: definition.headers,
  │       fetch: definition.fetch,
  │       retry: definition.retry,
  │    })
  │
  ├─ 2. Apply transformRequest (if provided)
  │    Wrap rest.request to transform RestRequest before execution
  │
  ├─ 3. Apply handleRateLimit (if provided)
  │    Replace rest.handleRateLimit with the custom handler
  │
  ├─ 4. Apply parseRateLimitHeaders (if provided)
  │    Replace rest.parseRateLimitHeaders with the custom parser
  │
  └─ 5. Return PlatformPlugin object
       {
         name, rest,
         match: definition.matchUrl,
         resolveUrl: definition.matchUrl,
         getContent: (id) => methods.getContent(rest, id),
         getChannel: (id) => methods.getChannel(rest, id),
         getLiveStreams: (channelId) => methods.getLiveStreams(rest, channelId),
         getVideos: (channelId, cursor) => methods.getVideos(rest, channelId, cursor),
         resolveArchive: methods.resolveArchive
           ? (live) => methods.resolveArchive!(rest, live)
           : undefined,
         dispose: () => rest.dispose(),
       }
```

### RestManager Changes

**No changes to RestManager itself.** The `RestManagerOptions` type already supports `headers`:

```ts
// Already exists in rest/types.ts
export type RestManagerOptions = {
  platform: string;
  baseUrl: string;
  rateLimitStrategy: RateLimitStrategy;
  tokenManager?: TokenManager;
  headers?: Record<string, string>; // Already supported
  fetch?: typeof globalThis.fetch;
  retry?: RetryConfig;
};
```

The `headers` field in `RestManagerOptions` is already used in `createHeaders` (line 211 of manager.ts: `...options.headers`). No infrastructure changes needed.

### PlatformPlugin.is() Implementation

```ts
is(value: unknown): value is PlatformPlugin {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === "string" &&
    typeof obj.match === "function" &&
    typeof obj.getContent === "function" &&
    typeof obj.getChannel === "function" &&
    typeof obj.getLiveStreams === "function" &&
    typeof obj.getVideos === "function" &&
    typeof obj.dispose === "function" &&
    obj.rest !== undefined
  );
}
```

## File Changes in Core

```
packages/core/src/
├── plugin.ts        # MODIFIED: Add companion object, PluginDefinition, PluginMethods
├── index.ts         # MODIFIED: Export changes (value export instead of type-only)
└── (all others)     # UNCHANGED
```

## Backward Compatibility

- `PlatformPlugin` type is unchanged — existing code that types against it continues to work
- `createRestManager()` is unchanged — direct usage still works
- Manual override pattern still works — `PlatformPlugin.create()` is additive, not a replacement for advanced customization
