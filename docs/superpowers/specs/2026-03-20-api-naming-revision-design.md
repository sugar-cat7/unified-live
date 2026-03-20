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

Rationale: Broadcast-axis naming reflects the SDK's focus on live-streaming platforms. `Archive` clearly denotes a completed broadcast recording. `Clip` is universal.

### Zod Schema Renames

| Current | New |
|---|---|
| `LiveStreamSchema` | `BroadcastSchema` |
| `ScheduledStreamSchema` | `ScheduledBroadcastSchema` |
| `VideoSchema` | `ArchiveSchema` |
| `ClipSchema` | `ClipSchema` (unchanged) |

### Type Guard Renames (Companion Objects)

| Current | New |
|---|---|
| `Content.isLive()` | `Content.isBroadcast()` |
| `Content.isVideo()` | `Content.isArchive()` |
| `Content.isScheduled()` | `Content.isScheduledBroadcast()` |
| `LiveStream.is()` | `Broadcast.is()` |
| `Video.is()` | `Archive.is()` |
| `ScheduledStream.is()` | `ScheduledBroadcast.is()` |

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

#### Utility (unchanged)

- `register(plugin)`, `platform(name)`, `match(url)`, `platforms()`, `[Symbol.dispose]()`

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
| `resolveArchive?(live)` | `resolveArchive?(broadcast)` (param type changes to `Broadcast`) |
| `getContents?(ids)` | `batchGetContents?(ids)` |
| `getLiveStreamsBatch?(channelIds)` | `batchGetBroadcasts?(channelIds)` |
| `search?(options)` | `search?(options)` (unchanged) |
| `getClips?(channelId, options?)` | `listClips?(channelId, options?)` |
| `getClipsByIds?(ids)` | `batchGetClips?(ids)` |

## Migration Strategy

- **Breaking change**: Major version bump required
- **No deprecated aliases**: No type aliases or re-exports for old names (per project convention: no backwards-compatibility hacks)
- **Clean break**: All renames applied atomically
- **CHANGELOG**: Provide old-name → new-name mapping table for users

## Affected Packages

| Package | Impact |
|---|---|
| `packages/core` | Type definitions, client, plugin interface, tests |
| `packages/youtube` | Plugin implementation |
| `packages/twitch` | Plugin implementation |
| `packages/twitcasting` | Plugin implementation |
| `apps/docs` | Documentation, examples, API guide |

## Implementation Order

Bottom-up per project convention:

1. Types (`types.ts` — schemas, types, companion objects)
2. Plugin interface (`plugin.ts`)
3. Client (`client.ts` — type + implementation)
4. Plugin implementations (youtube, twitch, twitcasting)
5. Tests (all `*.test.ts`)
6. Documentation (`apps/docs`)

## References

- [Google AIP-131: Get](https://google.aip.dev/131)
- [Google AIP-132: List](https://google.aip.dev/132)
- [Google AIP-231: Batch Get](https://google.aip.dev/231)
- [Stripe API naming](https://docs.stripe.com/api)
