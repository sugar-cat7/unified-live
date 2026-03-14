# プラットフォームプラグイン

各プラットフォームは独立したパッケージとして提供されます。必要なプラットフォームだけをインストールできます。

## YouTube

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

| 操作 | コスト |
|------|--------|
| `getContent`（videos.list） | 1 ユニット |
| `getChannel`（channels.list） | 1 ユニット |
| `getVideos`（playlistItems.list + videos.list） | 2 ユニット |
| `getLiveStreams`（search.list + videos.list） | 101 ユニット |

SDK はクォータ消費をローカルで追跡し、上限に達すると `QuotaExhaustedError` をスローします。

---

## Twitch

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

Twitch は 60 秒あたり 800 リクエストを許可します。SDK はトークンバケットアルゴリズムと API レスポンスのレート制限ヘッダーを使って自動管理します。

### 認証

SDK が OAuth2 Client Credentials Grant を自動処理します。トークンは期限切れ前に自動更新されます。

---

## TwitCasting

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

TwitCasting は 60 秒あたり 60 リクエストを許可します。SDK が自動管理します。

### 認証

SDK が Basic 認証（`base64(clientId:clientSecret)`）を内部で処理します。

---

## プラグインの登録

```ts
import { createClient } from "@unified-live/core";

// 方法 A: 作成後に登録
const client = createClient();
client.register(youtube);
client.register(twitch);
client.register(twitcasting);

// 方法 B: 作成時に渡す
const client = createClient({
  plugins: [youtube, twitch, twitcasting],
});
```

## リソースの解放

使い終わったら `dispose()` を呼んで内部タイマーを解放してください:

```ts
client.dispose();
```

## 次のステップ

- [エラーハンドリング](./04-error-handling.md) — API エラーの処理
- [ページネーション](./05-pagination.md) — 動画リストの取得
