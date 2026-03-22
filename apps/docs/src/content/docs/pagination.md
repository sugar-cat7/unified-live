---
title: Pagination
description: "Cursor-based pagination for listing archives and broadcasts"
---

## Fetching Archives

`listArchives` returns a `Page<Archive>` with cursor-based pagination:

```ts
const page = await client.listArchives("youtube", channelId);

console.log(page.items); // Archive[]
console.log(page.cursor); // string | undefined — pass to get next page
console.log(page.hasMore); // boolean — true if more pages exist
console.log(page.total); // number | undefined — total count (if available)
```

## Fetching Multiple Pages

```ts
let cursor: string | undefined;
const allArchives: Archive[] = [];

do {
  const page = await client.listArchives("youtube", channelId, cursor);
  allArchives.push(...page.items);
  cursor = page.cursor;
} while (cursor);

console.log(`Fetched ${allArchives.length} archives`);
```

> The `Page<T>` type also provides a `hasMore` boolean. Use `page.cursor` for the loop condition and `page.hasMore` to show "Load More" buttons in UIs.

## Fetching a Limited Number of Pages

```ts
const MAX_PAGES = 3;
let cursor: string | undefined;
const archives: Archive[] = [];

for (let i = 0; i < MAX_PAGES; i++) {
  const page = await client.listArchives("twitch", channelId, cursor);
  archives.push(...page.items);
  cursor = page.cursor;
  if (!cursor) break;
}
```

## Filtering Archives

Pass `ArchiveListOptions` to filter results by period, sort order, or video type (platform support varies):

```ts
const page = await client.listArchives("twitch", channelId, undefined, 20, {
  period: "week",
  sort: "views",
  videoType: "highlight",
});
```

| Option      | Values                                    | Description             |
| :---------- | :---------------------------------------- | :---------------------- |
| `period`    | `"all"`, `"day"`, `"week"`, `"month"`     | Time range filter       |
| `sort`      | `"time"`, `"trending"`, `"views"`         | Sort order              |
| `videoType` | Platform-specific (e.g., `"archive"`, `"highlight"`, `"upload"` for Twitch) | Video type filter |

## Broadcasts

`listBroadcasts` returns all currently active broadcasts for a channel. No pagination is needed — broadcasts are typically few.

```ts
const streams = await client.listBroadcasts("twitch", channelId);

for (const stream of streams) {
  console.log(`${stream.title} — ${stream.viewerCount} viewers`);
}
```

## Next Steps

- [Advanced](../advanced/) — OpenTelemetry and direct plugin access
