# 02: Platform Plugins

## PlatformPlugin Interface

```ts
interface PlatformPlugin {
  /** Platform identifier (e.g., "youtube", "twitch", "twitcasting") */
  readonly name: string;

  /** REST client instance for this platform */
  readonly rest: RestManager;

  /** Check if a URL belongs to this platform */
  match(url: string): boolean;

  /** Parse a URL into platform, type, and resource ID */
  resolveUrl(url: string): ResolvedUrl | null;

  /** Fetch a single content by platform-specific ID */
  getContent(id: string): Promise<Content>;

  /** Fetch channel information */
  getChannel(id: string): Promise<Channel>;

  /** List active live streams for a channel */
  getLiveStreams(channelId: string): Promise<LiveStream[]>;

  /** List videos (archives) for a channel with pagination */
  getVideos(channelId: string, cursor?: string): Promise<Page<Video>>;

  /** Find the archive video for a live stream (optional) */
  resolveArchive?(live: LiveStream): Promise<Video | null>;

  /** Get broadcast session info from any content (optional, Phase 2) */
  resolveSession?(content: Content): Promise<BroadcastSession | null>;

  /** Release resources (timers, connections) */
  dispose?(): void;
}
```

---

## YouTube Plugin

Package: `packages/youtube/`

### API Endpoints Used

| Endpoint | Method | Quota Cost | Purpose |
| --- | --- | --- | --- |
| `videos.list` | GET | 1 unit | Fetch video/live stream by ID |
| `channels.list` | GET | 1 unit | Fetch channel info |
| `search.list` | GET | 100 units | Search for content (high cost!) |
| `liveBroadcasts.list` | GET | 1 unit | List live broadcasts for a channel |
| `playlistItems.list` | GET | 1 unit | List videos in a channel's uploads playlist |

### Base URL

`https://www.googleapis.com/youtube/v3`

### Authentication

YouTube uses an API Key passed as a query parameter (`?key=<apiKey>`). No `Authorization` header.

The YouTube plugin overrides RestManager to inject the key:

```ts
// Override: inject API key as query parameter
const origRequest = this.rest.request;
this.rest.request = async (req) => {
  req.query = { ...req.query, key: config.apiKey };
  return origRequest(req);
};
```

### Rate Limiting

- Strategy: `QuotaBudgetStrategy`
- Daily limit: 10,000 units (default, can be increased via Google Cloud Console)
- Cost map: see `04_INFRASTRUCTURE.md`
- Response headers: **None** (YouTube does not provide rate limit headers)
- Quota exhaustion: `QuotaExhaustedError` thrown immediately (no point retrying)
- 403 `quotaExceeded` / `dailyLimitExceeded`: treated as quota exhaustion
- 403 `rateLimitExceeded`: separate per-second rate limit, handled via `Retry-After` header

### Response Mapping

| YouTube API Object | SDK Type | Key Mapping |
| --- | --- | --- |
| `Video` (with `liveStreamingDetails.actualStartTime`) | `LiveStream` | `snippet.liveBroadcastContent === "live"` |
| `Video` (without live details, or ended) | `Video` | `contentDetails.duration` > 0 |
| `Channel` | `Channel` | `snippet.title`, `snippet.thumbnails` |

### Pagination

- Type: `pageToken`-based
- YouTube returns `nextPageToken` in response; pass as `pageToken` query param for next page
- Mapped to `Page.cursor`

### URL Patterns

| Pattern | Type | ID Extraction |
| --- | --- | --- |
| `youtube.com/watch?v=<id>` | content | `v` query parameter |
| `youtu.be/<id>` | content | path segment |
| `youtube.com/live/<id>` | content | path segment |
| `youtube.com/channel/<id>` | channel | path segment |
| `youtube.com/@<handle>` | channel | `@handle` (requires resolution) |
| `youtube.com/c/<name>` | channel | custom URL (requires resolution) |

### resolveArchive

YouTube uses the same ID for live and archive. `resolveArchive(live)` is equivalent to `getContent(live.id)` and checking if `type === "video"`.

---

## Twitch Plugin

Package: `packages/twitch/`

### API Endpoints Used

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `GET /streams` | GET | List active streams (by `user_id` or `user_login`) |
| `GET /videos` | GET | List videos (archives, highlights, uploads) for a user |
| `GET /users` | GET | Fetch user/channel info |
| `GET /channels` | GET | Fetch channel info (broadcaster-specific) |

### Base URL

