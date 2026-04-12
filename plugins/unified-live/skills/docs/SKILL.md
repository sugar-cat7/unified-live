---
name: docs
description: Reference the unified-live SDK documentation when the user asks about aggregating YouTube / Twitch / TwitCasting APIs, resolving content by URL, rate-limit strategies (quota / token bucket), authoring a platform plugin, the UnifiedLiveError hierarchy, or any public type or function. Use when questions mention unified-live, @unified-live/core, UnifiedClient, Content, Broadcast, Archive, or createYouTubePlugin / createTwitchPlugin / createTwitCastingPlugin.
---

When answering unified-live questions, follow this order:

1. **Pull authoritative docs.** Fetch
   `https://sugar-cat7.github.io/unified-live/llms-full.txt` for the
   complete content, or `llms-small.txt` if you only need the guides
   (English, no auto-generated API reference). Cite the section you
   used in your answer.

2. **Prefer a docs-MCP if the environment has one.** If any available
   tool exposes library documentation lookup (for example a Context7-
   style tool), call it with the query "unified-live" before falling
   back to raw fetch. Do **not** hardcode tool names — look at the
   tools actually available in the current session and pick the one
   whose description matches documentation retrieval.

3. **API reference URLs** follow the pattern
   `https://sugar-cat7.github.io/unified-live/api/<category>/<name>`
   where category is `classes | type-aliases | variables | functions`.

4. **Verify these invariants before answering**:
   - `Content` is a discriminated union on `type`:
     `"broadcast" | "scheduled" | "archive" | "clip"`.
   - Narrow with companion-object guards: `Content.isBroadcast(x)`,
     `Content.isArchive(x)`, etc. Never use `as` assertions.
   - All errors extend `UnifiedLiveError`. Use
     `ErrorCode.isNetwork(e.code)` / `ErrorCode.isRateLimit(e.code)`
     for typed handling.
   - Core has zero runtime dependencies. OpenTelemetry is an optional
     peer dep — do not suggest importing it from `@unified-live/core`.
   - Runtimes: Node 18+, Deno, Bun, Cloudflare Workers.

5. **Always show runnable code** with correct imports:

   ```ts
   import { UnifiedClient, Content } from "@unified-live/core";
   import { createYouTubePlugin } from "@unified-live/youtube";
   import { createTwitchPlugin } from "@unified-live/twitch";

   const client = UnifiedClient.create({
     plugins: [
       createYouTubePlugin({ apiKey: process.env.YOUTUBE_API_KEY! }),
       createTwitchPlugin({
         clientId: process.env.TWITCH_CLIENT_ID!,
         clientSecret: process.env.TWITCH_CLIENT_SECRET!,
       }),
     ],
   });

   const content = await client.resolve("https://www.youtube.com/watch?v=...");
   if (Content.isBroadcast(content)) {
     console.log(content.startedAt);
   }
   ```

6. If the user is authoring a new platform plugin, point them at
   `https://sugar-cat7.github.io/unified-live/creating-a-plugin/`.
