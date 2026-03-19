---
title: 概要
description: "unified-liveの概要と複数プラットフォームAPI統合の課題解決"
---

## 課題

YouTube、Twitch、TwitCasting をまたいだライブ配信データを集約するアプリケーションを構築するには、3つのまったく異なるAPI — 認証方式、レート制限モデル、データ形式、URL構造がすべて異なる — を扱う必要があります。

|                         | [YouTube Data API v3](https://developers.google.com/youtube/v3) | [Twitch Helix API](https://dev.twitch.tv/docs/api/) | [TwitCasting API v2](https://apiv2-doc.twitcasting.tv/) |
| :---------------------- | :-------------------------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------ |
| **認証**                | APIキー（クエリパラメータ）                                     | OAuth2 Client Credentials                           | Basic Auth（base64）                                    |
| **レート制限**          | クォータベース（10,000ユニット/日）                             | トークンバケット（ヘッダー駆動）                    | トークンバケット（60リクエスト/60秒）                   |
| **コストモデル**        | エンドポイント毎のコスト（1〜1,600ユニット）                    | 定額（1リクエスト = 1トークン）                     | 定額（1リクエスト = 1トークン）                         |
| **配信 vs. アーカイブ** | 同一の動画ID                                                    | 異なる動画ID                                        | 同一のムービーID                                        |
| **チャンネルID**        | `UC...` プレフィックス、`@handle`                               | ログイン名                                          | ユーザーID                                              |

### よくある課題

- **YouTubeのクォータ** — 日次10,000ユニットのクォータはすぐに消費されます。`search.list` 1回で100ユニット。ローカルでの追跡がなければ、日中にサイレントな403エラーが発生します。
- **TwitchのOAuth** — トークンには有効期限があり、期限前にリフレッシュが必要です。リフレッシュを見逃すと本番環境で401エラーになります。
- **TwitCastingのレート制限** — 1分間に60リクエストのみ。適切なトークンバケットがなければ、中程度の負荷でも429エラーに遭遇します。
- **異なるデータモデル** — YouTubeの「動画」、Twitchの「VOD」、TwitCastingの「ムービー」は概念的には同じものですが、JSON構造とフィールド名がまったく異なります。

## unified-live の解決策

```ts
import { UnifiedClient } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";
import { createTwitCastingPlugin } from "@unified-live/twitcasting";

const client = UnifiedClient.create({
  plugins: [
    createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
    createTwitchPlugin({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
    createTwitCastingPlugin({
      clientId: process.env.TWITCASTING_CLIENT_ID!,
      clientSecret: process.env.TWITCASTING_CLIENT_SECRET!,
    }),
  ],
});

// 1つのインターフェース — SDKが認証、レート制限、データ正規化を処理
const yt = await client.getContent("https://www.youtube.com/watch?v=abc123");
const tw = await client.getContent("https://www.twitch.tv/videos/123456");
const tc = await client.getContent("https://twitcasting.tv/user/movie/789");

// すべて同じ Content 型で返される
console.log(yt.title); // string
console.log(tw.platform); // "twitch"
console.log(tc.type); // "live" | "video"
```

### SDK が処理すること

| 関心事                 | unified-live の処理方法                                                                                                                    |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **認証**               | APIキー注入（YouTube）、OAuth2自動リフレッシュ（Twitch）、Basic Auth エンコード（TwitCasting）                                             |
| **レート制限**         | `QuotaExhaustedError` 付きローカルクォータ追跡（YouTube）、ヘッダー解析付きトークンバケット（Twitch）、固定トークンバケット（TwitCasting） |
| **リトライ**           | 429/5xx に対する指数バックオフ、401 でのトークンリフレッシュ                                                                               |
| **データ正規化**       | すべてのプラットフォームを統一された `Content`、`Channel`、`LiveStream`、`Video` 型にマッピング                                            |
| **URL解決**            | URLからプラットフォームを自動検出、プラットフォーム毎に複数のURL形式をサポート                                                             |
| **オブザーバビリティ** | すべてのAPIコールに対するOpenTelemetryスパン（OTel未設定時はオーバーヘッドゼロ）                                                           |

### 機能マトリクス

| 機能                         | YouTube | Twitch | TwitCasting |
| :--------------------------- | :-----: | :----: | :---------: |
| URL からコンテンツ取得       |   ✅    |   ✅   |     ✅      |
| ID からコンテンツ取得        |   ✅    |   ✅   |     ✅      |
| ライブ配信一覧               |   ✅    |   ✅   |     ✅      |
| 動画一覧（ページネーション） |   ✅    |   ✅   |     ✅      |
| チャンネル情報取得           |   ✅    |   ✅   |     ✅      |
| アーカイブ解決               |   ✅    |   ✅   |     ✅      |
| OpenTelemetry トレーシング   |   ✅    |   ✅   |     ✅      |

## 公式APIドキュメント

- [YouTube Data API v3](https://developers.google.com/youtube/v3/docs) — Googleの動画プラットフォームAPI（SDKは **v3** を対象）
- [Twitch Helix API](https://dev.twitch.tv/docs/api/guide) — Twitchの現行REST API（SDKは現行APIである **Helix** を対象）
- [TwitCasting API v2](https://apiv2-doc.twitcasting.tv/) — TwitCastingのREST API（SDKは **v2** を対象）

## 次のステップ

- [はじめる](../getting-started/) — インストールと最初のクエリ実行
- [コアコンセプト](../core-concepts/) — Content、Channel、型システム
- [使用例](../examples/) — 実践的なコードレシピ
