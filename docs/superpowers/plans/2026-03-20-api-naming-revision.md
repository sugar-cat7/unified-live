# API Naming Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename domain types, client methods, and plugin interfaces to follow Google AIP / Stripe naming conventions.

**Architecture:** Mechanical rename across all layers (types -> plugin interface -> client -> implementations -> tests -> docs). Each task applies renames to one focused area. No logic changes.

**Tech Stack:** TypeScript, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-03-20-api-naming-revision-design.md`

**CRITICAL: SDK discriminant vs Platform API values**

The SDK discriminant values (`type: "live"`, `type: "video"`) are renamed to `"broadcast"` / `"archive"`. However, platform API query parameters and response types that happen to use the same strings must NOT be renamed:
- YouTube API: `type: "video"` in search queries (YouTube Data API search param)
- Twitch API: `type: "live"` in Helix query params, `type: "live" | ""` in `TwitchStream`, `type: "archive" | "highlight" | "upload"` in `TwitchVideo`
- Only rename `type:` values inside **SDK output objects** (objects that `satisfies Broadcast`, etc.) and **SDK discriminant checks** (`content.type === "live"`)

---

### Task 1: Core Types — Schemas & Type Definitions

**Files:**
- Modify: `packages/core/src/types.ts:47-149` (schemas + types)
- Modify: `packages/core/src/types.ts:179-189` (broadcastSessionSchema.contentIds.liveId)

**Rename Map:**
| Find | Replace |
|---|---|
| `liveStreamSchema` | `broadcastSchema` |
| `type: z.literal("live")` | `type: z.literal("broadcast")` |
| `type LiveStream = z.infer<typeof liveStreamSchema>` | `type Broadcast = z.infer<typeof broadcastSchema>` |
| `videoSchema` | `archiveSchema` |
| `type: z.literal("video")` | `type: z.literal("archive")` |
| `type Video = z.infer<typeof videoSchema>` | `type Archive = z.infer<typeof archiveSchema>` |
| `scheduledStreamSchema` | `scheduledBroadcastSchema` |
| `type ScheduledStream = z.infer<typeof scheduledStreamSchema>` | `type ScheduledBroadcast = z.infer<typeof scheduledBroadcastSchema>` |
| `contentSchema` references to old schema names | updated schema names |
| `liveId` (in broadcastSessionSchema) | `broadcastId` |

- [ ] **Step 1: Rename `liveStreamSchema` -> `broadcastSchema` and `LiveStream` -> `Broadcast`**

In `packages/core/src/types.ts`:
- Line 47: `liveStreamSchema` -> `broadcastSchema`
- Line 48: `z.literal("live")` -> `z.literal("broadcast")`
- Line 60: `type LiveStream` -> `type Broadcast`
- Update JSDoc: references to "live stream" -> "broadcast", `Content.isLive()` -> `Content.isBroadcast()`

- [ ] **Step 2: Rename `videoSchema` -> `archiveSchema` and `Video` -> `Archive`**

- Line 68: `videoSchema` -> `archiveSchema`
- Line 69: `z.literal("video")` -> `z.literal("archive")`
- Line 83: `type Video` -> `type Archive`
- Update JSDoc: references to "video" -> "archive", `Content.isVideo()` -> `Content.isArchive()`

- [ ] **Step 3: Rename `scheduledStreamSchema` -> `scheduledBroadcastSchema` and `ScheduledStream` -> `ScheduledBroadcast`**

- Line 91: `scheduledStreamSchema` -> `scheduledBroadcastSchema`
- Line 102: `type ScheduledStream` -> `type ScheduledBroadcast`
- Update JSDoc: `Content.isScheduled()` -> `Content.isScheduledBroadcast()`

- [ ] **Step 4: Update `contentSchema` discriminated union**

- Lines 136-141: Update schema references inside the union:
  ```ts
  export const contentSchema = z.discriminatedUnion("type", [
    broadcastSchema,
    archiveSchema,
    scheduledBroadcastSchema,
    clipSchema,
  ]);
  ```
- Update JSDoc: `Content.isLive()` / `Content.isVideo()` / `Content.isScheduled()` -> new names

- [ ] **Step 5: Rename `broadcastSessionSchema.contentIds.liveId` -> `broadcastId`**

- Line 186: `liveId` -> `broadcastId`

- [ ] **Step 6: Verify file compiles**

Run: `cd packages/core && npx tsc --noEmit src/types.ts 2>&1 | head -20`
Expected: Type errors from dependent files (plugin.ts, client.ts) — that's OK at this stage.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/types.ts
git commit -m "refactor!: rename domain types — LiveStream->Broadcast, Video->Archive, ScheduledStream->ScheduledBroadcast"
```

