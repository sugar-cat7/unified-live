import type { RateLimitStrategy } from "@unified-live/core";
import { createQuotaBudgetStrategy } from "@unified-live/core";

/** YouTube Data API v3 quota cost map. */
export const YOUTUBE_COST_MAP: Record<string, number> = {
  "videos:list": 1,
  "channels:list": 1,
  "playlists:list": 1,
  "playlistItems:list": 1,
  "liveBroadcasts:list": 1,
  "liveStreams:list": 1,
  "search:list": 100,
};

/**
 * Creates a QuotaBudgetStrategy configured for YouTube.
 *
 * @param dailyLimit - optional daily quota cap (defaults to 10,000)
 * @returns rate limit strategy tracking YouTube quota
 * @precondition dailyLimit > 0
 * @postcondition returns a strategy that tracks YouTube quota consumption
 */
export const createYouTubeQuotaStrategy = (dailyLimit?: number): RateLimitStrategy => {
  return createQuotaBudgetStrategy({
    dailyLimit: dailyLimit ?? 10_000,
    costMap: YOUTUBE_COST_MAP,
    defaultCost: 1,
    platform: "youtube",
  });
};
