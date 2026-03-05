# Decisions

Record the rationale behind specification decisions in chronological order.

## Recording Rules

- One entry per decision
- Always include "What", "Why", "Alternatives", and "Impact Scope"
- When a specification changes, do not delete old decisions; append an update instead

## Decision Log

### D-001: Content as Discriminated Union

- Date: 2026-03-05
- Status: Accepted
- Decision: Model Content as a discriminated union with `type: "live" | "video"`, where LiveStream and Video extend a shared ContentBase.
- Context: The SDK needs a single return type for `getContent()` that can represent both live streams and archived videos.
- Rationale: Discriminated unions enable type-safe narrowing in TypeScript (`if (content.type === "live") { content.viewerCount }`). A single `Content` type simplifies the public API surface.
- Alternatives: (1) Separate `LiveStream` and `Video` types at top level with no shared union — rejected because `getContent()` would need two separate methods or a wrapper type. (2) A single flat type with optional fields — rejected because it loses type safety.
- Impact Scope: All types, all platform plugins, all public API methods

---

### D-002: discordeno-style RestManager (Overridable Function Object)

- Date: 2026-03-05
- Status: Accepted
- Decision: Design RestManager as a function object (interface with method properties) where every method is overridable by direct assignment, following the discordeno pattern.
- Context: Platform plugins need to customize HTTP behavior (e.g., YouTube adds `?key=` query param, Twitch adds `Client-Id` header, TwitCasting requires `X-Api-Version` header). Class inheritance would require complex hierarchies.
- Rationale: Function objects allow targeted overrides without subclassing. Consumers and plugin authors can override `createHeaders`, `handleRateLimit`, or `runRequest` individually. This is the pattern proven in production by discordeno.
- Alternatives: (1) Class-based HTTPClient with method overrides — rejected because it encourages deep inheritance hierarchies. (2) Middleware/interceptor pattern — considered but adds complexity for simple header additions. (3) Configuration-only approach — too rigid for platform-specific behaviors like YouTube's 403 quota handling.
- Impact Scope: `packages/core/src/rest/manager.ts`, all platform plugins
- Related Use Cases: All (every API call flows through RestManager)

---

### D-003: Dual Rate Limit Strategies (TokenBucket + QuotaBudget)

- Date: 2026-03-05
- Status: Accepted
- Decision: Use a Strategy pattern with two implementations: `TokenBucketStrategy` for Twitch/TwitCasting (header-driven token refill) and `QuotaBudgetStrategy` for YouTube (cost-based daily quota).
- Context: YouTube's quota system is fundamentally different from Twitch/TwitCasting. YouTube has a daily cost budget (10,000 units) where different endpoints cost different amounts (search = 100 units). Twitch and TwitCasting use standard requests-per-time-window limits with remaining count in response headers.
- Rationale: A unified "one size fits all" approach cannot capture the cost-per-endpoint model of YouTube. The Strategy pattern allows each platform to use the appropriate algorithm while keeping the RestManager interface uniform.
- Alternatives: (1) Unified token bucket with cost weighting — could work but doesn't model YouTube's daily reset at Pacific midnight. (2) No rate limit management (leave to consumer) — rejected because transparent rate limiting is a core value proposition. (3) Decorator pattern wrapping fetch — too low-level, doesn't handle quota budgeting.
- Impact Scope: `packages/core/src/rest/strategy.ts`, `packages/core/src/rest/bucket.ts`, `packages/core/src/rest/quota.ts`, all platform plugins
- Related Use Cases: All (rate limiting is cross-cutting)

---

### D-004: OpenTelemetry as First-Class Citizen

- Date: 2026-03-05
- Status: Accepted
- Decision: Instrument every platform API call with OpenTelemetry traces and metrics natively. Depend on `@opentelemetry/api` (the API contract only) as a peer dependency.
- Context: Production systems need observability into platform API performance, rate limit state, and error rates. Retrofitting observability is always harder than building it in.
- Rationale: `@opentelemetry/api` is a lightweight API contract (~50KB). When no OTel SDK is registered, all calls become no-ops with zero overhead. This gives consumers production-grade observability with zero configuration if they already have OTel set up, and zero cost if they don't.
- Alternatives: (1) Pluggable logging interface — less structured than OTel traces, no standard metrics. (2) Optional OTel plugin — adds complexity for consumers who want observability. (3) Console.log-based debug mode — not suitable for production.
- Impact Scope: `packages/core/src/telemetry/`, RestManager, all platform plugins
- Related Use Cases: All (every API call emits traces)

---

### D-005: sessionId for Cross-Platform ID Tracking

