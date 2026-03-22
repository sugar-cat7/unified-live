---
title: ページネーション
description: "アーカイブ・配信一覧のカーソルベースページネーション"
---

## アーカイブの取得

`listArchives` はカーソルベースのページネーションで `Page<Archive>` を返します:

```ts
const page = await client.listArchives("youtube", channelId);

console.log(page.items); // Archive[]
console.log(page.cursor); // string | undefined — 次ページ取得用
console.log(page.hasMore); // boolean — 次のページが存在する場合 true
console.log(page.total); // number | undefined — 総数（取得可能な場合）
```

## 複数ページの取得

```ts
let cursor: string | undefined;
const allArchives: Archive[] = [];

do {
  const page = await client.listArchives("youtube", channelId, cursor);
  allArchives.push(...page.items);
  cursor = page.cursor;
} while (cursor);

console.log(`${allArchives.length} 件のアーカイブを取得しました`);
```

> `Page<T>` 型は `hasMore` ブール値も提供します。ループ条件には `page.cursor` を使い、UI の「もっと読む」ボタンの表示には `page.hasMore` を使用してください。

## ページ数を制限して取得

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

## アーカイブのフィルタリング

`ArchiveListOptions` を渡して、期間・ソート順・動画タイプでフィルタリングできます（プラットフォームによりサポート状況が異なります）:

```ts
const page = await client.listArchives("twitch", channelId, undefined, 20, {
  period: "week",
  sort: "views",
  videoType: "highlight",
});
```

| オプション  | 値                                        | 説明                    |
| :---------- | :---------------------------------------- | :---------------------- |
| `period`    | `"all"`, `"day"`, `"week"`, `"month"`     | 期間フィルタ            |
| `sort`      | `"time"`, `"trending"`, `"views"`         | ソート順                |
| `videoType` | プラットフォーム固有（例: Twitch の `"archive"`, `"highlight"`, `"upload"`） | 動画タイプフィルタ |

## ライブ配信の取得

`listBroadcasts` はチャンネルの現在のライブ配信をすべて返します。ライブ配信は通常少数なので、ページネーションは不要です。

```ts
const streams = await client.listBroadcasts("twitch", channelId);

for (const stream of streams) {
  console.log(`${stream.title} — ${stream.viewerCount} 人が視聴中`);
}
```

## 次のステップ

- [応用](../advanced/) — OpenTelemetry やプラグインの直接アクセス
