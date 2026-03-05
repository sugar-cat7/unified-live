# Review #2: Post-Bug-Fix Review

## Context

After the first review fixed 2 bugs (thumbnail validation, JSON parse safety), added 9 tests (120 -> 129), cleaned template artifacts, and aligned `resolveArchive` signature, a second full review was conducted. This review focuses on spec-implementation alignment, remaining test gaps, and a fragile timezone calculation.

## Triage Summary

3 agents explored core, youtube, and project config. Several findings were **false positives**:

- **Zod v4 `.check()` API** — `z.int().check(z.positive())` is valid Zod v4 (verified in review #1)
- **Rate limit handle lifecycle** — Handle is acquired once before the retry loop, reused across retries, then complete/release once. This is correct by design.
- **Upcoming broadcasts misclassified** — SDK has no "upcoming" type; mapping to Video is acceptable MVP behavior.

---

## P1: Spec Divergences (fix docs to match implementation)

### P1-1: `match()` return type in spec

**Spec** (`02_PLUGINS.md:14`): `match(url: string): boolean`
**Impl** (`core/src/plugin.ts:29`): `match(url: string): ResolvedUrl | null`

Fix spec. Implementation is superior — returning `ResolvedUrl | null` avoids a separate `resolveUrl()` call.

### P1-2: `dispose()` optionality in spec

**Spec** (`02_PLUGINS.md:38`): `dispose?(): void`
**Impl** (`core/src/plugin.ts:53`): `dispose(): void`

Fix spec. Required `dispose()` is safer — plugins should always be disposable.

### P1-3: Plugin construction syntax in spec

**Spec** (`03_CLIENT_API.md:17,183,200`): `new YouTubePlugin({ ... })`
**Impl** (`youtube/src/plugin.ts:50`): `createYouTubePlugin({ ... })`

Fix spec. Factory functions follow the discordeno pattern per CLAUDE.md.

### P1-4: `getContent` overload vs `getContentById` in spec

**Spec** (`03_CLIENT_API.md:75`): `client.getContent(platform: string, id: string)` (overload)
**Impl** (`core/src/client.ts:42`): `client.getContentById(platform, id)` (separate method)

Fix spec. Separate method name avoids TypeScript overload complexity.

---

## P1: Code Fix

### P1-5: `nextResetTime()` uses fragile `toLocaleString` parsing

**File**: `packages/core/src/rest/quota.ts:105-116`

```ts
const pt = new Date(
  now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
);
```

Parsing a formatted locale string back into a Date is unreliable across Node.js versions. Replace with `Intl.DateTimeFormat.formatToParts()` which returns structured data.

---

## P1: Missing Tests

### P1-6: `resolveUrl()` untested

**File**: `packages/youtube/src/__tests__/plugin.test.ts`

Delegates to `matchYouTubeUrl()` which is tested, but the plugin method itself needs a direct test.

### P1-7: `resolveArchive()` untested

**File**: `packages/youtube/src/__tests__/plugin.test.ts`

No test covers the archive resolution path (plugin.ts:289-293).

### P1-8: 403 `rateLimitExceeded` untested

**File**: `packages/youtube/src/__tests__/plugin.test.ts`

Only `quotaExceeded` 403 is tested. The `rateLimitExceeded` 403 retry path (plugin.ts:97-104) has no coverage.

### P1-9: Empty playlist in `getVideos()` untested

**File**: `packages/youtube/src/__tests__/plugin.test.ts`

The `{ items: [] }` return path (plugin.ts:259-261) has no test.

---

## P2: Deferred Items

These are tracked but not fixed in this pass:

| Item | Description |
|------|-------------|
| `PlatformNotFoundError(url)` | `client.ts:137` passes full URL as platform name — semantically wrong but informative error message |
| RestManager edge case tests | Multi-401, mixed errors, concurrent requests |
| Turbo cache disabled | `turbo.json` has `"cache": false` on all tasks — likely intentional during dev |
| knip missing in CI | `post-edit-check.sh` runs it locally, but not in `.github/workflows/` |
| biome format check in CI | CI only runs `biome:check`, not full format pipeline |
| `getBestThumbnail` generic Error | Throws `Error` instead of `UnifiedLiveError` — internal function, already tested |

---

## Implementation Order

1. **P1-1..P1-4** — Fix spec docs (`02_PLUGINS.md`, `03_CLIENT_API.md`)
2. **P1-5** — Fix `nextResetTime()` (`quota.ts`)
3. **P1-6..P1-9** — Add 4 missing tests (`plugin.test.ts`)
4. Run `./scripts/post-edit-check.sh`

## Files Modified

| File | Changes |
|------|---------|
| `docs/plan/unified-live-sdk/02_PLUGINS.md` | P1-1: `match()` return type, P1-2: `dispose()` required |
| `docs/plan/unified-live-sdk/03_CLIENT_API.md` | P1-3: factory syntax, P1-4: `getContentById` |
| `packages/core/src/rest/quota.ts` | P1-5: replace `toLocaleString` with `formatToParts` |
| `packages/youtube/src/__tests__/plugin.test.ts` | P1-6..P1-9: resolveUrl, resolveArchive, 403 retry, empty playlist |

## Verification

```
./scripts/post-edit-check.sh   # build + biome + knip + type-check + test
```
