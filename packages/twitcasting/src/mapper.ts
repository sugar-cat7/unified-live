import { ParseError } from "@unified-live/core";
import type { Channel, Content, LiveStream, Video } from "@unified-live/core";

/** Subset of TwitCasting Movie resource fields actually used. */
export type TCMovie = {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  last_owner_comment: string | null;
  category: string | null;
  link: string;
  is_live: boolean;
  is_recorded: boolean;
  current_view_count: number;
  total_view_count: number;
  duration: number;
  created: number;
  large_thumbnail: string;
  small_thumbnail: string;
};

/** Subset of TwitCasting User resource fields actually used. */
export type TCUser = {
  id: string;
  screen_id: string;
  name: string;
  image: string;
  profile: string;
  level: number;
  is_live: boolean;
};

/**
 * Convert a TwitCasting live Movie to a unified LiveStream.
 *
 * @param movie - TwitCasting movie resource
 * @param user - TwitCasting user who owns the movie
 * @returns unified LiveStream
 * @precondition movie.is_live === true
 * @postcondition returns LiveStream with sessionId set to movie.id
 */
export const toLive = (movie: TCMovie, user: TCUser): LiveStream => {
  if (!movie.id || !user.id) {
    throw new ParseError("twitcasting", "PARSE_RESPONSE", {
      message: `TwitCasting resource missing required fields (movie.id, user.id)${movie.id ? ` for movie ${movie.id}` : ""}`,
      path: "/movies",
    });
  }
  return {
    id: movie.id,
    platform: "twitcasting",
    title: movie.title || `${user.name}'s live`,
    url: movie.link,
    thumbnail: {
      url: movie.large_thumbnail,
      width: 640,
      height: 360,
    },
    channel: {
      id: user.id,
      name: user.name,
      url: `https://twitcasting.tv/${user.screen_id}`,
    },
    sessionId: movie.id,
    type: "live",
    viewerCount: movie.current_view_count,
    startedAt: new Date(movie.created * 1000),
    raw: movie,
  } satisfies LiveStream;
};

/**
 * Convert a TwitCasting Movie to a unified Video.
 *
 * @param movie - TwitCasting movie resource
 * @param user - TwitCasting user who owns the movie
 * @returns unified Video
 * @precondition movie.is_live === false
 * @postcondition returns Video with sessionId set to movie.id
 */
export const toVideo = (movie: TCMovie, user: TCUser): Video => {
  if (!movie.id || !user.id) {
    throw new ParseError("twitcasting", "PARSE_RESPONSE", {
      message: `TwitCasting resource missing required fields (movie.id, user.id)${movie.id ? ` for movie ${movie.id}` : ""}`,
      path: "/movies",
    });
  }
  return {
    id: movie.id,
    platform: "twitcasting",
    title: movie.title || `${user.name}'s broadcast`,
    url: movie.link,
    thumbnail: {
      url: movie.large_thumbnail,
      width: 640,
      height: 360,
    },
    channel: {
      id: user.id,
      name: user.name,
      url: `https://twitcasting.tv/${user.screen_id}`,
    },
    sessionId: movie.id,
    type: "video",
    duration: movie.duration,
    viewCount: movie.total_view_count,
    publishedAt: new Date(movie.created * 1000),
    raw: movie,
  } satisfies Video;
};

/**
 * Convert a TwitCasting Movie to unified Content (live or video).
 *
 * @param movie - TwitCasting movie resource
 * @param user - TwitCasting user who owns the movie
 * @returns unified Content (LiveStream if live, Video otherwise)
 */
export const toContent = (movie: TCMovie, user: TCUser): Content => {
  if (movie.is_live) {
    return toLive(movie, user);
  }
  return toVideo(movie, user);
};

/**
 * Convert a TwitCasting User to a unified Channel.
 *
 * @param user - TwitCasting user resource
 * @returns unified Channel
 */
export const toChannel = (user: TCUser): Channel => {
  if (!user.id || !user.screen_id) {
    throw new ParseError("twitcasting", "PARSE_RESPONSE", {
      message: `TwitCasting user resource missing required fields (id, screen_id)${user.id ? ` for user ${user.id}` : ""}`,
      path: "/users",
    });
  }
  return {
    id: user.id,
    platform: "twitcasting",
    name: user.name,
    url: `https://twitcasting.tv/${user.screen_id}`,
    thumbnail: {
      url: user.image,
      width: 300,
      height: 300,
    },
  } satisfies Channel;
};
