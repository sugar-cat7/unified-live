/**
 * Basic usage example for unified-live SDK.
 *
 * This example demonstrates how to set up the client with all three
 * platform plugins and fetch content from different platforms.
 *
 * Prerequisites:
 * - YouTube Data API v3 key
 * - Twitch application credentials (client ID + secret)
 * - TwitCasting application credentials (client ID + secret)
 */

import { Content, ErrorCode, UnifiedClient, UnifiedLiveError } from "@unified-live/core";
import { createYouTubePlugin } from "@unified-live/youtube";
import { createTwitchPlugin } from "@unified-live/twitch";
import { createTwitCastingPlugin } from "@unified-live/twitcasting";

// 1. Create platform plugins
const youtube = createYouTubePlugin({
  apiKey: process.env.YOUTUBE_API_KEY!,
});

const twitch = createTwitchPlugin({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
});

const twitcasting = createTwitCastingPlugin({
  clientId: process.env.TWITCASTING_CLIENT_ID!,
  clientSecret: process.env.TWITCASTING_CLIENT_SECRET!,
});

// 2. Create unified client
const client = UnifiedClient.create({
  plugins: [youtube, twitch, twitcasting],
});

// 3. Fetch content by URL (auto-detects platform)
const content = await client.resolve("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
console.log(`[${content.platform}] ${content.title}`);

// 4. Use type guards to narrow content type
if (Content.isArchive(content)) {
  console.log(`Duration: ${content.duration}s, Views: ${content.viewCount}`);
}

if (Content.isBroadcast(content)) {
  console.log(`Viewers: ${content.viewerCount}, Started: ${content.startedAt}`);
}

// 5. Fetch channel info
const channel = await client.getChannel("twitch", "shroud");
console.log(`Channel: ${channel.name} (${channel.platform})`);

// 6. Paginate through archives
let cursor: string | undefined;
do {
  const page = await client.listArchives("youtube", "UCuAXFkgsw1L7xaCfnd5JJOw", cursor);

  for (const archive of page.items) {
    console.log(`  ${archive.title} (${archive.duration}s)`);
  }

  cursor = page.cursor;
} while (cursor);

// 7. Error handling with structured errors and category helpers
try {
  await client.resolve("https://www.youtube.com/watch?v=nonexistent");
} catch (error) {
  if (error instanceof UnifiedLiveError) {
    // Structured error with code, context, and retryability
    console.error(`Error [${error.code}]: ${error.message}`);
    console.error(`Platform: ${error.platform}`);
    console.error(`Retryable: ${error.retryable}`);

    // ErrorCode category helpers for monitoring/alerting
    if (ErrorCode.isNetwork(error.code)) {
      console.error("Network issue — check connectivity");
    } else if (ErrorCode.isRateLimit(error.code)) {
      console.error("Rate limited — back off and retry");
    } else if (ErrorCode.isClientError(error.code)) {
      console.error("Client error — check your input");
    }

    // JSON-serializable for structured logging (supports nested cause chains)
    console.error(JSON.stringify(error));
  }
}

// 8. Request cancellation with AbortSignal
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

try {
  const plugin = client.platform("youtube");
  await plugin.rest.request({
    method: "GET",
    path: "/videos",
    query: { id: "dQw4w9WgXcQ", part: "snippet" },
    signal: controller.signal,
  });
} catch (error) {
  if (error instanceof UnifiedLiveError && error.code === "NETWORK_ABORT") {
    console.log("Request was cancelled");
  }
}
