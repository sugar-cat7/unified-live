# Error Hierarchy — Infrastructure Changes

## RestManager Changes

### handleResponse

Current (manager.ts):
```ts
// JSON parse failure
throw new UnifiedLiveError(`Failed to parse response from ${manager.platform}`, manager.platform, "PARSE_ERROR");
```

After:
```ts
throw new ParseError(manager.platform, "PARSE_JSON", {
  message: `Failed to parse JSON response from ${manager.platform}`,
  path: req.path,
  status: response.status,
  cause: parseError,
});
```

### request (retry loop)

Current error flow:
```
401 → AuthenticationError(platform)
404 → NotFoundError(platform, req.path)
5xx → retry → RateLimitError(platform)
```

After:
```
401 → AuthenticationError(platform, { code: "AUTHENTICATION_EXPIRED", cause })
404 → NotFoundError(platform, req.path, { cause })
429 → retry → RateLimitError(platform, { retryAfter, cause })
5xx → retry → NetworkError(platform, "NETWORK_CONNECTION", { path, method, cause })
fetch error → classify → NetworkError(platform, classifyNetworkError(e), { path, method, cause: e })
```

### fetch Error Wrapping

Currently, fetch exceptions (network failures) are **not caught** in RestManager. They propagate as raw `TypeError` from native fetch.

After: Wrap fetch errors in `NetworkError`:

```ts
let response: Response;
try {
  response = await fetchFn(url, { method, headers, body, signal });
} catch (error) {
  const code = classifyNetworkError(error as Error);
  throw new NetworkError(manager.platform, code, {
    path: req.path,
    method: req.method,
    cause: error as Error,
  });
}
```

### 5xx After Retries

Currently throws `RateLimitError` for 5xx exhaustion — misleading. Change to:

```ts
// After all retries for 5xx
throw new NetworkError(manager.platform, "NETWORK_CONNECTION", {
  message: `Request failed after ${maxRetries} retries: ${response.status}`,
  path: req.path,
  method: req.method,
});
```

Reserve `RateLimitError` for actual 429 rate limiting.

## OTel Span Attributes

Add error code to OTel spans:

```ts
span.setAttributes({
  "error.code": error.code,           // ErrorCode literal
  "error.type": error.name,           // Class name
  "error.has_cause": !!error.cause,   // Whether cause chain exists
});
```

## Auth Token Manager

### Twitch (auth.ts)

Current:
```ts
throw new AuthenticationError("twitch", `Token fetch failed: ${(e as Error).message}`);
throw new AuthenticationError("twitch", `Token fetch failed: ${res.status}`);
```

After:
```ts
// fetch exception
throw new AuthenticationError("twitch", {
  code: "AUTHENTICATION_INVALID",
  message: `Token fetch failed: ${(e as Error).message}`,
  cause: e as Error,
});

// Non-OK response
throw new AuthenticationError("twitch", {
  code: "AUTHENTICATION_INVALID",
  message: `Token fetch failed: HTTP ${res.status}`,
});
```

### Static Token (auth/static.ts)

Current:
```ts
throw new AuthenticationError("unknown", "Static token invalidated.");
```

After:
```ts
throw new AuthenticationError("unknown", {
  code: "AUTHENTICATION_EXPIRED",
  message: "Static token invalidated. Check credentials.",
});
```

## YouTube Rate Limit Handler

Current (rate-limit.ts):
```ts
throw new QuotaExhaustedError("youtube", { consumed, limit, resetsAt, requestedCost: 0 });
```

After (no change to QuotaExhaustedError usage, constructor signature updated):
```ts
throw new QuotaExhaustedError("youtube", {
  consumed: status.limit - status.remaining,
  limit: status.limit,
  resetsAt: status.resetsAt,
  requestedCost: 0,
});
```

## YouTube Mapper

Current (mapper.ts:138) — **GENERIC ERROR**:
```ts
throw new Error("YouTube resource has no thumbnail");
```

After:
```ts
throw new ParseError("youtube", "PARSE_RESPONSE", {
  message: "YouTube resource has no thumbnail",
});
```