---

### Task 2: Core Types — Companion Objects & Type Guards

**Files:**
- Modify: `packages/core/src/types.ts:373-523` (companion objects)

- [ ] **Step 1: Rename `LiveStream` companion object -> `Broadcast`**

Lines 373-385:
```ts
export const Broadcast = {
  is: (value: unknown): value is Broadcast => {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string, unknown>;
    return obj.type === "broadcast" && typeof obj.id === "string" && typeof obj.platform === "string";
  },
} as const;
```

- [ ] **Step 2: Rename `ScheduledStream` companion -> `ScheduledBroadcast`**

Lines 397-411:
```ts
export const ScheduledBroadcast = {
  is: (value: unknown): value is ScheduledBroadcast => {
    ...
    return obj.type === "scheduled" && ...;
  },
} as const;
```

- [ ] **Step 3: Rename `Video` companion -> `Archive`**

Lines 423-435:
```ts
export const Archive = {
  is: (value: unknown): value is Archive => {
    ...
    return obj.type === "archive" && ...;
  },
} as const;
```

- [ ] **Step 4: Update `Content` type guard namespace**

Lines 511-523 (including JSDoc `@postcondition`):
```ts
/**
 * Type guard namespace for Content discriminated union.
 *
 * @precondition content must be a valid Content value
 * @postcondition narrows to Broadcast, Archive, ScheduledBroadcast, or Clip
 * @category Types
 */
export const Content = {
  isBroadcast: (content: Content): content is Broadcast => content.type === "broadcast",
  isScheduledBroadcast: (content: Content): content is ScheduledBroadcast => content.type === "scheduled",
  isArchive: (content: Content): content is Archive => content.type === "archive",
  isClip: (content: Content): content is Clip => content.type === "clip",
} as const;
```

- [ ] **Step 5: Update all JSDoc on companion objects**

Update `@example`, `@returns`, `@postcondition` descriptions to use new type names.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types.ts
git commit -m "refactor!: rename companion objects — LiveStream->Broadcast, Video->Archive, ScheduledStream->ScheduledBroadcast"
```

---

### Task 3: Plugin Interface

**Files:**
- Modify: `packages/core/src/plugin.ts:1-314`

**Rename Map:**
| Find | Replace |
|---|---|
| `supportsLiveStreams` | `supportsBroadcasts` |
| `supportsBatchLiveStreams` | `supportsBatchBroadcasts` |
| `getLiveStreams` (in PluginMethods) | `listBroadcasts` |
| `getVideos` (in PluginMethods) | `listArchives` |
| `getContents` (in PluginMethods) | `batchGetContents` |
| `getLiveStreamsBatch` (in PluginMethods) | `batchGetBroadcasts` |
| `getClips` (in PluginMethods) | `listClips` |
| `getClipsByIds` (in PluginMethods) | `batchGetClips` |
| `LiveStream` (type refs) | `Broadcast` |
| `Video` (type refs) | `Archive` |

- [ ] **Step 1: Update imports**

Line 1-17: Update type imports from `"./types"`:
- `LiveStream` -> `Broadcast`
- `Video` -> `Archive`

- [ ] **Step 2: Rename `PluginCapabilities` fields**

Lines 20-37:
- `supportsLiveStreams` -> `supportsBroadcasts`
- `supportsBatchLiveStreams` -> `supportsBatchBroadcasts`
- Update JSDoc comments

- [ ] **Step 3: Rename `PluginMethods` keys and type refs**

Lines 90-128:
- `getLiveStreams` -> `listBroadcasts`, return `Broadcast[]`
- `getVideos` -> `listArchives`, return `Page<Archive>`
- `resolveArchive` param `LiveStream` -> `Broadcast`, return `Archive | null`
- `getContents` -> `batchGetContents`
- `getLiveStreamsBatch` -> `batchGetBroadcasts`, return `BatchResult<Broadcast[]>`
- `getClips` -> `listClips`
- `getClipsByIds` -> `batchGetClips`

- [ ] **Step 4: Rename `PlatformPlugin` type method signatures**

Lines 137-186: Same renames as PluginMethods, without `rest` param.

- [ ] **Step 5: Update `PlatformPlugin.create()` wiring**

Lines 254-286:
- Rename all capability defaults and method delegations to new names
- `supportsLiveStreams: true` -> `supportsBroadcasts: true`
- `!!methods.getLiveStreamsBatch` -> `!!methods.batchGetBroadcasts`
- `getLiveStreams: (channelId) => methods.getLiveStreams(...)` -> `listBroadcasts: (channelId) => methods.listBroadcasts(...)`
- etc.

- [ ] **Step 6: Update `PlatformPlugin.is()` type guard**

Lines 298-313:
- `obj.getLiveStreams` -> `obj.listBroadcasts`
- `obj.getVideos` -> `obj.listArchives`

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/plugin.ts
git commit -m "refactor!: rename plugin interface methods and capabilities"
```

