# Post-Implementation Review & Fix Plan

## Context

The plugin-based SDK architecture (YouTube-only MVP) was implemented across Phases 0-7. All gates pass (build, type-check, biome, knip, 120 tests). This review identifies bugs, missing coverage, and cleanup items to address before merging.

## Severity Legend

- **P0 (Bug)**: Runtime error or incorrect behavior
- **P1 (Gap)**: Missing error handling or test coverage for realistic scenarios
- **P2 (Cleanup)**: Template artifacts, docs, minor improvements

---

## P0: Bugs

### P0-1: `getBestThumbnail()` returns invalid data when no thumbnail exists

**File**: `packages/youtube/src/mapper.ts:133-134`

When all thumbnail sizes are `undefined`, returns `{ url: "", width: 0, height: 0 }`. This violates the core `thumbnailSchema` which requires `z.url()` (non-empty valid URL) and `z.int().check(z.positive())` (width/height > 0). Any downstream validation or serialization will fail.

**Fix**: Throw an error or use a known YouTube placeholder URL. Since `thumbnail` is required on `Content` but optional on `Channel`, the simplest fix is to throw — a video with no thumbnail at all is a data integrity issue from YouTube's side.

```ts
function getBestThumbnail(thumbnails: ...) {
  const thumb = thumbnails.high ?? thumbnails.medium ?? thumbnails.default;
  if (!thumb) {
    throw new Error("YouTube video has no thumbnail");
  }
  return { url: thumb.url, width: thumb.width, height: thumb.height };
}
```

### P0-2: `handleResponse` crashes on non-JSON responses

**File**: `packages/core/src/rest/manager.ts:194`

`response.json()` will throw a `SyntaxError` if the response body is not valid JSON (HTML error pages, empty body, etc.). This uncaught error bypasses the error hierarchy entirely.

**Fix**: Wrap in try-catch, throw a meaningful `UnifiedLiveError`.

```ts
handleResponse: async <T>(response: Response, _req: RestRequest): Promise<RestResponse<T>> => {
  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    throw new UnifiedLiveError(
      `Failed to parse response from ${_req.path}`,
      manager.platform,
      "PARSE_ERROR",
    );
  }
  // ... rest unchanged
},
```

### P0-3: `handle.complete()` never called on error paths

**File**: `packages/core/src/rest/manager.ts:155,163`

In the `request` method, `handle.complete(response.headers)` is only called on success (line 155). In the `catch` block, `handle.release()` is called (line 163). However, for non-retriable errors (404, final 401), the code `throw`s before reaching `handle.complete()` — the catch block calls `handle.release()`, which is correct. But: if `handleResponse` itself throws (e.g. P0-2), the response headers are lost. This is actually fine because `release()` is the correct fallback. **No fix needed** — just confirming the error path is safe.

---

## P1: Missing Error Handling & Test Gaps

### P1-1: Missing tests for `getChannel()`, `getLiveStreams()`, `getVideos()`

**File**: `packages/youtube/src/__tests__/plugin.test.ts`

The plugin test only covers `getContent`, `match`, `handleRateLimit`, and `dispose`. The three other main methods have zero test coverage:
- `getChannel()` — three code paths (@handle, UC-ID, custom URL), NotFoundError
- `getLiveStreams()` — search + video fetch pipeline, empty results
- `getVideos()` — channel lookup + playlist + video fetch pipeline, pagination cursor

**Fix**: Add tests for each method with at least: happy path + not-found error.

### P1-2: Missing test for non-JSON response in RestManager

**File**: `packages/core/src/__tests__/rest/manager.test.ts`

No test verifies behavior when the server returns non-JSON (e.g. HTML 502 page). After fixing P0-2, add a test that verifies the error is properly thrown.

### P1-3: `toChannel()` missing JSDoc

**File**: `packages/youtube/src/mapper.ts:112`

