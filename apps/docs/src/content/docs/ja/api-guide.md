---
title: API リファレンスガイド
---

API リファレンスは英語で自動生成されています。このページでは、API リファレンスの読み方と主要な型の日本語対照表を提供します。

## API リファレンスへのアクセス

サイドバーの **API Reference** セクションから、自動生成された TypeDoc ドキュメントにアクセスできます。

## カテゴリ別概要

API リファレンスは以下のカテゴリで整理されています:

### Client

SDK のメインエントリーポイント。

| シンボル | 説明 |
|---------|------|
| `UnifiedClient` | SDK クライアント。プラグインの管理とリクエストのルーティングを行う |
| `UnifiedClientOptions` | クライアント作成時の設定オプション |

### Types

すべてのプラットフォームで共通のデータ型。

| シンボル | 日本語名 | 説明 |
|---------|---------|------|
| `Content` | コンテンツ | ライブ配信または動画の判別共用体 |
| `LiveStream` | ライブ配信 | 現在配信中のストリーム (`type: "live"`) |
| `Video` | 動画 | アーカイブまたはアップロード動画 (`type: "video"`) |
| `Channel` | チャンネル | 配信チャンネルまたはユーザーアカウント |
| `Page<T>` | ページ | カーソルベースのページネーションラッパー |
| `ResolvedUrl` | 解決済み URL | URL からプラットフォームとリソースを特定した結果 |
| `BroadcastSession` | 配信セッション | ライブ配信とアーカイブ動画を関連付ける |

### Errors

SDK が投げるエラー階層。

| シンボル | 日本語名 | 説明 |
|---------|---------|------|
| `UnifiedLiveError` | 基底エラー | すべての SDK エラーの基底クラス |
| `NotFoundError` | 未検出エラー | リソースがプラットフォームに存在しない |
| `AuthenticationError` | 認証エラー | 認証情報が無効または期限切れ |
| `RateLimitError` | レート制限エラー | リクエスト頻度が制限を超過 |
| `QuotaExhaustedError` | クォータ枯渇エラー | 日次クォータを使い切った (YouTube) |
| `NetworkError` | ネットワークエラー | fetch レベルの通信障害 |
| `ParseError` | パースエラー | レスポンスの JSON 解析に失敗 |
| `ValidationError` | バリデーションエラー | 入力値が不正 |
| `PlatformNotFoundError` | プラットフォーム未登録エラー | 指定プラットフォームが未登録 |

### Plugins

プラグインの公開 API。

| シンボル | 説明 |
|---------|------|
| `PlatformPlugin` | プラットフォームプラグインの型とファクトリ |
| `PluginDefinition` | プラグインの宣言的設定 |
| `PluginMethods` | プラットフォーム固有のデータアクセスメソッド |
| `PluginCapabilities` | プラグインの機能メタデータ |

### Plugin Development

プラグイン開発者向けの内部インフラ。

| シンボル | 説明 |
|---------|------|
| `RestManager` | HTTP リクエストのライフサイクル管理 |
| `createRestManager` | RestManager のファクトリ関数 |
| `RateLimitStrategy` | レート制限戦略のインターフェース |
| `createTokenBucketStrategy` | トークンバケット戦略のファクトリ |
| `createQuotaBudgetStrategy` | クォータバジェット戦略のファクトリ |
| `TokenManager` | 認証トークンの管理 |
| `RestRequest` / `RestResponse` | REST リクエスト/レスポンスの型 |

### Observability

オブザーバビリティ（可観測性）関連。

| シンボル | 説明 |
|---------|------|
| `getTracer` | OpenTelemetry トレーサーの取得 |
| `SpanAttributes` | SDK が使用するスパン属性キー |

## よく使うパターン

### 型の絞り込み

```ts
import { Content } from "@unified-live/core";

if (Content.isLive(content)) {
  // content は LiveStream 型に絞り込まれる
}
```

### エラーハンドリング

```ts
import { UnifiedLiveError, RateLimitError } from "@unified-live/core";

try {
  const content = await client.getContent(url);
} catch (error) {
  if (error instanceof RateLimitError) {
    // レート制限に対応
  } else if (error instanceof UnifiedLiveError) {
    console.error(error.code, error.context);
  }
}
```

## 関連リンク

- [API Reference](/unified-live/api/) — 完全な英語 API リファレンス
- [コアコンセプト](../core-concepts/) — 型システムの詳細
- [エラーハンドリング](../error-handling/) — エラー処理の詳細ガイド