---

### Task 4: Client — Type Definition & Implementation

**Files:**
- Modify: `packages/core/src/client.ts:1-603`

**Rename Map (methods + types):**
| Current | New |
|---|---|
| `LiveStream` (type ref) | `Broadcast` |
| `Video` (type ref) | `Archive` |
| `ScheduledStream` (type ref, incl. JSDoc) | `ScheduledBroadcast` |
| `getContent(url)` | `resolve(url)` |
| `getContentById(platform, id)` | `getContent(platform, id)` |
| `getLiveStreams(platform, channelId)` | `listBroadcasts(platform, channelId)` |
| `getVideos(...)` | `listArchives(...)` |
| `getContents(platform, ids)` | `batchGetContents(platform, ids)` |
| `getLiveStreamsBatch(platform, channelIds)` | `batchGetBroadcasts(platform, channelIds)` |
| `getClips(...)` | `listClips(...)` |
| `getClipsByIds(...)` | `batchGetClips(...)` |
| `getAllLiveStreams(channelIds)` | `crossListBroadcasts(channels)` |
| `searchAll(options)` | `crossSearch(options)` |

- [ ] **Step 1: Update imports**

Lines 1-24: Update type imports:
- `LiveStream` -> `Broadcast`
- `Video` -> `Archive`

- [ ] **Step 2: Rename `UnifiedClient` type signatures**

Lines 33-223: Apply full rename map to all method signatures and JSDoc.

Key changes:
- `getContent(url: string): Promise<Content>` -> `resolve(url: string): Promise<Content>`
- `getContentById(platform: string, id: string): Promise<Content>` -> `getContent(platform: string, id: string): Promise<Content>`
- `getLiveStreams(...)` -> `listBroadcasts(...)` returning `Broadcast[]`
- `getVideos(...)` -> `listArchives(...)` returning `Page<Archive>`
- `getContents(...)` -> `batchGetContents(...)`
- `getLiveStreamsBatch(...)` -> `batchGetBroadcasts(...)` with `BatchResult<Broadcast[]>`
- `getClips(...)` -> `listClips(...)`
- `getClipsByIds(...)` -> `batchGetClips(...)`
- `getAllLiveStreams(channelIds)` -> `crossListBroadcasts(channels)` with `BatchResult<Broadcast[]>`
- `searchAll(options)` -> `crossSearch(options)`

- [ ] **Step 3: Rename implementation method keys + span names**

Lines 245-572: Rename all method implementations:
- Method keys to match new names
- `withClientSpan("getContent", ...)` -> `withClientSpan("resolve", ...)`
- `withClientSpan("getContentById", ...)` -> `withClientSpan("getContent", ...)`
- `withClientSpan("getLiveStreams", ...)` -> `withClientSpan("listBroadcasts", ...)`
- `withClientSpan("getVideos", ...)` -> `withClientSpan("listArchives", ...)`
- `withClientSpan("getContents", ...)` -> `withClientSpan("batchGetContents", ...)`
- `withClientSpan("getLiveStreamsBatch", ...)` -> `withClientSpan("batchGetBroadcasts", ...)`
- `withClientSpan("getClips", ...)` -> `withClientSpan("listClips", ...)`
- `withClientSpan("getClipsByIds", ...)` -> `withClientSpan("batchGetClips", ...)`
- `withClientSpan("getAllLiveStreams", ...)` -> `withClientSpan("crossListBroadcasts", ...)`
- `withClientSpan("searchAll", ...)` -> `withClientSpan("crossSearch", ...)`

- [ ] **Step 4: Update internal cross-references**

In `crossListBroadcasts` implementation:
- `client.getLiveStreamsBatch(platform, ids)` -> `client.batchGetBroadcasts(platform, ids)`

In batch fallback logic:
- `plugin.getContents` -> `plugin.batchGetContents`
- `plugin.getLiveStreamsBatch` -> `plugin.batchGetBroadcasts`
- `plugin.getClipsByIds` -> `plugin.batchGetClips`
- `plugin.getLiveStreams` -> `plugin.listBroadcasts`

- [ ] **Step 5: Update error messages**

