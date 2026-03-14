import type { Channel, LiveStream, Video } from "@unified-live/core";

/** Subset of Twitch Helix Stream resource fields actually used. */
export type TwitchStream = {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
  type: "live" | "";
};

/** Subset of Twitch Helix Video resource fields actually used. */
export type TwitchVideo = {
  id: string;
  stream_id: string | null;
  user_id: string;
  user_login: string;
  user_name: string;
  title: string;
  duration: string;
  view_count: number;
  created_at: string;
  published_at: string;
  thumbnail_url: string;
  type: "archive" | "highlight" | "upload";
  url: string;
};

/** Subset of Twitch Helix User resource fields actually used. */
export type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
};

/**
 * Convert a Twitch Stream to a unified LiveStream.
 *
 * @param stream - Twitch stream resource from Helix API
 * @returns unified LiveStream
 * @precondition stream.type === "live"
 * @postcondition returns LiveStream with sessionId set to stream.id
 */
export const streamToLive = (stream: TwitchStream): LiveStream => {
  return {
    id: stream.id,
    platform: "twitch",
    title: stream.title,
    url: `https://www.twitch.tv/${stream.user_login}`,
    thumbnail: formatThumbnailUrl(stream.thumbnail_url),
    channel: {
      id: stream.user_id,
      name: stream.user_name,
      url: `https://www.twitch.tv/${stream.user_login}`,
    },
    sessionId: stream.id,
    type: "live",
    viewerCount: stream.viewer_count,
    startedAt: new Date(stream.started_at),
    raw: stream,
  };
};

/**
 * Convert a Twitch Video to a unified Video.
 *
 * @param video - Twitch video resource from Helix API
 * @returns unified Video
 * @precondition video has all required fields
 * @postcondition returns Video with sessionId set to stream_id (if available)
 */
export const videoToVideo = (video: TwitchVideo): Video => {
  return {
    id: video.id,
    platform: "twitch",
    title: video.title,
    url: video.url,
    thumbnail: formatThumbnailUrl(video.thumbnail_url),
    channel: {
      id: video.user_id,
      name: video.user_name,
      url: `https://www.twitch.tv/${video.user_login}`,
    },
    sessionId: video.stream_id ?? video.id,
    type: "video",
    duration: parseTwitchDuration(video.duration),
    viewCount: video.view_count,
    publishedAt: new Date(video.published_at),
    raw: video,
  };
};

/**
 * Convert a Twitch User to a unified Channel.
 *
 * @param user - Twitch user resource from Helix API
 * @returns unified Channel
 */
export const userToChannel = (user: TwitchUser): Channel => {
  return {
    id: user.id,
    platform: "twitch",
    name: user.display_name,
    url: `https://www.twitch.tv/${user.login}`,
    thumbnail: {
      url: user.profile_image_url,
      width: 300,
      height: 300,
    },
  };
};

/**
 * Parse Twitch duration format (e.g., "3h2m1s", "45m30s", "30s") into seconds.
 *
 * @param duration - Twitch duration string
 * @returns total seconds
 * @idempotency Safe — pure function
 */
export const parseTwitchDuration = (duration: string): number => {
  const match = duration.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const seconds = Number.parseInt(match[3] ?? "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
};

const formatThumbnailUrl = (templateUrl: string) => {
  const url = templateUrl
    .replace("%{width}", "640")
    .replace("%{height}", "360")
    .replace("{width}", "640")
    .replace("{height}", "360");
  return { url, width: 640, height: 360 };
};
