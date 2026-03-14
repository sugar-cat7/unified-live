# Error Hierarchy — Type Definitions

## ErrorCode (String Literal Union)

```ts
export type ErrorCode =
  // Not Found
  | "NOT_FOUND"
  // Authentication
  | "AUTHENTICATION_INVALID"
  | "AUTHENTICATION_EXPIRED"
  // Rate Limiting
  | "RATE_LIMIT_EXCEEDED"
  // Quota
  | "QUOTA_EXHAUSTED"
  // Network
  | "NETWORK_TIMEOUT"
  | "NETWORK_CONNECTION"
  | "NETWORK_DNS"
  | "NETWORK_ABORT"
  // Parse
  | "PARSE_JSON"
  | "PARSE_RESPONSE"
  // Validation
  | "VALIDATION_INVALID_URL"
  | "VALIDATION_INVALID_INPUT"
  // Platform
  | "PLATFORM_NOT_FOUND"
  // Internal
  | "INTERNAL";
```

### Code Hierarchy

| Category | Codes | Description |
| --- | --- | --- |
| `NOT_FOUND` | `NOT_FOUND` | Resource does not exist on platform |
| `AUTHENTICATION_*` | `AUTHENTICATION_INVALID`, `AUTHENTICATION_EXPIRED` | Credential issues |
| `RATE_LIMIT_*` | `RATE_LIMIT_EXCEEDED` | Request rate limit after retries |
| `QUOTA_*` | `QUOTA_EXHAUSTED` | Cost-based quota (YouTube) |
| `NETWORK_*` | `NETWORK_TIMEOUT`, `NETWORK_CONNECTION`, `NETWORK_DNS`, `NETWORK_ABORT` | Fetch-level failures |
| `PARSE_*` | `PARSE_JSON`, `PARSE_RESPONSE` | Response parsing failures |
| `VALIDATION_*` | `VALIDATION_INVALID_URL`, `VALIDATION_INVALID_INPUT` | Input validation |
| `PLATFORM_*` | `PLATFORM_NOT_FOUND` | Plugin not registered |
| `INTERNAL` | `INTERNAL` | Unexpected SDK-internal error |

## ErrorContext

Structured metadata attached to every error:

```ts
export type ErrorContext = {
  /** Platform name (always present). */
  platform: string;
  /** HTTP method if the error occurred during a request. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Request path (e.g., "/videos"). */
  path?: string;
  /** HTTP status code from the response. */
  status?: number;
  /** Resource ID that was being accessed. */
  resourceId?: string;
};
```

## Error Class Hierarchy

```
UnifiedLiveError (base)
│  code: ErrorCode
│  context: ErrorContext
│  cause?: Error
│
├── NotFoundError
│     code: "NOT_FOUND"
│
├── AuthenticationError
│     code: "AUTHENTICATION_INVALID" | "AUTHENTICATION_EXPIRED"
│
├── RateLimitError
│     code: "RATE_LIMIT_EXCEEDED"
│     retryAfter?: number
│
├── QuotaExhaustedError
│     code: "QUOTA_EXHAUSTED"
│     details: { consumed, limit, resetsAt, requestedCost }
│
├── NetworkError
│     code: "NETWORK_TIMEOUT" | "NETWORK_CONNECTION" | "NETWORK_DNS" | "NETWORK_ABORT"
│
├── ParseError
│     code: "PARSE_JSON" | "PARSE_RESPONSE"
│
├── ValidationError
│     code: "VALIDATION_INVALID_URL" | "VALIDATION_INVALID_INPUT"
│
└── PlatformNotFoundError
      code: "PLATFORM_NOT_FOUND"
```

## Base Class Definition

```ts
export class UnifiedLiveError extends Error {
  readonly code: ErrorCode;
  readonly context: ErrorContext;

  constructor(
    message: string,
    code: ErrorCode,
    context: ErrorContext,
    options?: { cause?: Error },
  ) {
    super(message, { cause: options?.cause });
    this.name = "UnifiedLiveError";
    this.code = code;
    this.context = context;
  }
}
```

### Key Design Decisions

- **`cause` uses ES2022 `Error.cause`**: Native support, no custom property needed. Supported in Node.js 16.9+, all modern browsers.
- **`context` replaces the old `platform` field**: `context.platform` is always present. Additional fields are optional.
- **`code` is typed per subclass**: Each subclass narrows `code` to its specific literal(s) via constructor typing.
- **`details` on `QuotaExhaustedError` stays separate**: It contains quota-specific data that doesn't fit in `ErrorContext`.

## Subclass Definitions

### NotFoundError

```ts
export class NotFoundError extends UnifiedLiveError {
  constructor(
    platform: string,
    resourceId: string,
    options?: { cause?: Error },
  ) {
    super(
      `Resource "${resourceId}" not found on ${platform}`,
      "NOT_FOUND",
      { platform, resourceId },
      options,
    );
    this.name = "NotFoundError";
  }
}
```

### AuthenticationError

