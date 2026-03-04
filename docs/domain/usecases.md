# Use Cases

## Priority Definitions

- MVP: Required for initial release
- Phase 2: Added after MVP
- Phase 3: Future extensions

## Use Case List

| ID | Use Case | Primary Actor | Priority | Related Entities |
| --- | --- | --- | --- | --- |
| UC-001 | Get Content by URL | SDK Consumer | MVP | Content, ResolvedUrl |
| UC-002 | Get Content by Platform + ID | SDK Consumer | MVP | Content |
| UC-003 | Get Live Streams for Channel | SDK Consumer | MVP | LiveStream, Channel |
| UC-004 | Get Videos for Channel | SDK Consumer | MVP | Video, Channel, Page |
| UC-005 | Get Channel Info | SDK Consumer | MVP | Channel |
| UC-006 | Resolve Archive from Live Stream | SDK Consumer | MVP | LiveStream, Video, BroadcastSession |
| UC-007 | Match URL to Platform | SDK Consumer | MVP | ResolvedUrl |
| UC-008 | Resolve Broadcast Session | SDK Consumer | Phase 2 | BroadcastSession, Content |
| UC-009 | Register Platform Plugin | SDK Consumer | Phase 2 | - |

## Use Case Details

### UC-001: Get Content by URL

- Summary: Retrieve a single Content (LiveStream or Video) from any supported platform, given its URL
- Actor: SDK Consumer
- Trigger: Consumer calls `client.getContent(url)`
- Preconditions: The platform matching the URL has a registered plugin with valid credentials
- Postconditions: A normalized Content object is returned

#### Basic Flow

1. Client parses the URL and resolves which platform plugin matches
2. Plugin extracts the resource ID from the URL
3. Plugin calls the platform API to fetch the resource
4. RestManager handles rate limiting, auth, and retries transparently
5. Plugin adapter maps the platform-specific response to the unified Content type
6. Content is returned to the consumer

#### Exception Flow

1. URL does not match any registered platform -> `PlatformNotFoundError`
2. Resource not found on platform -> `NotFoundError`
3. Rate limit exceeded after max retries -> `RateLimitError`
4. Auth credentials invalid/expired -> `AuthenticationError`
5. YouTube daily quota exhausted -> `QuotaExhaustedError`

#### Input/Output

- Input: `url: string` (e.g., `"https://youtube.com/watch?v=dQw4w9WgXcQ"`, `"https://twitch.tv/videos/12345"`)
- Output: `Content` (LiveStream or Video, depending on the resource state)

#### Acceptance Criteria

- YouTube URL returns Content with `platform: "youtube"` and valid `sessionId`
- Twitch URL returns Content with `platform: "twitch"` and valid `sessionId`
- TwitCasting URL returns Content with `platform: "twitcasting"` and valid `sessionId`
- Unsupported URL returns an error, not a crash

---

### UC-002: Get Content by Platform + ID

- Summary: Retrieve a single Content by directly specifying the platform and resource ID
- Actor: SDK Consumer
- Trigger: Consumer calls `client.getContent(platform, id)`
- Preconditions: The specified platform has a registered plugin with valid credentials
- Postconditions: A normalized Content object is returned

#### Basic Flow

1. Client looks up the plugin for the specified platform
2. Plugin calls the platform API with the given ID
3. RestManager handles rate limiting, auth, and retries
4. Plugin adapter maps the response to Content
5. Content is returned

#### Exception Flow

1. Platform not registered -> `PlatformNotFoundError`
2. ID not found -> `NotFoundError`
3. Rate limit / auth / quota errors (same as UC-001)

#### Input/Output

- Input: `platform: string`, `id: string`
- Output: `Content`

#### Acceptance Criteria

- Same normalization guarantees as UC-001

---

### UC-003: Get Live Streams for Channel

- Summary: List currently active live streams for a given channel
- Actor: SDK Consumer
- Trigger: Consumer calls `client.getLiveStreams(platform, channelId)`
- Preconditions: Platform plugin registered with valid credentials
- Postconditions: Array of LiveStream objects returned (empty if no active streams)

#### Basic Flow

1. Client looks up the plugin for the specified platform
2. Plugin calls the platform API to list live streams for the channel
3. RestManager handles rate limiting, auth, and retries
4. Plugin adapter maps each result to LiveStream
5. Array of LiveStream is returned

#### Exception Flow

1. Channel not found -> `NotFoundError`
2. Rate limit / auth / quota errors

#### Input/Output

- Input: `platform: string`, `channelId: string`
- Output: `LiveStream[]`

#### Acceptance Criteria

- Returns only items with `type: "live"`
- Returns empty array (not error) when channel has no active streams

---

### UC-004: Get Videos for Channel

- Summary: List videos (archives) for a given channel with cursor-based pagination
- Actor: SDK Consumer
- Trigger: Consumer calls `client.getVideos(platform, channelId, cursor?)`
- Preconditions: Platform plugin registered with valid credentials
- Postconditions: A Page of Video objects returned

#### Basic Flow

1. Client looks up the plugin for the specified platform
2. Plugin calls the platform API to list videos, passing cursor if provided
3. RestManager handles rate limiting, auth, and retries
4. Plugin adapter maps each result to Video
5. Page\<Video> is returned with `cursor` for next page (undefined if last page)

#### Exception Flow