- `"searchAll requires..."` -> `"crossSearch requires..."`
- Any method name references in error strings

- [ ] **Step 6: Update `UnifiedClient.is()` type guard**

Lines 581-603: Update checked method names:
- `"getContent"`, `"getContentById"` -> `"resolve"`, `"getContent"`
- `"getLiveStreams"` -> `"listBroadcasts"`
- `"getVideos"` -> `"listArchives"`
- etc.

- [ ] **Step 7: Update plugin capability checks**

- `plugin.capabilities.supportsLiveStreams` -> `plugin.capabilities.supportsBroadcasts` (if referenced)
- `plugin.capabilities.supportsBatchLiveStreams` -> `plugin.capabilities.supportsBatchBroadcasts`

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/client.ts
git commit -m "refactor!: rename UnifiedClient methods — resolve, listBroadcasts, batchGet, cross prefixes"
```

---

### Task 5: Core Barrel Exports

**Files:**
- Modify: `packages/core/src/index.ts:55-78`

- [ ] **Step 1: Update exports**

```ts
// --- Types ---
export type { ClipOptions, KnownPlatform, ResolvedUrl, SearchOptions } from "./types";
export {
  BatchResult,
  Broadcast,
  broadcastSchema,
  Channel,
  channelRefSchema,
  channelSchema,
  Clip,
  clipOptionsSchema,
  clipSchema,
  Content,
  contentSchema,
  knownPlatforms,
  Page,
  resolvedUrlSchema,
  ScheduledBroadcast,
  scheduledBroadcastSchema,
  searchOptionsSchema,
  thumbnailSchema,
  Archive,
  archiveSchema,
} from "./types";
```

Key changes:
- `LiveStream` -> `Broadcast`
- `liveStreamSchema` -> `broadcastSchema`
- `Video` -> `Archive`
- `videoSchema` -> `archiveSchema`
- `ScheduledStream` -> `ScheduledBroadcast`
- `scheduledStreamSchema` -> `scheduledBroadcastSchema`

- [ ] **Step 2: Verify core package compiles**

Run: `cd packages/core && npx tsc --noEmit 2>&1 | head -30`
Expected: Errors only from downstream packages (youtube/twitch/twitcasting) — core itself should compile clean.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "refactor!: update barrel exports for renamed types"
```

---

### Task 6: YouTube Plugin

**Files:**
- Modify: `packages/youtube/src/mapper.ts`
- Modify: `packages/youtube/src/methods.ts`
- Modify: `packages/youtube/src/plugin.ts`
- Modify: `packages/youtube/src/index.ts`

- [ ] **Step 1: Update `mapper.ts`**

- Import: `LiveStream` -> `Broadcast`, `Video` -> `Archive`, `ScheduledStream` -> `ScheduledBroadcast`
- SDK output objects only: `type: "live"` -> `type: "broadcast"`, `type: "video"` -> `type: "archive"`
- `satisfies LiveStream` -> `satisfies Broadcast`
- `satisfies Video` -> `satisfies Archive`
- `satisfies ScheduledStream` -> `satisfies ScheduledBroadcast`
- Update JSDoc: "LiveStream" -> "Broadcast", "Video" -> "Archive"

- [ ] **Step 2: Rename method functions in `methods.ts`**

**WARNING:** YouTube API query params `type: "video"` (search API param) must NOT be renamed. Only rename SDK discriminant checks like `content.type === "live"` -> `content.type === "broadcast"`.

| Current | New |
|---|---|
| `youtubeGetLiveStreams` | `youtubeListBroadcasts` |
| `youtubeGetVideos` | `youtubeListArchives` |
| `youtubeGetContents` | `youtubeBatchGetContents` |
| `youtubeResolveArchive` | `youtubeResolveArchive` (unchanged — only param/return types change) |

- Update return type annotations: `LiveStream[]` -> `Broadcast[]`, `Page<Video>` -> `Page<Archive>`, `Video | null` -> `Archive | null`
- Update imports from `@unified-live/core`

- [ ] **Step 3: Update `plugin.ts` method wiring**

- Import renames: `youtubeGetLiveStreams` -> `youtubeListBroadcasts`, etc.
- Method object keys:
  ```ts
  {
    getContent: youtubeGetContent,
    getChannel: youtubeGetChannel,
    listBroadcasts: youtubeListBroadcasts,
    listArchives: youtubeListArchives,
    resolveArchive: youtubeResolveArchive,
    batchGetContents: youtubeBatchGetContents,
    search: youtubeSearch,
  }
  ```

- [ ] **Step 4: Update `index.ts` barrel exports**

