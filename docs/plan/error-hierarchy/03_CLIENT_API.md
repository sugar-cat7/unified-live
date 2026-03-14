# Error Hierarchy — Public API

## Exported Types

From `@unified-live/core`:

```ts
// Type
export type { ErrorCode, ErrorContext } from "./errors.js";

// Classes
export {
  UnifiedLiveError,
  NotFoundError,
  AuthenticationError,
  RateLimitError,
  QuotaExhaustedError,
  NetworkError,        // new
  ParseError,          // new
  ValidationError,     // new
  PlatformNotFoundError,
} from "./errors.js";

// Utility
export { classifyNetworkError } from "./errors.js";
```

## Consumer Usage Examples

### Basic error handling

```ts
try {
  const content = await client.getContent(url);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log(error.code);              // "NOT_FOUND"
    console.log(error.context.platform);  // "youtube"
    console.log(error.context.resourceId); // "abc123"
  }
}
```

### Network error handling

```ts
try {
  const content = await client.getContent(url);
} catch (error) {
  if (error instanceof NetworkError) {
    switch (error.code) {
      case "NETWORK_TIMEOUT":
        console.log("Request timed out, try again later");
        break;
      case "NETWORK_DNS":
        console.log("DNS resolution failed — check connectivity");
        break;
      case "NETWORK_CONNECTION":
        console.log("Connection failed");
        break;
      case "NETWORK_ABORT":
        console.log("Request was aborted");
        break;
    }
    // Original error available via cause chain
    console.log(error.cause); // TypeError: fetch failed
  }
}
```

### Structured logging

```ts
catch (error) {
  if (error instanceof UnifiedLiveError) {
    logger.error({
      code: error.code,
      message: error.message,
      context: error.context,
      cause: error.cause?.message,
    });
  }
}
```

### Exhaustive code switching

```ts
function handleError(error: UnifiedLiveError): void {
  switch (error.code) {
    case "NOT_FOUND":
    case "PLATFORM_NOT_FOUND":
      // 404-like
      break;
    case "AUTHENTICATION_INVALID":
    case "AUTHENTICATION_EXPIRED":
      // 401-like
      break;
    case "RATE_LIMIT_EXCEEDED":
    case "QUOTA_EXHAUSTED":
      // 429-like
      break;
    case "NETWORK_TIMEOUT":
    case "NETWORK_CONNECTION":
    case "NETWORK_DNS":
    case "NETWORK_ABORT":
      // Network failures
      break;
    case "PARSE_JSON":
    case "PARSE_RESPONSE":
      // Parse failures
      break;
    case "VALIDATION_INVALID_URL":
    case "VALIDATION_INVALID_INPUT":
      // Input validation
      break;
    case "INTERNAL":
      // Unexpected
      break;
  }
}
```

## Client Changes

### getContent (URL validation)

Currently, if a URL matches no plugin, throws `PlatformNotFoundError`. Add input validation:

```ts
// Before plugin lookup
if (!url || typeof url !== "string") {
  throw new ValidationError("VALIDATION_INVALID_INPUT", "URL must be a non-empty string");
}
```

### Backward Compatibility

The `platform` getter on `UnifiedLiveError` ensures existing code works:

```ts
// Old code — still works
error.platform // returns error.context.platform

// New code — more structured
error.context.platform
error.context.path
error.context.status
```
