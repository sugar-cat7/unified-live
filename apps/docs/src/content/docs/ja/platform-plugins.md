---
title: プラットフォームプラグイン
---

各プラットフォームは独立したパッケージとして提供されます。必要なプラットフォームだけをインストールできます。

## プラットフォーム一覧

| プラットフォーム | ステータス | 認証                         | レート制限                  | アーカイブ解決 |
| :--------------- | :--------- | :--------------------------- | :-------------------------- | :------------- |
| YouTube          | ✅ 安定    | API キー（クエリパラメータ） | クォータバジェット (10k/日) | ✅ 対応        |
| Twitch           | ✅ 安定    | OAuth2 Client Credentials    | トークンバケット (800/分)   | ✅ 対応        |
| TwitCasting      | ✅ 安定    | Basic Auth (base64)          | トークンバケット (60/分)    | ✅ 対応        |

---

## YouTube

> **公式ドキュメント:** [YouTube Data API v3](https://developers.google.com/youtube/v3)
>
> YouTubeのクォータシステムはエンドポイント毎に異なるコスト（1〜101ユニット）を日次10,000ユニットのプールから消費します。SDKはローカルで消費を追跡し、サイレントな403エラーの前に `QuotaExhaustedError` をスローします。

```bash
pnpm add @unified-live/core @unified-live/youtube
```

```ts
import { createYouTubePlugin } from "@unified-live/youtube";

const youtube = createYouTubePlugin({
  apiKey: process.env.YOUTUBE_API_KEY!,
  quota: {
    dailyLimit: 10_000, // 任意、デフォルト: 10,000 ユニット
  },
});
```

### YouTube API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成（または既存のものを選択）
3. **YouTube Data API v3** を有効化
4. **認証情報** から API キーを作成

### クォータ

YouTube はコストベースの日次クォータを使用します（デフォルト: 10,000 ユニット）。操作ごとにコストが異なります:

| 操作                                            | コスト       |
| ----------------------------------------------- | ------------ |
| `getContent`（videos.list）                     | 1 ユニット   |
| `getChannel`（channels.list）                   | 1 ユニット   |
| `getVideos`（channels.list + playlistItems.list + videos.list） | 3 ユニット   |
| `getLiveStreams`（search.list + videos.list）   | 101 ユニット |

SDK はクォータ消費をローカルで追跡し、上限に達すると `QuotaExhaustedError` をスローします。

---

## Twitch

> **公式ドキュメント:** [Twitch Helix API](https://dev.twitch.tv/docs/api/)
>
> TwitchはOAuth2 Client Credentialsとトークンリフレッシュが必要です。SDKはトークンのライフサイクル全体 — 初回取得、90%期限でのリフレッシュ、401時の自動リトライ — を処理します。

```bash
pnpm add @unified-live/core @unified-live/twitch
```

```ts
import { createTwitchPlugin } from "@unified-live/twitch";

const twitch = createTwitchPlugin({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});
```

### Twitch 認証情報の取得

1. [Twitch Developer Console](https://dev.twitch.tv/console) にアクセス
2. 新しいアプリケーションを登録
3. **Client ID** をコピーし、**Client Secret** を生成

### レート制限

Twitch はトークンバケットアルゴリズムを使用し、レート制限は `Ratelimit-Limit`/`Ratelimit-Remaining`/`Ratelimit-Reset` レスポンスヘッダーで通知されます。SDK はデフォルトのバケットサイズで初期化し、実際の API レスポンスに基づいて動的に調整します。

### 認証

SDK が OAuth2 Client Credentials Grant を自動処理します。トークンは期限切れ前に自動更新されます。

---

## TwitCasting

> **公式ドキュメント:** [TwitCasting API v2](https://apiv2-doc.twitcasting.tv/)
>
> TwitCastingは1分間に60リクエストという厳しいレート制限があります。SDKはトークンバケットと透過的なリトライでこれを強制し、予期しない429エラーを防ぎます。

```bash
pnpm add @unified-live/core @unified-live/twitcasting
```

```ts
import { createTwitCastingPlugin } from "@unified-live/twitcasting";

const twitcasting = createTwitCastingPlugin({
  clientId: process.env.TWITCASTING_CLIENT_ID!,
  clientSecret: process.env.TWITCASTING_CLIENT_SECRET!,
});
```

### TwitCasting 認証情報の取得

1. [TwitCasting Developer](https://twitcasting.tv/developer.php) にアクセス
2. 新しいアプリケーションを登録
3. **Client ID** と **Client Secret** をコピー

### レート制限

TwitCasting のほとんどのエンドポイントは 60 秒あたり 60 リクエストを許可します。一部のエンドポイント（サポーター/サポート中リスト）は 60 秒あたり 30 リクエストのより厳しい制限があります。SDK が自動管理します。

### 認証

SDK がアプリケーションレベルのアクセスとして Basic 認証（`base64(clientId:clientSecret)`）を内部で処理します。TwitCasting はユーザーレベル操作用の Bearer Token もサポートしていますが、現在は実装されていません。

---

## プラグインの登録

```ts
import { UnifiedClient } from "@unified-live/core";

// 方法 A: 作成後に登録
const client = UnifiedClient.create();
client.register(youtube);
client.register(twitch);
client.register(twitcasting);

// 方法 B: 作成時に渡す
const client = UnifiedClient.create({
  plugins: [youtube, twitch, twitcasting],
});
```

## リソースの解放

`using` を使うとスコープを抜けた時点で自動的に内部タイマーが解放されます:

```ts
using client = UnifiedClient.create({ plugins: [createYouTubePlugin({ apiKey: "..." })] });
// スコープ終了時に client[Symbol.dispose]() が自動的に呼ばれます
```

## 次のステップ

- [エラーハンドリング](../error-handling/) — API エラーの処理
- [ページネーション](../pagination/) — 動画リストの取得
- [プラグインの作成](../creating-a-plugin/) — 独自プラグインの構築
