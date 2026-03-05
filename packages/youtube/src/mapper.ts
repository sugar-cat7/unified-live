import type { Channel, Content, LiveStream, Video } from "@unified-live/core";

/** Subset of YouTube Data API v3 Video resource fields actually used. */
export type YTVideoResource = {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    thumbnails: {
      high?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      default?: { url: string; width: number; height: number };
    };
    liveBroadcastContent: "live" | "upcoming" | "none";
    publishedAt: string;
  };
  contentDetails: {
    duration: string; // ISO 8601 (e.g., "PT1H2M3S")
  };
  statistics: {
    viewCount: string;
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
    concurrentViewers?: string;
  };
};

/** Subset of YouTube Data API v3 Channel resource fields actually used. */
export type YTChannelResource = {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      high?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      default?: { url: string; width: number; height: number };
    };
    customUrl?: string;
  };
  contentDetails: {
    relatedPlaylists: {
      uploads: string;
    };
  };
};

/** Subset of YouTube Data API v3 PlaylistItem resource fields. */
export type YTPlaylistItemResource = {
  snippet: {
    resourceId: {
      videoId: string;
    };
  };
};

/**
 * Convert a YouTube Video resource to a unified Content type.
 *
 * @precondition item has all required fields (snippet, contentDetails, statistics)
 * @postcondition returns LiveStream if currently live, Video otherwise
 */
export function toContent(item: YTVideoResource): Content {
  const thumbnail = getBestThumbnail(item.snippet.thumbnails);
  const channel = {
    id: item.snippet.channelId,
    name: item.snippet.channelTitle,
    url: `https://www.youtube.com/channel/${item.snippet.channelId}`,
  };

  const isLive = item.snippet.liveBroadcastContent === "live";

  if (isLive && item.liveStreamingDetails?.actualStartTime) {
    return {
      id: item.id,
      platform: "youtube",
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      thumbnail,
      channel,
      sessionId: item.id,
      type: "live",
      viewerCount: Number.parseInt(
        item.liveStreamingDetails.concurrentViewers ?? "0",
        10,
      ),
      startedAt: new Date(item.liveStreamingDetails.actualStartTime),
      raw: item,
    } satisfies LiveStream;
  }

  return {
    id: item.id,
    platform: "youtube",
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    thumbnail,
    channel,
    sessionId: item.id,
    type: "video",
    duration: parseDuration(item.contentDetails.duration),
    viewCount: Number.parseInt(item.statistics.viewCount, 10),
    publishedAt: new Date(item.snippet.publishedAt),
    raw: item,
  } satisfies Video;
}

/**
 * Convert a YouTube Channel resource to a unified Channel type.
 */
export function toChannel(item: YTChannelResource): Channel {
  const thumbnail =
    item.snippet.thumbnails.high ??
    item.snippet.thumbnails.medium ??
    item.snippet.thumbnails.default;

  return {
    id: item.id,
    platform: "youtube",
    name: item.snippet.title,
    url: `https://www.youtube.com/channel/${item.id}`,
    thumbnail: thumbnail
      ? { url: thumbnail.url, width: thumbnail.width, height: thumbnail.height }
      : undefined,
  };
}

function getBestThumbnail(
  thumbnails: YTVideoResource["snippet"]["thumbnails"],
) {
  const thumb = thumbnails.high ?? thumbnails.medium ?? thumbnails.default;
  if (!thumb) {
    return { url: "", width: 0, height: 0 };
  }
  return { url: thumb.url, width: thumb.width, height: thumb.height };
}

/**
 * Parse an ISO 8601 duration string (e.g., "PT1H2M3S") into seconds.
 *
 * @precondition duration is a valid ISO 8601 duration
 * @postcondition returns total seconds as a number >= 0
 * @idempotency Safe — pure function
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const seconds = Number.parseInt(match[3] ?? "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}
