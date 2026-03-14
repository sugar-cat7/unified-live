# Implementation Checklist: plugin-companion-object

Spec: `docs/plan/plugin-companion-object/`

## Phase 1: Types

Document: `01_TYPES.md`
Status: Done

### Goal

Define `PluginDefinition`, `PluginMethods` types and `PlatformPlugin` companion object skeleton in `@unified-live/core`.

### Checklist

- [x] Define `PluginDefinition` type in `packages/core/src/plugin.ts`
- [x] Define `PluginMethods` type in `packages/core/src/plugin.ts`
- [x] Add `PlatformPlugin` companion object value with `create` and `is`
- [x] Update `packages/core/src/index.ts` exports
- [x] Verify build: `pnpm build --filter @unified-live/core`
- [x] Verify existing tests still pass: `pnpm test:run --filter @unified-live/core`

### Session Notes

2026-03-08

- Done: PluginDefinition, PluginMethods types and PlatformPlugin companion object implemented in plugin.ts. Exports updated. Build and 82 existing tests pass.
- Next: Phase 2
- Risks/TODO: None

---

## Phase 2: Infrastructure

Document: `04_INFRASTRUCTURE.md`
Status: Done

### Goal

Implement `PlatformPlugin.create()` and `PlatformPlugin.is()` in core.

### Checklist

- [x] Implement `PlatformPlugin.create(definition, methods)` logic
- [x] Implement `PlatformPlugin.is(value)` type guard
- [x] Unit tests for `PlatformPlugin.create()` (13 tests)
- [x] Unit tests for `PlatformPlugin.is()` (8 tests)
- [x] Verify build and all tests pass (103 core tests)

### Session Notes

2026-03-08

- Done: create() and is() implemented in Phase 1 alongside types (no benefit to separating skeleton from implementation). 21 new tests in plugin.test.ts covering all create/is scenarios.
- Next: Phase 3
- Risks/TODO: None

---

## Phase 3: Platform Plugins

Document: `02_PLUGINS.md`
Status: Done

### Goal

Migrate `createYouTubePlugin` to use `PlatformPlugin.create()`. Extract methods and rate limit handler.

### Checklist

- [x] Create `packages/youtube/src/methods.ts` (5 extracted methods)
- [x] Create `packages/youtube/src/rate-limit.ts` (createYouTubeRateLimitHandler)
- [x] Refactor `packages/youtube/src/plugin.ts` to use `PlatformPlugin.create()`
- [x] Update `packages/youtube/src/index.ts` — no changes needed
- [x] All 155 tests pass (103 core + 52 youtube)
- [x] Build passes, post-edit-check green

### Session Notes

2026-03-08

- Done: YouTube plugin fully migrated. plugin.ts reduced from 301 lines to 58 lines. Methods extracted to methods.ts, rate limit handler to rate-limit.ts. All existing tests pass without modification.
- Next: PR creation
- Risks/TODO: None