1. Channel not found -> `NotFoundError`
2. Rate limit / auth / quota errors
3. TwitCasting offset > 1000 -> plugin internally switches to `slice_id` pagination

#### Input/Output

- Input: `platform: string`, `channelId: string`, `cursor?: string`
- Output: `Page<Video>`

#### Acceptance Criteria

- Returns only items with `type: "video"`
- Pagination works across all 3 platforms
- TwitCasting `slice_id` constraint is handled transparently

---

### UC-005: Get Channel Info

- Summary: Retrieve channel information by platform and channel ID
- Actor: SDK Consumer
- Trigger: Consumer calls `client.getChannel(platform, id)`
- Preconditions: Platform plugin registered with valid credentials
- Postconditions: A Channel object returned

#### Basic Flow

1. Client looks up the plugin for the specified platform
2. Plugin calls the platform API to fetch channel/user info
3. RestManager handles rate limiting, auth, and retries
4. Plugin adapter maps the response to Channel
5. Channel is returned

#### Exception Flow

1. Channel not found -> `NotFoundError`
2. Rate limit / auth / quota errors

#### Input/Output

- Input: `platform: string`, `id: string`
- Output: `Channel`

#### Acceptance Criteria

- Returns normalized Channel with `url` pointing to the canonical channel page

---

### UC-006: Resolve Archive from Live Stream

- Summary: Find the archive (VOD) video that corresponds to a given live stream
- Actor: SDK Consumer
- Trigger: Consumer calls `plugin.resolveArchive(liveStream)`
- Preconditions: The live stream has a valid `sessionId`; platform plugin registered
- Postconditions: The corresponding Video is returned, or null if not yet available

#### Basic Flow

1. Consumer obtains a LiveStream (e.g., via UC-001 or UC-003)
2. Consumer accesses the platform plugin via `client.platform(name)`
3. Consumer calls `plugin.resolveArchive(liveStream)`
4. YouTube / TwitCasting: Since `id === sessionId`, plugin fetches `getContent(id)` and returns as Video
5. Twitch: Plugin fetches the user's recent archives and searches for `stream_id` match
6. Matching Video is returned, or null if VOD is not yet available/public

#### Exception Flow

1. `sessionId` is undefined -> returns null
2. Archive not yet generated (stream still live or processing) -> returns null
3. Archive set to subscribers-only or deleted -> returns null
4. Rate limit / auth errors

#### Input/Output

- Input: `live: LiveStream`
- Output: `Video | null`

#### Acceptance Criteria

- YouTube: `archive.id === live.id` and `archive.sessionId === live.sessionId`
- Twitch: `archive.sessionId === live.sessionId` but `archive.id !== live.id`
- TwitCasting: `archive.id === live.id` and `archive.sessionId === live.sessionId`
- Returns null (not error) when archive is unavailable

---

### UC-007: Match URL to Platform

- Summary: Parse a URL and determine which platform it belongs to and what resource it identifies
- Actor: SDK Consumer
- Trigger: Consumer calls `client.match(url)` or plugin's `resolveUrl(url)`
- Preconditions: None (does not require credentials or network access)
- Postconditions: ResolvedUrl returned, or null if URL doesn't match any platform

#### Basic Flow

1. Client iterates registered plugins
2. Each plugin's `match(url)` checks if the URL belongs to that platform
3. Matching plugin's `resolveUrl(url)` extracts platform, type, and ID
4. ResolvedUrl is returned

#### Exception Flow

1. URL doesn't match any registered platform -> returns null
2. URL matches platform but format is unrecognized -> returns null

#### Input/Output

- Input: `url: string`
- Output: `ResolvedUrl | null`

#### Acceptance Criteria

- YouTube patterns: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/channel/`, `youtube.com/@`
- Twitch patterns: `twitch.tv/<username>`, `twitch.tv/videos/<id>`
- TwitCasting patterns: `twitcasting.tv/<username>`, `twitcasting.tv/<username>/movie/<id>`
- No network calls required

---

### UC-008: Resolve Broadcast Session (Phase 2)

- Summary: Get the full broadcast session info (start/end times, live + archive IDs) from any content
- Actor: SDK Consumer
- Trigger: Consumer calls `plugin.resolveSession(content)`
- Preconditions: Platform plugin registered; content has valid `sessionId`
- Postconditions: BroadcastSession returned with all known IDs

#### Input/Output

- Input: `content: Content`
- Output: `BroadcastSession | null`

---

### UC-009: Register Platform Plugin (Phase 2)

- Summary: Dynamically register or deregister platform plugins at runtime
- Actor: SDK Consumer
- Trigger: Consumer calls `client.register(plugin)` or `client.deregister(platformName)`
- Preconditions: Plugin implements PlatformPlugin interface

#### Input/Output

- Input: `plugin: PlatformPlugin`
- Output: void

---

## Open Items and Next Actions

| Topic | Impact Scope | Next Action | Deadline |
| --- | --- | --- | --- |
| Error handling: Result type vs thrown exceptions | All use cases | Decide in D-008 (see decisions.md) | Before implementation |
| YouTube quota sharing across client instances | UC-001 through UC-005 (YouTube) | Investigate if quota state should be shareable | Phase 2 |
| TwitCasting search.lives endpoint usage | UC-003 | Verify API availability and rate limits | Before TwitCasting adapter |
| Plugin auto-discovery via package.json | UC-009 | Design discovery mechanism | Phase 2 |