- `YouTubeTypedLiveStream` -> `YouTubeTypedBroadcast` (type alias using `Broadcast`)
- `YouTubeTypedVideo` -> `YouTubeTypedArchive` (type alias using `Archive`)
- Update method re-exports if any

- [ ] **Step 5: Verify compilation**

Run: `cd packages/youtube && npx tsc --noEmit 2>&1 | head -20`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/youtube/src/mapper.ts packages/youtube/src/methods.ts packages/youtube/src/plugin.ts packages/youtube/src/index.ts
git commit -m "refactor!: rename YouTube plugin methods to new API conventions"
```

---

### Task 7: Twitch Plugin

**Files:**
- Modify: `packages/twitch/src/mapper.ts`
- Modify: `packages/twitch/src/methods.ts`
- Modify: `packages/twitch/src/plugin.ts`
- Modify: `packages/twitch/src/index.ts`

- [ ] **Step 1: Update `mapper.ts`**

- Import: `LiveStream` -> `Broadcast`, `Video` -> `Archive`
- SDK output objects only: `type: "live"` -> `type: "broadcast"`, `type: "video"` -> `type: "archive"`
- `satisfies LiveStream` -> `satisfies Broadcast`
- `satisfies Video` -> `satisfies Archive`
- Function `toLive` return type: `LiveStream` -> `Broadcast`
- Function `toVideo` return type: `Video` -> `Archive`
- Function `toSearchLive` return type: `LiveStream` -> `Broadcast`
- Update JSDoc

**WARNING: DO NOT rename Twitch API type definitions:**
- `TwitchStream.type: "live" | ""` (line 15) — Twitch Helix API field
- `TwitchVideo.type: "archive" | "highlight" | "upload"` (line 32) — Twitch Helix API field

- [ ] **Step 2: Rename method functions in `methods.ts`**

**WARNING:** Twitch API query params `type: "live"` in search/batch requests must NOT be renamed. Only rename SDK discriminant checks.

| Current | New |
|---|---|
| `twitchGetLiveStreams` | `twitchListBroadcasts` |
| `twitchGetVideos` | `twitchListArchives` |
| `twitchGetContents` | `twitchBatchGetContents` |
| `twitchGetLiveStreamsBatch` | `twitchBatchGetBroadcasts` |
| `twitchGetClips` | `twitchListClips` |
| `twitchGetClipsByIds` | `twitchBatchGetClips` |
| `twitchResolveArchive` | `twitchResolveArchive` (unchanged — only types change) |

- Update return type annotations and imports

- [ ] **Step 3: Update `plugin.ts` method wiring**

```ts
{
  getContent: twitchGetContent,
  getChannel: twitchGetChannel,
  listBroadcasts: twitchListBroadcasts,
  listArchives: twitchListArchives,
  resolveArchive: twitchResolveArchive,
  batchGetContents: twitchBatchGetContents,
  batchGetBroadcasts: twitchBatchGetBroadcasts,
  search: twitchSearch,
  listClips: twitchListClips,
  batchGetClips: twitchBatchGetClips,
}
```

- [ ] **Step 4: Update `index.ts` barrel exports**

- `TwitchTypedLiveStream` -> `TwitchTypedBroadcast` (type alias using `Broadcast`)
- `TwitchTypedVideo` -> `TwitchTypedArchive` (type alias using `Archive`)
- Update method re-exports if any
- Update capability references: `supportsBatchLiveStreams` -> `supportsBatchBroadcasts`

- [ ] **Step 5: Verify compilation**

Run: `cd packages/twitch && npx tsc --noEmit 2>&1 | head -20`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/twitch/src/mapper.ts packages/twitch/src/methods.ts packages/twitch/src/plugin.ts packages/twitch/src/index.ts
git commit -m "refactor!: rename Twitch plugin methods to new API conventions"
```

---

### Task 8: TwitCasting Plugin

**Files:**
- Modify: `packages/twitcasting/src/mapper.ts`
- Modify: `packages/twitcasting/src/methods.ts`
- Modify: `packages/twitcasting/src/plugin.ts`
- Modify: `packages/twitcasting/src/index.ts`

- [ ] **Step 1: Update `mapper.ts`**

- Import: `LiveStream` -> `Broadcast`, `Video` -> `Archive`
- `type: "live"` -> `type: "broadcast"`
- `type: "video"` -> `type: "archive"`
- `satisfies LiveStream` -> `satisfies Broadcast`
- `satisfies Video` -> `satisfies Archive`
- Function `toLive` return type: `LiveStream` -> `Broadcast`
- Function `toVideo` return type: `Video` -> `Archive`
- Update JSDoc