```ts
type AuthenticationCode = "AUTHENTICATION_INVALID" | "AUTHENTICATION_EXPIRED";

export class AuthenticationError extends UnifiedLiveError {
  declare readonly code: AuthenticationCode;

  constructor(
    platform: string,
    options?: {
      code?: AuthenticationCode;
      message?: string;
      cause?: Error;
    },
  ) {
    super(
      options?.message ?? "Authentication failed",
      options?.code ?? "AUTHENTICATION_INVALID",
      { platform },
      { cause: options?.cause },
    );
    this.name = "AuthenticationError";
  }
}
```

### RateLimitError

```ts
export class RateLimitError extends UnifiedLiveError {
  declare readonly code: "RATE_LIMIT_EXCEEDED";
  readonly retryAfter?: number;

  constructor(
    platform: string,
    options?: { retryAfter?: number; cause?: Error },
  ) {
    super(
      options?.retryAfter
        ? `Rate limited, retry after ${options.retryAfter}s`
        : "Rate limited",
      "RATE_LIMIT_EXCEEDED",
      { platform },
      { cause: options?.cause },
    );
    this.name = "RateLimitError";
    this.retryAfter = options?.retryAfter;
  }
}
```

### QuotaExhaustedError

```ts
type QuotaDetails = {
  consumed: number;
  limit: number;
  resetsAt: Date;
  requestedCost: number;
};

export class QuotaExhaustedError extends UnifiedLiveError {
  declare readonly code: "QUOTA_EXHAUSTED";
  readonly details: QuotaDetails;

  constructor(
    platform: string,
    details: QuotaDetails,
    options?: { cause?: Error },
  ) {
    super(
      `Quota exhausted: ${details.consumed}/${details.limit} used, resets at ${details.resetsAt.toISOString()}`,
      "QUOTA_EXHAUSTED",
      { platform },
      options,
    );
    this.name = "QuotaExhaustedError";
    this.details = details;
  }
}
```

### NetworkError (new)

```ts
type NetworkCode =
  | "NETWORK_TIMEOUT"
  | "NETWORK_CONNECTION"
  | "NETWORK_DNS"
  | "NETWORK_ABORT";

export class NetworkError extends UnifiedLiveError {
  declare readonly code: NetworkCode;

  constructor(
    platform: string,
    code: NetworkCode,
    options?: {
      message?: string;
      path?: string;
      method?: ErrorContext["method"];
      cause?: Error;
    },
  ) {
    super(
      options?.message ?? `Network error: ${code}`,
      code,
      { platform, path: options?.path, method: options?.method },
      { cause: options?.cause },
    );
    this.name = "NetworkError";
  }
}
```

### ParseError (new)

```ts
type ParseCode = "PARSE_JSON" | "PARSE_RESPONSE";

export class ParseError extends UnifiedLiveError {
  declare readonly code: ParseCode;

  constructor(
    platform: string,
    code: ParseCode,
    options?: {
      message?: string;
      path?: string;
      status?: number;
      cause?: Error;
    },
  ) {
    super(
      options?.message ?? `Parse error: ${code}`,
      code,
      { platform, path: options?.path, status: options?.status },
      { cause: options?.cause },
    );
    this.name = "ParseError";
  }
}
```

### ValidationError (new)

```ts
type ValidationCode = "VALIDATION_INVALID_URL" | "VALIDATION_INVALID_INPUT";

export class ValidationError extends UnifiedLiveError {
  declare readonly code: ValidationCode;

  constructor(
    code: ValidationCode,
    message: string,
    options?: { platform?: string; cause?: Error },
  ) {
    super(
      message,
      code,
      { platform: options?.platform ?? "unknown" },
      { cause: options?.cause },
    );
    this.name = "ValidationError";
  }
}
```

### PlatformNotFoundError

```ts
export class PlatformNotFoundError extends UnifiedLiveError {
  declare readonly code: "PLATFORM_NOT_FOUND";

  constructor(platform: string) {
    super(
      `Platform "${platform}" is not registered`,
      "PLATFORM_NOT_FOUND",
      { platform },
    );
    this.name = "PlatformNotFoundError";
  }
}
```

## Backward Compatibility

| Old API | New API | Migration |
| --- | --- | --- |
| `error.platform` | `error.context.platform` | Add getter for backward compat |
| `error.code` (string) | `error.code` (ErrorCode) | Narrows existing type |
| `new AuthenticationError(platform, message?)` | `new AuthenticationError(platform, { message?, code?, cause? })` | Options object |
| `new RateLimitError(platform, retryAfter?)` | `new RateLimitError(platform, { retryAfter?, cause? })` | Options object |
| `new NotFoundError(platform, resourceId)` | `new NotFoundError(platform, resourceId, { cause? })` | Optional 3rd arg |

### `platform` Getter

To avoid breaking `error.platform`, add a getter on `UnifiedLiveError`:

```ts
get platform(): string {
  return this.context.platform;
}
```

## Helper: classifyNetworkError

Classify fetch errors into specific `NetworkCode` values:

```ts
export function classifyNetworkError(error: Error): NetworkCode {
  const msg = error.message.toLowerCase();
  if (error.name === "AbortError" || msg.includes("abort")) return "NETWORK_ABORT";
  if (msg.includes("timeout") || error.name === "TimeoutError") return "NETWORK_TIMEOUT";
  if (msg.includes("dns") || msg.includes("getaddrinfo")) return "NETWORK_DNS";
  return "NETWORK_CONNECTION";
}
```
