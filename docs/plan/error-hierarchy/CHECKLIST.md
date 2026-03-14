# Implementation Checklist: error-hierarchy

Spec: `docs/plan/error-hierarchy/`

## Phase 1: Types

Document: `01_TYPES.md`
Status: **Done**

### Goal

Define `ErrorCode`, `ErrorContext` types and rewrite all error classes with new constructors, `cause` support, and `platform` backward-compat getter.

### Checklist

- [x] Define `ErrorCode` string literal union type
- [x] Define `ErrorContext` type
- [x] Rewrite `UnifiedLiveError` base class (code: ErrorCode, context: ErrorContext, cause via ES2022, `platform` getter)
- [x] Rewrite `NotFoundError` (add optional `{ cause }` 3rd arg)
- [x] Rewrite `AuthenticationError` (options object: `{ code?, message?, cause? }`)
- [x] Rewrite `RateLimitError` (options object: `{ retryAfter?, cause? }`)
- [x] Rewrite `QuotaExhaustedError` (add optional `{ cause }` 3rd arg)
- [x] Add `NetworkError` class (code: `NETWORK_*`, options: `{ message?, path?, method?, cause? }`)
- [x] Add `ParseError` class (code: `PARSE_*`, options: `{ message?, path?, status?, cause? }`)
- [x] Add `ValidationError` class (code: `VALIDATION_*`, platform optional)
- [x] Rewrite `PlatformNotFoundError` (use new base constructor)
- [x] Add `classifyNetworkError(error: Error): NetworkCode` helper
- [x] Update `packages/core/src/index.ts` exports (add `ErrorCode`, `ErrorContext`, `NetworkError`, `ParseError`, `ValidationError`, `classifyNetworkError`)
- [x] Update error unit tests (`errors.test.ts`):
  - [x] All existing tests pass with new constructors
  - [x] `error.platform` getter returns `context.platform`
  - [x] `error.cause` preserves original error
  - [x] `error.code` is typed to specific literals per class
  - [x] `ErrorContext` fields are set correctly
  - [x] `NetworkError` with all 4 codes
  - [x] `ParseError` with both codes
  - [x] `ValidationError` with both codes
  - [x] `classifyNetworkError` classifies AbortError, TimeoutError, DNS, connection

### Testing

```bash
pnpm test --filter @unified-live/core
```

### Session Notes

- Done: All types, classes, helper, exports, and 39 tests
- Next: N/A
- Risks/TODO: None

---

## Phase 2: Infrastructure

Document: `04_INFRASTRUCTURE.md`
Status: **Done**

### Goal

Migrate RestManager, auth modules, and OTel instrumentation to use the new error classes.

### Checklist

- [x] RestManager `handleResponse`: replace `UnifiedLiveError("PARSE_ERROR")` with `ParseError("PARSE_JSON", { path, status, cause })`
- [x] RestManager `request`: wrap fetch exceptions in `NetworkError` with `classifyNetworkError`
- [x] RestManager `request`: 401 → `AuthenticationError(platform, { code: "AUTHENTICATION_EXPIRED" })`
- [x] RestManager `request`: 404 → `NotFoundError(platform, req.path)` (compatible, no change needed)
- [x] RestManager `request`: 5xx after retries → `NetworkError("NETWORK_CONNECTION", { path, method })` instead of `RateLimitError`
- [x] RestManager `request`: 429 after retries → `RateLimitError(platform, { retryAfter })` (handled by handleRateLimit)
- [x] OTel spans: add `error.code`, `error.type`, `error.has_cause` attributes
- [x] Static TokenManager (`auth/static.ts`): use `AuthenticationError(platform, { code: "AUTHENTICATION_EXPIRED" })`
- [x] Update RestManager tests (`manager.test.ts`):
  - [x] Existing tests pass (12 tests)
- [x] Update static auth test — passes

### Testing

```bash
pnpm test --filter @unified-live/core
```

### Session Notes

- Done: All RestManager, OTel, and auth migrations. Completed alongside Phase 1 for compilation compatibility.
- Next: N/A
- Risks/TODO: None

---

## Phase 3: Platform Plugins

Document: `02_PLUGINS.md`
Status: **Done**

### Goal

Migrate all plugin throw statements to new error constructors.

### Checklist

- [x] YouTube `mapper.ts`: replace `new Error("YouTube resource has no thumbnail")` with `ParseError`
- [x] YouTube `rate-limit.ts`: verify `QuotaExhaustedError` constructor still compatible
- [x] YouTube `methods.ts`: verify `NotFoundError` calls still compatible
- [x] Twitch `auth.ts`: migrate `AuthenticationError` calls to options object with `cause`
- [x] TwitCasting `methods.ts`: verify `NotFoundError` calls still compatible
- [x] Update YouTube plugin tests (`plugin.test.ts`):
  - [x] Verify error classes and codes in test assertions (52 tests pass)
- [x] Update Twitch plugin tests (`plugin.test.ts`):
  - [x] Verify `AuthenticationError` with new constructor (26 tests pass)
- [x] Update TwitCasting plugin tests (`plugin.test.ts`):
  - [x] Verify error classes in test assertions (21 tests pass)

### Testing

```bash
pnpm test --filter @unified-live/youtube
pnpm test --filter @unified-live/twitch
pnpm test --filter @unified-live/twitcasting
```

### Session Notes

- Done: All plugin migrations. Twitch auth.ts done in Phase 2 for compilation.
- Next: N/A
- Risks/TODO: None

---

## Phase 4: Client API

Document: `03_CLIENT_API.md`
Status: **Done**

### Goal

Add input validation to client methods and verify end-to-end error flow.

### Checklist

- [x] `client.ts` `getContent`: add `ValidationError("VALIDATION_INVALID_INPUT")` for invalid URL input
- [x] `client.ts` `getContentById`: no validation needed (platform lookup already throws PlatformNotFoundError)
- [x] Update client tests (`client.test.ts`):
  - [x] `ValidationError` on empty/invalid URL
  - [x] `PlatformNotFoundError` still works
  - [x] Error `context.platform` accessible
- [x] Run full test suite across all packages — 239 tests pass
- [x] Run `./scripts/post-edit-check.sh` — all gates pass

### Testing

```bash
pnpm test --filter @unified-live/core
./scripts/post-edit-check.sh
```

### Session Notes

- Done: ValidationError in client, test added, full suite green
- Next: N/A
- Risks/TODO: None