- [ ] **Step 2: Rename method functions in `methods.ts`**

| Current | New |
|---|---|
| `twitcastingGetLiveStreams` | `twitcastingListBroadcasts` |
| `twitcastingGetVideos` | `twitcastingListArchives` |
| `twitcastingResolveArchive` | `twitcastingResolveArchive` (unchanged — only types change) |

- Update return type annotations and imports

- [ ] **Step 3: Update `plugin.ts` method wiring**

```ts
{
  getContent: twitcastingGetContent,
  getChannel: twitcastingGetChannel,
  listBroadcasts: twitcastingListBroadcasts,
  listArchives: twitcastingListArchives,
  resolveArchive: twitcastingResolveArchive,
  search: twitcastingSearch,
}
```

- [ ] **Step 4: Update `index.ts` barrel exports**

- `TwitCastingTypedLiveStream` -> `TwitCastingTypedBroadcast` (type alias using `Broadcast`)
- `TwitCastingTypedVideo` -> `TwitCastingTypedArchive` (type alias using `Archive`)
- Update method re-exports if any

- [ ] **Step 5: Verify compilation**

Run: `cd packages/twitcasting && npx tsc --noEmit 2>&1 | head -20`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/twitcasting/src/mapper.ts packages/twitcasting/src/methods.ts packages/twitcasting/src/plugin.ts packages/twitcasting/src/index.ts
git commit -m "refactor!: rename TwitCasting plugin methods to new API conventions"
```

---

### Task 9: Core Tests

**Files:**
- Modify: `packages/core/src/types.test.ts`
- Modify: `packages/core/src/plugin.test.ts`
- Modify: `packages/core/src/client.test.ts`

- [ ] **Step 1: Update `types.test.ts`**

Apply full rename map across all test cases:
- Imports: `LiveStream`, `liveStreamSchema`, `Video`, `videoSchema`, `ScheduledStream`, `scheduledStreamSchema` -> new names
- Test data: `type: "live"` -> `type: "broadcast"`, `type: "video"` -> `type: "archive"`
- Type guard tests: `Content.isLive()` -> `Content.isBroadcast()`, `Content.isVideo()` -> `Content.isArchive()`, `Content.isScheduled()` -> `Content.isScheduledBroadcast()`
- Companion objects: `LiveStream.is()` -> `Broadcast.is()`, `Video.is()` -> `Archive.is()`, `ScheduledStream.is()` -> `ScheduledBroadcast.is()`
- `BroadcastSession` tests: `liveId` -> `broadcastId`

- [ ] **Step 2: Update `plugin.test.ts`**

- Method references: `getLiveStreams` -> `listBroadcasts`, `getVideos` -> `listArchives`
- Mock methods: rename keys in mock plugin methods objects
- Capability references: `supportsLiveStreams` -> `supportsBroadcasts`, `supportsBatchLiveStreams` -> `supportsBatchBroadcasts`
- Type references: `LiveStream` -> `Broadcast`, `Video` -> `Archive`

- [ ] **Step 3: Update `client.test.ts`**

- Method calls: `client.getContent(url)` -> `client.resolve(url)`, `client.getContentById(...)` -> `client.getContent(...)`, `client.getLiveStreams(...)` -> `client.listBroadcasts(...)`, etc.
- Mock plugin methods: rename all keys
- Type references: `LiveStream` -> `Broadcast`, `Video` -> `Archive`
- `getAllLiveStreams` -> `crossListBroadcasts`
- `searchAll` -> `crossSearch`
- Test data: `type: "live"` -> `type: "broadcast"`, `type: "video"` -> `type: "archive"`

- [ ] **Step 4: Run core tests**

Run: `cd packages/core && npx vitest run 2>&1 | tail -30`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.test.ts packages/core/src/plugin.test.ts packages/core/src/client.test.ts
git commit -m "test: update core tests for API naming revision"
```

---

### Task 10: YouTube Tests

**Files:**
- Modify: `packages/youtube/src/mapper.test.ts`
- Modify: `packages/youtube/src/methods.test.ts`
- Modify: `packages/youtube/src/plugin.test.ts`
- Modify: `packages/youtube/src/integration.test.ts`

- [ ] **Step 1: Update `mapper.test.ts`**

- Type references and discriminant values
- `LiveStream` -> `Broadcast`, `Video` -> `Archive`, `ScheduledStream` -> `ScheduledBroadcast`
- `type: "live"` -> `type: "broadcast"`, `type: "video"` -> `type: "archive"`

- [ ] **Step 2: Update `methods.test.ts`**

