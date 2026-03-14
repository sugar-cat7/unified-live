# エラーハンドリング

SDK がスローするエラーはすべて `UnifiedLiveError` のインスタンスです。`try/catch` で処理します。

## エラーの種類

```ts
import {
  UnifiedLiveError,
  NotFoundError,
  QuotaExhaustedError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  ParseError,
  ValidationError,
  PlatformNotFoundError,
} from "@unified-live/core";
```

| エラー | 発生タイミング | 対処方法 |
|--------|--------------|----------|
| `NotFoundError` | コンテンツやチャンネルが存在しない | ID や URL を確認 |
| `QuotaExhaustedError` | YouTube の日次クォータ超過 | クォータがリセットされるまで待機 |
| `AuthenticationError` | 認証情報が無効または期限切れ | API キーを確認 |
| `RateLimitError` | リトライ上限後もレート制限超過 | リクエスト頻度を下げる |
| `NetworkError` | ネットワーク障害（タイムアウト、DNS、接続） | 接続を確認、後でリトライ |
| `ParseError` | API レスポンスのパース失敗 | バグとして報告 |
| `ValidationError` | 無効な入力（空の URL など） | 入力を修正 |
| `PlatformNotFoundError` | プラットフォームのプラグインが未登録 | プラグインを登録 |

## 基本的なエラー処理

```ts
try {
  const content = await client.getContent(url);
  console.log(content.title);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log(`${error.platform} で見つかりませんでした`);
  } else if (error instanceof QuotaExhaustedError) {
    console.log(`クォータ超過。リセット時刻: ${error.details.resetsAt}`);
    console.log(`使用量: ${error.details.consumed}/${error.details.limit}`);
  } else if (error instanceof AuthenticationError) {
    console.log(`${error.platform} の認証に失敗しました`);
  } else if (error instanceof NetworkError) {
    console.log(`ネットワークエラー: ${error.code}`); // 例: "NETWORK_TIMEOUT"
  } else if (error instanceof UnifiedLiveError) {
    console.log(`SDK エラー: ${error.message} (${error.code})`);
  } else {
    throw error; // 予期しないエラーは再スロー
  }
}
```

## エラーコード

すべてのエラーには型付きの `code` フィールドがあり、プログラム的なハンドリングが可能です:

```ts
catch (error) {
  if (error instanceof UnifiedLiveError) {
    switch (error.code) {
      case "NOT_FOUND":
      case "PLATFORM_NOT_FOUND":
        // リソースまたはプラットフォームが見つからない
        break;
      case "AUTHENTICATION_INVALID":
      case "AUTHENTICATION_EXPIRED":
        // 認証情報の問題
        break;
      case "NETWORK_TIMEOUT":
      case "NETWORK_CONNECTION":
      case "NETWORK_DNS":
      case "NETWORK_ABORT":
        // ネットワーク障害
        break;
      case "RATE_LIMIT_EXCEEDED":
      case "QUOTA_EXHAUSTED":
        // レート制限
        break;
    }
  }
}
```

## 構造化コンテキスト

すべてのエラーは `error.context` で構造化されたメタデータを持ちます:

```ts
catch (error) {
  if (error instanceof UnifiedLiveError) {
    console.log(error.platform);          // "youtube"（後方互換 getter）
    console.log(error.context.platform);  // "youtube"
    console.log(error.context.path);      // "/videos"（該当する場合）
    console.log(error.context.status);    // 404（該当する場合）
    console.log(error.cause);             // 元のエラー（ラップされている場合）
  }
}
```

## 自動リトライ

SDK は以下のケースで自動的にリトライします（エラーはスローされません）:

- **429 Too Many Requests** — `Retry-After` ヘッダーに従って待機後リトライ
- **5xx サーバーエラー** — 指数バックオフでリトライ
- **401 Unauthorized** — 認証トークンを更新してリトライ（Twitch）

すべてのリトライが失敗した場合のみエラーがスローされます。

## YouTube クォータ

YouTube のクォータエラーは特別です。日次クォータ（デフォルト 10,000 ユニット）を使い切ると、`QuotaExhaustedError` が即座にスローされます。クォータのリセットは太平洋時間の深夜なので、リトライしても意味がないためです。

```ts
try {
  const streams = await client.getLiveStreams("youtube", channelId);
} catch (error) {
  if (error instanceof QuotaExhaustedError) {
    const { consumed, limit, resetsAt } = error.details;
    console.log(`YouTube クォータ: ${consumed}/${limit}、リセット: ${resetsAt}`);
  }
}
```

## 次のステップ

- [ページネーション](./05-pagination.md) — 動画リストのページング
- [応用](./06-advanced.md) — OpenTelemetry やプラグインの直接アクセス
