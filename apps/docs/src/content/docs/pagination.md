---
title: Pagination
description: "Cursor-based pagination for listing videos and live streams"
---

## Fetching Videos

`getVideos` returns a `Page<Video>` with cursor-based pagination:

```ts
const page = await client.getVideos("youtube", channelId);

console.log(page.items); // Video[]
console.log(page.cursor); // string | undefined — pass to get next page
console.log(page.hasMore); // boolean — true if more pages exist
console.log(page.total); // number | undefined — total count (if available)
```

## Fetching Multiple Pages

```ts
let cursor: string | undefined;
const allVideos: Video[] = [];

do {
  const page = await client.getVideos("youtube", channelId, cursor);
  allVideos.push(...page.items);
  cursor = page.cursor;
} while (cursor);

console.log(`Fetched ${allVideos.length} videos`);
```

> The `Page<T>` type also provides a `hasMore` boolean. Use `page.cursor` for the loop condition and `page.hasMore` to show "Load More" buttons in UIs.

## Fetching a Limited Number of Pages

```ts
const MAX_PAGES = 3;
let cursor: string | undefined;
const videos: Video[] = [];

for (let i = 0; i < MAX_PAGES; i++) {
  const page = await client.getVideos("twitch", channelId, cursor);
  videos.push(...page.items);
  cursor = page.cursor;
  if (!cursor) break;
}
```

## Live Streams

`getLiveStreams` returns all currently active live streams for a channel. No pagination is needed — live streams are typically few.

```ts
const streams = await client.getLiveStreams("twitch", channelId);

for (const stream of streams) {
  console.log(`${stream.title} — ${stream.viewerCount} viewers`);
}
```

## Next Steps

- [Advanced](../advanced/) — OpenTelemetry and direct plugin access