- Date: 2026-03-05
- Status: Accepted
- Decision: Add a `sessionId` field to Content that provides a stable identifier linking a live broadcast to its archive, even when the platform uses different IDs for each.
- Context: On Twitch, the Stream ID (live) and Video ID (archive) are different. On YouTube and TwitCasting, the same ID is used for both. Consumers who track broadcasts across their lifecycle need a way to correlate these.
- Rationale: `sessionId` abstracts away the platform-specific ID mapping. For YouTube/TwitCasting, `sessionId === id`. For Twitch, `sessionId` equals the `stream_id`, which appears on both the Stream object and the Video object's `stream_id` field.
- Alternatives: (1) Consumer-managed correlation — pushes complexity to every consumer. (2) Always use the same ID (force mapping at archive time) — not possible because Twitch Video API returns only `video_id`, not `stream_id`, as the primary ID. (3) Separate `liveId` / `archiveId` fields — more verbose and doesn't solve the lookup problem.
- Impact Scope: Content type, all platform plugins, BroadcastSession

---

### D-006: Monorepo with Core + Per-Platform Packages

- Date: 2026-03-05
- Status: Accepted
- Decision: Structure the SDK as a pnpm workspace monorepo with separate packages: `@unified-live/core`, `@unified-live/youtube`, `@unified-live/twitch`, `@unified-live/twitcasting`.
- Context: Consumers may only need one or two platforms. Bundling all platforms in a single package would include unnecessary code.
- Rationale: Separate packages enable tree-shaking at the package level. Consumers who only need YouTube install `@unified-live/core` + `@unified-live/youtube`. Each platform can be versioned independently. Build times are also improved with smaller compilation units.
- Alternatives: (1) Single package with platform modules — simpler publishing but no tree-shaking at package level, consumers always install all platform code. (2) Separate repos per platform — too much overhead for coordinating shared types and release cycles.
- Impact Scope: Entire repo structure, build configuration, publishing
- Related Use Cases: All

---

### D-007: Zero Runtime Dependencies

- Date: 2026-03-05
- Status: Accepted
- Decision: The SDK has zero runtime dependencies. Only `@opentelemetry/api` is a peer dependency. HTTP is handled via native `fetch`.
- Context: SDKs that pull in many dependencies increase supply chain risk, bundle size, and compatibility issues across runtimes (Node.js, Deno, Bun, edge runtimes).
- Rationale: Native `fetch` is available in all modern JavaScript runtimes. Zod is used for schema definitions at build time. `@opentelemetry/api` is a peer dependency (consumer provides it or it's a no-op).
- Alternatives: (1) Use an HTTP client library (axios, ky, etc.) — adds a dependency and may not work in all runtimes. (2) Include Zod as a runtime dependency for response validation — considered, decision pending (may be useful for validating platform API responses).
- Impact Scope: All packages, package.json dependencies
- Related Use Cases: All

---

### D-008: Error Handling Strategy

- Date: 2026-03-05
- Status: Accepted
- Decision: The SDK uses **thrown exceptions** with a typed error hierarchy rooted in `UnifiedLiveError`. The SDK does NOT use Result types and does NOT depend on `@my-app/errors`.
- Context: The monorepo template uses `@my-app/errors` with `Ok`, `Err`, `wrap`, and `AppError`. However, research into major OSS TypeScript SDKs (discordeno, Octokit, Stripe, AWS SDK v3) shows they all use thrown exceptions.
- Rationale: (1) Every major OSS TypeScript SDK throws exceptions — this is the strongest signal from ecosystem research. (2) SDK consumers expect `try/catch` or `.catch()` for async operations. (3) Result types require consumers to learn a new error handling pattern. (4) The SDK's typed error hierarchy (`UnifiedLiveError`, `QuotaExhaustedError`, etc.) provides type safety via `instanceof` checks.
- Alternatives: (1) Result type (`@my-app/errors`) — rejected because it diverges from every OSS SDK convention and adds consumer friction. (2) Fork as `@unified-live/errors` — rejected because thrown exceptions are simpler. (3) Dual mode (Result + `.throw()`) — rejected because it doubles the API surface.
- Impact Scope: All public API methods, all error types, `packages/core/src/errors.ts`

---

### D-009: Remove DDD/Clean Architecture Terminology

- Date: 2026-03-05
- Status: Accepted
- Decision: Replace all DDD and Clean Architecture terminology in documentation with standard OSS SDK terminology. "Entity" -> "Type", "Aggregate Root" -> removed, "UseCase" -> "Client Method", "Adapter" -> "Plugin", "Companion Object" -> "Type Guard", "Business Rules" -> "Constraints", "Domain Model" -> "Type Definitions".
- Context: The documentation was initially written using a web-app template that follows Clean Architecture / DDD. The SDK architecture is sound, but the terminology creates confusion for OSS contributors who are familiar with standard SDK patterns.
- Rationale: Aligning terminology with standard OSS SDK conventions (discordeno, Octokit, Stripe, AWS SDK v3) reduces contributor onboarding friction and makes the project more approachable.
- Alternatives: Keep DDD terminology — rejected because it creates an unnecessary barrier for SDK contributors.
- Impact Scope: All documentation files, CLAUDE.md
