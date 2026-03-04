# Glossary

## Glossary (Ubiquitous Language)

| Term | Description | Code Naming |
| --- | --- | --- |
| Content | The unified abstraction over LiveStream and Video. A discriminated union with `type: "live" \| "video"`. | `Content` |
| LiveStream | Content subtype representing a currently broadcasting live stream (`type: "live"`). | `LiveStream` |
| Video | Content subtype representing a recorded/archived video (`type: "video"`). | `Video` |
| Channel | A streaming channel/user account on a platform. | `Channel` |
| ChannelRef | A lightweight reference to a channel, embedded within Content (id, name, url only). | `ChannelRef` |
| Thumbnail | A value object representing an image with URL and dimensions. | `Thumbnail` |
| BroadcastSession | The lifecycle link between a live stream and its resulting archive video. Contains `sessionId` and content IDs for both live and archive. | `BroadcastSession` |
| SessionId | A platform-specific identifier that links a live broadcast to its archive. Remains the same across the live and archive phases of a broadcast. | `sessionId` |
| Platform | One of the supported live streaming services: YouTube, Twitch, or TwitCasting. | `platform` (string literal) |
| PlatformPlugin | The interface that each platform adapter must implement. Provides `getContent`, `getLiveStreams`, `getVideos`, `getChannel`, `resolveArchive`, etc. | `PlatformPlugin` |
| RestManager | The HTTP client layer responsible for executing requests, managing retries, and coordinating rate limits and auth. Designed as a discordeno-style overridable function object. | `RestManager` |
| RateLimitStrategy | An algorithm for managing API rate limits. Two implementations: TokenBucket (Twitch, TwitCasting) and QuotaBudget (YouTube). | `RateLimitStrategy` |
| TokenBucket | A rate limiting strategy that uses a token refill model. Tokens are consumed per request and refilled over a time window. Header-driven: actual remaining count is updated from API response headers. | `TokenBucketStrategy` |
| QuotaBudget | A rate limiting strategy for YouTube's cost-based quota system. Tracks consumed units locally (API doesn't report remaining quota in headers). Different endpoints cost different amounts (e.g., search = 100 units). | `QuotaBudgetStrategy` |
| RateLimitHandle | A handle returned by `RateLimitStrategy.acquire()`. Must be completed after request (`handle.complete(headers)`) or released on retry (`handle.release()`). | `RateLimitHandle` |
| TokenManager | An abstraction for per-platform authentication credential management. Provides `getAuthHeader()` for transparent token acquisition and refresh. | `TokenManager` |
| Page | A cursor-based pagination envelope containing `items`, optional `cursor` for next page, and optional `total` count. | `Page<T>` |
| ResolvedUrl | The result of parsing a platform URL: contains `platform`, `type` (content or channel), and extracted `id`. | `ResolvedUrl` |
| UnifiedClient | The main entry point for SDK consumers. Orchestrates plugin lookup, delegates to platform plugins, and manages plugin registration. | `UnifiedClient` |

## Naming Rules

- Reflect domain concepts in code using the term from the Glossary
- Platform names are lowercase strings: `"youtube"`, `"twitch"`, `"twitcasting"`
- All entity types use PascalCase in code
- The discriminant field is always `type` (not `kind`, `category`, etc.)
- Pagination cursors are always `cursor: string | undefined` (not `nextPageToken`, `offset`, etc.)

## Deprecated & Synonym Notes

| Deprecated Term | Preferred Term | Reason |
| --- | --- | --- |
| Stream | LiveStream | "Stream" is ambiguous (could mean stream of data). Use `LiveStream` for clarity. |
| Archive | Video | Archives are just videos with `type: "video"`. The term "archive" is used informally but the type is always `Video`. |
| VOD | Video | VOD (Video on Demand) is Twitch-specific terminology. Use `Video` in the unified model. |
| Movie | Video / Content | "Movie" is TwitCasting-specific terminology for their content objects. Use `Content` or `Video` in the unified model. |
| User | Channel | Some platforms (Twitch, TwitCasting) call their channels "users". Use `Channel` in the unified model. |
| Broadcaster | Channel | TwitCasting-specific term. Use `Channel`. |
