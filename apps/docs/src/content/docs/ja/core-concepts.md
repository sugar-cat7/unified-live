---
title: 基本概念
sidebar:
  order: 2
---

## Content

`Content` はライブ配信とアーカイブ動画を統一的に扱う型です。`type: "live" | "video"` の Discriminated Union として定義されています。

```ts
const content = await client.getContent(url);

if (content.type === "live") {
  console.log(content.viewerCount); // 視聴者数
  console.log(content.startedAt); // 配信開始日時
}

if (content.type === "video") {
  console.log(content.duration); // 再生時間（秒）
  console.log(content.viewCount); // 再生回数
  console.log(content.publishedAt); // 公開日時
}
```

### タイプガード

`Content` コンパニオンオブジェクトで型を絞り込めます:

```ts
import { Content } from "@unified-live/core";

if (Content.isLive(content)) {
  // content が LiveStream に絞り込まれる
  console.log(content.viewerCount);
}

if (Content.isVideo(content)) {
  // content が Video に絞り込まれる
  console.log(content.duration);
}
```

### 共通フィールド

`LiveStream` と `Video` は以下のフィールドを共有します:

| フィールド  | 型           | 説明                                       |
| ----------- | ------------ | ------------------------------------------ |
| `id`        | `string`     | プラットフォーム固有のコンテンツ ID        |
| `platform`  | `string`     | `"youtube"`, `"twitch"`, `"twitcasting"`   |
| `title`     | `string`     | コンテンツのタイトル                       |
| `url`       | `string`     | コンテンツの URL                           |
| `thumbnail` | `Thumbnail`  | サムネイル画像（`url`, `width`, `height`） |
| `channel`   | `ChannelRef` | チャンネル参照（`id`, `name`, `url`）      |
| `sessionId` | `string?`    | ライブとアーカイブを紐付ける ID（後述）    |
| `raw`       | `unknown`    | プラットフォーム API の生レスポンス        |

## Channel

`Channel` は配信チャンネルまたはユーザーアカウントを表します:

```ts
const channel = await client.getChannel("youtube", "UC_x5XG1OV2P6uZZ5FSM9Ttw");

console.log(channel.id); // "UC_x5XG1OV2P6uZZ5FSM9Ttw"
console.log(channel.platform); // "youtube"
console.log(channel.name); // チャンネル名
console.log(channel.url); // チャンネル URL
console.log(channel.thumbnail); // サムネイル（任意）
```

## URL 解析

クライアントは URL からプラットフォームを自動判別します:

```ts
// プラットフォームを自動判別してコンテンツを取得
const content = await client.getContent("https://www.youtube.com/watch?v=abc123");
const content = await client.getContent("https://www.twitch.tv/videos/123456");
const content = await client.getContent("https://twitcasting.tv/user/movie/123");

// 取得せずに URL だけ解析
const resolved = client.match("https://www.youtube.com/watch?v=abc123");
// { platform: "youtube", type: "content", id: "abc123" }

const resolved = client.match("https://www.twitch.tv/username");
// { platform: "twitch", type: "channel", id: "username" }
```

### 対応 URL 形式

**YouTube:**

- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/channel/CHANNEL_ID`
- `youtube.com/@handle`
- `youtube.com/live/VIDEO_ID`

**Twitch:**

- `twitch.tv/videos/VIDEO_ID`
- `twitch.tv/USERNAME`

**TwitCasting:**

- `twitcasting.tv/USER_ID/movie/MOVIE_ID`
- `twitcasting.tv/USER_ID`

## Session ID

`sessionId` はライブ配信とそのアーカイブ動画を紐付けます。YouTube や TwitCasting ではライブとアーカイブが同じ ID を共有しますが、Twitch では異なる ID が使われます。`sessionId` はプラットフォームに関係なく安定したリンクを提供します。

```ts
// ライブ配信中
const live = await client.getContent("https://youtube.com/watch?v=abc123");
console.log(live.sessionId); // "abc123"

// 配信終了後のアーカイブも同じ sessionId
const archive = await client.getContent("https://youtube.com/watch?v=abc123");
console.log(archive.sessionId); // "abc123"
```

## 次のステップ

- [プラットフォームプラグイン](../platform-plugins/) — 各プラットフォームの設定方法
- [エラーハンドリング](../error-handling/) — エラー処理