`https://api.twitch.tv/helix`

### Authentication

Two modes:

**App Access Token (MVP)**: Client Credentials Grant

- `ClientCredentialsTokenManager` handles auto-fetch and proactive refresh
- Requests require both `Authorization: Bearer <token>` and `Client-Id: <clientId>` headers

```ts
// Override: add Client-Id header
const origCreateHeaders = this.rest.createHeaders;
this.rest.createHeaders = async (req) => {
  const headers = await origCreateHeaders(req);
  return { ...headers, "Client-Id": config.clientId };
};
```

**User Access Token (Phase 2)**: Authorization Code Grant

- `UserAccessTokenManager` handles refresh_token flow
- Required for user-specific operations (not needed for MVP read operations)

### Rate Limiting

- Strategy: `TokenBucketStrategy`
- Global limit: 800 requests / 60 seconds
- Response headers: `Ratelimit-Limit`, `Ratelimit-Remaining`, `Ratelimit-Reset`
- Header-driven: actual remaining count is updated from response headers after each request
- Exhaustion behavior: requests queue and wait for token refill

```ts
parseHeaders: (headers: Headers) => {
  const limit = headers.get("Ratelimit-Limit");
  const remaining = headers.get("Ratelimit-Remaining");
  const reset = headers.get("Ratelimit-Reset");
  if (!limit || !remaining) return undefined;
  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetsAt: new Date(parseInt(reset!, 10) * 1000),
  };
}
```

### Response Mapping

| Twitch API Object | SDK Type | Key Mapping |
| --- | --- | --- |
| `Stream` | `LiveStream` | `viewer_count`, `started_at` |
| `Video` (type: "archive") | `Video` | `duration` (ISO 8601 format: "3h2m1s"), `view_count` |
| `User` | `Channel` | `display_name`, `profile_image_url` |

### Pagination

- Type: Cursor-based
- Twitch returns `pagination.cursor` in response; pass as `after` query param
- Mapped to `Page.cursor`

### URL Patterns

| Pattern | Type | ID Extraction |
| --- | --- | --- |
| `twitch.tv/<username>` | channel | path segment (user_login) |
| `twitch.tv/videos/<id>` | content | path segment (video_id) |

Note: `twitch.tv/<username>` when user is live could resolve to either LiveStream or Channel. The Twitch plugin resolves to channel by default; consumers use `getLiveStreams()` to check if the channel is live.

### resolveArchive

Twitch is the only platform where `resolveArchive` requires extra work:

```ts
async resolveArchive(live: LiveStream): Promise<Video | null> {
  if (!live.sessionId) return null;

  // Fetch user's recent archives and find the one matching the stream_id
  const res = await this.rest.request<TwitchVideosResponse>({
    method: "GET",
    path: "/videos",
    query: {
      user_id: live.channel.id,
      type: "archive",
      first: "20",
    },
    bucketId: "videos:list",
  });

  const match = res.data.data.find((v) => v.stream_id === live.sessionId);
  return match ? videoToVideo(match) : null;
}
```

---

## TwitCasting Plugin

Package: `packages/twitcasting/`

### API Endpoints Used

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `GET /users/:user_id` | GET | Fetch user/channel info |
| `GET /users/:user_id/movies` | GET | List movies (live/archive) for a user |
| `GET /movies/:movie_id` | GET | Fetch a single movie |

### Base URL

`https://apiv2.twitcasting.tv`

### Authentication

Two modes:

**Basic Auth (MVP)**: Application-level access

