import {
  type Channel,
  type Content,
  type LiveStream,
  NotFoundError,
  type Page,
  type RestManager,
  type Video,
} from "@unified-live/core";
import { toContent, toLive, toVideo, type TCMovie, type TCUser, toChannel } from "./mapper";

type TCMovieResponse = {
  movie: TCMovie;
  broadcaster: TCUser;
};

type TCUserResponse = {
  user: TCUser;
};

type TCMoviesResponse = {
  total_count: number;
  movies: TCMovie[];
};

/**
 * Fetch a TwitCasting movie by ID and map to unified Content.
 *
 * @param rest - REST manager for API requests
 * @param id - TwitCasting movie ID
 * @returns unified Content (live or video) for the movie
 * @precondition id is a valid TwitCasting movie ID
 * @postcondition returns Content (live or video) for the movie
 */
export const twitcastingGetContent = async (rest: RestManager, id: string): Promise<Content> => {
  const res = await rest.request<TCMovieResponse>({
    method: "GET",
    path: `/movies/${id}`,
    bucketId: "movies",
  });

  return toContent(res.data.movie, res.data.broadcaster);
};

/**
 * Fetch a TwitCasting channel by user_id or screen_id and map to unified Channel.
 *
 * @param rest - REST manager for API requests
 * @param id - TwitCasting user_id or screen_id
 * @returns unified Channel for the user
 * @throws NotFoundError if user does not exist
 * @precondition id is a valid TwitCasting user_id or screen_id
 * @postcondition returns Channel for the user
 */
export const twitcastingGetChannel = async (rest: RestManager, id: string): Promise<Channel> => {
  const res = await rest.request<TCUserResponse>({
    method: "GET",
    path: `/users/${id}`,
    bucketId: "users",
  });

  if (!res.data.user) {
    throw new NotFoundError("twitcasting", id);
  }

  return toChannel(res.data.user);
};

/**
 * Fetch active live streams for a TwitCasting channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - TwitCasting user_id or screen_id
 * @returns array of live streams (0 or 1 items)
 * @precondition channelId is a valid TwitCasting user_id or screen_id
 * @postcondition returns live streams (0 or 1 for TwitCasting, since a user can only have one live)
 */
export const twitcastingGetLiveStreams = async (
  rest: RestManager,
  channelId: string,
): Promise<LiveStream[]> => {
  const res = await rest.request<TCUserResponse>({
    method: "GET",
    path: `/users/${channelId}`,
    bucketId: "users",
  });

  if (!res.data.user.is_live) {
    return [];
  }

  // Fetch the current live movie
  const movieRes = await rest.request<{ movie: TCMovie }>({
    method: "GET",
    path: `/users/${channelId}/current_live`,
    bucketId: "movies",
  });

  if (!movieRes.data.movie) {
    return [];
  }

  return [toLive(movieRes.data.movie, res.data.user)];
};

/**
 * Fetch paginated videos for a TwitCasting channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - TwitCasting user_id or screen_id
 * @param cursor - optional pagination cursor (slice_id)
 * @param pageSize - number of items per page (default 50)
 * @returns paginated list of videos
 * @precondition channelId is a valid TwitCasting user_id or screen_id
 * @postcondition returns paginated videos using slice_id for deep pagination
 */
export const twitcastingGetVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize = 50,
): Promise<Page<Video>> => {
  const query: Record<string, string> = { limit: String(pageSize) };
  if (cursor) {
    query.slice_id = cursor;
  }

  // We need user info for mapping, fetch in parallel
  const [moviesRes, userRes] = await Promise.all([
    rest.request<TCMoviesResponse>({
      method: "GET",
      path: `/users/${channelId}/movies`,
      query,
      bucketId: "movies",
    }),
    rest.request<TCUserResponse>({
      method: "GET",
      path: `/users/${channelId}`,
      bucketId: "users",
    }),
  ]);

  const movies = moviesRes.data.movies;
  const videos = movies.filter((m) => !m.is_live).map((m) => toVideo(m, userRes.data.user));

  // Use last movie ID (not last video) as cursor to avoid stopping when a page has only live movies
  const nextCursor = movies.length === pageSize ? movies.at(-1)!.id : undefined;
  return {
    items: videos,
    cursor: nextCursor,
    total: moviesRes.data.total_count,
    hasMore: nextCursor !== undefined,
  };
};

/**
 * TwitCasting uses the same ID for live and archive.
 * resolveArchive checks if the movie has ended and returns the video.
 *
 * @param rest - REST manager for API requests
 * @param live - live stream to check for archive
 * @returns archived Video or null if still live
 */
export const twitcastingResolveArchive = async (
  rest: RestManager,
  live: LiveStream,
): Promise<Video | null> => {
  const res = await rest.request<TCMovieResponse>({
    method: "GET",
    path: `/movies/${live.id}`,
    bucketId: "movies",
  });

  if (res.data.movie.is_live) {
    return null;
  }

  return toVideo(res.data.movie, res.data.broadcaster);
};