- Import renames: `youtubeGetLiveStreams` -> `youtubeListBroadcasts`, `youtubeGetVideos` -> `youtubeListArchives`, `youtubeGetContents` -> `youtubeBatchGetContents`
- Describe block names and method calls

- [ ] **Step 3: Update `plugin.test.ts` and `integration.test.ts`**

- Method call renames: `plugin.getLiveStreams()` -> `plugin.listBroadcasts()`, etc.
- Type references and discriminant values

- [ ] **Step 4: Run YouTube tests**

Run: `cd packages/youtube && npx vitest run 2>&1 | tail -30`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/youtube/src/mapper.test.ts packages/youtube/src/methods.test.ts packages/youtube/src/plugin.test.ts packages/youtube/src/integration.test.ts
git commit -m "test: update YouTube tests for API naming revision"
```

---

### Task 11: Twitch Tests

**Files:**
- Modify: `packages/twitch/src/mapper.test.ts`
- Modify: `packages/twitch/src/methods.test.ts`
- Modify: `packages/twitch/src/plugin.test.ts`
- Modify: `packages/twitch/src/integration.test.ts`

- [ ] **Step 1: Update `mapper.test.ts`**

- `LiveStream` -> `Broadcast`, `Video` -> `Archive`
- `type: "live"` -> `type: "broadcast"`, `type: "video"` -> `type: "archive"`

- [ ] **Step 2: Update `methods.test.ts`**

- Import renames: `twitchGetLiveStreams` -> `twitchListBroadcasts`, `twitchGetVideos` -> `twitchListArchives`, `twitchGetContents` -> `twitchBatchGetContents`, `twitchGetLiveStreamsBatch` -> `twitchBatchGetBroadcasts`, `twitchGetClips` -> `twitchListClips`, `twitchGetClipsByIds` -> `twitchBatchGetClips`
- Describe blocks and method calls

- [ ] **Step 3: Update `plugin.test.ts` and `integration.test.ts`**

- Method call renames and type references

- [ ] **Step 4: Run Twitch tests**

Run: `cd packages/twitch && npx vitest run 2>&1 | tail -30`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twitch/src/mapper.test.ts packages/twitch/src/methods.test.ts packages/twitch/src/plugin.test.ts packages/twitch/src/integration.test.ts
git commit -m "test: update Twitch tests for API naming revision"
```

---

### Task 12: TwitCasting Tests

**Files:**
- Modify: `packages/twitcasting/src/mapper.test.ts`
- Modify: `packages/twitcasting/src/methods.test.ts`
- Modify: `packages/twitcasting/src/plugin.test.ts`
- Modify: `packages/twitcasting/src/integration.test.ts`

- [ ] **Step 1: Update `mapper.test.ts`**

- `LiveStream` -> `Broadcast`, `Video` -> `Archive`
- `type: "live"` -> `type: "broadcast"`, `type: "video"` -> `type: "archive"`

- [ ] **Step 2: Update `methods.test.ts`**

- Import renames: `twitcastingGetLiveStreams` -> `twitcastingListBroadcasts`, `twitcastingGetVideos` -> `twitcastingListArchives`
- Describe blocks and method calls

- [ ] **Step 3: Update `plugin.test.ts` and `integration.test.ts`**

- Method call renames and type references

- [ ] **Step 4: Run TwitCasting tests**

