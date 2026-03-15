---
title: ページネーション
---

## 動画の取得

`getVideos` はカーソルベースのページネーションで `Page<Video>` を返します:

```ts
const page = await client.getVideos("youtube", channelId);

console.log(page.items); // Video[]
console.log(page.cursor); // string | undefined — 次ページ取得用
console.log(page.total); // number | undefined — 総数（取得可能な場合）
```

## 複数ページの取得

```ts
let cursor: string | undefined;
const allVideos: Video[] = [];

do {
  const page = await client.getVideos("youtube", channelId, cursor);
  allVideos.push(...page.items);
  cursor = page.cursor;
} while (cursor);

console.log(`${allVideos.length} 件の動画を取得しました`);
```

## ページ数を制限して取得

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

## ライブ配信の取得

`getLiveStreams` はチャンネルの現在のライブ配信をすべて返します。ライブ配信は通常少数なので、ページネーションは不要です。

```ts
const streams = await client.getLiveStreams("twitch", channelId);

for (const stream of streams) {
  console.log(`${stream.title} — ${stream.viewerCount} 人が視聴中`);
}
```

## 次のステップ

- [応用](../advanced/) — OpenTelemetry やプラグインの直接アクセス
