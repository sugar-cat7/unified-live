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

import { Content, UnifiedClient } from "@unified-live/core";
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
using client = UnifiedClient.create({
  plugins: [youtube, twitch, twitcasting],
});

// 3. Fetch content by URL (auto-detects platform)
const content = await client.getContent("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
console.log(`[${content.platform}] ${content.title}`);

if (Content.isVideo(content)) {
  console.log(`Duration: ${content.duration}s, Views: ${content.viewCount}`);
}

if (Content.isLive(content)) {
  console.log(`Viewers: ${content.viewerCount}, Started: ${content.startedAt}`);
}

// 4. Fetch channel info
const channel = await client.getChannel("https://www.twitch.tv/shroud");
console.log(`Channel: ${channel.name} (${channel.platform})`);

// 5. Paginate through videos
let cursor: string | undefined;
do {
  const page = await client.getVideos("youtube", "UCuAXFkgsw1L7xaCfnd5JJOw", cursor);
  for (const video of page.items) {
    console.log(`  ${video.title} (${video.duration}s)`);
  }
  cursor = page.cursor;
} while (cursor);

