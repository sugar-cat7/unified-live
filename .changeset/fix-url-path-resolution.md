---
"@unified-live/core": patch
---

fix(core): preserve baseUrl path in REST manager URL construction

`new URL("/path", "https://host/base")` drops `/base` per RFC 3986 absolute-path semantics. This caused requests to Twitch (`/helix`) and YouTube (`/youtube/v3`) to resolve to the wrong URL, resulting in 404 errors or empty responses.

The fix normalizes to a trailing-slash base + relative path before constructing the URL.
