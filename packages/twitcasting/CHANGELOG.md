# @unified-live/twitcasting

## 0.1.0

### Minor Changes

- [#29](https://github.com/sugar-cat7/unified-live/pull/29) [`3fc51b8`](https://github.com/sugar-cat7/unified-live/commit/3fc51b884e799235f0ec45c05f5d94be07eb4f92) Thanks [@sugar-cat7](https://github.com/sugar-cat7)! - Remove Symbol.dispose and timer-based rate limiting

  BREAKING CHANGES:
  - `Symbol.dispose` removed from all public types (`UnifiedClient`, `PlatformPlugin`, `RestManager`, `RateLimitStrategy`, `TokenManager`)
  - `using client = ...` no longer works — use `const client = ...` instead. No cleanup needed.
  - `TokenBucket` now rejects with `RateLimitError` on exhaustion instead of blocking
  - `TokenBucketConfig` requires a new `platform` field

  Migration:
  - Replace `using client = UnifiedClient.create(...)` with `const client = UnifiedClient.create(...)`
  - Remove all `client[Symbol.dispose]()` calls — they are no longer needed
  - Add `platform` field to any custom `TokenBucketConfig`
  - Handle `RateLimitError` from token bucket (previously blocked until refill)

### Patch Changes

- Updated dependencies [[`3fc51b8`](https://github.com/sugar-cat7/unified-live/commit/3fc51b884e799235f0ec45c05f5d94be07eb4f92)]:
  - @unified-live/core@0.1.0
