# API Naming Revision Design

## Overview

Revise the UnifiedClient public API naming to follow industry-standard conventions (Google AIP, Stripe) and eliminate naming inconsistencies. This is a breaking change affecting domain types, client methods, and plugin interface.

## Motivation

- `All` suffix (`getAllLiveStreams`, `searchAll`) misleads users into expecting exhaustive retrieval; the actual semantics are cross-platform aggregation
- Batch methods use inconsistent suffixes: `getContents` (plural), `getLiveStreamsBatch` (`Batch` suffix), `getClipsByIds` (`ByIds` suffix)
- `get` is used for both single-resource and collection retrieval, contrary to the `get` = single / `list` = collection convention established by Google AIP-131/132
- `LiveStream` / `Video` are platform-specific terms; the SDK targets broadcast platforms more broadly

## Design Decisions

### Naming Conventions (Google AIP alignment)

| Verb | Semantics | Return Type Pattern | Reference |
|---|---|---|---|
| `get` | Single resource by ID | `Promise<T>` | AIP-131 |
| `list` | Collection (optionally paginated) | `Promise<T[]>` or `Promise<Page<T>>` | AIP-132 |
| `batchGet` | Multiple resources by IDs | `Promise<BatchResult<T>>` | AIP-231 |
| `search` | Query-based retrieval | `Promise<Page<T>>` | Stripe convention |
| `cross` | Cross-platform aggregation | `Promise<Record<string, ...>>` | SDK-specific (no industry precedent) |
| `resolve` | URL resolution + content fetch | `Promise<Content>` | SDK-specific convenience |

### Domain Type Renames

| Current | New | Discriminant (`type` field) |
|---|---|---|
| `LiveStream` | `Broadcast` | `"live"` → `"broadcast"` |
| `ScheduledStream` | `ScheduledBroadcast` | `"scheduled"` (unchanged) |
| `Video` | `Archive` | `"video"` → `"archive"` |
| `Clip` | `Clip` | `"clip"` (unchanged) |
| `Content` (union) | `Content` | — (unchanged) |
| `BroadcastSession` | `BroadcastSession` | — (unchanged; groups Broadcast + Archive, no collision) |

Rationale: Broadcast-axis naming reflects the SDK's focus on live-streaming platforms. `Archive` clearly denotes a completed broadcast recording. `Clip` is universal. `BroadcastSession` remains unchanged as it describes a session concept linking `Broadcast` and `Archive`.

**`BroadcastSession.contentIds.liveId`**: Rename to `broadcastId` for consistency with `LiveStream` → `Broadcast`. Similarly, `archiveId` remains unchanged (already aligned with `Archive`).

### Zod Schema Renames

| Current | New |
|---|---|
| `liveStreamSchema` | `broadcastSchema` |
| `scheduledStreamSchema` | `scheduledBroadcastSchema` |
| `videoSchema` | `archiveSchema` |
| `clipSchema` | `clipSchema` (unchanged) |
| `contentSchema` | `contentSchema` (unchanged; internal discriminant literals updated to `"broadcast"` / `"archive"`) |
| `broadcastSessionSchema` | `broadcastSessionSchema` (unchanged) |
| `searchOptionsSchema` | `searchOptionsSchema` (unchanged; see note on `status` below) |

**Note on `searchOptionsSchema.status`**: The `status` enum `["live", "upcoming", "ended"]` is **unchanged**. `"live"` here describes a broadcast state ("currently live"), not a content type discriminant. These are different semantic axes: `type: "broadcast"` identifies the content kind; `status: "live"` describes the current state. Keeping `status: "live"` avoids confusion with the common English meaning.

### Type Guard Renames (Companion Objects)

| Current | New |
|---|---|
| `Content.isLive()` | `Content.isBroadcast()` |
| `Content.isVideo()` | `Content.isArchive()` |
| `Content.isScheduled()` | `Content.isScheduledBroadcast()` |
| `Content.isClip()` | `Content.isClip()` (unchanged) |
| `LiveStream.is()` | `Broadcast.is()` |
| `Video.is()` | `Archive.is()` |
| `ScheduledStream.is()` | `ScheduledBroadcast.is()` |
| `Clip.is()` | `Clip.is()` (unchanged) |
| `Channel.is()` | `Channel.is()` (unchanged) |
| `BroadcastSession.is()` | `BroadcastSession.is()` (unchanged) |

### PluginCapabilities Field Renames

| Current | New |
|---|---|
| `supportsLiveStreams` | `supportsBroadcasts` |
| `supportsBatchLiveStreams` | `supportsBatchBroadcasts` |
| `supportsArchiveResolution` | `supportsArchiveResolution` (unchanged; already uses "Archive") |
| `supportsSearch` | `supportsSearch` (unchanged) |
| `supportsClips` | `supportsClips` (unchanged) |

### UnifiedClient Method Renames

#### Single Resource (`get`)

| Current | New | Signature |
|---|---|---|
| `getContent(url)` | `resolve(url)` | `(url: string) => Promise<Content>` |
| `getContentById(platform, id)` | `getContent(platform, id)` | `(platform: string, id: string) => Promise<Content>` |
| `getChannel(platform, id)` | `getChannel(platform, id)` | unchanged |

#### Collection (`list`)

| Current | New | Return |
|---|---|---|
| `getLiveStreams(platform, channelId)` | `listBroadcasts(platform, channelId)` | `Broadcast[]` |
| `getVideos(platform, channelId, cursor?, pageSize?)` | `listArchives(platform, channelId, cursor?, pageSize?)` | `Page<Archive>` |
| `getClips(platform, channelId, options?)` | `listClips(platform, channelId, options?)` | `Page<Clip>` |

