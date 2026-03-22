---
"@unified-live/core": minor
"@unified-live/youtube": minor
"@unified-live/twitch": minor
"@unified-live/twitcasting": minor
---

Remove Symbol.dispose and timer-based rate limiting

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