- `BasicAuthTokenManager`: `Authorization: Basic base64(clientId:clientSecret)`
- No token refresh needed (credentials don't expire)
- Limited to read-only/public operations

**Bearer Token (Phase 2)**: User-level access

- `TwitCastingBearerTokenManager`: `Authorization: Bearer <accessToken>`
- Expires in ~180 days
- No refresh token available — re-authorization required on expiry

### Required Headers

```ts
this.rest.createHeaders = async (req) => {
  const auth = await this.tokenManager.getAuthHeader();
  return {
    "Accept": "application/json",
    "X-Api-Version": "2.0",  // Required by TwitCasting API
    "Authorization": auth,
  };
};
```

### Rate Limiting

- Strategy: `TokenBucketStrategy`
- Global limit: 60 requests / 60 seconds
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Header-driven: actual remaining count is updated from response headers
- Exhaustion behavior: requests queue and wait for token refill

```ts
parseHeaders: (headers: Headers) => {
  const limit = headers.get("X-RateLimit-Limit");
  const remaining = headers.get("X-RateLimit-Remaining");
  const reset = headers.get("X-RateLimit-Reset");
  if (!limit || !remaining || !reset) return undefined;
  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetsAt: new Date(parseInt(reset, 10) * 1000),
  };
}
```

### Response Mapping

| TwitCasting API Object | SDK Type | Key Mapping |
| --- | --- | --- |
| `Movie` (is_live: true) | `LiveStream` | `current_view_count`, `created` (Unix timestamp) |
| `Movie` (is_live: false) | `Video` | `duration`, `total_view_count`, `created` |
| `User` | `Channel` | `name`, `screen_id`, `image` |

```ts
function movieToContent(movie: TCMovie, broadcaster: TCUser): Content {
  const base = {
    id: movie.id,
    platform: "twitcasting",
    sessionId: movie.id,  // TwitCasting: id === sessionId
    title: movie.title,
    url: movie.link,
    thumbnail: { url: movie.large_thumbnail, width: 640, height: 360 },
    channel: {
      id: broadcaster.id,
      name: broadcaster.name,
      url: `https://twitcasting.tv/${broadcaster.screen_id}`,
    },
    raw: movie,
  };

  if (movie.is_live) {
    return {
      ...base,
      type: "live" as const,
      viewerCount: movie.current_view_count,
      startedAt: new Date(movie.created * 1000),
    };
  }

  return {
    ...base,
    type: "video" as const,
    duration: movie.duration,
    viewCount: movie.total_view_count,
    publishedAt: new Date(movie.created * 1000),
  };
}
```

### Pagination

- Type: Offset-based with `slice_id` for deep pagination
- Constraint: `offset` parameter is limited to max 1000
- For items beyond 1000: use `slice_id` (the movie ID of the last item in previous page)
- `limit`: max 50 per request

```ts
async getVideos(channelId: string, cursor?: string): Promise<Page<Video>> {
  const query: Record<string, string> = { limit: "50" };

  if (cursor) {
    // cursor = previous page's last movie_id -> used as slice_id
    query.slice_id = cursor;
  }

  const res = await this.rest.request<TCMoviesResponse>({
    method: "GET",
    path: `/users/${channelId}/movies`,
    query,
    bucketId: "movies:list",
  });

  const videos = res.data.movies.map((m) => movieToVideo(m, broadcaster));

  return {
    items: videos,
    cursor: videos.length === 50 ? videos.at(-1)!.id : undefined,
    total: res.data.total_count,
  };
}
```

### URL Patterns

| Pattern | Type | ID Extraction |
| --- | --- | --- |
| `twitcasting.tv/<screen_id>` | channel | path segment (screen_id / user_login) |
| `twitcasting.tv/<screen_id>/movie/<movie_id>` | content | `movie_id` from path |

### resolveArchive

TwitCasting uses the same ID for live and archive. `resolveArchive(live)` is equivalent to `getContent(live.id)` and checking if `type === "video"` (broadcast ended).

### Platform-Specific Notes

1. **API documentation is Japanese only**: The SDK provides English JSDoc for all public APIs.
2. **`is_live` / `is_recorded` flags**: Movies have both flags. `is_live = true` means currently broadcasting. `is_recorded = true` means a past broadcast (archive). These are mutually exclusive in practice.
3. **User ID vs Screen ID**: TwitCasting uses numeric user IDs internally but `screen_id` (alphanumeric username) in URLs. The plugin must handle both.

---

## Platform Comparison Summary

| Aspect | YouTube | Twitch | TwitCasting |
| --- | --- | --- | --- |
| Base URL | `googleapis.com/youtube/v3` | `api.twitch.tv/helix` | `apiv2.twitcasting.tv` |
| Auth (MVP) | API Key (query param) | Client Credentials (Bearer + Client-Id) | Basic Auth |
| Rate Limit Model | Cost-based daily quota (10K units) | Token bucket (800 req/60s) | Token bucket (60 req/60s) |
| Rate Limit Headers | None | `Ratelimit-*` | `X-RateLimit-*` |
| Pagination | `pageToken` | cursor (`after`) | `offset` + `slice_id` |
| Live/Archive ID | Same | **Different** | Same |
| `sessionId` Mapping | `id` | `stream.id` / `video.stream_id` | `id` |
| Type Generation | openapi-typescript | openapi-typescript | Manual (no OpenAPI spec) |
| API Docs Language | English | English | **Japanese only** |