#### Batch (`batchGet`)

| Current | New | Return |
|---|---|---|
| `getContents(platform, ids)` | `batchGetContents(platform, ids)` | `BatchResult<Content>` |
| `getLiveStreamsBatch(platform, channelIds)` | `batchGetBroadcasts(platform, channelIds)` | `BatchResult<Broadcast[]>` |
| `getClipsByIds(platform, ids)` | `batchGetClips(platform, ids)` | `BatchResult<Clip>` |

#### Search

| Current | New | Return |
|---|---|---|
| `search(platform, options)` | `search(platform, options)` | `Page<Content>` (unchanged) |

#### Cross-Platform Aggregation (`cross`)

| Current | New | Return |
|---|---|---|
| `getAllLiveStreams(channelIds)` | `crossListBroadcasts(channels)` | `Record<string, BatchResult<Broadcast[]>>` |
| `searchAll(options)` | `crossSearch(options)` | `Record<string, Page<Content>>` |

Note: `crossListBroadcasts` parameter renamed from `channelIds` to `channels` for clarity. Type remains `Record<string, string[]>`.

#### Utility (unchanged)

- `register(plugin)`, `platform(name)`, `match(url)`, `platforms()`, `[Symbol.dispose]()`

#### UnifiedClient.is() Type Guard

`UnifiedClient.is()` and `PlatformPlugin.is()` both check for method existence to identify instances. The checked method names must be updated to reflect the renames (e.g., check for `resolve`, `getContent`, `listBroadcasts` instead of `getContent`, `getContentById`, `getLiveStreams`).

### PlatformPlugin Method Renames

#### Required Methods

| Current | New |
|---|---|
| `match(url)` | `match(url)` (unchanged) |
| `getContent(id)` | `getContent(id)` (unchanged) |
| `getChannel(id)` | `getChannel(id)` (unchanged) |
| `getLiveStreams(channelId)` | `listBroadcasts(channelId)` |
| `getVideos(channelId, cursor?, pageSize?)` | `listArchives(channelId, cursor?, pageSize?)` |

#### Optional Methods

| Current | New |
|---|---|
| `resolveArchive?(live: LiveStream)` | `resolveArchive?(broadcast: Broadcast): Promise<Archive \| null>` (param + return type updated) |
| `getContents?(ids)` | `batchGetContents?(ids)` |
| `getLiveStreamsBatch?(channelIds)` | `batchGetBroadcasts?(channelIds)` |
| `search?(options)` | `search?(options)` (unchanged) |
| `getClips?(channelId, options?)` | `listClips?(channelId, options?)` |
| `getClipsByIds?(ids)` | `batchGetClips?(ids)` |

### PluginMethods Type

`PluginMethods` (the implementation type wired to `PlatformPlugin` via `PlatformPlugin.create()`) must rename all method keys in lockstep with the PlatformPlugin table above. The same renames apply to `PluginDefinition.methods`.

### Observability: Span Operation Names

All `withClientSpan("operationName", ...)` calls use the method name as the OpenTelemetry span operation name. These must be updated in lockstep with method renames (e.g., `"getLiveStreams"` → `"listBroadcasts"`, `"getAllLiveStreams"` → `"crossListBroadcasts"`). This is a clean break — no backward-compatible span aliases.

### Error Message Strings

User-facing error messages that reference method names (e.g., `"searchAll requires at least one of..."`) must be updated to use new names (e.g., `"crossSearch requires..."`).

### Naming Note: `resolve(url)` vs `resolveArchive(broadcast)`

Both use the verb "resolve" but at different levels with clear context:
- `client.resolve(url)` — resolves a URL to its content (client-level convenience)
- `plugin.resolveArchive(broadcast)` — resolves a broadcast to its archived recording (plugin-level)

The full method names are sufficiently distinct. No rename needed.

## Migration Strategy

- **Breaking change**: Major version bump required
- **No deprecated aliases**: No type aliases or re-exports for old names (per project convention: no backwards-compatibility hacks)
- **Clean break**: All renames applied atomically
- **CHANGELOG**: Provide old-name → new-name mapping table for users

## Affected Packages

| Package | Impact |
|---|---|
| `packages/core` | Type definitions (`types.ts`), client (`client.ts`), plugin interface (`plugin.ts`), barrel exports (`index.ts`), tests |
| `packages/youtube` | Plugin implementation |
| `packages/twitch` | Plugin implementation |
| `packages/twitcasting` | Plugin implementation |
| `apps/docs` | Documentation, examples, API guide |

## Implementation Order

Bottom-up per project convention:

1. Types (`types.ts` — schemas, discriminant literals, types, companion objects, `contentSchema` union)
2. Plugin interface (`plugin.ts` — `PluginCapabilities`, `PluginMethods`, `PluginDefinition`, `PlatformPlugin`)
3. Client (`client.ts` — `UnifiedClient` type, implementation, `UnifiedClient.is()` type guard)
4. Barrel exports (`index.ts`)
5. Plugin implementations (youtube, twitch, twitcasting)
6. Tests (all `*.test.ts`)
7. Documentation (`apps/docs`)

## References

- [Google AIP-131: Get](https://google.aip.dev/131)
- [Google AIP-132: List](https://google.aip.dev/132)
- [Google AIP-231: Batch Get](https://google.aip.dev/231)
- [Stripe API naming](https://docs.stripe.com/api)