Run: `cd packages/twitcasting && npx vitest run 2>&1 | tail -30`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twitcasting/src/mapper.test.ts packages/twitcasting/src/methods.test.ts packages/twitcasting/src/plugin.test.ts packages/twitcasting/src/integration.test.ts
git commit -m "test: update TwitCasting tests for API naming revision"
```

---

### Task 13: Example Code

**Files:**
- Modify: `examples/basic-usage.ts`

- [ ] **Step 1: Update all method calls and type references**

- `client.getContent(url)` -> `client.resolve(url)`
- `Content.isVideo()` -> `Content.isArchive()`
- `Content.isLive()` -> `Content.isBroadcast()`
- `client.getVideos()` -> `client.listArchives()`
- `client.getLiveStreams()` -> `client.listBroadcasts()`
- `LiveStream` -> `Broadcast`, `Video` -> `Archive`

- [ ] **Step 2: Commit**

```bash
git add examples/basic-usage.ts
git commit -m "docs: update example code for API naming revision"
```

---

### Task 14: Documentation (English)

**Files:**
- Modify: `apps/docs/src/content/docs/getting-started.md`
- Modify: `apps/docs/src/content/docs/core-concepts.md`
- Modify: `apps/docs/src/content/docs/examples.md`
- Modify: `apps/docs/src/content/docs/advanced.md`
- Modify: `apps/docs/src/content/docs/pagination.md`
- Modify: `apps/docs/src/content/docs/error-handling.md`
- Modify: `apps/docs/src/content/docs/platform-plugins.md`
- Modify: `apps/docs/src/content/docs/creating-a-plugin.md`
- Modify: `apps/docs/src/content/docs/overview.md`
- Modify: `apps/docs/src/content/docs/index.mdx` (if exists)

- [ ] **Step 1: Apply rename map across all English docs**

Global find/replace in each file:
| Find | Replace |
|---|---|
| `LiveStream` | `Broadcast` |
| `liveStreamSchema` | `broadcastSchema` |
| `ScheduledStream` | `ScheduledBroadcast` |
| `scheduledStreamSchema` | `scheduledBroadcastSchema` |
| `Video` (as type — context-sensitive) | `Archive` |
| `videoSchema` | `archiveSchema` |
| `Content.isLive()` | `Content.isBroadcast()` |
| `Content.isVideo()` | `Content.isArchive()` |
| `Content.isScheduled()` | `Content.isScheduledBroadcast()` |
| `getContent(url)` | `resolve(url)` |
| `getContentById` | `getContent` |
| `getLiveStreams` | `listBroadcasts` |
| `getVideos` | `listArchives` |
| `getContents` | `batchGetContents` |
| `getLiveStreamsBatch` | `batchGetBroadcasts` |
| `getClips` | `listClips` |
| `getClipsByIds` | `batchGetClips` |
| `getAllLiveStreams` | `crossListBroadcasts` |
| `searchAll` | `crossSearch` |
| `type: "live"` | `type: "broadcast"` |
| `type: "video"` | `type: "archive"` |
| `supportsLiveStreams` | `supportsBroadcasts` |

Note: `Video` replacement must be context-sensitive — only replace when used as a type name, not in prose ("video" as a general word).

- [ ] **Step 2: Commit**

```bash
git add apps/docs/src/content/docs/*.md apps/docs/src/content/docs/*.mdx
git commit -m "docs: update English documentation for API naming revision"
```

---

### Task 15: Documentation (Japanese)

**Files:**
- Modify: All files in `apps/docs/src/content/docs/ja/`

- [ ] **Step 1: Apply same rename map as Task 14 across all Japanese docs**

Same global find/replace. Code samples and type names are identical; Japanese prose around them stays unchanged.

- [ ] **Step 2: Commit**

```bash
git add apps/docs/src/content/docs/ja/
git commit -m "docs: update Japanese documentation for API naming revision"
```

---

### Task 16: Full Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run 2>&1 | tail -50`
Expected: ALL PASS

- [ ] **Step 2: Run post-edit-check**

Run: `./scripts/post-edit-check.sh`
Expected: PASS (lint, format, type-check)

- [ ] **Step 3: Search for orphaned old names**

Run grep for each old name to ensure no SDK references remain. Use word-boundary aware patterns to avoid false positives:
```bash
# SDK type names (avoid matching Twitch/YouTube API types)
grep -rP "\bLiveStream\b|\bVideoSchema\b|\bliveStreamSchema\b|\bScheduledStream\b|\bscheduledStreamSchema\b|\bvideoSchema\b" packages/ apps/ examples/ --include="*.ts" --include="*.tsx" --include="*.md" --include="*.mdx" -l

# SDK method names
grep -rP "\bgetLiveStreams\b|\bgetVideos\b|\bgetContentById\b|\bgetLiveStreamsBatch\b|\bgetClipsByIds\b|\bgetAllLiveStreams\b|\bsearchAll\b|\bgetContents\b" packages/ apps/ examples/ --include="*.ts" --include="*.tsx" --include="*.md" --include="*.mdx" -l

# SDK capability names
grep -rP "\bsupportsLiveStreams\b|\bsupportsBatchLiveStreams\b" packages/ apps/ examples/ --include="*.ts" --include="*.md" -l

# BroadcastSession field
grep -rP "\bliveId\b" packages/ apps/ examples/ --include="*.ts" -l

# Content.isLive, Content.isVideo, Content.isScheduled
grep -rP "Content\.isLive|Content\.isVideo|Content\.isScheduled[^B]" packages/ apps/ examples/ --include="*.ts" --include="*.md" -l
```
Expected: No matches (or only in CHANGELOG / spec docs / plan docs).
Note: `Video` as a standalone word is too generic — check manually for type usage vs prose.

- [ ] **Step 4: Final commit if any fixes needed**

Stage only the specific files that needed fixing, then commit.
