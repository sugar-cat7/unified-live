import type { Channel, Content, LiveStream, Video } from "@unified-live/core";
import { ParseError } from "@unified-live/core";
import type { components } from "./generated/youtube-api";

export type Schemas = components["schemas"];

/** YouTube Data API v3 Video resource (generated from Discovery Document). */
export type YTVideoResource = Schemas["Video"];

/** YouTube Data API v3 Channel resource (generated from Discovery Document). */
export type YTChannelResource = Schemas["Channel"];

/** YouTube Data API v3 PlaylistItem resource (generated from Discovery Document). */
export type YTPlaylistItemResource = Schemas["PlaylistItem"];

const pickThumbnail = (
  thumbnails: Schemas["ThumbnailDetails"] | undefined,
): { url: string; width: number; height: number } | undefined => {
  const thumb = thumbnails?.high ?? thumbnails?.medium ?? thumbnails?.default;
  if (!thumb?.url || thumb.width == null || thumb.height == null) return undefined;
  return { url: thumb.url, width: thumb.width, height: thumb.height };
};

/**
 * Convert a YouTube Video resource to a unified Content type.
 *
 * @param item - YouTube video resource from the API
 * @returns unified Content (LiveStream if live, Video otherwise)
 * @throws ParseError if required fields (id, snippet, contentDetails, statistics) are missing
 * @precondition item was fetched with part=snippet,contentDetails,statistics,liveStreamingDetails
 * @postcondition returns LiveStream if currently live, Video otherwise
 */
export const toContent = (item: YTVideoResource): Content => {
  const { id, snippet, contentDetails, statistics, liveStreamingDetails } = item;
  if (!id || !snippet || !contentDetails || !statistics) {
    throw new ParseError("youtube", "PARSE_RESPONSE", {
      message: "YouTube video resource missing required parts (id, snippet, contentDetails, statistics)",
    });
  }

  const channelId = snippet.channelId;
  const publishedAt = snippet.publishedAt;
  if (!channelId) {
    throw new ParseError("youtube", "PARSE_RESPONSE", { message: "YouTube video resource missing channelId" });
  }
  if (!publishedAt) {
    throw new ParseError("youtube", "PARSE_RESPONSE", { message: "YouTube video resource missing publishedAt" });
  }

  const thumbnail = pickThumbnail(snippet.thumbnails);
  if (!thumbnail) {
    throw new ParseError("youtube", "PARSE_RESPONSE", { message: "YouTube resource has no thumbnail" });
  }

  const channel = {
    id: channelId,
    name: snippet.channelTitle ?? "",
    url: `https://www.youtube.com/channel/${channelId}`,
  };

  const isLive = snippet.liveBroadcastContent === "live";

  if (isLive && liveStreamingDetails?.actualStartTime) {
    return {
      id,
      platform: "youtube",
      title: snippet.title ?? "",
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail,
      channel,
      sessionId: id,
      type: "live",
      viewerCount: Number.parseInt(liveStreamingDetails.concurrentViewers ?? "0", 10),
      startedAt: new Date(liveStreamingDetails.actualStartTime),
      raw: item,
    } satisfies LiveStream;
  }

  return {
    id,
    platform: "youtube",
    title: snippet.title ?? "",
    url: `https://www.youtube.com/watch?v=${id}`,
    thumbnail,
    channel,
    sessionId: id,
    type: "video",
    duration: parseDuration(contentDetails.duration ?? ""),
    viewCount: Number.parseInt(statistics.viewCount ?? "0", 10),
    publishedAt: new Date(publishedAt),
    raw: item,
  } satisfies Video;
};

/**
 * Convert a YouTube Channel resource to a unified Channel type.
 *
 * @param item - YouTube channel resource from the API
 * @returns unified Channel
 * @throws ParseError if required fields (id, snippet) are missing
 * @precondition item was fetched with part=snippet,contentDetails
 * @postcondition returns a Channel with thumbnail undefined if none available
 * @idempotency Safe — pure function
 */
export const toChannel = (item: YTChannelResource): Channel => {
  const { id, snippet } = item;
  if (!id || !snippet) {
    throw new ParseError("youtube", "PARSE_RESPONSE", {
      message: "YouTube channel resource missing required parts (id, snippet)",
    });
  }

  return {
    id,
    platform: "youtube",
    name: snippet.title ?? "",
    url: `https://www.youtube.com/channel/${id}`,
    thumbnail: pickThumbnail(snippet.thumbnails),
  };
};

/**
 * Parse an ISO 8601 duration string (e.g., "PT1H2M3S") into seconds.
 *
 * @param duration - ISO 8601 duration string
 * @returns total seconds
 * @precondition duration is a valid ISO 8601 duration
 * @postcondition returns total seconds as a number >= 0
 * @idempotency Safe — pure function
 */
export const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const seconds = Number.parseInt(match[3] ?? "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
};