Per CLAUDE.md: "Write JSDoc with preconditions, postconditions, and idempotency for public functions." `toChannel()` is exported and has only a one-line JSDoc without the required annotations.

**Fix**: Add full JSDoc matching the `toContent()` pattern.

### P1-4: RestManager type JSDoc missing preconditions/postconditions

**File**: `packages/core/src/rest/manager.ts:26-52`

The overridable method signatures have brief comments but not the formal JSDoc required by CLAUDE.md. The `createRestManager` factory itself (line 55-61) has proper JSDoc — the individual method types should match.

**Fix**: Add `@precondition` / `@postcondition` to each method's JSDoc.

---

## P2: Cleanup

### P2-1: Template artifact references remain

These files reference deleted template paths (`services/api/Dockerfile`, etc.):
- `.semgrepignore` — references `services/api/Dockerfile`
- `.gitleaks.toml` — allowlist references `services/api/Dockerfile`
- `scripts/security-scan.sh` — references template Docker image scan
- `.github/workflows/create-release-pr.yml` — references `develop` branch and `infrastructure/terraform/**`

**Fix**: Clean each file to remove dead references.

### P2-2: `@opentelemetry/api` missing from pnpm catalog

**File**: `pnpm-workspace.yaml`

Core's `package.json` specifies `"@opentelemetry/api": "^1.9.0"` directly instead of using `catalog:`. The spec (`05_PACKAGE_STRUCTURE.md`) expects it in the catalog.

**Fix**: Add `'@opentelemetry/api': ^1.9.0` to `pnpm-workspace.yaml` catalog, update core's `package.json` to `"@opentelemetry/api": "catalog:"`.

### P2-3: `resolveArchive` signature diverges from spec

**File**: `packages/core/src/plugin.ts:50`, `packages/youtube/src/plugin.ts:289`

Spec says `resolveArchive?(live: LiveStream): Promise<Video | null>` but implementation uses `Content` param and `Content | null` return. The broader type works but is less precise.

**Fix**: Narrow to spec signature. The YouTube implementation already checks `content.type === "video"`, so narrowing the param to `LiveStream` just removes the dead branch.

---

## Implementation Order

1. **P0-1** — Fix `getBestThumbnail` (mapper.ts)
2. **P0-2** — Fix `handleResponse` JSON parsing (manager.ts)
3. **P1-1** — Add plugin method tests (plugin.test.ts)
4. **P1-2** — Add non-JSON response test (manager.test.ts)
5. **P1-3** — Add JSDoc to `toChannel` (mapper.ts)
6. **P1-4** — Add JSDoc to RestManager methods (manager.ts)
7. **P2-1** — Clean template artifact references
8. **P2-2** — Add @opentelemetry/api to catalog
9. **P2-3** — Narrow resolveArchive signature

## Files Modified

| File | Changes |
|------|---------|
| `packages/youtube/src/mapper.ts` | P0-1: thumbnail error, P1-3: JSDoc |
| `packages/core/src/rest/manager.ts` | P0-2: JSON parse safety, P1-4: JSDoc |
| `packages/youtube/src/__tests__/plugin.test.ts` | P1-1: getChannel/getLiveStreams/getVideos tests |
| `packages/core/src/__tests__/rest/manager.test.ts` | P1-2: non-JSON response test |
| `packages/core/src/plugin.ts` | P2-3: narrow resolveArchive |
| `packages/youtube/src/plugin.ts` | P2-3: narrow resolveArchive |
| `.semgrepignore` | P2-1: remove template ref |
| `.gitleaks.toml` | P2-1: remove template ref |
| `scripts/security-scan.sh` | P2-1: remove template ref |
| `.github/workflows/create-release-pr.yml` | P2-1: remove template refs |
| `pnpm-workspace.yaml` | P2-2: add @opentelemetry/api to catalog |
| `packages/core/package.json` | P2-2: use catalog: for @opentelemetry/api |

## Verification

```
./scripts/post-edit-check.sh   # build + biome + knip + type-check + test
```
