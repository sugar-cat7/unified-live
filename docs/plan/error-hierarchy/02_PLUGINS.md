# Error Hierarchy — Plugin Changes

## Migration Summary

All plugins need to update their `throw` statements to use the new constructor signatures.

### YouTube Plugin

| File | Current | After |
| --- | --- | --- |
| `methods.ts:40` | `new NotFoundError("youtube", id)` | `new NotFoundError("youtube", id)` (compatible) |
| `methods.ts:71` | `new NotFoundError("youtube", id)` | `new NotFoundError("youtube", id)` (compatible) |
| `methods.ts:131` | `new NotFoundError("youtube", channelId)` | `new NotFoundError("youtube", channelId)` (compatible) |
| `mapper.ts:138` | `new Error("YouTube resource has no thumbnail")` | `new ParseError("youtube", "PARSE_RESPONSE", { message: "..." })` |
| `rate-limit.ts:29` | `new QuotaExhaustedError("youtube", {...})` | No change (constructor signature compatible) |

### Twitch Plugin

| File | Current | After |
| --- | --- | --- |
| `methods.ts:38` | `new NotFoundError("twitch", id)` | No change (compatible) |
| `methods.ts:66` | `new NotFoundError("twitch", id)` | No change (compatible) |
| `auth.ts:38` | `new AuthenticationError("twitch", "Token fetch failed: ...")` | `new AuthenticationError("twitch", { message, cause })` |
| `auth.ts:45` | `new AuthenticationError("twitch", "Token fetch failed: ...")` | `new AuthenticationError("twitch", { message })` |

### TwitCasting Plugin

| File | Current | After |
| --- | --- | --- |
| `methods.ts:65` | `new NotFoundError("twitcasting", id)` | No change (compatible) |

## Platform-Specific Error Detection

### YouTube 403 Responses

YouTube returns structured error reasons in the response body:

```json
{
  "error": {
    "errors": [{ "reason": "quotaExceeded" }]
  }
}
```

The rate-limit handler already detects these. No changes needed beyond the constructor update.

### Twitch Token Errors

Twitch OAuth returns error descriptions:

```json
{
  "status": 401,
  "message": "invalid client secret"
}
```

These should use `AUTHENTICATION_INVALID`. Token expiry (detected during token refresh) should use `AUTHENTICATION_EXPIRED`.

### TwitCasting Errors

TwitCasting returns errors in this format:

```json
{
  "error": {
    "code": 404,
    "message": "Not Found"
  }
}
```

Currently handled by RestManager's generic 404 detection. No plugin-specific changes needed.
