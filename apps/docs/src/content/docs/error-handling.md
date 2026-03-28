---
title: Error Handling
description: "Handle API errors gracefully with the unified error hierarchy"
---

All errors thrown by the SDK are instances of `UnifiedLiveError`. Use `try/catch` to handle them.

## Error Types

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

| Error                   | When                                       | What to Do                                   |
| ----------------------- | ------------------------------------------ | -------------------------------------------- |
| `NotFoundError`         | Content or channel doesn't exist           | Check the ID or URL                          |
| `QuotaExhaustedError`   | YouTube daily quota exceeded               | Wait until quota resets                      |
| `AuthenticationError`   | Invalid or expired credentials             | Check your API keys                          |
| `RateLimitError`        | Rate limit exceeded after all retries      | Reduce request frequency; check `retryAfter` |
| `NetworkError`          | Network failure (timeout, DNS, connection) | Check connectivity, retry later              |
| `ParseError`            | Failed to parse API response               | [Report as a bug](https://github.com/sugar-cat7/unified-live/issues) |
| `ValidationError`       | Invalid input (e.g., empty URL)            | Fix the input                                |
| `PlatformNotFoundError` | No plugin registered for the platform      | Register the plugin                          |

## Basic Error Handling

```ts
try {
  const content = await client.resolve(url);
  console.log(content.title);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log(`Not found on ${error.platform}`);
  } else if (error instanceof QuotaExhaustedError) {
    console.log(`Quota exceeded. Resets at: ${error.details.resetsAt}`);
    console.log(`Used: ${error.details.consumed}/${error.details.limit}`);
  } else if (error instanceof AuthenticationError) {
    console.log(`Auth failed for ${error.platform}`);
  } else if (error instanceof NetworkError) {
    console.log(`Network error: ${error.code}`); // e.g., "NETWORK_TIMEOUT"
  } else if (error instanceof UnifiedLiveError) {
    console.log(`SDK error: ${error.message} (${error.code})`);
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

## Error Codes

Every error has a typed `code` field for programmatic handling:

```ts
try {
  const content = await client.resolve(url);
} catch (error) {
  if (error instanceof UnifiedLiveError) {
    switch (error.code) {
      case "NOT_FOUND":
      case "PLATFORM_NOT_FOUND":
        // Resource or platform not found
        break;
      case "AUTHENTICATION_INVALID":
      case "AUTHENTICATION_EXPIRED":
        // Credential issues
        break;
      case "NETWORK_TIMEOUT":
      case "NETWORK_CONNECTION":
      case "NETWORK_DNS":
      case "NETWORK_ABORT":
        // Network failures
        break;
      case "RATE_LIMIT_EXCEEDED":
      case "QUOTA_EXHAUSTED":
        // Rate limiting
        break;
      case "PARSE_JSON":
      case "PARSE_RESPONSE":
        // Response parsing failures
        break;
      case "VALIDATION_INVALID_URL":
      case "VALIDATION_INVALID_INPUT":
        // Input validation errors
        break;
      case "INTERNAL":
        // Internal SDK error
        break;
    }
  }
}
```

## Structured Context

All errors carry structured metadata via `error.context`:

```ts
try {
  const content = await client.resolve(url);
} catch (error) {
  if (error instanceof UnifiedLiveError) {
    console.log(error.platform);          // "youtube" (backward-compat getter)
    console.log(error.context.platform);  // "youtube"
    console.log(error.context.path);      // "/videos" (if applicable)
    console.log(error.context.status);    // 404 (if applicable)
    console.log(error.cause);             // Original error (if wrapped)
  }
}
```

## RateLimitError

`RateLimitError` includes a `retryAfter` property — the number of seconds to wait before retrying, or `undefined` if the server did not provide a value.

```ts
try {
  const content = await client.resolve(url);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after: ${error.retryAfter ?? "unknown"} seconds`);
  }
}
```

## Transparent Retries

The SDK automatically retries these scenarios without throwing:

- **429 Too Many Requests** — waits using `Retry-After` header, then retries
- **5xx Server Errors** — retries with exponential backoff
- **401 Unauthorized** — refreshes the auth token and retries (Twitch)

You only see an error if all retries are exhausted.

## YouTube Quota

YouTube quota errors behave differently from other rate limits. When the daily quota (default 10,000 units) is exhausted, the SDK throws `QuotaExhaustedError` immediately without retrying, because the quota resets at midnight Pacific Time.

```ts
try {
  const streams = await client.listBroadcasts("youtube", channelId);
} catch (error) {
  if (error instanceof QuotaExhaustedError) {
    const { consumed, limit, resetsAt } = error.details;
    console.log(`YouTube quota: ${consumed}/${limit}, resets at ${resetsAt}`);
  }
}
```

## Next Steps

- [Pagination](../pagination/) — Fetching paginated archive lists
- [Advanced](../advanced/) — OpenTelemetry and custom plugins
